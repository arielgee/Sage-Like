"use strict";

let rssTreeView = (function() {

	//==================================================================================
	//=== Class Declerations
	//==================================================================================

	class CurrentlyDraggedOver {
		constructor() {
			this.init();
		}
		init() {
			this._id = "";
			this._startTime = 0;
		}
		set(id) {
			this._id = id;
			this._startTime = Date.now();
		}
		get id() {
			return this._id;
		}
		get lingered() {
			return ((Date.now() - this._startTime) > 900);
		}
	};

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	const FILTER_TOOLTIP_TITLE = "Feed Filtering Methods: \n" +
									"  \u25cf Filtering using case-insensitive text. \n" +
									"  \u25cf Filtering using Regular Expression pattern enclosed between two slashes ('/'). \n" +
									"      Flag 'i' (case-insensitive) is supported when placed after the second slash. \n" +
									"  \u25cf URL filtering using text prefixed with a single percent sign ('%'). \n" +
									"  \u25cf Status filtering using special commands prefixed with a single greater-than sign ('>'): \n" +
									"     \u2022 Use '>unread' for unvisited feeds. \n" +
									"     \u2022 Use '>read' for visited feeds. \n" +
									"     \u2022 Use '>error' for feeds that failed to update. \n" +
									"     \u2022 Use '>load' for feeds that are still loading. \n\n" +
									"\u2731 Feeds may change their title and/or status after the filter was applied.";

	let TreeItemStatus = Object.freeze({
		UNDEFINED: -1,
		ERROR: 0,
		VISITED: 1,
		UNVISITED: 2,
		LOADING: 3,
		EMPTY: 4,
	});

	let m_elmCheckTreeFeeds;
	let m_elmExpandAll;
	let m_elmCollapseAll;
	let m_elmFilterWidget;
	let m_elmButtonFilter;
	let m_elmFilterTextBoxContainer;
	let m_elmTextFilter;
	let m_elmReapplyFilter;
	let m_elmClearFilter;

	let m_elmTreeRoot;

	let m_elmCurrentlyLoading;
	let m_elmCurrentlySelected;
	let m_rssTreeCreatedOK = false;
	let m_elmCurrentlyDragged = null;

	let m_prioritySelectedItemId = null;

	let m_lastClickedFeedTime = 0;
	let m_timeoutIdMonitorRSSTreeFeeds = null;
	let m_lockBookmarksEventHandler = new Locker();

	let m_objOpenTreeFolders = new OpenTreeFolders();
	let m_objTreeFeedsData = new TreeFeedsData();
	let m_objCurrentlyDraggedOver = new CurrentlyDraggedOver();

	let m_isFilterApplied = false;
	let m_msgShowCountReapplyFilter = 0;
	let m_bPrefShowFeedStats = prefs.DEF_PREF_SHOW_FEED_STATS_VALUE;

	let m_filterChangeDebouncer = null;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {

		m_objTreeFeedsData.purge();
		m_objOpenTreeFolders.purge();

		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);

		browser.runtime.onMessage.addListener(onRuntimeMessage);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case slGlobals.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_ROOT_FOLDER) {
					messageView.close();
					discoveryView.close();
					NewFeedPropertiesView.close();
					NewFolderPropertiesView.close();
					EditFeedPropertiesView.close();
					EditFolderPropertiesView.close();
					InfoBubble.i.dismiss();
					rssListView.disposeList();
					createRSSTree();
				}

				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL) {
					monitorRSSTreeFeeds();
				}

				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_STATS) {
					setShowFeedStatsFromPreferences();
				}

				// Entire tree is recreated when: message.details === slGlobals.MSGD_PREF_CHANGE_ALL
				if (message.details === slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC ||
						message.details === slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC_ATTACH) {

					if (TreeItemType.isFeed(m_elmCurrentlySelected)) {
						openTreeFeed(m_elmCurrentlySelected, false);
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER:
				m_lockBookmarksEventHandler.lock();
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER:
				m_lockBookmarksEventHandler.unlock();
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID:
				m_prioritySelectedItemId = message.itemId;
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_ADD_NEW_DISCOVERED_FEEDS:
				if(message.winId === panel.getWindowId()) {
					for(let feed of message.feeds) {
						if(isFeedInTree(feed.url)) {
							return Promise.resolve({ existInTree: feed.title });
						}
					}
					addNewFeeds(message.feeds);
				}
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onDOMContentLoaded() {

		m_elmExpandAll = document.getElementById("expandall");
		m_elmCollapseAll = document.getElementById("collapseall");
		m_elmFilterWidget = document.getElementById("filterWidget");
		m_elmButtonFilter = document.getElementById("filter");
		m_elmFilterTextBoxContainer = document.getElementById("filterTextBoxContainer");
		m_elmTextFilter = document.getElementById("textFilter");
		m_elmReapplyFilter = document.getElementById("reapplyFilter");
		m_elmClearFilter = document.getElementById("clearFilter");
		m_elmCheckTreeFeeds = document.getElementById("checkTreeFeeds");
		m_elmTreeRoot = document.getElementById(slGlobals.ID_UL_RSS_TREE_VIEW);

		if(await internalPrefs.getIsExtensionInstalled()) {
			internalPrefs.setIsExtensionInstalled(false);
			await handleOnInstallExtension();
		}

		// toolbar buttons event listeners
		m_elmCheckTreeFeeds.addEventListener("click", onClickCheckTreeFeeds);
		m_elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmButtonFilter.addEventListener("click",onClickFilter);
		m_elmFilterTextBoxContainer.addEventListener("transitionend",onTransitionEndFilterTextBoxContainer);
		m_elmTextFilter.addEventListener("input", onInputChangeTextFilter);
		m_elmTextFilter.addEventListener("keydown", onKeyDownTextFilter);
		m_elmReapplyFilter.addEventListener("click", onClickReapplyFilter);
		m_elmClearFilter.addEventListener("click", onClickClearFilter);

		// treeView event listeners
		m_elmTreeRoot.addEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.addEventListener("keydown", onKeyDownTreeRoot);
		m_elmTreeRoot.addEventListener("focus", onFocusTreeItem, true);		// focus, blur, and change, do not bubble up the document tree; Event capturing moves down
		m_elmTreeRoot.addEventListener("click", onClickTreeItem);
		m_elmTreeRoot.addEventListener("auxclick", onClickTreeItem);
		m_elmTreeRoot.addEventListener("dragstart", onDragStartTreeItem);
		m_elmTreeRoot.addEventListener("dragenter", onDragEnterTreeItem);
		m_elmTreeRoot.addEventListener("dragover", onDragOverTreeItem);
		m_elmTreeRoot.addEventListener("dragleave", onDragLeaveTreeItem);
		m_elmTreeRoot.addEventListener("dragend", onDragEndTreeItem);
		m_elmTreeRoot.addEventListener("drop", onDropTreeItem);

		// browser bookmarks event listeners
		browser.bookmarks.onCreated.addListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.addListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.addListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.addListener(onBookmarksEventHandler);

		m_bPrefShowFeedStats = await prefs.getShowFeedStats();

		createRSSTree();

		browser.browserAction.setBadgeText({text: ""});
		m_elmFilterTextBoxContainer.title = FILTER_TOOLTIP_TITLE.replace(/ /g, "\u00a0");

		panel.notifyViewContentLoaded(slGlobals.VIEW_CONTENT_LOAD_FLAG.TREE_VIEW_LOADED);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		clearTimeout(m_timeoutIdMonitorRSSTreeFeeds);
		m_timeoutIdMonitorRSSTreeFeeds = null;

		// toolbar buttons event listeners
		m_elmCheckTreeFeeds.removeEventListener("click", onClickCheckTreeFeeds);
		m_elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		m_elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);
		m_elmButtonFilter.removeEventListener("click",onClickFilter);
		m_elmFilterTextBoxContainer.removeEventListener("transitionend",onTransitionEndFilterTextBoxContainer);
		m_elmTextFilter.removeEventListener("input", onInputChangeTextFilter);
		m_elmTextFilter.removeEventListener("keydown", onKeyDownTextFilter);
		m_elmReapplyFilter.removeEventListener("click", onClickReapplyFilter);
		m_elmClearFilter.removeEventListener("click", onClickClearFilter);

		// treeView event listeners
		m_elmTreeRoot.removeEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.removeEventListener("keydown", onKeyDownTreeRoot);
		m_elmTreeRoot.removeEventListener("focus", onFocusTreeItem, true);		// focus, blur, and change, do not bubble up the document tree; Event capturing moves down
		m_elmTreeRoot.removeEventListener("click", onClickTreeItem);
		m_elmTreeRoot.removeEventListener("auxclick", onClickTreeItem);
		m_elmTreeRoot.removeEventListener("dragstart", onDragStartTreeItem);
		m_elmTreeRoot.removeEventListener("dragenter", onDragEnterTreeItem);
		m_elmTreeRoot.removeEventListener("dragover", onDragOverTreeItem);
		m_elmTreeRoot.removeEventListener("dragleave", onDragLeaveTreeItem);
		m_elmTreeRoot.removeEventListener("dragend", onDragEndTreeItem);
		m_elmTreeRoot.removeEventListener("drop", onDropTreeItem);

		// browser bookmarks event listeners
		browser.bookmarks.onCreated.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.removeListener(onBookmarksEventHandler);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setShowFeedStatsFromPreferences() {

		prefs.getShowFeedStats().then(showStats => {

			m_bPrefShowFeedStats = showStats;

			if(m_bPrefShowFeedStats) {

				// switched from 'do not show' to 'show', just refresh tree
				monitorRSSTreeFeeds(true);
			} else {

				// switched from 'show' to 'do not show', clear stat text
				let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS);

				for(let i=0, len=elms.length; i<len; i++) {
					elms[i].textContent = "";
				}
			}
		});
	}

	//==================================================================================
	//=== Tree Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function createRSSTree() {

		// show loading animation (if not already removed by disposeTree()) if it takes too long
		showDelayedLoadingAnimation();

		// get folder's open/closed statuses from local storage
		await m_objOpenTreeFolders.getStorage();

		m_rssTreeCreatedOK = false;
		m_elmCurrentlyLoading = null;
		m_elmCurrentlySelected = null;
		setTbButtonCheckFeedsAlert(false);

		prefs.getRootFeedsFolderId().then((folderId) => {

			disposeTree();

			if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				m_elmTreeRoot.appendChild(createErrorTagLI("The feeds folder is not set in the Options page."));
				browser.runtime.openOptionsPage();
				return;
			}

			browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
				let folderChildren = bookmarks[0].children;
				if (!!folderChildren) {		// do this to skip displaying the parent folder
					for (let i=0, len=folderChildren.length; i<len; i++) {
						createTreeItem(m_elmTreeRoot, folderChildren[i]);
					}
				}

				// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
				if (slUtil.hasHScroll(m_elmTreeRoot)) {
					m_elmTreeRoot.style.height = (m_elmTreeRoot.clientHeight - slUtil.getScrollbarWidth()) + "px";
				}
				m_rssTreeCreatedOK = true;
				restoreTreeViewState();
				broadcastRssTreeCreatedOK();
				monitorRSSTreeFeeds(true);

			}).catch((error) => {
				m_elmTreeRoot.appendChild(createErrorTagLI("Failed to load feeds folder: " + error.message));
				browser.runtime.openOptionsPage();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTreeItem(parentElement, bookmark) {

		let elmLI;

		if (bookmark.type === "folder") {

			elmLI = createTagLI(bookmark.id, bookmark.title, slGlobals.CLS_RTV_LI_TREE_FOLDER, null);

			let elmUL = createTagUL();
			elmLI.appendChild(elmUL);

			setFolderState(elmLI, m_objOpenTreeFolders.exist(bookmark.id));

			for (let child of bookmark.children) {
				createTreeItem(elmUL, child);
			}

		} else if (bookmark.type === "bookmark") {

			elmLI = createTagLI(bookmark.id, bookmark.title, slGlobals.CLS_RTV_LI_TREE_FEED, bookmark.url);
		} else {
			return;	// separator
		}
		parentElement.appendChild(elmLI);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagUL() {
		let elmUL = document.createElement("ul");
		return elmUL;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagLI(id, text, className, href = null) {

		// ++ normalize the textContent
		if(text.length === 0) {
			try {
				let url = new URL(href);
				text = url.hostname;
			} catch (error) {
				text = slGlobals.STR_TITLE_EMPTY;
			}
		}

		let elmTitle = document.createElement("span");
		let elmStats = document.createElement("span");
		let elmCaption = document.createElement("div");
		let elm = document.createElement("li");

		elmTitle.className = slGlobals.CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE;
		elmTitle.textContent = text;
		elmStats.className = slGlobals.CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS;
		elmCaption.className = slGlobals.CLS_RTV_DIV_TREE_ITEM_CAPTION;

		elm.id = id;
		elm.className = slGlobals.CLS_RTV_LI_TREE_ITEM + " " + className;
		elm.draggable = true;
		elm.tabIndex = 0;
		if (href !== null) {
			elm.setAttribute("href", href);
		}

		elmCaption.appendChild(elmTitle);
		elmCaption.appendChild(elmStats);
		elm.appendChild(elmCaption);

		setTreeItemTooltip(elm);

		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createErrorTagLI(text) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = text;
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function restoreTreeViewState() {

		internalPrefs.getTreeViewRestoreData().then((restoreData) => {

			m_elmTreeRoot.parentElement.scrollTop = restoreData.treeScrollTop;

			if(m_prioritySelectedItemId === null) {
				setFeedSelectionState(document.getElementById(restoreData.treeSelectedItemId));

				if (TreeItemType.isFeed(m_elmCurrentlySelected)) {
					openTreeFeed(m_elmCurrentlySelected, false);
				}

			} else {

				// After OPML import, AND IF THE SIDEBAR IS OPEN, the tree is re-created and the newly imported
				// folder will get selected
				// if m_prioritySelectedItemId is not null then select this one and not from the restoreData

				let elm = document.getElementById(m_prioritySelectedItemId);
				m_prioritySelectedItemId = null;

				setFeedSelectionState(elm);
				setFolderState(elm, true);
				elm.scrollIntoView(true);
			}

			if(restoreData.feedsFilter !== "") {
				setTimeout(() => {
					m_elmTextFilter.value = restoreData.feedsFilter;
					openFilterWidget();
					handleTreeFilter();
				}, 400);
			}

		});
	}

	//==================================================================================
	//=== Tree Processing
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function monitorRSSTreeFeeds(bForce = false) {

		// first clear the current timeout if called from preference change to
		// set a new interval value or to have no background monitoring at all
		clearTimeout(m_timeoutIdMonitorRSSTreeFeeds);
		m_timeoutIdMonitorRSSTreeFeeds = null;

		prefs.getCheckFeedsInterval().then((nextInterval) => {

			// if interval is zero then do not perform background monitoring unless forced
			if(nextInterval !== "0" || bForce) {
				checkForNewRSSTreeFeedsData();
			}

			// if interval is zero then do not schedule the next background monitoring
			if(nextInterval !== "0") {

				// Repeat a new timeout session.
				if(nextInterval.includes(":")) {
					nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
				}
				m_timeoutIdMonitorRSSTreeFeeds = setTimeout(monitorRSSTreeFeeds, parseInt(nextInterval));
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function checkForNewRSSTreeFeedsData() {

		await m_objTreeFeedsData.getStorage();

		let elmLIs = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

		prefs.getCheckFeedsMethod().then(async (value) => {

			let counter = 0;
			let method = value.split(";").map(x => parseInt(x));
			let batchSize = method[0] === 0 ? 1 : Math.ceil(elmLIs.length / method[0]);
			let timeoutPause = method[1];
			let elm;

			for(let i=0, len=elmLIs.length; i<len; i++) {
				elm = elmLIs[i];
				checkForNewFeedData(elm, elm.id, elm.getAttribute("href"));
				if((++counter % batchSize) === 0) {
					await slUtil.sleep(timeoutPause);
				}
			}
			//console.log("[Sage-Like]", "Periodic check for new feeds performed in sidebar.");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function checkForNewFeedData(elmLI, id, url) {

		setFeedErrorState(elmLI, false);
		setFeedLoadingState(elmLI, true);

		// add if not already exists or just update the lastChecked
		m_objTreeFeedsData.update(id);

		prefs.getFetchTimeout().then((timeout) => {

			timeout *= 1000;	// to milliseconds

			let fetching = m_bPrefShowFeedStats ? syndication.fetchFeedItems(url, timeout, undefined, false) : syndication.fetchFeedData(url, timeout);

			fetching.then((fetchResult) => {

				let updateTime = slUtil.asSafeNumericDate(fetchResult.feedData.lastUpdated);

				setFeedVisitedState(elmLI, m_objTreeFeedsData.value(id).lastVisited > updateTime);
				updateFeedTitle(elmLI, fetchResult.feedData.title);
				updateFeedStatsFromHistory(elmLI, fetchResult.list);
				setTreeItemTooltipFull(elmLI, fetchResult.feedData.title, "Update: " + (new Date(updateTime)).toWebExtensionLocaleString());
				updateTreeBranchFoldersStats(elmLI);
			}).catch((error) => {
				setFeedErrorState(elmLI, true, error.message);
			}).finally(() => {	// wait for Fx v58
				setFeedLoadingState(elmLI, false);
			});
		});
	}

	//==================================================================================
	//=== Tree Item Event Listeners; delegated from the treeView element
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownTreeRoot(event) {

		// The default behaviour of Fx is to call "mousedown" when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		if(event.button === 1 || event.target === m_elmTreeRoot) {
			event.stopPropagation();
			event.preventDefault();
			if(event.target.tagName === "LI") setFeedSelectionState(event.target);
			setFocus();
		}
		InfoBubble.i.dismiss();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTreeRoot(event) {

		let elmTarget = event.target;

		if(elmTarget.getAttribute("disabled") !== null) {
			return;
		}

		let count, elmCount, elm, elms;
		let keyCode = event.code;

		if(event.key === "Delete") {
			keyCode = "KeyD";
		} else if(event.ctrlKey && event.key === "Insert") {
			keyCode = "KeyC";
		} else if( (event.shiftKey && event.key === "Insert") || (event.ctrlKey && keyCode === "KeyV") ) {
			keyCode = "KeyS";
		}

		switch (keyCode) {

			case "Tab":
				if(event.shiftKey) {
					return;		// for shift+tab let the system handle it. exit w/o stop propagation
				} else {
					rssListView.setFocus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Enter":
			case "NumpadEnter":
				if(TreeItemType.isFeed(elmTarget)) {
					openTreeFeed(elmTarget, event.shiftKey);
				} else {
					toggleFolderState(elmTarget);
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Home":
				elms = m_elmTreeRoot.querySelectorAll("li");		// get all selectable elements

				for(let i=0, len=elms.length; i<len; i++) {
					if(elms[i].offsetParent !== null) {		// visible or not
						elms[i].focus();
						break;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "End":
				elms = m_elmTreeRoot.querySelectorAll("li");		// get all selectable elements

				for(let i=elms.length-1; i>=0; i--) {
					if(elms[i].offsetParent !== null) {		// visible or not
						elms[i].focus();
						break;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowUp":
				elms = m_elmTreeRoot.querySelectorAll("li:not(.filtered)");	// get all selectable elements

				// find target element in list
				for(let i=0, len=elms.length; i<len; i++) {

					// find in list the immediate PREVIOUS visible element
					if(elms[i].id === elmTarget.id && (i-1) >= 0) {

						for(let j=i-1; j>=0; j--) {
							if(elms[j].offsetParent !== null) {		// visible or not
								elms[j].focus();
								break;
							}
						}
						break;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				elms = m_elmTreeRoot.querySelectorAll("li:not(.filtered)");	// get all selectable elements

				for(let i=0, len=elms.length; i<len; i++) {

					// find target element in list
					if(elms[i].id === elmTarget.id && (i+1) < len) {

						// find in list the immediate NEXT visible element
						for(let j=i+1; j<len; j++) {
							if(elms[j].offsetParent !== null) {		// visible or not
								elms[j].focus();
								break;
							}
						}
						break;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowLeft":
				if(TreeItemType.isFolderOpen(elmTarget)) {
					setFolderState(elmTarget, false);
				} else if(elmTarget.parentElement.parentElement.tagName === "LI") {
					elmTarget.parentElement.parentElement.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowRight":
				if(TreeItemType.isFolder(elmTarget)) {
					if(TreeItemType.isOpen(elmTarget)) {
						elm = elmTarget.querySelector("ul > li:not(.filtered)"); // first visible child
						if(!!elm) elm.focus();
					} else {
						setFolderState(elmTarget, true);
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageUp":
				if( (elms = m_elmTreeRoot.querySelectorAll("li:not(.filtered)")).length > 0 ) {		// get all selectable elements

					count = 1;
					elmCount = slUtil.numberOfVItemsInViewport(elms[0].firstElementChild, m_elmTreeRoot);	// use caption height

					// find target element in list
					for(let i=0, len=elms.length; i<len; i++) {

						// find in list the current selected item
						if(elms[i].id === elmTarget.id && (i-1) >= 0) {

							for(let j=i-1; j>=0; j--) {
								if(elms[j].offsetParent !== null) {		// only if visible
									elm = elms[j];
									if(++count === elmCount) {
										break;
									}
								}
							}
							elm.focus();
							break;
						}
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageDown":
				if( (elms = m_elmTreeRoot.querySelectorAll("li:not(.filtered)")).length > 0 ) {		// get all selectable elements

					count = 1;
					elmCount = slUtil.numberOfVItemsInViewport(elms[0].firstElementChild, m_elmTreeRoot);	// use caption height

					// find target element in list
					for(let i=0, len=elms.length; i<len; i++) {

						// find in list the current selected item
						if(elms[i].id === elmTarget.id && (i+1) < len) {

							for(let j=i+1; j<len; j++) {
								if(elms[j].offsetParent !== null) {		// only if visible
									elm = elms[j];
									if(++count === elmCount) {
										break;
									}
								}
							}
							elm.focus();
							break;
						}
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyO":
				if(TreeItemType.isFeed(elmTarget)) {
					browser.tabs.update({ url: slUtil.getFeedPreviewUrl(elmTarget.getAttribute("href")) });
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyT":
				if(TreeItemType.isFeed(elmTarget)) {
					browser.tabs.create({ url: slUtil.getFeedPreviewUrl(elmTarget.getAttribute("href")) });
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyW":
				if(TreeItemType.isFeed(elmTarget)) {
					browser.windows.create({
						url: slUtil.getFeedPreviewUrl(elmTarget.getAttribute("href")),
						type: "normal",
					});
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyV":
				if(TreeItemType.isFeed(elmTarget)) {
					browser.windows.create({
						url: slUtil.getFeedPreviewUrl(elmTarget.getAttribute("href")),
						type: "normal",
						incognito: true,
					}).catch((error) => messageView.open(slUtil.incognitoErrorMessage(error)) );
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyA":
				if(TreeItemType.isFolder(elmTarget)) {
					openAllFeedsInTabs(elmTarget);
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyG":
				toggleVisitedState(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyR":
				markAllFeedsAsVisitedState(true);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyU":
				markAllFeedsAsVisitedState(false);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyN":
				openNewFeedProperties(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyF":
				openNewFolderProperties(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyC":
				if(TreeItemType.isFeed(elmTarget)) {
					slUtil.writeTextToClipboard(elmTarget.getAttribute("href"));
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyS":
				pasteFeedUrlFromClipboard(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyD":
				deleteTreeItem(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyP":
				openEditTreeItemProperties(elmTarget);
				break;
				/////////////////////////////////////////////////////////////////////////

			default:
				return;		// do not stop propagation
				/////////////////////////////////////////////////////////////////////////
		}

		event.stopPropagation();
		event.preventDefault();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusTreeItem(event) {
		setFeedSelectionState(event.target);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickTreeItem(event) {

		let elmLI = event.target;
		let clickCount = event.detail;

		if(!!!elmLI) return;

		// event.detail: check the current click count to avoid the double-click's second click.
		if(clickCount === 1 && TreeItemType.isFeed(elmLI)) {

			event.stopPropagation();

			if(event.button === 0) {						// left click

				// default action: load feed items in list
				openTreeFeed(elmLI, event.shiftKey);

				// open feed preview
				prefs.getClickOpensFeedPreview().then((value) => {
					if(value === prefs.CLICK_OPENS_FEED_PREVIEW_VALUES.openNewTab) {
						browser.tabs.create({ url: slUtil.getFeedPreviewUrl(elmLI.getAttribute("href")) });
					} else if(value === prefs.CLICK_OPENS_FEED_PREVIEW_VALUES.openTab) {
						browser.tabs.update({ url: slUtil.getFeedPreviewUrl(elmLI.getAttribute("href")) });
					} else if(m_objTreeFeedsData.value(elmLI.id).openInFeedPreview) {
						browser.tabs.create({ url: slUtil.getFeedPreviewUrl(elmLI.getAttribute("href")) });
					}
				});

			} else if(event.button === 1) {					// middle click

				if(event.ctrlKey && event.altKey && !event.shiftKey) {

					let url = new URL(elmLI.getAttribute("href"));
					url.searchParams.append(...(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));
					url = url.toString();

					// ++Dev Mode++: open link & link view-source in new tabs
					browser.tabs.create({ url: url });
					browser.tabs.create({ url: "view-source:" + url });

				} else if(event.shiftKey) {

					// open feed preview in new window
					browser.windows.create({ url: slUtil.getFeedPreviewUrl(elmLI.getAttribute("href")), type: "normal" });

				} else {

					// open feed preview in new tab
					browser.tabs.create({ url: slUtil.getFeedPreviewUrl(elmLI.getAttribute("href")) });
				}
			}

		} else if(event.button === 0 && TreeItemType.isFolder(elmLI) && eventOccureInItemCaptionHeight(event, elmLI)) {

			prefs.getFolderClickAction().then((action) => {

				if( (action === prefs.FOLDER_CLICK_ACTION_VALUES.singleClick) ||
					(action === prefs.FOLDER_CLICK_ACTION_VALUES.doubleClick && (clickCount%2) === 0) ) {

					event.stopPropagation();
					toggleFolderState(elmLI);
					elmLI.focus();
				}
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragStartTreeItem(event) {

		event.stopPropagation();

		m_elmCurrentlyDragged = event.target;

		internalPrefs.getDropInsideFolderShowMsgCount().then((count) => {
			if(count > 0) {
				InfoBubble.i.show("Press the Shift key to drop item <b>inside</b> folder.", undefined, false);
				internalPrefs.setDropInsideFolderShowMsgCount(--count);
			}
		});

		let transfer = event.dataTransfer;

		transfer.effectAllowed = "move";
		transfer.setData("text/wx-sl-treeitem-html", m_elmCurrentlyDragged.outerHTML);

		if(TreeItemType.isFeed(m_elmCurrentlyDragged)) {
			let url = slUtil.getFeedPreviewUrl(m_elmCurrentlyDragged.getAttribute("href"));
			transfer.setData("text/x-moz-url", url + "\n" + m_elmCurrentlyDragged.firstElementChild.firstElementChild.textContent);
			transfer.setData("text/uri-list", url);
		}
		m_elmCurrentlyDragged.classList.add("dragged");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEnterTreeItem(event) {
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragOverTreeItem(event) {

		event.stopPropagation();
		event.preventDefault();

		let target = event.target;
		let transfer = event.dataTransfer;
		let validMimes = ["text/wx-sl-treeitem-html", "text/x-moz-url", "text/uri-list", "text/plain"];

		// Prevent drop
		if(	(!m_rssTreeCreatedOK) ||														// Tree is not set and valid
			(!TreeItemType.isTreeItem(target) && !TreeItemType.isTree(target)) ||			// Drop only on tree items (feed | folders) or tree root
			(!!m_elmCurrentlyDragged && m_elmCurrentlyDragged.contains(target)) ||			// Prevent element from been droped into itself.
			(!!!m_elmCurrentlyDragged && transfer.types.every(i => i === validMimes[0])) ||	// Prevent drop of "text/wx-sl-treeitem-html" from another window
			(!transfer.types.includesSome(validMimes)) ) {									// Prevent invalid mime types

			transfer.effectAllowed = transfer.dropEffect = "none";
			return false;
		}

		if(TreeItemType.isFolder(target)) {

			// when a folder is open the height of the LI is as the Height of the entier folder.
			// The result is that hovering on the left of the items in the folder (but not ON a folder item) marks
			// the entire folder as a drop target. This makes sure that only hovers on the top of the elements are processed
			if(!eventOccureInItemCaptionHeight(event, target)) {
				transfer.effectAllowed = transfer.dropEffect = "none";
				return false;
			}

			if(TreeItemType.isClosed(target)) {

				// it's a folder - lingering
				if(target.id === m_objCurrentlyDraggedOver.id) {

					if(m_objCurrentlyDraggedOver.lingered) {
						// mouse has lingered enough, open the closed folder
						setFolderState(target, true);
					}
				} else {
					// it's a folder - just in
					m_objCurrentlyDraggedOver.set(target.id);
				}
			}

			target.classList.toggle("dropInside", event.shiftKey);
		}

		target.classList.add("draggedOver");
		transfer.effectAllowed = transfer.dropEffect = (!!m_elmCurrentlyDragged ? "move" : "copy");
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragLeaveTreeItem(event) {
		event.stopPropagation();
		if(TreeItemType.isTreeItem(event.target)) event.target.classList.remove("draggedOver", "dropInside");
		m_objCurrentlyDraggedOver.init();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEndTreeItem(event) {
		event.stopPropagation();
		m_elmCurrentlyDragged.classList.remove("dragged");
		event.target.classList.remove("draggedOver", "dropInside");
		m_objCurrentlyDraggedOver.init();
		m_elmCurrentlyDragged = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onDropTreeItem(event) {

		// The m_elmCurrentlyDragged member varaiable is nulled in the dragend() event but
		// is still needed in the drop() event.
		// According to the drag-and-drop processing model in current HTML specification (updated August 13, 2019),
		// the drop() event must fire BEFORE the dragend() event. (https://html.spec.whatwg.org/multipage/dnd.html#drag-and-drop-processing-model)
		// This dose not guarantee that m_elmCurrentlyDragged will remain valid the entire process of this function.
		// Therefore m_elmCurrentlyDragged is immediately saved locally.
		let elmCurrentlyDragged = m_elmCurrentlyDragged;

		// prevent propagation from the perent (folder)
		event.stopPropagation();

		let elmDropTarget = event.target;
		let transfer = event.dataTransfer;

		// nothing to do if dropped in the same location OR in a folder
		if(elmDropTarget === elmCurrentlyDragged) {
			elmCurrentlyDragged.classList.remove("dragged");
		} else {

			if ( !!elmCurrentlyDragged && transfer.types.includes("text/wx-sl-treeitem-html") ) {

				let dropInRootFolder = TreeItemType.isTree(elmDropTarget);
				let gettingDragged = browser.bookmarks.get(elmCurrentlyDragged.id);
				let gettingDrop = browser.bookmarks.get(dropInRootFolder ? (await prefs.getRootFeedsFolderId()) : elmDropTarget.id);

				gettingDragged.then((dragged) => {
					gettingDrop.then((drop) => {

						let newIndex = drop[0].index;

						// when moving a bookmark item down in it's folder the target index should me decresed by one
						// becouse the indexing will shift down due to the removal of the dragged item.
						if( (dragged[0].parentId === drop[0].parentId) && (dragged[0].index < drop[0].index) ) {
							newIndex--;
						}

						// if shiftKey is pressed then insert dargged item(s) into the the dropped folder
						let inFolder = dropInRootFolder || (event.shiftKey && TreeItemType.isFolder(elmDropTarget));

						let destination = {
							parentId: (inFolder ? drop[0].id : drop[0].parentId),
							index: (dropInRootFolder ? undefined : (inFolder ? 0 : newIndex)),	// insert as first in folder or last if folder is the root folder
						};

						suspendBookmarksEventHandler(() => {
							return browser.bookmarks.move(elmCurrentlyDragged.id, destination).then((moved) => {

								let elmDraggedFolderUL = elmCurrentlyDragged.parentElement;
								elmDraggedFolderUL.removeChild(elmCurrentlyDragged);

								let elmDropped;
								let dropHTML = transfer.getData("text/wx-sl-treeitem-html");

								if(dropInRootFolder) {
									m_elmTreeRoot.insertAdjacentHTML("beforeend", dropHTML);
									elmDropped = m_elmTreeRoot.lastElementChild;
								} else if(inFolder) {
									let elmDropTargetFolderUL = elmDropTarget.lastElementChild;
									setFolderState(elmDropTarget, true);		// open the folder if closed
									elmDropTargetFolderUL.insertAdjacentHTML("afterbegin", dropHTML);
									elmDropped = elmDropTargetFolderUL.firstElementChild;

									// don't display DropInsideFolder message any more. The user gets it.
									internalPrefs.setDropInsideFolderShowMsgCount(0);
								} else {
									elmDropTarget.insertAdjacentHTML("beforebegin", dropHTML);
									elmDropped = elmDropTarget.previousElementSibling;
								}

								removeFeedLoadingStatus(elmDropped);
								updateTreeBranchFoldersStats(elmDraggedFolderUL);
								updateTreeBranchFoldersStats(elmDropped);
								elmDropped.focus();
							});
						});
					}).catch((error) => {
						InfoBubble.i.show("Bookmarks error: Drop target may have been removed.\nShift+click on toolbar button <b>Check feeds</b> to reload the sidebar.", undefined, true, false, 4000)
						console.log("[Sage-Like]", "Bookmarks get error", error);
					});
				}).catch((error) => {
					InfoBubble.i.show("Bookmarks error: Dragged item may have been removed.\nShift+click on toolbar button <b>Check feeds</b> to reload the sidebar.", undefined, true, false, 4000)
					console.log("[Sage-Like]", "Bookmarks get error", error);
				});

			} else if (transfer.types.includes("text/x-moz-url")) {

				let mozUrl = transfer.getData("text/x-moz-url").split("\n");
				let url = stripFeedPreviewUrl(mozUrl[0]);

				if( !!slUtil.validURL(url) ) {
					createNewFeedExtended(elmDropTarget, (!!mozUrl[1] ? mozUrl[1] : "New Feed"), url, true, false, event.shiftKey);
				} else {
					InfoBubble.i.show("The dropped url is not valid.");
					console.log("[Sage-Like]", "Drop text/x-moz-url invalid URL error", "'" + url + "'");
				}

			} else if (transfer.types.includes("text/uri-list")) {

				let url = stripFeedPreviewUrl(transfer.getData("URL"));

				if( !!slUtil.validURL(url) ) {
					createNewFeedExtended(elmDropTarget, "New Feed", url, true, false, event.shiftKey);
				} else {
					InfoBubble.i.show("The dropped url is not valid.");
					console.log("[Sage-Like]", "Drop text/uri-list invalid URL error", "'" + url + "'");
				}

			} else if (transfer.types.includes("text/plain")) {

				let data = stripFeedPreviewUrl(transfer.getData("text/plain"));

				if( !!slUtil.validURL(data) ) {
					createNewFeedExtended(elmDropTarget, "New Feed", data, true, false, event.shiftKey);
				} else {
					InfoBubble.i.show("The dropped text is not a valid URL.");
					console.log("[Sage-Like]", "Drop text/plain invalid URL error", "'" + data + "'");
				}
			}
		}
		elmDropTarget.classList.remove("draggedOver", "dropInside");
		return false;
	}

	//==================================================================================
	//=== Open Tree Feed in List
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function openTreeFeed(elmLI, reload) {

		// remove here if is error
		setFeedErrorState(elmLI, false);

		rssListView.disposeList();

		let url = elmLI.getAttribute("href");

		// Since all is asynchronous, if a slow responding feed is clicked right before a faster one it
		// will be processed last and will alter the rssListView result.
		// Therefore to make sure that the last user-click is not overridden by the slower previous one
		// save the time of the last feed click twice; globally and locally. Then perform selected functions only if
		// the time of this feed click time is equal to the global.
		let thisFeedClickTime = m_lastClickedFeedTime = Date.now();

		setOneConcurrentFeedLoadingState(elmLI, true);

		let gettingTimeout = prefs.getFetchTimeout();
		let getttingShowAttach = prefs.getShowFeedItemDescAttach();

		gettingTimeout.then((timeout) => {
			getttingShowAttach.then(showAttach => {

				syndication.fetchFeedItems(url, timeout*1000, reload, true, showAttach).then((result) => {

					let fdDate = new Date(slUtil.asSafeNumericDate(result.feedData.lastUpdated));

					setFeedVisitedState(elmLI, true);
					updateFeedTitle(elmLI, result.feedData.title);
					updateFeedStatsFromHistory(elmLI, result.list);
					setTreeItemTooltipFull(elmLI, result.feedData.title, "Update: " + fdDate.toWebExtensionLocaleString());

					// change the rssListView content only if this is the last user click.
					if(thisFeedClickTime === m_lastClickedFeedTime) {
						rssListView.setFeedItems(result.list, getTreeItemText(elmLI), elmLI);
					}

				}).catch((error) => {

					setFeedErrorState(elmLI, true, error.message);
					updateTreeItemStats(elmLI, 0, 0);		// will remove the stats

					// change the rssListView content only if this is the last user click.
					if(thisFeedClickTime === m_lastClickedFeedTime) {
						rssListView.setListErrorMsg(error.message, getTreeItemText(elmLI), url);
					}
				}).finally(() => {	// wait for Fx v58

					// change loading state only if this is the last user click.
					if(thisFeedClickTime === m_lastClickedFeedTime) {
						setOneConcurrentFeedLoadingState(elmLI, false);
					}

					// even if there was an error the feed was visited
					m_objTreeFeedsData.set(elmLI.id, { lastVisited: slUtil.getCurrentLocaleDate().getTime() });

					updateTreeBranchFoldersStats(elmLI);
				});
			});
		});

		elmLI.focus();
	}

	//==================================================================================
	//=== Bookmarks Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventHandler(id, objInfo) {

		if(m_lockBookmarksEventHandler.isUnlocked) {

			let ids = [id];

			// bookmark moved/removed
			if(objInfo.parentId) {
				ids.push(objInfo.parentId);
			}

			// bookmark moved
			if(objInfo.oldParentId) {
				ids.push(objInfo.oldParentId);
			}

			slUtil.isDescendantOfRoot(ids).then((isDescendant) => {
				if(isDescendant) {
					setTbButtonCheckFeedsAlert(true);
				}
			});
		}
	}

	//==================================================================================
	//=== Toolbar Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickCheckTreeFeeds(event) {

		if( !m_rssTreeCreatedOK || event.shiftKey ) {
			handleTreeClearFilter();
			rssListView.disposeList();
			createRSSTree();
		} else {
			monitorRSSTreeFeeds(true);
		}
		setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExpandCollapseAll(event) {

		if(this.id === "expandall") {

			let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FOLDER + ".closed");
			for(let i=elms.length-1; i>=0; i--) {
				setFolderState(elms[i], true, false);
			}

		} else {

			let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FOLDER + ".open");
			for(let i=0, len=elms.length; i<len; i++) {
				setFolderState(elms[i], false);
			}

			// move selected item to top most visible parent folder
			if(!!m_elmCurrentlySelected && !!!m_elmCurrentlySelected.offsetParent) {

				let elm = m_elmCurrentlySelected;
				while(!!!elm.offsetParent) {
					elm = elm.parentElement;
				}
				setFeedSelectionState(elm);
			}
		}
		setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickFilter(event) {
		openFilterWidget();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTransitionEndFilterTextBoxContainer(event) {

		if(event.target === m_elmFilterTextBoxContainer && event.propertyName === "width") {

			// apply 'overflow: visible' after the transition was completed so that the
			// inner filter buttons (apply & clear) will have the box-shadow affect when hovered
			if(m_elmFilterWidget.classList.contains("opened")) {
				m_elmFilterTextBoxContainer.classList.add("visibleOverflow");
			} else {
				m_elmFilterTextBoxContainer.style.display = "none";
				InfoBubble.i.dismiss();
				unfilterAllTreeItems();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeTextFilter(event) {

		clearTimeout(m_filterChangeDebouncer);
		m_filterChangeDebouncer = setTimeout(() => {

			handleTreeFilter();

			// selected item always in view if it's visible
			if(!!m_elmCurrentlySelected && !!m_elmCurrentlySelected.offsetParent) {
				setTimeout(() => slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstElementChild, m_elmTreeRoot.parentElement, "auto"), 600);
			}

			m_filterChangeDebouncer = null;
		}, 150);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTextFilter(event) {
		if(event.code === "Escape") {
			handleTreeClearFilter();

			// selected item always in view
			if(!!m_elmCurrentlySelected) {
				setTimeout(() => slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstElementChild, m_elmTreeRoot.parentElement, "auto"), 600);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickReapplyFilter(event) {

		clearTimeout(m_filterChangeDebouncer);
		m_filterChangeDebouncer = setTimeout(() => {

			handleTreeFilter();
			InfoBubble.i.dismiss();

			// selected item always in view if it's visible
			if(!!m_elmCurrentlySelected && !!m_elmCurrentlySelected.offsetParent) {
				setTimeout(() => slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstElementChild, m_elmTreeRoot.parentElement, "auto"), 600);
			}

			m_filterChangeDebouncer = null;
		}, 150);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickClearFilter(event) {

		handleTreeClearFilter();

		// selected item always in view
		if(!!m_elmCurrentlySelected) {
			setTimeout(() => slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstElementChild, m_elmTreeRoot.parentElement, "auto"), 600);
		}
	}

	//==================================================================================
	//=== Adding New Tree Items (discovery)
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addNewFeeds(newFeedsList) {

		prefs.getRootFeedsFolderId().then((parentId) => {

			let bookmarksList = newFeedsList.map((feed) => {
				return {
					parentId: parentId,
					title: feed.title,
					url: feed.url,
				};
			});
			createBookmarksSequentially(bookmarksList);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createBookmarksSequentially(bookmarksList) {

		/*
			Because bookmarks.create() is an asynchronous function the creation of multiple bookmarks
			sequentially is performed to the same index (last index) and will appear in reverse order.

			This function makes sure that all the create actions are done in the order thay were delivered.
		*/

		suspendBookmarksEventHandler(() => {
			return new Promise(async (resolve, reject) => {

				let created, elmLI;
				for(let i=0, len=bookmarksList.length; i<len; i++) {

					created = await browser.bookmarks.create(bookmarksList[i]);

					elmLI = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FEED, created.url);
					elmLI.classList.add("blinkNew");
					m_elmTreeRoot.appendChild(elmLI);

					m_objTreeFeedsData.set(created.id);
					setFeedVisitedState(elmLI, false);
				}

				elmLI.scrollIntoView({behavior: "smooth"});		// when loop terminates the elmLI is the last LI appended
				blinkNewlyAddedFeeds();
				resolve();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function blinkNewlyAddedFeeds() {

		let elms = m_elmTreeRoot.querySelectorAll(".blinkNew");

		for (let i=0, len=elms.length; i<len; i++) {
			const elm = elms[i];
			blinkElement(elm, elm.style.visibility, 200, 1500);
			elm.classList.remove("blinkNew");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function blinkElement(elm, orgVisibility, interval, duration) {

		elm.style.visibility = (elm.style.visibility === "hidden" ? orgVisibility : "hidden");

		if(duration > 0) {
			setTimeout(blinkElement, interval, elm, orgVisibility, interval, duration-interval);
		} else {
			elm.style.visibility = orgVisibility;
		}
	}

	//==================================================================================
	//=== Context Menu Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function openNewFeedProperties(elmLI) {
		NewFeedPropertiesView.i.open(elmLI, "New Feed", "").then((result) => {
			createNewFeedExtended(result.elmLI, result.title, result.url, result.updateTitle, result.openInFeedPreview, result.inFolder);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeedExtended(elmItem, title, url, updateTitle, openInFeedPreview, inFolder) {

		if (TreeItemType.isTree(elmItem)) {
			createNewFeedInRootFolder(title, url, updateTitle, openInFeedPreview);
		} else {
			createNewFeed(elmItem, title, url, updateTitle, openInFeedPreview, inFolder);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeed(elmLI, title, url, updateTitle, openInFeedPreview, inFolder) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inFolder is true then insert new item inside the provided folder item
			inFolder = inFolder && TreeItemType.isFolder(elmLI);

			let newBookmark = {
				index: (inFolder ? 0 : bookmarks[0].index),			// insert as first in folder
				parentId: (inFolder ? bookmarks[0].id : bookmarks[0].parentId),
				title: title,
				type: "bookmark",
				url: url,
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newBookmark).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FEED, created.url);

					if(inFolder) {
						let elmFolderUL = elmLI.lastElementChild;
						setFolderState(elmLI, true);		// open the folder if closed
						elmFolderUL.insertBefore(newElm, elmFolderUL.firstElementChild);
					} else {
						elmLI.parentElement.insertBefore(newElm, elmLI);
					}

					setFeedVisitedState(newElm, false);
					updateTreeBranchFoldersStats(newElm);
					m_objTreeFeedsData.set(created.id, { updateTitle: updateTitle, openInFeedPreview: openInFeedPreview });
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeedInRootFolder(title, url, updateTitle, openInFeedPreview) {

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				console.log("[Sage-Like]", "Can't create new feed in root folder when root folder is not set.");
				return;
			}

			let newBookmark = {
				parentId: folderId,
				title: title,
				type: "bookmark",
				url: url,
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newBookmark).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FEED, created.url);

					m_elmTreeRoot.appendChild(newElm);

					setFeedVisitedState(newElm, false);
					m_objTreeFeedsData.set(created.id, { updateTitle: updateTitle, openInFeedPreview: openInFeedPreview });
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openNewFolderProperties(elmLI) {
		NewFolderPropertiesView.i.open(elmLI, "New Folder").then((result) => {
			createNewFolderExtended(result.elmLI, result.title, result.inFolder);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolderExtended(elmItem, title, inFolder) {

		if (TreeItemType.isTree(elmItem)) {
			createNewFolderInRootFolder(title);
		} else {
			createNewFolder(elmItem, title, inFolder);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolder(elmLI, title, inFolder) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inFolder is true then insert new folder inside the provided folder item
			inFolder = inFolder && TreeItemType.isFolder(elmLI);

			let newFolder = {
				index: (inFolder ? 0 : bookmarks[0].index),			// insert as first in folder
				parentId: (inFolder ? bookmarks[0].id : bookmarks[0].parentId),
				title: title,
				type: "folder",
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newFolder).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FOLDER, null);
					let elmUL = createTagUL();

					newElm.appendChild(elmUL);

					setFolderState(newElm, false);

					if(inFolder) {
						let elmFolderUL = elmLI.lastElementChild;
						setFolderState(elmLI, true);
						elmFolderUL.insertBefore(newElm, elmFolderUL.firstElementChild);
					} else {
						elmLI.parentElement.insertBefore(newElm, elmLI);
					}

					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolderInRootFolder(title) {

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				console.log("[Sage-Like]", "Can't create new folder in root folder when root folder is not set.");
				return;
			}

			let newFolder = {
				parentId: folderId,
				title: title,
				type: "folder",
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newFolder).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FOLDER, null);
					let elmUL = createTagUL();

					newElm.appendChild(elmUL);
					m_elmTreeRoot.appendChild(newElm);

					setFolderState(newElm, false);
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function pasteFeedUrlFromClipboard(elmLI) {
		slUtil.readTextFromClipboard().then((text) => {
			if( !!slUtil.validURL( (text = stripFeedPreviewUrl(text)) ) ) {
				setFolderState(elmLI, true);		// will do nothing if it's a feed
				createNewFeedExtended(elmLI, "New Feed", text, true, false, true);
			} else {
				InfoBubble.i.show("The pasted text is not a valid URL.");
				console.log("[Sage-Like]", "Pasted text invalid URL error", "'" + text + "'");
			}
		}).catch((error) => InfoBubble.i.show(error.message) );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function deleteTreeItem(elmLI) {

		if(!TreeItemType.isTreeItem(elmLI)) return;

		let isFolder = TreeItemType.isFolder(elmLI);
		let text = "Permanently delete the ";

		if(isFolder) {
			text += "folder <b>'" + getTreeItemText(elmLI).escapeMarkup() + "'</b> <u>and all of its contents</u> from your bookmarks?"
		} else {
			text += "feed <b title=\"" + elmLI.getAttribute("href") + "\">'" + getTreeItemText(elmLI).escapeMarkup() + "'</b> from your bookmarks?"
		}

		messageView.open(text, messageView.ButtonSet.setYesNo, "Delete " + (isFolder ? "Folder" : "Feed")).then((result) => {

			if(result === messageView.ButtonCode.Yes) {

				let funcBookmarksRemove = isFolder ? browser.bookmarks.removeTree : browser.bookmarks.remove;

				suspendBookmarksEventHandler(() => {
					return funcBookmarksRemove(elmLI.id).then(() => {

						if(elmLI.nextElementSibling !== null) {
							elmLI.nextElementSibling.focus();
						} else if(elmLI.previousElementSibling !== null) {
							elmLI.previousElementSibling.focus();
						} else if(elmLI.parentElement.parentElement.tagName === "LI") {
							elmLI.parentElement.parentElement.focus();
						} else {
							m_elmCurrentlySelected = null;
						}

						if(rssListView.getListViewTitle() === getTreeItemText(elmLI)) {
							rssListView.disposeList();
						}

						let elmDeletedFolderUL = elmLI.parentElement;
						elmDeletedFolderUL.removeChild(elmLI);
						updateTreeBranchFoldersStats(elmDeletedFolderUL);
						m_objTreeFeedsData.remove(elmLI.id);

					}).catch((error) => {
						InfoBubble.i.show("Bookmarks error: Item may have been already removed.\nShift+click on toolbar button <b>Check feeds</b> to reload the sidebar.", undefined, true, false, 4000)
						console.log("[Sage-Like]", "Bookmarks remove" + (isFolder ? "Tree" : "") + " error", error);
					});
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openAllFeedsInTabs(elmLI, onlyUnread = true) {

		if(!!!elmLI) return;

		let parkedTabUrl;
		let elms = elmLI.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED + (onlyUnread ? ".bold" : ""));

		for(let i=0, len=elms.length; i<len; i++) {
			const elm = elms[i];		// redeclare each iteration due to the async Promise
			parkedTabUrl = slUtil.getParkedTabUrl(slUtil.getFeedPreviewUrl(elm.getAttribute("href")), getTreeItemText(elm));
			browser.tabs.create({ active: false, url: parkedTabUrl }).then(() => {
				setFeedVisitedState(elm, true);
				m_objTreeFeedsData.set(elm.id, { lastVisited: slUtil.getCurrentLocaleDate().getTime() });
			}).catch((error) => {
				console.log("[Sage-Like]", error);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleVisitedState(elmLI) {

		if(!!elmLI) {
			if(TreeItemType.isFeed(elmLI)) {
				toggleFeedVisitedState(elmLI);
			} else if(TreeItemType.isFolder(elmLI)) {
				toggleFolderFeedsVisitedState(elmLI);
			}
			notifyAppliedFilter();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleFeedVisitedState(elmLI) {

		if(elmLI.classList.contains("error")) {
			InfoBubble.i.show("Feed is erroneous.", elmLI, true, m_elmTreeRoot.style.direction === "rtl", 3500, true);
			return;
		}

		if(elmLI.classList.toggle("bold")) {
			// turned to not visited
			m_objTreeFeedsData.set(elmLI.id, { lastVisited: 0 });
		} else {
			// turned to visited
			m_objTreeFeedsData.set(elmLI.id, { lastVisited: slUtil.getCurrentLocaleDate().getTime() });
		}
		updateTreeBranchFoldersStats(elmLI);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleFolderFeedsVisitedState(elmLI) {

		// matching elements are in document order
		let elms = elmLI.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED + ":not(.error)");

		if(elms.length > 0) {

			let elm, visitedState = elms[0].classList.contains("bold");		// first element sets the visited state; document order

			for(let i=0, len=elms.length; i<len; i++) {

				elm = elms[i];

				elm.classList.toggle("bold", !visitedState);
				m_objTreeFeedsData.set(elm.id, { lastVisited: (visitedState ? slUtil.getCurrentLocaleDate().getTime() : 0) }, false);

				// only once per folder
				if(!!!elm.nextElementSibling) {
					updateTreeBranchFoldersStats(elm);
				}
			}
			m_objTreeFeedsData.setStorage();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function markAllFeedsAsVisitedState(isVisited) {

		let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED + ":not(.error)");

		if(elms.length > 0) {

			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].classList.toggle("bold", !isVisited);
				m_objTreeFeedsData.set(elms[i].id, { lastVisited: (isVisited ? slUtil.getCurrentLocaleDate().getTime() : 0) }, false);
			}
			m_objTreeFeedsData.setStorage();
			updateAllTreeFoldersStats();
			notifyAppliedFilter();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openEditTreeItemProperties(elmLI) {

		if (TreeItemType.isFolder(elmLI)) {

			EditFolderPropertiesView.i.open(elmLI).then((result) => {
				updateFolderProperties(result.elmLI, result.title);
			});

		} else if (TreeItemType.isFeed(elmLI)) {

			m_objTreeFeedsData.setIfNotExist(elmLI.id);
			let treeFeed = m_objTreeFeedsData.value(elmLI.id);
			EditFeedPropertiesView.i.open(elmLI, treeFeed.updateTitle, treeFeed.openInFeedPreview).then((result) => {
				updateFeedProperties(result.elmLI, result.title, result.url, result.updateTitle, result.openInFeedPreview);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedProperties(elmLI, newTitle, newUrl, newUpdateTitle, newOpenInFeedPreview) {

		let changes = {
			title: newTitle,
			url: newUrl,
		};

		suspendBookmarksEventHandler(() => {
			return browser.bookmarks.update(elmLI.id, changes).then((updated) => {

				setTreeItemText(elmLI, updated.title);
				notifyAppliedFilter();

				let urlChanged = (elmLI.getAttribute("href") !== updated.url);

				if(urlChanged) {
					elmLI.setAttribute("href", updated.url);
					setFeedVisitedState(elmLI, false);
				}
				setTreeItemTooltip(elmLI);
				m_objTreeFeedsData.set(updated.id, { updateTitle: newUpdateTitle, openInFeedPreview: newOpenInFeedPreview });
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFolderProperties(elmLI, newTitle) {

		let changes = {
			title: newTitle,
		};

		suspendBookmarksEventHandler(() => {
			return browser.bookmarks.update(elmLI.id, changes).then((updated) => {
				setTreeItemText(elmLI, updated.title);
				setTreeItemTooltip(elmLI);
			});
		});
	}

	//==================================================================================
	//=== Tree Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function updateTreeBranchFoldersStats(elm) {

		// Pity the CPU
		if(!m_bPrefShowFeedStats) return;

		let elmULFolder;

		if(TreeItemType.isTreeItem(elm)) {
			elmULFolder = elm.parentElement;
		} else if(elm.tagName === "UL") {
			elmULFolder = elm;
		} else {
			return;
		}

		let totalCount, unreadCount;

		try {
			while(elmULFolder !== m_elmTreeRoot) {

				totalCount = elmULFolder.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED).length;
				unreadCount = elmULFolder.querySelectorAll(":not(.error).bold." + slGlobals.CLS_RTV_LI_TREE_FEED).length;

				updateTreeItemStats(elmULFolder.parentElement, totalCount, unreadCount);

				elmULFolder = elmULFolder.parentElement.parentElement;
			}
		} catch (error) {
			console.log("[Sage-Like]", "A tree item may have been deleted. ", error);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateAllTreeFoldersStats() {

		// Have mercy on the CPU
		if(!m_bPrefShowFeedStats) return;

		let totalCount, unreadCount, elmLI;
		let elmLIs = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FOLDER);

		for (let i=0, len=elmLIs.length; i<len; i++) {

			elmLI = elmLIs[i];

			totalCount = elmLI.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED).length;
			unreadCount = elmLI.querySelectorAll(".bold." + slGlobals.CLS_RTV_LI_TREE_FEED).length;

			updateTreeItemStats(elmLI, totalCount, unreadCount);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function updateFeedStatsFromHistory(elmLI, feedItems) {

		if(m_bPrefShowFeedStats && !!feedItems) {

			let totalCount = feedItems.length;
			let vItems, unreadCount = 0;

			for(let i=0; i<totalCount; i++) {
				try {
					vItems = await browser.history.getVisits({ url: feedItems[i].url });
					if(vItems.length === 0) {
						unreadCount++;
					}
				} catch (error) {
					console.log("[Sage-Like]", "get history visits", error);
				}
			}
			updateTreeItemStats(elmLI, totalCount, unreadCount);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateTreeItemStats(elmLI, totalCount, unreadCount) {

		if(m_bPrefShowFeedStats && TreeItemType.isTreeItem(elmLI)) {
			//setTreeItemStats(elmLI, "(\u200a" + unreadCount + "\u200a/\u200a" + totalCount + "\u200a)");	// THIN SPACE
			setTreeItemStats(elmLI, unreadCount > 0 ? "(\u200a" + unreadCount + "\u200a)" : "");	// HAIR SPACE
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedTitle(elmLI, title) {

		let treeFeedsData = m_objTreeFeedsData.value(elmLI.id);

		// don't change title if user unchecked that option for this feed
		// don't change title to empty string
		if(!!treeFeedsData && treeFeedsData.updateTitle === true && title.length > 0) {

			browser.bookmarks.get(elmLI.id).then((bookmarks) => {

				// don't change title if title is the same
				if(bookmarks[0].title !== title) {

					suspendBookmarksEventHandler(() => {
						return browser.bookmarks.update(elmLI.id, { title: title }).then((updatedNode) => {
							setTreeItemText(elmLI, updatedNode.title);
							notifyAppliedFilter();
						}).catch((error) => console.log("[Sage-Like]", error) );
					});
				}
			}).catch((error) => console.log("[Sage-Like]", error) );
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleFolderState(elm) {

		if(TreeItemType.isFolder(elm)) {

			if (TreeItemType.isOpen(elm)) {
				setFolderVisibility(elm, false);
				m_objOpenTreeFolders.remove(elm.id);
			} else {
				setFolderVisibility(elm, true);
				m_objOpenTreeFolders.set(elm.id);
				elm.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFolderState(elm, open, scrollIntoView = true) {

		if(TreeItemType.isFolder(elm)) {

			if (open) {
				setFolderVisibility(elm, true);
				m_objOpenTreeFolders.set(elm.id);

				if(scrollIntoView) {
					elm.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
				}
			} else {
				setFolderVisibility(elm, false);
				m_objOpenTreeFolders.remove(elm.id);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFolderVisibility(elmLI, open) {
		// Don't Call This Directly
		elmLI.classList.toggle("open", open);
		elmLI.classList.toggle("closed", !open);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedLoadingState(elm, isLoading) {
		elm.classList.toggle("loading", isLoading);
		notifyAppliedFilter();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setOneConcurrentFeedLoadingState(elm, isLoading) {

		if (isLoading && m_elmCurrentlyLoading !== null) {
			m_elmCurrentlyLoading.classList.remove("loading");
		}
		elm.classList.toggle("loading", isLoading);
		m_elmCurrentlyLoading = isLoading ? elm : null;
		notifyAppliedFilter();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedSelectionState(elm) {

		if(!!elm) {

			if (m_elmCurrentlySelected !== null) {
				m_elmCurrentlySelected.classList.remove("selected");
			}

			// select only selectable tree items
			if (TreeItemType.isTreeItem(elm)) {
				m_elmCurrentlySelected = elm;
				elm.classList.add("selected");
				slUtil.scrollIntoViewIfNeeded(elm.firstElementChild, m_elmTreeRoot.parentElement, "auto");
				internalPrefs.setTreeSelectedItemId(elm.id);
			} else {
				m_elmCurrentlySelected = null;
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedVisitedState(elm, isVisited) {
		elm.classList.toggle("bold", !isVisited);
		notifyAppliedFilter();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedErrorState(elm, isError, errorMsg) {

		elm.classList.toggle("error", isError);
		setTreeItemTooltip(elm, isError ? "Error: " + errorMsg : undefined);
		notifyAppliedFilter();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setTreeItemTooltip(elmLI, thirdLine) {

		let tooltipText;

		if(elmLI.hasAttribute("href")) {

			tooltipText =
				"Title: " + getTreeItemText(elmLI) +
				"\nURL: " + elmLI.getAttribute("href") +
				(!!thirdLine ? "\n" + thirdLine : "");

			tooltipText = tooltipText.replace(/(^[a-z]{3,6}:) /gim, "$1\u2003");			// 'Title', 'URL', 'Update', 'Error'

		} else {
			tooltipText = getTreeItemText(elmLI);		// folder has only title
		}
		elmLI.title = tooltipText;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setTreeItemTooltipFull(elmLI, titleLine, thirdLine) {

		let tooltipText = "Title: ";
		let treeFeedsData = m_objTreeFeedsData.value(elmLI.id);

		// don't use channel title if user unchecked that option for this feed
		if(!!treeFeedsData && treeFeedsData.updateTitle && !!titleLine) {
			tooltipText += titleLine;
		} else {
			tooltipText += getTreeItemText(elmLI);
		}

		tooltipText +=
			(elmLI.hasAttribute("href") ? ("\nURL: " + elmLI.getAttribute("href")) : "") +
			"\n" + thirdLine;

		tooltipText = tooltipText.replace(/(^[a-z]{3,6}:) /gim, "$1\u2003");			// 'Title', 'URL', 'Update', 'Error'
		elmLI.title = tooltipText;
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setTbButtonCheckFeedsAlert(isAlertOn) {

		if(m_elmCheckTreeFeeds.slSavedTitle === undefined) {
			m_elmCheckTreeFeeds.slSavedTitle = m_elmCheckTreeFeeds.title;
		}

		m_elmCheckTreeFeeds.classList.toggle("alert", isAlertOn);

		if(isAlertOn) {
			m_elmCheckTreeFeeds.title = "The feeds folder or it's content has been modified by another party.\nShift+click to reload.";
			InfoBubble.i.show(m_elmCheckTreeFeeds.title, m_elmCheckTreeFeeds);
		} else {
			m_elmCheckTreeFeeds.title = m_elmCheckTreeFeeds.slSavedTitle;
			InfoBubble.i.dismiss();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function suspendBookmarksEventHandler(callbackPromise) {

		m_lockBookmarksEventHandler.lock();

		callbackPromise().catch((error) => {
			console.log("[Sage-Like]", error, callbackPromise);
		}).finally(() => m_lockBookmarksEventHandler.unlock() );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeFeedLoadingStatus(elmLI) {

		let list;
		if(TreeItemType.isFolder(elmLI)) {
			list = elmLI.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED)
		} else if(TreeItemType.isFeed(elmLI)) {
			list = [elmLI];
		}

		for (let i=0, len=list.length; i<len; i++) {
			if(m_elmCurrentlyLoading && m_elmCurrentlyLoading.id === list[i].id) {
				setOneConcurrentFeedLoadingState(list[i], false);
			} else {
				list[i].classList.remove("loading");				// if loading from periodic check
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function switchViewDirection() {
		if(m_elmTreeRoot.parentElement.style.direction === "rtl") {
			m_elmTreeRoot.parentElement.style.direction = m_elmTreeRoot.style.direction = "ltr";
		} else {
			m_elmTreeRoot.parentElement.style.direction = m_elmTreeRoot.style.direction = "rtl";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isFeedInTree(url) {
		return (m_elmTreeRoot.querySelector("." + slGlobals.CLS_RTV_LI_TREE_FEED + "[href=\"" + url + "\"]") !== null);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeTree() {

		while (m_elmTreeRoot.firstElementChild) {
			m_elmTreeRoot.removeChild(m_elmTreeRoot.firstElementChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function eventOccureInItemCaptionHeight(evt, elm) {

		// This function checks if the event has occured in the top part of the element
		return ((evt.clientY - elm.getBoundingClientRect().top) <= elm.firstElementChild.getBoundingClientRect().height);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function eventOccureInItemIcon(evt, elm) {

		// This function checks if the event has occured in the top-left part of the element
		if(eventOccureInItemCaptionHeight(evt, elm)) {
			return ( ((evt.clientX - elm.getBoundingClientRect().left) <= panel.getDensity().treeIndent) );
		} else {
			return false;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFocus() {
		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.focus();
		} else {
			m_elmTreeRoot.focus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleOnInstallExtension() {

		return new Promise((resolve) => {

			// Even if the extension is installed, check the extension's prefs to see if the feed folder ID is
			// set and can be obtained. This can happen if the extension's local storage was not removed
			prefs.getRootFeedsFolderId().then((folderId) => {

				if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {

					browser.bookmarks.search({ title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME }).then(async (treeNodes) => {

						let rootId, foundNode = treeNodes.find((node) => { return node.type === "folder"; });

						if(!!foundNode) {
							rootId = foundNode.id;
						} else {
							InfoBubble.i.show("Creating default feeds folder. Please wait...", undefined, false);
							rootId = await createOnInstallFeedsBookmarksFolder();
							InfoBubble.i.dismiss();
						}

						prefs.setRootFeedsFolderId(rootId);
						resolve();
					});
				} else {
					resolve();
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function createOnInstallFeedsBookmarksFolder() {

		return new Promise(async (resolve) => {

			let folderRoot = {
				parentId: slGlobals.BOOKMARKS_ROOT_MENU_GUID,
				title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME,
				type: "folder",
			};

			let folders = [
				{	details: { title: "News", type: "folder" },
					feeds: [{ title: "Reddit World News", url: "https://www.reddit.com/r/worldnews/.rss" },
							{ title: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
							{ title: "BuzzFeed News", url: "https://www.buzzfeed.com/world.xml" },
						//	{ title: "Google World United States", url: "https://news.google.com/news/rss/headlines/section/topic/WORLD" },
					],
				},
				{	details: { title: "Tech", type: "folder" },
					feeds: [{ title: "TechCrunch", url: "https://feeds.feedburner.com/TechCrunch" },
							{ title: "Top News - MIT", url: "https://www.technologyreview.com/topnews.rss" },
							{ title: "Ars Technica", url: "http://feeds.arstechnica.com/arstechnica/technology-lab" },
						//	{ title: "Techmeme", url: "https://www.techmeme.com/feed.xml" },
					],
				},
				{	details: { title: "DIY", type: "folder" },
					feeds: [{ title: "Pretty Handy Girl", url: "https://www.prettyhandygirl.com/feed/" },
							{ title: "Man Made DIY", url: "https://www.manmadediy.com/site_index.rss" },
						//	{ title: "Ana White", url: "https://www.ana-white.com/feed" },
							{ title: "Remodelaholic", url: "https://www.remodelaholic.com/category/diy/feed" },
					],
				},
				{	details: { title: "Sports", type: "folder" },
					feeds: [{ title: "RunningPhysio", url: "https://www.running-physio.com/feed" },
							{ title: "Goal", url: "https://www.goal.com/en/feeds/news?fmt=rss&ICID=HP" },
							{ title: "Bike Rumor", url: "https://feeds.feedburner.com/BikeRumor" },
						//	{ title: "CelticsBlog", url: "https://www.celticsblog.com/rss/current" },
					],
				},
				{	details: { title: "Mozilla", type: "folder" },
					feeds: [{ title: "Mozilla Press Center", url: "https://blog.mozilla.org/press/feed/" },
							{ title: "The Mozilla Blog", url: "https://developer.mozilla.org/devnews/index.php/feed/atom/" },
						//	{ title: "Extensions", url: "https://addons.mozilla.org/en-US/firefox/extensions/format:rss?sort=updated" },
					],
				},
			];

			let createdRoot = await browser.bookmarks.create(folderRoot);
			let createdFolder;

			m_objOpenTreeFolders.clear(false);

			for (let idx=0, len=folders.length; idx<len; idx++) {
				folders[idx].details.parentId = createdRoot.id;
				createdFolder = await createBookmarksFolder(folders[idx]);
				m_objOpenTreeFolders.set(createdFolder.id);
			}

			resolve(createdRoot.id);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function createBookmarksFolder(folder) {

		let createdFolder = await browser.bookmarks.create(folder.details);

		for (let idx=0, len=folder.feeds.length; idx<len; idx++) {
			folder.feeds[idx].parentId = createdFolder.id;
			await browser.bookmarks.create(folder.feeds[idx]);
		}
		return createdFolder;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showDelayedLoadingAnimation() {

		// show loading animation (if not already removed by disposeTree()) if it takes too long
		setTimeout(() => {
			let anim = document.getElementById("busyAnimTreeLoading");
			if(anim) {
				anim.classList.add("visible");
			}
		}, 800);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isRssTreeCreatedOK() {
		return m_rssTreeCreatedOK;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openFilterWidget() {

		m_elmFilterTextBoxContainer.style.display = "flex";

		internalPrefs.getMsgShowCountHoverFilterTextBox().then((count) => {
			if(count > 0) {
				InfoBubble.i.show("Hover over the filter text box for vital information.", m_elmFilterWidget, false, false, 4000);
				internalPrefs.setMsgShowCountHoverFilterTextBox(--count);
			}
			m_elmTextFilter.focus();
		}).finally(() => {
			setTimeout(() => m_elmFilterWidget.classList.add("opened"));
		});

		internalPrefs.getMsgShowCountReapplyFilter().then((count) => m_msgShowCountReapplyFilter = count );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleTreeFilter() {

		const txtValue = m_elmTextFilter.value;

		let itemsFiltered = false;		// pessimistic

		notifyAppliedFilter(true);
		m_elmFilterWidget.classList.remove("filterTextOn", "filterRegExpOn", "filterStatusOn", "filterUrlOn");
		m_elmTreeRoot.classList.add("hidden");

		if(txtValue !== "") {

			m_isFilterApplied = true;

			if(txtValue[0] === ">") {

				switch (txtValue.toLowerCase()) {
					case ">":		itemsFiltered = filterTreeItemStatus(TreeItemStatus.EMPTY);		break;
					case ">read":	itemsFiltered = filterTreeItemStatus(TreeItemStatus.VISITED);	break;
					case ">unread":	itemsFiltered = filterTreeItemStatus(TreeItemStatus.UNVISITED);	break;
					case ">error":	itemsFiltered = filterTreeItemStatus(TreeItemStatus.ERROR);		break;
					case ">load":	itemsFiltered = filterTreeItemStatus(TreeItemStatus.LOADING);	break;
					default:		itemsFiltered = filterTreeItemStatus(TreeItemStatus.UNDEFINED);	break;
				}

			} else if(txtValue[0] === "%") {

				itemsFiltered = filterTreeItemURL(txtValue.substring(1).trim().toLowerCase());

			} else {
				itemsFiltered = filterTreeItemText(txtValue);
			}
		}

		if (itemsFiltered) {
			filterEmptyFolderItems();
		} else {
			unfilterAllTreeItems();
			m_isFilterApplied = false;
		}

		m_elmTreeRoot.classList.remove("hidden");

		internalPrefs.setFeedsFilter(txtValue);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleTreeClearFilter() {

		m_elmFilterWidget.classList.remove("opened", "filterTextOn", "filterRegExpOn", "filterStatusOn", "filterUrlOn");
		m_elmFilterTextBoxContainer.classList.remove("visibleOverflow");
		m_elmTextFilter.value = "";
		notifyAppliedFilter(true);
		m_isFilterApplied = false;

		internalPrefs.setFeedsFilter("");
		InfoBubble.i.dismiss();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterTreeItemStatus(status) {

		m_elmFilterWidget.classList.add("filterStatusOn");

		// nothing to hide
		if(status === TreeItemStatus.EMPTY) {
			return false;
		}

		// select all tree items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

		// hide the ones that do not match the filter
		if(status === TreeItemStatus.ERROR) {
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].classList.toggle("filtered", !elms[i].classList.contains("error"));
			}
		} else if(status === TreeItemStatus.VISITED) {
			for(let i=0, len=elms.length; i<len; i++) {
				const cList = elms[i].classList;
				elms[i].classList.toggle("filtered", cList.contains("bold") || cList.contains("error") || cList.contains("loading"));
			}
		} else if(status === TreeItemStatus.UNVISITED) {
			for(let i=0, len=elms.length; i<len; i++) {
				const cList = elms[i].classList;
				elms[i].classList.toggle("filtered", !cList.contains("bold") || cList.contains("error") || cList.contains("loading"));
			}
		} else if(status === TreeItemStatus.LOADING) {
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].classList.toggle("filtered", !elms[i].classList.contains("loading"));
			}
		} else if(status === TreeItemStatus.UNDEFINED) {
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].classList.add("filtered");
			}
		}

		return true;	// itemsFiltered;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterTreeItemURL(txtFilter) {

		m_elmFilterWidget.classList.add("filterUrlOn");

		if(txtFilter.length > 0) {

			// select all tree items
			let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

			// hide the ones that do not match the filter
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].classList.toggle("filtered", !(elms[i].getAttribute("href").toLowerCase().includes(txtFilter)));
			}
			return true;		// itemsFiltered
		}

		return false;		// itemsFiltered
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterTreeItemText(txtFilter) {

		let funcSimpleFilter = (text, filter) => text.toLowerCase().includes(filter);
		let funcRegExpFilter = (text, filter) => text.match(filter) !== null;

		const REG_EXP_PATTERN = new RegExp("^(\/.*\/)([gimuy]*)$");
		let funcFilter, paramFilter, test = txtFilter.match(REG_EXP_PATTERN);

		// select which filter function to use
		if( !!test && slUtil.isRegExpValid(...(txtFilter.split('/').filter(e => e.length > 0))) ) {

			m_elmFilterWidget.classList.add("filterRegExpOn");
			paramFilter = test[1] + (test[2].includes("i") ? "i" : "");							// remove all flags except for 'i'
			paramFilter = new RegExp(...(paramFilter.split('/').filter((e, idx) => idx > 0)));	// convert to RegExp
			funcFilter = funcRegExpFilter;
		} else {

			m_elmFilterWidget.classList.add("filterTextOn");
			paramFilter = txtFilter.toLowerCase();						// case-insensitive
			funcFilter = funcSimpleFilter;
		}

		// if empty RegExp filter
		if(paramFilter.constructor.name === "RegExp" && paramFilter.source === "(?:)") {
			return false;
		}

		// select all tree items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

		// hide the ones that do not match the filter
		for(let i=0, len=elms.length; i<len; i++) {
			elms[i].classList.toggle("filtered", !funcFilter(getTreeItemText(elms[i]), paramFilter));
		}

		return true;		// itemsFiltered
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterEmptyFolderItems() {

		// select all folder items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FOLDER);

		// hide the ones that all their children are hidden
		for(let i=0, len=elms.length; i<len; i++) {

			let unFiltered = elms[i].querySelector("ul > ." + slGlobals.CLS_RTV_LI_TREE_FEED + ":not(.filtered)");
			elms[i].classList.toggle("filtered", unFiltered === null);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function unfilterAllTreeItems() {

		// show all that is hidden
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_ITEM + ".filtered");
		let len = elms.length;


		if(len === 0) return;

		// Duff’s Device: limiting loop iterations pattern
		let iterations = Math.ceil(len / 10);
		let startAt = len % 10;
		let i = 0, interval = 0, zeroed = 1;

		do {
			setTimeout(() => {
				switch(startAt){
					case 0: elms[i++].classList.remove("filtered");
					case 9: elms[i++].classList.remove("filtered");
					case 8: elms[i++].classList.remove("filtered");
					case 7: elms[i++].classList.remove("filtered");
					case 6: elms[i++].classList.remove("filtered");
					case 5: elms[i++].classList.remove("filtered");
					case 4: elms[i++].classList.remove("filtered");
					case 3: elms[i++].classList.remove("filtered");
					case 2: elms[i++].classList.remove("filtered");
					case 1: elms[i++].classList.remove("filtered");
				}
				startAt = 0;
			}, interval++ * 10 * zeroed);			// process in intervals of 10 ms

			if(interval === 100) zeroed = 0;		// after 100 intervals do not timeout the process
		} while (--iterations);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function notifyAppliedFilter(reset = false) {

		if(m_isFilterApplied) {

			if(m_elmReapplyFilter.slSavedTitle === undefined) {
				m_elmReapplyFilter.slSavedTitle = m_elmReapplyFilter.title;
			}

			if(reset) {
				m_elmReapplyFilter.classList.remove("alert");
				m_elmReapplyFilter.title = m_elmReapplyFilter.slSavedTitle;
			} else {

				// Do NOT notify the filter about changes if the current filter is on feed URLs.
				// Unlike feed title & feed status, a feed's URL is not modified by tree updates.

				if(!m_elmFilterWidget.classList.contains("filterUrlOn")) {

					m_elmReapplyFilter.classList.add("alert");
					m_elmReapplyFilter.title = "The state of one or more feeds has changed.\nFilter may require reapplying.";

					if(m_msgShowCountReapplyFilter > 0) {
						InfoBubble.i.show(m_elmReapplyFilter.title, m_elmReapplyFilter, true, true);
						internalPrefs.setMsgShowCountReapplyFilter(--m_msgShowCountReapplyFilter);
						m_msgShowCountReapplyFilter = 0;	// show only once per widget session
					}
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getTreeItemText(elmLI) {
		return elmLI.firstElementChild.firstElementChild.textContent;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setTreeItemText(elmLI, text) {
		elmLI.firstElementChild.firstElementChild.textContent = text;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setTreeItemStats(elmLI, text) {
		elmLI.firstElementChild.firstElementChild.nextElementSibling.textContent = text;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function stripFeedPreviewUrl(url) {
		return decodeURIComponent(url.replace(slUtil.getFeedPreviewUrl(""), ""));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disable(value) {

		if (value === true) {
			m_elmTreeRoot.setAttribute("disabled", "");
			m_elmTreeRoot.classList.add("disabled", "disabledBlur");

			let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_ITEM);
			for(let i=0, len=elms.length; i<len; i++) {
				if( !!(elms[i].offsetParent) ) {			// only if it's visible (items in closed folders)
					elms[i].tabIndex = -1;
					elms[i].setAttribute("disabled", "");
				}
			}

		} else {
			m_elmTreeRoot.removeAttribute("disabled");
			m_elmTreeRoot.classList.remove("disabled", "disabledBlur");

			let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_ITEM + "[disabled]");
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].tabIndex = 0;
				elms[i].removeAttribute("disabled");
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function broadcastRssTreeCreatedOK() {
		browser.runtime.sendMessage({
			id: slGlobals.MSG_ID_RSS_TREE_CREATED_OK
		});
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
		openNewFeedProperties: openNewFeedProperties,
		openNewFolderProperties: openNewFolderProperties,
		pasteFeedUrlFromClipboard: pasteFeedUrlFromClipboard,
		deleteTreeItem: deleteTreeItem,
		openAllFeedsInTabs: openAllFeedsInTabs,
		toggleVisitedState: toggleVisitedState,
		markAllFeedsAsVisitedState: markAllFeedsAsVisitedState,
		openEditTreeItemProperties: openEditTreeItemProperties,
		isFeedInTree: isFeedInTree,
		switchViewDirection: switchViewDirection,
		setFocus: setFocus,
		isRssTreeCreatedOK: isRssTreeCreatedOK,
		updateTreeItemStats: updateTreeItemStats,
		getTreeItemText: getTreeItemText,
		disable: disable,
	};

})();
