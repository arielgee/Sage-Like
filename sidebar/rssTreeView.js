"use strict";

let rssTreeView = (function() {

	//==================================================================================
	//=== Class Declerations
	//==================================================================================

	class OpenFolders extends StoredKeyedItems {
		getStorage() {
			return new Promise((resolve) => {
				internalPrefs.getOpenFolders().then((items) => {
					this._items = items;
					resolve(this.length);
				});
			});
		}
		setStorage() {
			internalPrefs.setOpenSubFolders(this._items);
		}
	};

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

	const FILTER_TOOLTIP_TITLE = "Filter the Displayed Feeds Using the Following Options: \u000d" +
									"  \u271a Simple search text (case-insensitive). \u000d" +
									"  \u271a Regular expression pattern enclosed between two slashes ('/'). \u000d" +
									"      Flag 'i' (case-insensitive) is supported when placed after the second slash. \u000d" +
									"  \u271a Special commands prefixed with a single greater-than character ('>'): \u000d" +
									"     \u2726 Use '>unread' for unvisited feeds. \u000d" +
									"     \u2726 Use '>read' for visited feeds. \u000d" +
									"     \u2726 Use '>error' for feeds that failed to update. \u000d" +
									"     \u2726 Use '>load' for feeds that are still loading. \u000d\u000d" +
									"\u2731 Feeds may change their status after the filter was applied.";

	let TreeItemStatus = Object.freeze({
		INVALID: -1,
		ERROR: 0,
		VISITED: 1,
		UNVISITED: 2,
		LOADING: 3,
	});

	let m_elmCheckTreeFeeds;
	let m_elmExpandAll;
	let m_elmCollapseAll;
	let m_elmfilterContainer;
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

	let m_lineHeight = 21;
	let m_lastClickedFeedTime = 0;
	let m_timeoutIdMonitorRSSTreeFeeds = null;
	let m_lockBookmarksEventHandler = new Locker();

	let m_objOpenSubFolders = new OpenFolders();
	let m_objTreeFeedsData = new TreeFeedsData();
	let m_objCurrentlyDraggedOver = new CurrentlyDraggedOver();

	let m_browserVersion;				// V64 RSS support dropped
	let m_isFilterApplied = false;
	let m_bPrefShowFeedStats = prefs.DEF_PREF_SHOW_FEED_STATS_VALUE;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
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
					NewFeedPropertiesView.i.close();
					NewFolderPropertiesView.i.close();
					EditFeedPropertiesView.i.close();
					EditFolderPropertiesView.i.close();
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

		// V64 RSS support dropped
		slUtil.getBrowserVersion().then((version) => {
			m_browserVersion = version;
		});

		m_elmExpandAll = document.getElementById("expandall");
		m_elmCollapseAll = document.getElementById("collapseall");
		m_elmfilterContainer = document.getElementById("filterContainer");
		m_elmButtonFilter = document.getElementById("filter");
		m_elmFilterTextBoxContainer = document.getElementById("filterTextBoxContainer");
		m_elmTextFilter = document.getElementById("textFilter");
		m_elmReapplyFilter = document.getElementById("reapplyFilter");
		m_elmClearFilter = document.getElementById("clearFilter");
		m_elmCheckTreeFeeds = document.getElementById("checkTreeFeeds");
		m_elmTreeRoot = document.getElementById(slGlobals.ID_UL_RSS_TREE_VIEW);

		m_objTreeFeedsData.purge();

		if(await internalPrefs.getIsExtensionInstalled()) {
			internalPrefs.setIsExtensionInstalled(false);
			await handleOnInstallExtension();
		}

		// toolbar buttons event listeners
		m_elmCheckTreeFeeds.addEventListener("click", onClickCheckTreeFeeds);
		m_elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmButtonFilter.addEventListener("click",onClickFilter);
		m_elmTextFilter.addEventListener("input", onInputChangeTextFilter);
		m_elmTextFilter.addEventListener("keydown", onKeyDownTextFilter);
		m_elmReapplyFilter.addEventListener("click", onClickReapplyFilter);
		m_elmClearFilter.addEventListener("click", onClickClearFilter);

		// treeView event listeners
		m_elmTreeRoot.addEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.addEventListener("keydown", onKeyDownTreeRoot);
		m_elmTreeRoot.addEventListener("focus", onFocusTreeItem, true);		// focus, blur, and change, do not bubble up the document tree; Event capturing moves down
		m_elmTreeRoot.addEventListener("click", onClickTreeItem);
		m_elmTreeRoot.addEventListener("dblclick", onDoubleClickTreeItem);
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

		m_lineHeight = parseInt(getComputedStyle(m_elmTreeRoot).getPropertyValue("line-height"));

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
		m_elmTextFilter.removeEventListener("input", onInputChangeTextFilter);
		m_elmTextFilter.removeEventListener("keydown", onKeyDownTextFilter);
		m_elmReapplyFilter.removeEventListener("click", onClickReapplyFilter);
		m_elmClearFilter.removeEventListener("click", onClickClearFilter);

		// treeView event listeners
		m_elmTreeRoot.removeEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.removeEventListener("keydown", onKeyDownTreeRoot);
		m_elmTreeRoot.removeEventListener("focus", onFocusTreeItem, true);		// focus, blur, and change, do not bubble up the document tree; Event capturing moves down
		m_elmTreeRoot.removeEventListener("click", onClickTreeItem);
		m_elmTreeRoot.removeEventListener("dblclick", onDoubleClickTreeItem);
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
				let elms = m_elmTreeRoot.querySelectorAll(".treeview ." + slGlobals.CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS);

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
		await m_objOpenSubFolders.getStorage();

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
				if (bookmarks[0].children) {		// do this to skip displaying the parent folder
					for (let child of bookmarks[0].children) {
						createTreeItem(m_elmTreeRoot, child);
					}
				}

				// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
				if (slUtil.hasHScroll(m_elmTreeRoot)) {
					m_elmTreeRoot.style.height = (m_elmTreeRoot.clientHeight - slUtil.getScrollbarWidth()) + "px";
				}
				m_rssTreeCreatedOK = true;
				restoreTreeViewState();
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

			setFolderState(elmLI, m_objOpenSubFolders.exist(bookmark.id));

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
			} catch {
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
		elm.setAttribute("draggable", "true");
		elm.setAttribute("tabindex", "0");
		if (href !== null) {
			elm.setAttribute("href", href);
		}

		elmCaption.appendChild(elmTitle);
		elmCaption.appendChild(elmStats);
		elm.appendChild(elmCaption);

		setFeedTooltipState(elm);

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

			if (!!m_elmCurrentlySelected && m_elmCurrentlySelected.classList.contains(slGlobals.CLS_RTV_LI_TREE_FEED)) {
				openTreeFeed(m_elmCurrentlySelected, false);
			}

			if(restoreData.feedsFilter !== "") {
				setTimeout(() => {
					m_elmTextFilter.value = restoreData.feedsFilter;
					onClickFilter({});
					onInputChangeTextFilter({});
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

			for(let elmLI of elmLIs) {
				checkForNewFeedData(elmLI, elmLI.id, elmLI.getAttribute("href"));
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

		m_objTreeFeedsData.setIfNotExist(id);
		m_objTreeFeedsData.setLastChecked(id);

		prefs.getFetchTimeout().then((timeout) => {

			timeout *= 1000;	// to milliseconds

			let fetching = m_bPrefShowFeedStats ? syndication.fetchFeedItems(url, timeout) : syndication.fetchFeedData(url, timeout);

			fetching.then((fetchResult) => {

				let updateTime = slUtil.asSafeNumericDate(fetchResult.feedData.lastUpdated);

				setFeedTooltipState(elmLI, "Updated: " + (new Date(updateTime)).toWebExtensionLocaleString());		// feedData.description not displayed as thirdLine in tooltip
				setFeedVisitedState(elmLI, m_objTreeFeedsData.value(id).lastVisited > updateTime);
				updateFeedTitle(elmLI, fetchResult.feedData.title);
				updateFeedStatsFromHistory(elmLI, fetchResult.list);
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
	function onFocusTreeItem(event) {
		setFeedSelectionState(event.target);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickTreeItem(event) {

		let elmLI = event.target;

		// event.detail: check the current click count to avoid the double-click's second click.
		if(!!elmLI && elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FEED) && event.detail <= 1) {

			event.stopPropagation();
			openTreeFeed(elmLI, event.shiftKey);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDoubleClickTreeItem(event) {

		event.stopPropagation();

		let elmLI = event.target;

		if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER) && eventOccureInItemLineHeight(event, elmLI)) {
			toggleFolderState(elmLI);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragStartTreeItem(event) {

		event.stopPropagation();

		m_elmCurrentlyDragged = event.target;

		internalPrefs.getDropInsideFolderShowMsgCount().then((count) => {
			if(count > 0) {
				slUtil.showInfoBar("Use the Shift key to drop item <b>inside</b> folder.", undefined, m_elmTreeRoot.style.direction, false);
				internalPrefs.setDropInsideFolderShowMsgCount(--count);
			}
		});

		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", m_elmCurrentlyDragged.outerHTML);

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

		// + Drop only on LI element
		// + Prevent element from been droped into itself.
		// + Unless the dropped data is a URI
		if((target.tagName !== "LI" || !!!m_elmCurrentlyDragged || m_elmCurrentlyDragged.contains(target)) && !event.dataTransfer.types.includes("text/uri-list")) {
			event.dataTransfer.dropEffect = "none";
			return false;
		}

		let isFolder = target.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

		if(isFolder) {

			// when a folder is open the height of the LI is as the Height of the entier folder.
			// The result is that hovering on the left of the items in the folder (but not ON a folder item) marks
			// the entire folder as a drop target. This makes sure that only hovers on the top of the elements are processed
			if(!eventOccureInItemLineHeight(event, target)) {
				event.dataTransfer.dropEffect = "none";
				return false;
			}

			// it's a folder - lingering
			if(target.id === m_objCurrentlyDraggedOver.id) {

				let isFolderClosed = target.classList.contains("closed");

				if(isFolderClosed && m_objCurrentlyDraggedOver.lingered) {
					// mouse has lingered enough, open the closed folder
					setFolderState(target, true);
				}

			} else {
				// it's a folder - just in
				m_objCurrentlyDraggedOver.set(target.id);
			}

			target.classList.toggle("dropInside", event.shiftKey);
		}

		target.classList.add("draggedOver");
		event.dataTransfer.dropEffect = "move";
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragLeaveTreeItem(event) {
		event.stopPropagation();
		event.target.classList.remove("draggedOver", "dropInside");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEndTreeItem(event) {
		event.stopPropagation();
		m_elmCurrentlyDragged.classList.remove("dragged");
		event.target.classList.remove("draggedOver", "dropInside");
		m_objCurrentlyDraggedOver.init();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDropTreeItem(event) {

		// prevent propagation from the perent (folder)
		event.stopPropagation();

		let elmDropTarget = event.target;

		// nothing to do if dropped in the same location OR in a folder
		if(elmDropTarget === m_elmCurrentlyDragged) {
			m_elmCurrentlyDragged.classList.remove("dragged");
		} else {

			if(event.dataTransfer.types.includes("text/x-moz-url")){
				let mozUrl = event.dataTransfer.getData("text/x-moz-url").split("\n");
				createNewFeed(elmDropTarget, (mozUrl[1].length === 0 ? "New Feed" : mozUrl[1]), mozUrl[0], true, event.shiftKey);
			} else if(event.dataTransfer.types.includes("text/uri-list")){
				createNewFeed(elmDropTarget, "New Feed", event.dataTransfer.getData("URL"), true, event.shiftKey);
			} else {

				let gettingDragged = browser.bookmarks.get(m_elmCurrentlyDragged.id);
				let gettingDrop = browser.bookmarks.get(elmDropTarget.id);

				gettingDragged.then((dragged) => {
					gettingDrop.then((drop) => {

						let newIndex = drop[0].index;

						// when moving a bookmark item down in it's folder the target index should me decresed by one
						// becouse the indexing will shift down due to the removal of the dragged item.
						if( (dragged[0].parentId === drop[0].parentId) && (dragged[0].index < drop[0].index) ) {
							newIndex--;
						}

						// if shiftKey is pressed then insert dargged item(s) into the the dropped folder
						let inFolder = event.shiftKey && elmDropTarget.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

						let destination = {
							parentId: (inFolder ? drop[0].id : drop[0].parentId),
							index: (inFolder ? 0 : newIndex),			// insert as first in folder
						};

						suspendBookmarksEventHandler(() => {
							return browser.bookmarks.move(m_elmCurrentlyDragged.id, destination).then((moved) => {

								let elmDraggedFolderUL = m_elmCurrentlyDragged.parentElement;
								elmDraggedFolderUL.removeChild(m_elmCurrentlyDragged);

								let elmDropped;
								let dropHTML = event.dataTransfer.getData("text/html");

								if(inFolder) {
									let elmDropTargetFolderUL = elmDropTarget.lastElementChild;
									setFolderState(elmDropTarget, true);		// open the folder if closed
									elmDropTargetFolderUL.insertAdjacentHTML("afterbegin", dropHTML);
									elmDropped = elmDropTargetFolderUL.firstChild;

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
					});
				});
			}
		}
		elmDropTarget.classList.remove("draggedOver", "dropInside");
		return false;
	}

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

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(url, timeout*1000, reload).then((result) => {

				let fdDate = new Date(slUtil.asSafeNumericDate(result.feedData.lastUpdated));

				setFeedVisitedState(elmLI, true);
				updateFeedTitle(elmLI, result.feedData.title);
				updateFeedStatsFromHistory(elmLI, result.list);
				updateTreeBranchFoldersStats(elmLI);
				setFeedTooltipFullState(elmLI, result.feedData.title, "Updated: " + fdDate.toWebExtensionLocaleString());

				// change the rssListView content only if this is the last user click.
				if(thisFeedClickTime === m_lastClickedFeedTime) {
					rssListView.setFeedItems(result.list, getTreeItemText(elmLI), elmLI);
				}

			}).catch((error) => {

				setFeedErrorState(elmLI, true, error.message);

				// change the rssListView content only if this is the last user click.
				if(thisFeedClickTime === m_lastClickedFeedTime) {
					rssListView.setListErrorMsg(error.message, getTreeItemText(elmLI));
				}
			}).finally(() => {	// wait for Fx v58

				// change loading state only if this is the last user click.
				if(thisFeedClickTime === m_lastClickedFeedTime) {
					setOneConcurrentFeedLoadingState(elmLI, false);
				}

				// even if there was an error the feed was visited
				m_objTreeFeedsData.set(elmLI.id, { lastVisited: slUtil.getCurrentLocaleDate().getTime() });
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
	//=== Tree Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownTreeRoot(event) {
		if(event.target === m_elmTreeRoot) {
			event.stopPropagation();
			event.preventDefault();
			setFocus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTreeRoot(event) {

		event.stopPropagation();
		event.preventDefault();

		if(event.target.getAttribute("disabled") !== null) {
			return;
		}

		let count, elmCount, elm, elms;
		let elmTargetLI = event.target;
		let isFolder = elmTargetLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);
		let isFolderOpen;

		if(isFolder) {
			isFolderOpen = elmTargetLI.classList.contains("open");
		}

		switch (event.code) {

			case "Tab":
				rssListView.setFocus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Enter":
			case "NumpadEnter":
				if(isFolder) {
					toggleFolderState(elmTargetLI);
				} else {
					openTreeFeed(elmTargetLI, event.shiftKey);
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Home":
				m_elmTreeRoot.firstElementChild.focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "End":
				elms = m_elmTreeRoot.querySelectorAll("li:last-child");		// get all selectable elements

				for(let i=elms.length-1; i>=0; i--) {
					if(elms[i].offsetParent !== null) {		// visible or not
						elms[i].focus();
						return;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowUp":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements

				// find target element in list
				for(let i=0, len=elms.length; i<len; i++) {

					// find in list the immediate PREVIOUS visible element
					if(elms[i].id === elmTargetLI.id && (i-1) >= 0) {

						for(let j=i-1; j>=0; j--) {
							if(elms[j].offsetParent !== null) {		// visible or not
								elms[j].focus();
								return;
							}
						}
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements

				for(let i=0, len=elms.length; i<len; i++) {

					// find target element in list
					if(elms[i].id === elmTargetLI.id && (i+1) < len) {

						// find in list the immediate NEXT visible element
						for(let j=i+1; j<len; j++) {
							if(elms[j].offsetParent !== null) {		// visible or not
								elms[j].focus();
								return;
							}
						}
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowLeft":
				if(isFolder && isFolderOpen) {
					setFolderState(elmTargetLI, false);
					return;
				}
				if(elmTargetLI.parentElement.parentElement.tagName === "LI") {
					elmTargetLI.parentElement.parentElement.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowRight":
				if(isFolder) {
					if(isFolderOpen) {
						elms = elmTargetLI.querySelectorAll("#" + elmTargetLI.id + " > ul > li:first-child"); // first direct child
						elms[0].focus();
					} else {
						setFolderState(elmTargetLI, true);
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageUp":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements
				count = 1;
				elmCount = slUtil.numberOfVItemsInViewport(elmTargetLI.firstElementChild, m_elmTreeRoot);	// use caption height

				// find target element in list
				for(let i=0, len=elms.length; i<len; i++) {

					// find in list the current selected item
					if(elms[i].id === elmTargetLI.id && (i-1) >= 0) {

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
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageDown":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements
				count = 1;
				elmCount = slUtil.numberOfVItemsInViewport(elmTargetLI.firstElementChild, m_elmTreeRoot);	// use caption height

				// find target element in list
				for(let i=0, len=elms.length; i<len; i++) {

					// find in list the current selected item
					if(elms[i].id === elmTargetLI.id && (i+1) < len) {

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
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyO":
				browser.tabs.update({
					url: slUtil.getFeedPreviewUrlByBrowserVersion(elmTargetLI.getAttribute("href"), m_browserVersion),
				});
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyT":
				browser.tabs.create({
					url: slUtil.getFeedPreviewUrlByBrowserVersion(elmTargetLI.getAttribute("href"), m_browserVersion),
				});
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyW":
				browser.windows.create({
					url: slUtil.getFeedPreviewUrlByBrowserVersion(elmTargetLI.getAttribute("href"), m_browserVersion),
					type: "normal",
				});
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyV":
				browser.windows.create({
					url: slUtil.getFeedPreviewUrlByBrowserVersion(elmTargetLI.getAttribute("href"), m_browserVersion),
					type: "normal",
					incognito: true,
				});
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyG":
				toggleVisitedState(elmTargetLI);
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
				openNewFeedProperties(elmTargetLI);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyF":
				openNewFolderProperties(elmTargetLI);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyC":
				slUtil.copyTextToClipboard(elmTargetLI.getAttribute("href"));
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyD":
				deleteTreeItem(elmTargetLI);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyP":
				openEditTreeItemProperties(elmTargetLI);
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	//==================================================================================
	//=== Toolbar Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickCheckTreeFeeds(event) {

		if( !m_rssTreeCreatedOK || event.shiftKey ) {
			onClickClearFilter({});
			rssListView.disposeList();
			createRSSTree();
		} else {
			monitorRSSTreeFeeds(true);
		}
		setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExpandCollapseAll(event) {

		let elmLI, elmULs = m_elmTreeRoot.getElementsByTagName("ul");

		for (let elmUL of elmULs) {

			elmLI = elmUL.parentElement;

			if(this.id === "expandall") {
				setFolderState(elmLI, true);
				m_objOpenSubFolders.set(elmLI.id);
			} else {
				setFolderState(elmLI, false);
				m_objOpenSubFolders.remove(elmLI.id);
			}
		}
		setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickFilter(event) {

		// ugly way to apply 'overflow: visible' after the transition was completed
		let propVal = getComputedStyle(m_elmfilterContainer).getPropertyValue("--trans-duration-filter-box");
		let multiNumbers = propVal.replace(/[^\d\.\*]+/g, "").split("*");
		let timeout = (!!multiNumbers && multiNumbers.length  === 2) ? multiNumbers[0] * multiNumbers[1] + 10 : 1000;
		setTimeout(() => m_elmFilterTextBoxContainer.classList.add("visibleOverflow"), timeout);

		m_elmfilterContainer.classList.add("switched");
		m_elmTextFilter.focus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeTextFilter(event) {

		const txtValue = m_elmTextFilter.value;

		notifyAppliedFilter(true);
		m_elmfilterContainer.classList.remove("filterTextOn", "filterRegExpOn", "filterTagOn");

		if(txtValue !== "") {

			m_isFilterApplied = true;

			if(txtValue[0] === ">") {

				switch (txtValue.toLowerCase()) {
					case ">read":	filterTreeItemStatus(TreeItemStatus.VISITED);	break;
					case ">unread":	filterTreeItemStatus(TreeItemStatus.UNVISITED);	break;
					case ">error":	filterTreeItemStatus(TreeItemStatus.ERROR);		break;
					case ">load":	filterTreeItemStatus(TreeItemStatus.LOADING);	break;
					default:		filterTreeItemStatus(TreeItemStatus.INVALID);	break;
				}

			} else {
				filterTreeItemText(txtValue);
			}

			filterEmptyFolderItems();

		} else {
			unfilterAllTreeItems();
			m_isFilterApplied = false;
		}

		internalPrefs.setFeedsFilter(txtValue);

		// selected item always in view
		if(!!m_elmCurrentlySelected) {
			slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstChild, m_elmTreeRoot.parentElement, "auto");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTextFilter(event) {
		if(event.code === "Escape") {
			onClickClearFilter({});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickReapplyFilter(event) {
		onInputChangeTextFilter({});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickClearFilter(event) {

		m_elmTextFilter.value = "";
		unfilterAllTreeItems();
		m_elmfilterContainer.classList.remove("filterTextOn", "filterRegExpOn", "filterTagOn");
		notifyAppliedFilter(true);
		m_isFilterApplied = false;

		internalPrefs.setFeedsFilter("");

		m_elmFilterTextBoxContainer.classList.remove("visibleOverflow");
		m_elmfilterContainer.classList.remove("switched");

		// selected item always in view
		if(!!m_elmCurrentlySelected) {
			slUtil.scrollIntoViewIfNeeded(m_elmCurrentlySelected.firstChild, m_elmTreeRoot.parentElement, "auto");
		}
	}

	//==================================================================================
	//=== Adding New Tree Items (discovery)
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function addNewFeeds(newFeedsList) {

		let bookmarksList = [];
		let parentId = await prefs.getRootFeedsFolderId();

		for(let feed of newFeedsList) {

			bookmarksList.push( {
				parentId: parentId,
				title: feed.title,
				url: feed.url,
			} );
		}

		createBookmarksSequentially(bookmarksList);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function createBookmarksSequentially(bookmarksList) {

		/*
			Because bookmarks.create() is an asynchronous function the creation of multiple bookmarks
			sequentially is performed to the same index (last index) and will appear in reverse order.

			This function makes sure that all the create actions are done in the order thay were delivered.
		*/

		suspendBookmarksEventHandler(() => {
			return new Promise(async (resolve, reject) => {

				let created, elmLI;
				for(let bookmark of bookmarksList) {

					created = await browser.bookmarks.create(bookmark);

					elmLI = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_FEED, created.url);
					elmLI.classList.add("blinkNew");
					m_elmTreeRoot.appendChild(elmLI);

					m_objTreeFeedsData.setIfNotExist(created.id);
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

		m_elmTreeRoot.querySelectorAll(".blinkNew").forEach((elm) => {
			blinkElement(elm, elm.style.visibility, 200, 1500);
			elm.classList.remove("blinkNew");
		});
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
		NewFeedPropertiesView.i.show(elmLI, "New Feed", "").then((result) => {
			createNewFeedExtended(result.elmLI, result.title, result.url, result.updateTitle, result.inFolder);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeedExtended(elmItem, title, url, updateTitle, inFolder) {

		if (elmItem.id === slGlobals.ID_UL_RSS_TREE_VIEW) {
			createNewFeedInRootFolder(title, url, updateTitle);
		} else {
			createNewFeed(elmItem, title, url, updateTitle, inFolder);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeed(elmLI, title, url, updateTitle, inFolder) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inFolder is true then insert new item inside the provided folder item
			inFolder = inFolder && elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

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
						elmFolderUL.insertBefore(newElm, elmFolderUL.firstChild);
					} else {
						elmLI.parentElement.insertBefore(newElm, elmLI);
					}

					setFeedVisitedState(newElm, false);
					updateTreeBranchFoldersStats(newElm);
					m_objTreeFeedsData.set(created.id, { updateTitle: updateTitle });
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeedInRootFolder(title, url, updateTitle) {

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
					m_objTreeFeedsData.set(created.id, { updateTitle: updateTitle });
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openNewFolderProperties(elmLI) {
		NewFolderPropertiesView.i.show(elmLI, "New Folder").then((result) => {
			createNewFolderExtended(result.elmLI, result.title, result.inFolder);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolderExtended(elmItem, title, inFolder) {

		if (elmItem.id === slGlobals.ID_UL_RSS_TREE_VIEW) {
			createNewFolderInRootFolder(title);
		} else {
			createNewFolder(elmItem, title, inFolder);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolder(elmLI, title, inFolder) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inFolder is true then insert new folder inside the provided folder item
			inFolder = inFolder && elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

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
						elmFolderUL.insertBefore(newElm, elmFolderUL.firstChild);
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
	function deleteTreeItem(elmLI) {

		let isFolder = elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

		let text = "Permanently delete the " + (isFolder ? "folder " : "feed ") +
					"<b>'" + getTreeItemText(elmLI) + "'</b> " +
					(isFolder ? "<u>and all of its contents</u> " : "") + "from your bookmarks?"

		messageView.show(text, messageView.ButtonSet.setYesNo).then((result) => {

			if(result === messageView.ButtonCode.Yes) {

				let funcBookmarksRemove = isFolder ? browser.bookmarks.removeTree : browser.bookmarks.remove;

				suspendBookmarksEventHandler(() => {
					return funcBookmarksRemove(elmLI.id).then(() => {

						if(elmLI.nextElementSibling !== null) {
							elmLI.nextElementSibling.focus();
						} else if(elmLI.previousElementSibling !== null) {
							elmLI.previousElementSibling.focus();
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

					});
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleVisitedState(elmLI) {

		if(!!elmLI) {
			if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FEED)) {
				toggleFeedVisitedState(elmLI);
			} else if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER)) {
				toggleFolderFeedsVisitedState(elmLI);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleFeedVisitedState(elmLI) {

		if(elmLI.classList.contains("error")) {
			slUtil.showInfoBar("Feed is erroneous", elmLI, m_elmTreeRoot.style.direction);
			return;
		}

		if(elmLI.classList.toggle("bold")) {
			// turned to not visited
			m_objTreeFeedsData.value(elmLI.id).lastVisited = 0;
		} else {
			// turned to visited
			m_objTreeFeedsData.value(elmLI.id).lastVisited = slUtil.getCurrentLocaleDate().getTime();
		}
		m_objTreeFeedsData.setStorage();
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
				m_objTreeFeedsData.value(elm.id).lastVisited = visitedState ? slUtil.getCurrentLocaleDate().getTime() : 0;

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

			for(let elm of elms) {
				elm.classList.toggle("bold", !isVisited);
				m_objTreeFeedsData.value(elm.id).lastVisited = isVisited ? slUtil.getCurrentLocaleDate().getTime() : 0;
			}
			m_objTreeFeedsData.setStorage();
			updateAllTreeFoldersStats();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openEditTreeItemProperties(elmLI) {

		let isFolder = elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER);

		if(isFolder) {
			EditFolderPropertiesView.i.show(elmLI).then((result) => {
				updateFolderProperties(result.elmLI, result.title);
			});
		} else {
			m_objTreeFeedsData.setIfNotExist(elmLI.id);
			EditFeedPropertiesView.i.show(elmLI, m_objTreeFeedsData.value(elmLI.id).updateTitle).then((result) => {
				updateFeedProperties(result.elmLI, result.title, result.url, result.updateTitle);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedProperties(elmLI, newTitle, newUrl, newUpdateTitle) {

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
				setFeedTooltipState(elmLI);
				m_objTreeFeedsData.set(updated.id, { updateTitle: newUpdateTitle });
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
				setFeedTooltipState(elmLI);
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

		if(elm.classList.contains(slGlobals.CLS_RTV_LI_TREE_ITEM)) {
			elmULFolder = elm.parentElement;
		} else if(elm.tagName === "UL") {
			elmULFolder = elm;
		} else {
			return;
		}

		let totalCount, unreadCount;

		while(elmULFolder !== m_elmTreeRoot) {

			totalCount = elmULFolder.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_FEED).length;
			unreadCount = elmULFolder.querySelectorAll(".bold." + slGlobals.CLS_RTV_LI_TREE_FEED).length;

			updateTreeItemStats(elmULFolder.parentElement, totalCount, unreadCount);

			elmULFolder = elmULFolder.parentElement.parentElement;
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

		if(m_bPrefShowFeedStats) {

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

		if(m_bPrefShowFeedStats && !!elmLI && !!elmLI.classList && elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_ITEM)) {
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
	function toggleFolderState(elmTreeItem) {

		if (elmTreeItem.classList.contains("open")) {
			setFolderVisibility(elmTreeItem, false);
			m_objOpenSubFolders.remove(elmTreeItem.id);
		} else {
			setFolderVisibility(elmTreeItem, true);
			m_objOpenSubFolders.set(elmTreeItem.id);
			elmTreeItem.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFolderState(elmTreeItem, open) {

		if (open) {
			setFolderVisibility(elmTreeItem, true);
			m_objOpenSubFolders.set(elmTreeItem.id);
			elmTreeItem.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
		} else {
			setFolderVisibility(elmTreeItem, false);
			m_objOpenSubFolders.remove(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFolderVisibility(elmLI, open) {
		// Don't Call This Directlly
		elmLI.classList.remove("open", "closed");
		elmLI.classList.add(open ? "open" : "closed");
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

		if(elm !== undefined && elm !== null) {

			if (m_elmCurrentlySelected !== null) {
				m_elmCurrentlySelected.classList.remove("selected");
			}

			// select only selectable tree items
			if (elm && elm.tagName === "LI") {
				m_elmCurrentlySelected = elm;
				elm.classList.add("selected");
				slUtil.scrollIntoViewIfNeeded(elm.firstChild, m_elmTreeRoot.parentElement, "auto");
				internalPrefs.setTreeSelectedItemId(m_elmCurrentlySelected.id);
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
		setFeedTooltipState(elm, isError ? "Error: " + errorMsg : undefined);
		notifyAppliedFilter();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTooltipState(elmLI, secondLine = undefined, thirdLine = undefined) {

		elmLI.title = getTreeItemText(elmLI);

		if(secondLine !== undefined) {
			elmLI.title += "\u000d" + secondLine;

			if(thirdLine !== undefined) {
				elmLI.title += "\u000d\u000d" + thirdLine;
			}

		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTooltipFullState(elmLI, firstLine, secondLine) {

		let treeFeedsData = m_objTreeFeedsData.value(elmLI.id);

		// don't use channel title if user unchecked that option for this feed
		if(!!treeFeedsData && treeFeedsData.updateTitle && firstLine) {
			elmLI.title = firstLine;
		} else {
			elmLI.title = getTreeItemText(elmLI);
		}
		elmLI.title += "\u000d" + secondLine;
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
			m_elmCheckTreeFeeds.title = "The feeds folder or it's content has been modified by another party.\u000dShift+click to reload.";
			slUtil.showInfoBar(m_elmCheckTreeFeeds.title, m_elmCheckTreeFeeds, m_elmCheckTreeFeeds.style.direction);
		} else {
			m_elmCheckTreeFeeds.title = m_elmCheckTreeFeeds.slSavedTitle;
			slUtil.showInfoBar("");
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
		if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER)) {
			list = elmLI.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED)
		} else if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FEED)) {
			list = [elmLI];
		}

		list.forEach((elm) => {
			if(m_elmCurrentlyLoading && m_elmCurrentlyLoading.id === elm.id) {
				setOneConcurrentFeedLoadingState(elm, false);
			} else {
				elm.classList.remove("loading");				// if loading from periodic check
			}
		});
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

		while (m_elmTreeRoot.firstChild) {
			m_elmTreeRoot.removeChild(m_elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function eventOccureInItemLineHeight(evt, elm) {

		// This function checks if the event has occured in the top part of the element
		return ((evt.clientY - elm.getBoundingClientRect().top) <= m_lineHeight);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFocus() {
		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.focus();
		} else {
			m_elmTreeRoot.parentElement.focus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleOnInstallExtension() {

		return new Promise((resolve) => {

			browser.bookmarks.search({ title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME }).then(async (treeNodes) => {

				let foundNode = treeNodes.find((node) => { return node.type === "folder"; });

				slUtil.showInfoBar("Creating default feeds folder...", m_elmCheckTreeFeeds, m_elmCheckTreeFeeds.style.direction, false);
				let rootId = (foundNode ? foundNode.id : await createOnInstallFeedsBookmarksFolder());
				slUtil.showInfoBar("");

				prefs.setRootFeedsFolderId(rootId);
				resolve();
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
							{ title: "BBC News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
							{ title: "BuzzFeed News", url: "https://www.buzzfeed.com/world.xml" },
						//	{ title: "Google World United States", url: "https://news.google.com/news/rss/headlines/section/topic/WORLD" },
					],
				},
				{	details: { title: "Tech", type: "folder" },
					feeds: [{ title: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch" },
							{ title: "Top News - MIT", url: "https://www.technologyreview.com/topnews.rss" },
							{ title: "Ars Technica", url: "http://feeds.arstechnica.com/arstechnica/technology-lab" },
						//	{ title: "Techmeme", url: "http://www.techmeme.com/feed.xml" },
					],
				},
				{	details: { title: "DIY", type: "folder" },
					feeds: [{ title: "Pretty Handy Girl", url: "https://www.prettyhandygirl.com/feed/" },
							{ title: "Man Made DIY", url: "https://www.manmadediy.com/site_index.rss" },
						//	{ title: "Ana White", url: "http://www.ana-white.com/feed" },
							{ title: "Remodelaholic", url: "http://www.remodelaholic.com/category/diy/feed" },
					],
				},
				{	details: { title: "Sports", type: "folder" },
					feeds: [{ title: "RunningPhysio", url: "http://www.running-physio.com/feed" },
							{ title: "Goal", url: "http://www.goal.com/en/feeds/news?fmt=rss&ICID=HP" },
							{ title: "Bike Rumor", url: "http://feeds.feedburner.com/BikeRumor" },
						//	{ title: "CelticsBlog", url: "http://www.celticsblog.com/rss/current" },
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

			m_objOpenSubFolders.clear();

			for (let idx=0, len=folders.length; idx<len; idx++) {
				folders[idx].details.parentId = createdRoot.id;
				createdFolder = await createBookmarksFolder(folders[idx]);
				m_objOpenSubFolders.set(createdFolder.id);
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
	function filterTreeItemStatus(status) {

		m_elmfilterContainer.classList.add("filterTagOn");

		// select all tree items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

		// hide the ones that do not match the filter
		for(let i=0, len=elms.length; i<len; i++) {

			const cList = elms[i].classList;

			if(status === TreeItemStatus.ERROR) {
				elms[i].style.display = cList.contains("error") ? "" : "none";
			} else if(status === TreeItemStatus.VISITED) {
				elms[i].style.display = !cList.contains("bold") && !cList.contains("error") && !cList.contains("loading") ? "" : "none";
			} else if(status === TreeItemStatus.UNVISITED) {
				elms[i].style.display = cList.contains("bold") && !cList.contains("error") ? "" : "none";
			} else if(status === TreeItemStatus.LOADING) {
				elms[i].style.display = cList.contains("loading") ? "" : "none";
			} else {
				elms[i].style.display = "none";
			}
		}

		filterEmptyFolderItems();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterTreeItemText(txtFilter) {

		let funcSimpleFilter = (text, filter) => text.toLowerCase().includes(filter);
		let funcRegExpFilter = (text, filter) => text.match(new RegExp(...(filter.split('/').filter(e => e.length > 0)))) !== null;

		let test, funcFilter;

		// select which filter function to use
		if( !!(test = txtFilter.match(/^(\/.*\/)([gimsuy]*)$/)) &&
				slUtil.isRegExpValid(...(txtFilter.split('/').filter(e => e.length > 0))) ) {

			m_elmfilterContainer.classList.add("filterRegExpOn");
			txtFilter = test[1] + (test[2].includes("i") ? "i" : "");		// remove all flags except for 'i'
			funcFilter = funcRegExpFilter;
		} else {
			m_elmfilterContainer.classList.add("filterTextOn");
			txtFilter = txtFilter.toLowerCase();						// case-insensitive
			funcFilter = funcSimpleFilter;
		}

		// select all tree items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED);

		// hide the ones that do not match the filter
		for(let i=0, len=elms.length; i<len; i++) {

			if(funcFilter(getTreeItemText(elms[i]), txtFilter)) {
				elms[i].style.display = "";
			} else {
				elms[i].style.display = "none";
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterEmptyFolderItems() {

		// select all folder items
		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FOLDER);

		// hide the ones that all their children are hidden
		for(let i=0, len=elms.length; i<len; i++) {

			if(elms[i].querySelector("ul > ." + slGlobals.CLS_RTV_LI_TREE_FEED + ":not([style*='display: none'])") !== null) {
				elms[i].style.display = "";
			} else {
				elms[i].style.display = "none";
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function unfilterAllTreeItems() {

		let elms = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_FEED + ", li." + slGlobals.CLS_RTV_LI_TREE_FOLDER);

		// hide the ones that all their children are hidden
		for(let i=0, len=elms.length; i<len; i++) {
			elms[i].style.display = "";
		}
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
				m_elmReapplyFilter.classList.add("alert");
				m_elmReapplyFilter.title = m_elmReapplyFilter.slSavedTitle + "\u000d\u000d\u2731 The status or title of one or more feeds has changed. Filter may require reapplying.";
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

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
		openNewFeedProperties: openNewFeedProperties,
		openNewFolderProperties: openNewFolderProperties,
		deleteTreeItem: deleteTreeItem,
		toggleVisitedState: toggleVisitedState,
		markAllFeedsAsVisitedState: markAllFeedsAsVisitedState,
		openEditTreeItemProperties: openEditTreeItemProperties,
		isFeedInTree: isFeedInTree,
		switchViewDirection: switchViewDirection,
		setFocus: setFocus,
		isRssTreeCreatedOK: isRssTreeCreatedOK,
		updateTreeItemStats: updateTreeItemStats,
		getTreeItemText: getTreeItemText,
	};

})();
