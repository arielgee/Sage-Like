"use strict";

let rssTreeView = (function() {

	//==================================================================================
	//=== Class Declerations
	//==================================================================================

	class OpenSubTrees extends StoredKeyedItems {
		getStorage() {
			return new Promise((resolve) => {
				internalPrefs.getOpenSubTrees().then((items) => {
					this._items = items;
					resolve(this.length);
				});
			});
		}
		setStorage() {
			internalPrefs.setOpenSubTrees(this._items);
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

	let m_elmCheckTreeFeeds;
	let m_elmExpandAll;
	let m_elmCollapseAll;

	let m_elmTreeRoot;

	let m_elmCurrentlyLoading;
	let m_elmCurrentlySelected;
	let m_rssTreeCreatedOK = false;
	let m_elmCurrentlyDragged = null;

	let m_lineHeight = 21;
	let m_lastClickedFeedTime = 0;
	let m_timeoutIdMonitorRSSTreeFeeds = null;
	let m_flagSuspendBookmarksEventHandler = false;

	let m_objOpenSubTrees = new OpenSubTrees();
	let m_objTreeFeedsData = new TreeFeedsData();
	let m_objCurrentlyDraggedOver = new CurrentlyDraggedOver();


	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	/**************************************************/
	browser.runtime.onMessage.addListener((message) => {

		if (message.id === slGlobals.MSG_ID_PREFERENCES_CHANGED) {

			if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
				message.details === slGlobals.MSGD_PREF_CHANGE_ROOT_FOLDER) {
				discoveryView.close();
				feedPropertiesView.close();
				rssListView.disposeList();
				createRSSTree();
			}

			if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
				message.details === slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL) {
				monitorRSSTreeFeeds();
			}
		}
	});

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_objTreeFeedsData.purge();

		m_elmExpandAll = document.getElementById("expandall");
		m_elmCollapseAll = document.getElementById("collapseall");
		m_elmCheckTreeFeeds = document.getElementById("checkTreeFeeds");
		m_elmTreeRoot = document.getElementById(slGlobals.ID_UL_RSS_TREE_VIEW);

		m_elmCheckTreeFeeds.addEventListener("click", onClickCheckTreeFeeds);
		m_elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);
		m_elmTreeRoot.addEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.addEventListener("keydown", onKeyDownTreeRoot);
		browser.bookmarks.onCreated.addListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.addListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.addListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.addListener(onBookmarksEventHandler);

		m_lineHeight = parseInt(getComputedStyle(m_elmTreeRoot).getPropertyValue("line-height"));

		createRSSTree();

		browser.browserAction.setBadgeText({text: ""});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		removeAllTreeItemsEventListeners();

		clearTimeout(m_timeoutIdMonitorRSSTreeFeeds);
		m_timeoutIdMonitorRSSTreeFeeds = null;

		m_elmCheckTreeFeeds.removeEventListener("click", onClickCheckTreeFeeds);
		m_elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		m_elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);
		m_elmTreeRoot.removeEventListener("mousedown", onMouseDownTreeRoot);
		m_elmTreeRoot.removeEventListener("keydown", onKeyDownTreeRoot);
		browser.bookmarks.onCreated.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.removeListener(onBookmarksEventHandler);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	//==================================================================================
	//=== Tree Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function createRSSTree() {

		// get subtree's open/closed statuses from local storage
		await m_objOpenSubTrees.getStorage();

		disposeTree();
		m_rssTreeCreatedOK = false;
		m_elmCurrentlyLoading = null;
		m_elmCurrentlySelected = null;
		setTbButtonCheckFeedsAlert(false);

		prefs.getRootFeedsFolderId().then((folderId) => {

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
					m_elmTreeRoot.style.height = (m_elmTreeRoot.clientHeight - slUtil.getScrollbarWidth(document)) + "px";
				}
				m_rssTreeCreatedOK = true;
				monitorRSSTreeFeeds();

			}).catch((error) => {
				m_elmTreeRoot.appendChild(createErrorTagLI("Failed to load feed folder: " + error.message));
				browser.runtime.openOptionsPage();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTreeItem(parentElement, bookmark) {

		let elmLI;

		if (bookmark.type === "folder") {

			elmLI = createTagLI(bookmark.id, bookmark.title, slGlobals.CLS_RTV_LI_SUB_TREE, null);

			let elmUL = createTagUL();
			elmLI.appendChild(elmUL);

			setSubTreeState(elmLI, m_objOpenSubTrees.exist(bookmark.id));

			for (let child of bookmark.children) {
				createTreeItem(elmUL, child);
			}

		} else if (bookmark.type === "bookmark") {

			elmLI = createTagLI(bookmark.id, bookmark.title, slGlobals.CLS_RTV_LI_TREE_ITEM, bookmark.url);
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
	function createTagLI(id, textContent, className, href = null) {

		// ++ normalize the textContent
		if(textContent.length === 0) {
			let url = new URL(href);
			textContent = (href === null) ? "<no title>" : url.host;
		}

		let elmCaption = document.createElement("div");
		let elm = document.createElement("li");

		elmCaption.className = slGlobals.CLS_RTV_DIV_TREE_ITEM_CAPTION;
		elmCaption.textContent = textContent;

		elm.id = id;
		elm.className = className;
		elm.setAttribute("draggable", "true");
		elm.setAttribute("tabindex", "0");
		if (href !== null) {
			elm.setAttribute("href", href);
		}
		elm.appendChild(elmCaption);

		setFeedTooltipState(elm);
		addTreeItemEventListeners(elm);

		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createErrorTagLI(textContent) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = textContent;
		return elm;
	}

	//==================================================================================
	//=== Tree Processing
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function monitorRSSTreeFeeds() {

		// first clear the current timeout if called from preference change to
		// set a new interval value or to have no background monitoring at all
		clearTimeout(m_timeoutIdMonitorRSSTreeFeeds);
		m_timeoutIdMonitorRSSTreeFeeds = null;

		checkForNewRSSTreeFeedsData();

		prefs.getCheckFeedsInterval().then((nextInterval) => {

			// if interval is zero then do not perform background monitoring
			if(nextInterval !== "0") {

				// Repeat a new timeout session.
				if(nextInterval.includes(":")) {
					nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
				}
				m_timeoutIdMonitorRSSTreeFeeds = setTimeout(monitorRSSTreeFeeds, nextInterval);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function checkForNewRSSTreeFeedsData() {

		await m_objTreeFeedsData.getStorage();

		let elmLIs = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_ITEM);

		prefs.getCheckFeedsMethod().then(async (value) => {

			let counter = 0;
			let method = value.split(";");
			let batchSize = Math.ceil(elmLIs.length / Number(method[0]));
			let timeoutPause = Number(method[1]);

			elmLIs.forEach(async (elmLI) => {
				checkForNewFeedData(elmLI, elmLI.id, elmLI.getAttribute("href"));
				if((++counter % batchSize) === 0) {
					await slUtil.sleep(timeoutPause);
				}
			});
			//console.log("[sage-like]", "Periodic check for new feeds performed in sidebar.");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function checkForNewFeedData(elmLI, id, url) {

		setFeedErrorState(elmLI, false);
		setFeedLoadingState(elmLI, true);

		if(!m_objTreeFeedsData.exist(id)) {
			m_objTreeFeedsData.set(id);
		}
		m_objTreeFeedsData.setLastChecked(id);

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedData(url, timeout*1000).then((feedData) => {

				let updateTime = slUtil.asSafeNumericDate(feedData.lastUpdated);

				setFeedTooltipState(elmLI, "Updated: " + (new Date(updateTime)).toLocaleString());
				setFeedVisitedState(elmLI, m_objTreeFeedsData.value(id).lastVisited > updateTime);
				updateFeedTitle(elmLI, feedData.title);
			}).catch((error) => {
				setFeedErrorState(elmLI, true, error);
			}).finally(() => {	// wait for Fx v58
				setFeedLoadingState(elmLI, false);
			});
		});
	}

	//==================================================================================
	//=== Tree Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addTreeItemEventListeners(elm) {
		elm.addEventListener("focus", onFocusTreeItem, false);
		elm.addEventListener("click", onClickTreeItem, false);
		elm.addEventListener("dblclick", onDoubleClickTreeItem, false);
		elm.addEventListener("dragstart", onDragStartTreeItem, false);
		elm.addEventListener("dragenter", onDragEnterTreeItem, false)
		elm.addEventListener("dragover", onDragOverTreeItem, false);
		elm.addEventListener("dragleave", onDragLeaveTreeItem, false);
		elm.addEventListener("dragend", onDragEndTreeItem, false);
		elm.addEventListener("drop", onDropTreeItem, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeTreeItemEventListeners(elm) {
		elm.removeEventListener("focus", onFocusTreeItem, false);
		elm.removeEventListener("click", onClickTreeItem, false);
		elm.removeEventListener("dragstart", onDragStartTreeItem, false);
		elm.removeEventListener("dragenter", onDragEnterTreeItem, false)
		elm.removeEventListener("dragover", onDragOverTreeItem, false);
		elm.removeEventListener("dragleave", onDragLeaveTreeItem, false);
		elm.removeEventListener("dragend", onDragEndTreeItem, false);
		elm.removeEventListener("drop", onDropTreeItem, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addSubTreeItemsEventListeners(elm) {

		addTreeItemEventListeners(elm);
		for(let child of elm.children) {
			addSubTreeItemsEventListeners(child);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusTreeItem(event) {
		setFeedSelectionState(event.target);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickTreeItem(event) {

		// check the current click count to avoid the double-click's second click.
		if(event.detail > 1) {
			return;
		}

		event.stopPropagation();

		let elmLI = event.target;
		let isSubTree = elmLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entire subtree.
		// The result is that clicking on the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if(!eventOccureInItemLineHeight(event, elmLI)) {
			if(isSubTree) {
				elmLI.focus();
			}
			return;
		}

		if (!isSubTree) {

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
				syndication.fetchFeedItems(url, timeout*1000, event.shiftKey).then((result) => {

					let fdDate = new Date(slUtil.asSafeNumericDate(result.feedData.lastUpdated));

					setFeedVisitedState(elmLI, true);
					updateFeedTitle(elmLI, result.feedData.title);
					setFeedTooltipFullState(elmLI, result.feedData.title, "Updated: " + fdDate.toLocaleString());

					// change the rssListView content only if this is the last user click.
					if(thisFeedClickTime === m_lastClickedFeedTime) {
						rssListView.setFeedItems(result.list, elmLI.textContent);
					}

				}).catch((error) => {

					setFeedErrorState(elmLI, true, error);

					// change the rssListView content only if this is the last user click.
					if(thisFeedClickTime === m_lastClickedFeedTime) {
						rssListView.setListErrorMsg(error, elmLI.textContent);
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
		}
		elmLI.focus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDoubleClickTreeItem(event) {

		event.stopPropagation();

		let elmLI = event.target;
		let isSubTree = elmLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

		if(isSubTree) {
			toggleSubTreeState(elmLI);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragStartTreeItem(event) {

		event.stopPropagation();

		m_elmCurrentlyDragged = this;

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

		// prevent element from been droped into itself.
		if(m_elmCurrentlyDragged === null || m_elmCurrentlyDragged.contains(this)) {
			event.dataTransfer.dropEffect = "none";
			return false;
		}

		let isSubTree = this.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

		if(isSubTree) {

			// when a subtree is open the height of the LI is as the Height of the entier subtree.
			// The result is that hovering on the left of the items in the subtree (but not ON a subtree item) marks
			// the subtree as a drop target. This makes sure that only hovers above the top of the elements are processed
			if(!eventOccureInItemLineHeight(event, this)) {
				event.dataTransfer.dropEffect = "none";
				return false;
			}

			// it's a SubTree - lingering
			if(this.id === m_objCurrentlyDraggedOver.id) {

				let isSubTreeClosed = this.classList.contains("closed");

				if(isSubTreeClosed && m_objCurrentlyDraggedOver.lingered) {
					// mouse has lingered enough, open the closed SubTree
					setSubTreeState(this, true);
				}

			} else {
				// it's a SubTree - just in
				m_objCurrentlyDraggedOver.set(this.id);
			}
		}

		this.classList.add("draggedOver");
		event.dataTransfer.dropEffect = "move";
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragLeaveTreeItem(event) {
		this.classList.remove("draggedOver");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEndTreeItem(event) {
		m_elmCurrentlyDragged.classList.remove("dragged");
		this.classList.remove("draggedOver");
		m_objCurrentlyDraggedOver.init();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDropTreeItem(event) {

		// prevent propagation from the perent (subtree)
		event.stopPropagation();

		let elmDropTarget = this;

		// nothing to do if dropped in the same location OR in a SubTree
		if(elmDropTarget === m_elmCurrentlyDragged) {
			m_elmCurrentlyDragged.classList.remove("dragged");
		} else {

			let gettingDragged = browser.bookmarks.get(m_elmCurrentlyDragged.id);
			let gettingDrop = browser.bookmarks.get(elmDropTarget.id);

			gettingDragged.then((dragged) => {
				gettingDrop.then((drop) => {

					let newIndex = drop[0].index;

					// when moving a bookmark item down in it's SubTree the target index should me decresed by one
					// becouse the indexing will shift down due to the removal of the dragged item.
					if( (dragged[0].parentId === drop[0].parentId) && (dragged[0].index < drop[0].index) ) {
						newIndex--;
					}

					let destination = {
						parentId: drop[0].parentId,
						index: newIndex,
					};

					suspendBookmarksEventHandler(true);
					browser.bookmarks.move(m_elmCurrentlyDragged.id, destination).then((moved) => {

						m_elmCurrentlyDragged.parentElement.removeChild(m_elmCurrentlyDragged);

						let dropHTML = event.dataTransfer.getData("text/html");
						elmDropTarget.insertAdjacentHTML("beforebegin", dropHTML);
						let elmDropped = elmDropTarget.previousElementSibling;
						removeFeedLoadingStatus(elmDropped);
						addSubTreeItemsEventListeners(elmDropped);
						elmDropped.focus();
					}).finally(() => suspendBookmarksEventHandler(false));
				});
			});
		}
		elmDropTarget.classList.remove("draggedOver");
		return false;
	}

	//==================================================================================
	//=== Bookmarks Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventHandler(id, objInfo) {

		if(m_flagSuspendBookmarksEventHandler) {
			return;
		}

		let ids = [id];

		// bookmark removed
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

		let count, elmCount, elm, elms;
		let elmTargetLI = event.target;
		let isSubTree = elmTargetLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);
		let isSubTreeOpen;

		if(isSubTree) {
			isSubTreeOpen = elmTargetLI.classList.contains("open");
		}

		switch(event.key.toLowerCase()) {

			case "tab":
				rssListView.setFocus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "enter":
				if(isSubTree) {
					toggleSubTreeState(elmTargetLI);
				} else {
					// emulate event object
					onClickTreeItem( {
						detail: 1,
						stopPropagation: () => {},
						target: elmTargetLI,
						shiftKey: event.shiftKey,
						clientX: 1,
						clientY: 1,
					} );
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "home":
				m_elmTreeRoot.firstElementChild.focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "end":
				elms = m_elmTreeRoot.querySelectorAll("li:last-child");		// get all selectable elements

				for(let i=elms.length-1; i>=0; i--) {
					if(elms[i].offsetParent !== null) {		// visible or not
						elms[i].focus();
						return;
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "arrowup":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements

				// find target element in list
				for(let i=0; i<elms.length; i++) {

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

			case "arrowdown":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements

				for(let i=0; i<elms.length; i++) {

					// find target element in list
					if(elms[i].id === elmTargetLI.id && (i+1) < elms.length) {

						// find in list the immediate NEXT visible element
						for(let j=i+1; j<elms.length; j++) {
							if(elms[j].offsetParent !== null) {		// visible or not
								elms[j].focus();
								return;
							}
						}
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "arrowleft":
				if(isSubTree && isSubTreeOpen) {
					setSubTreeState(elmTargetLI, false);
					return;
				}
				if(elmTargetLI.parentElement.parentElement.tagName === "LI") {
					elmTargetLI.parentElement.parentElement.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "arrowright":
				if(isSubTree) {
					if(isSubTreeOpen) {
						elms = elmTargetLI.querySelectorAll("#" + elmTargetLI.id + " > ul > li:first-child"); // first direct child
						elms[0].focus();
					} else {
						setSubTreeState(elmTargetLI, true);
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "pageup":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements
				count = 1;
				elmCount = slUtil.numberOfVItemsInViewport(elmTargetLI.firstElementChild, m_elmTreeRoot);	// use caption height

				// find target element in list
				for(let i=0; i<elms.length; i++) {

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

			case "pagedown":
				elms = m_elmTreeRoot.querySelectorAll("li");	// get all selectable elements
				count = 1;
				elmCount = slUtil.numberOfVItemsInViewport(elmTargetLI.firstElementChild, m_elmTreeRoot);	// use caption height

				// find target element in list
				for(let i=0; i<elms.length; i++) {

					// find in list the current selected item
					if(elms[i].id === elmTargetLI.id && (i+1) < elms.length) {

						for(let j=i+1; j<elms.length; j++) {
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
		}
	}

	//==================================================================================
	//=== Toolbar Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickCheckTreeFeeds(event) {

		if( !m_rssTreeCreatedOK || event.shiftKey ) {
			rssListView.disposeList();
			createRSSTree();
		} else {
			monitorRSSTreeFeeds();
		}
		setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExpandCollapseAll(event) {

		let elmLI, elmULs = m_elmTreeRoot.getElementsByTagName("ul");

		for (let elmUL of elmULs) {

			elmLI = elmUL.parentElement;

			if(this.id === "expandall") {
				setSubTreeState(elmLI, true);
				m_objOpenSubTrees.set(elmLI.id);
			} else {
				setSubTreeState(elmLI, false);
				m_objOpenSubTrees.remove(elmLI.id);
			}
		}
		setFocus();
	}

	//==================================================================================
	//=== Adding New Tree Items (discovery)
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function addNewFeeds(newFeedsList) {

		let index, parentId;
		let last = m_elmTreeRoot.lastElementChild;

		// tree can be empty
		if (last === null || last.id === undefined || last.id === "") {
			index = -1;
			parentId = await prefs.getRootFeedsFolderId();
		} else {
			let bookmarks = await browser.bookmarks.get(last.id);
			index = bookmarks[0].index;
			parentId = bookmarks[0].parentId;
		}

		let counter = 1;
		let bookmarksList = [];

		for(let feed of newFeedsList) {

			bookmarksList.push( {
				index: index + (counter++),
				parentId: parentId,
				title: feed.title,
				url: feed.url,
			} );
		}

		suspendBookmarksEventHandler(true);
		createBookmarksSequentially(bookmarksList, 0);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createBookmarksSequentially(bookmarksList, index) {

		/*
			Because bookmarks.create() is an asynchronous function the creation of multiple bookmarks
			sequentially is performed to the same index (last index) and will appear in reverse order.

			This recursive/asynchronous function makes sure the next create is performed after the previous
			one has been completed. Better than pacing the creations using setTimeout(), yuck!
		*/

		// while index in pointing to an object in the array
		if(bookmarksList.length > index) {

			browser.bookmarks.create(bookmarksList[index]).then((created) => {

				let elmLI = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_ITEM, created.url);
				elmLI.classList.add("blinkNew");
				m_elmTreeRoot.appendChild(elmLI);

				if(!m_objTreeFeedsData.exist(created.id)) {
					m_objTreeFeedsData.set(created.id);
				}
				setFeedVisitedState(elmLI, false);

				createBookmarksSequentially(bookmarksList, ++index);

				// this will happend after the last element was appended
				if(bookmarksList.length === index) {
					elmLI.scrollIntoView();
					blinkNewlyAddedFeeds();
					suspendBookmarksEventHandler(false);
				}
			});
		}
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
	function createNewFeed(elmLI) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			let newBookmark = {
				index: bookmarks[0].index,
				parentId: bookmarks[0].parentId,
				title: "New Feed",
				type: "bookmark",
				url: "http://x/",
			};

			suspendBookmarksEventHandler(true);
			browser.bookmarks.create(newBookmark).then((created) => {

				let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_ITEM, created.url);
				elmLI.parentElement.insertBefore(newElm, elmLI);
				newElm.focus();

				feedPropertiesView.open(newElm, true, true);

			}).finally(() => suspendBookmarksEventHandler(false));

		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function deleteFeed(elmLI) {

		suspendBookmarksEventHandler(true);
		browser.bookmarks.remove(elmLI.id).then(() => {

			if(elmLI.nextElementSibling !== null) {
				elmLI.nextElementSibling.focus();
			} else if(elmLI.previousElementSibling !== null) {
				elmLI.previousElementSibling.focus();
			} else {
				m_elmCurrentlySelected = null;
			}

			elmLI.parentElement.removeChild(elmLI);
			m_objTreeFeedsData.remove(elmLI.id);

		}).finally(() => suspendBookmarksEventHandler(false));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openPropertiesView(elmLI) {

		let id = elmLI.id;

		if(!m_objTreeFeedsData.exist(id)) {
			m_objTreeFeedsData.set(id);
		}
		feedPropertiesView.open(elmLI, m_objTreeFeedsData.value(id).updateTitle);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedProperties(elmLI, newTitle, newUrl, newUpdateTitle) {

		let changes = {
			title: newTitle,
			url: newUrl,
		};

		suspendBookmarksEventHandler(true);
		browser.bookmarks.update(elmLI.id, changes).then((updated) => {

			elmLI.firstElementChild.textContent = updated.title;

			let urlChanged = (elmLI.getAttribute("href") !== updated.url);

			if(urlChanged) {
				elmLI.setAttribute("href", updated.url);
				setFeedVisitedState(elmLI, false);
			}
			setFeedTooltipState(elmLI);
			m_objTreeFeedsData.set(updated.id, { updateTitle: newUpdateTitle });

		}).catch((error) => {
			console.log("[Sage-Like]", error);
		}).finally(() => suspendBookmarksEventHandler(false));
	}

	//==================================================================================
	//=== Tree Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedTitle(elmLI, title) {

		// don't change title if user unchecked that option for this feed
		if(m_objTreeFeedsData.value(elmLI.id).updateTitle === false) {
			return;
		}

		// don't change title to empty string
		if(title.length > 0) {
			suspendBookmarksEventHandler(true);
			browser.bookmarks.update(elmLI.id, { title: title }).then((updatedNode) => {
				elmLI.firstElementChild.textContent = updatedNode.title;
			}).finally(() => suspendBookmarksEventHandler(false));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleSubTreeState(elmTreeItem) {

		if (elmTreeItem.classList.contains("open")) {
			setSubTreeVisibility(elmTreeItem, false);
			m_objOpenSubTrees.remove(elmTreeItem.id);
		} else {
			setSubTreeVisibility(elmTreeItem, true);
			m_objOpenSubTrees.set(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setSubTreeState(elmTreeItem, open) {

		if (open) {
			setSubTreeVisibility(elmTreeItem, true);
			m_objOpenSubTrees.set(elmTreeItem.id);
		} else {
			setSubTreeVisibility(elmTreeItem, false);
			m_objOpenSubTrees.remove(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setSubTreeVisibility(elmLI, open) {
		// Don't Call This Directlly
		elmLI.classList.remove("open", "closed");
		elmLI.classList.add(open ? "open" : "closed");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedLoadingState(elm, loading) {

		if (loading === true) {
			elm.classList.add("loading");
		} else {
			elm.classList.remove("loading");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setOneConcurrentFeedLoadingState(elm, loading) {

		if (loading === true) {

			if (m_elmCurrentlyLoading !== null) {
				m_elmCurrentlyLoading.classList.remove("loading");
			}
			elm.classList.add("loading");
			m_elmCurrentlyLoading = elm;
		} else {
			elm.classList.remove("loading");
			m_elmCurrentlyLoading = null;
		}
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
				slUtil.scrollIntoViewIfNeeded(elm, m_elmTreeRoot.parentElement);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedVisitedState(elm, visited) {

		if(visited === true) {
			elm.classList.remove("bold");
		} else {
			elm.classList.add("bold");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedErrorState(elm, error, errorMsg) {

		if(error === true) {
			elm.classList.add("error");
			setFeedTooltipState(elm, "Error: " + errorMsg);
		} else {
			elm.classList.remove("error");
			setFeedTooltipState(elm);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTooltipState(elmLI, secondLine = undefined) {

		elmLI.title = elmLI.firstElementChild.textContent;

		if(secondLine !== undefined) {
			elmLI.title += "\u000d" + secondLine;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTooltipFullState(elmLI, firstLine, secondLine) {

		// don't use channel title if user unchecked that option for this feed
		if(m_objTreeFeedsData.value(elmLI.id).updateTitle && firstLine) {
			elmLI.title = firstLine;
		} else {
			elmLI.title = elmLI.firstElementChild.textContent;
		}
		elmLI.title += "\u000d" + secondLine;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeAllTreeItemsEventListeners() {

		let elms = m_elmTreeRoot.getElementsByTagName("li");

		for (let elm of elms) {
			removeTreeItemEventListeners(elm);
		}
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setTbButtonCheckFeedsAlert(on) {

		if(m_elmCheckTreeFeeds.slSavedTitle === undefined) {
			m_elmCheckTreeFeeds.slSavedTitle = m_elmCheckTreeFeeds.title;
		}

		if(on) {
			m_elmCheckTreeFeeds.classList.add("alert");
			m_elmCheckTreeFeeds.title = "The feed folder or it's content has been modified by another party.\u000dShift+click to reload.";
		} else {
			m_elmCheckTreeFeeds.classList.remove("alert");
			m_elmCheckTreeFeeds.title = m_elmCheckTreeFeeds.slSavedTitle;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function suspendBookmarksEventHandler(suspendOrResume) {
		m_flagSuspendBookmarksEventHandler = suspendOrResume;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeFeedLoadingStatus(elmLI) {

		let list;
		if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE)) {
			list = elmLI.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_ITEM)
		} else if(elmLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_ITEM)) {
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
		if(m_elmTreeRoot.style.direction === "rtl") {
			m_elmTreeRoot.style.direction = "ltr";
		} else {
			m_elmTreeRoot.style.direction = "rtl";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isFeedInTree(url) {
		return (m_elmTreeRoot.querySelector("." + slGlobals.CLS_RTV_LI_TREE_ITEM + "[href=\"" + url + "\"]") !== null);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeTree() {

		removeAllTreeItemsEventListeners();
		while (m_elmTreeRoot.firstChild) {
			m_elmTreeRoot.removeChild(m_elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function eventOccureInItemLineHeight(evt, elm) {

		// This function checks if the event has occured in the top part of the element
		return ((evt.clientY - elm.getBoundingClientRect().top) <= m_lineHeight)
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFocus() {
		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.focus();
		} else {
			m_elmTreeRoot.parentElement.focus();
		}
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
		createNewFeed: createNewFeed,
		deleteFeed: deleteFeed,
		openPropertiesView: openPropertiesView,
		updateFeedProperties: updateFeedProperties,
		isFeedInTree: isFeedInTree,
		switchViewDirection: switchViewDirection,
		setFocus: setFocus,
	};

})();
