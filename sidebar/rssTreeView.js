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
	let m_semSuspendBookmarksEventHandlerReqCounter = 0;

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
				NewFeedPropertiesView.i.close();
				NewFolderPropertiesView.i.close();
				EditFeedPropertiesView.i.close();
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
	async function onDOMContentLoaded() {

		if(await internalPrefs.getIsExtensionInstalled()) {
			internalPrefs.setIsExtensionInstalled(false);
			await handleOnInstallExtension();
		}

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
					m_elmTreeRoot.style.height = (m_elmTreeRoot.clientHeight - slUtil.getScrollbarWidth()) + "px";
				}
				m_rssTreeCreatedOK = true;
				monitorRSSTreeFeeds();

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
			textContent = (href === null) ? slGlobals.STR_TITLE_EMPTY : url.host;
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

		prefs.getCheckFeedsInterval().then((nextInterval) => {

			// if interval is zero then do not perform background monitoring
			if(nextInterval !== "0") {

				checkForNewRSSTreeFeedsData();

				// Repeat a new timeout session.
				if(nextInterval.includes(":")) {
					nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
				}
				m_timeoutIdMonitorRSSTreeFeeds = setTimeout(monitorRSSTreeFeeds, Number(nextInterval));
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function checkForNewRSSTreeFeedsData() {

		await m_objTreeFeedsData.getStorage();

		let elmLIs = m_elmTreeRoot.querySelectorAll("li." + slGlobals.CLS_RTV_LI_TREE_ITEM);

		prefs.getCheckFeedsMethod().then(async (value) => {

			let counter = 0;
			let method = value.split(";").map(x => Number(x));
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
			syndication.fetchFeedData(url, timeout*1000).then((feedData) => {

				let updateTime = slUtil.asSafeNumericDate(feedData.lastUpdated);

				setFeedTooltipState(elmLI, "Updated: " + (new Date(updateTime)).toLocaleString());		// feedData.description not displayed as thirdLine in tooltip
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
		if((m_elmCurrentlyDragged === null || m_elmCurrentlyDragged.contains(this)) && !event.dataTransfer.types.includes("text/uri-list")) {
			event.dataTransfer.dropEffect = "none";
			return false;
		}

		let isSubTree = this.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

		if(isSubTree) {

			// when a subtree is open the height of the LI is as the Height of the entier subtree.
			// The result is that hovering on the left of the items in the subtree (but not ON a subtree item) marks
			// the entire subtree as a drop target. This makes sure that only hovers on the top of the elements are processed
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

			this.classList.toggle("dropInside", event.shiftKey);
		}

		this.classList.add("draggedOver");
		event.dataTransfer.dropEffect = "move";
		return false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragLeaveTreeItem(event) {
		this.classList.remove("draggedOver", "dropInside");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEndTreeItem(event) {
		m_elmCurrentlyDragged.classList.remove("dragged");
		this.classList.remove("draggedOver", "dropInside");
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

						// when moving a bookmark item down in it's SubTree the target index should me decresed by one
						// becouse the indexing will shift down due to the removal of the dragged item.
						if( (dragged[0].parentId === drop[0].parentId) && (dragged[0].index < drop[0].index) ) {
							newIndex--;
						}

						// if shiftKey is pressed then insert dargged item(s) into the the dropped folder
						let inSubTree = event.shiftKey && elmDropTarget.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

						let destination = {
							parentId: (inSubTree ? drop[0].id : drop[0].parentId),
							index: (inSubTree ? 0 : newIndex),			// insert as first in folder
						};

						suspendBookmarksEventHandler(() => {
							return browser.bookmarks.move(m_elmCurrentlyDragged.id, destination).then((moved) => {

								m_elmCurrentlyDragged.parentElement.removeChild(m_elmCurrentlyDragged);

								let elmDropped;
								let dropHTML = event.dataTransfer.getData("text/html");

								if(inSubTree) {
									let elmDropTargetFolderUL = elmDropTarget.lastElementChild;
									setSubTreeState(elmDropTarget, true);		// open the sub tree if closed
									elmDropTargetFolderUL.insertAdjacentHTML("afterbegin", dropHTML);
									elmDropped = elmDropTargetFolderUL.firstChild;
								} else {
									elmDropTarget.insertAdjacentHTML("beforebegin", dropHTML);
									elmDropped = elmDropTarget.previousElementSibling;
								}

								removeFeedLoadingStatus(elmDropped);
								addSubTreeItemsEventListeners(elmDropped);
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

	//==================================================================================
	//=== Bookmarks Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventHandler(id, objInfo) {

		if(m_semSuspendBookmarksEventHandlerReqCounter > 0) {
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

		if(event.target.getAttribute("disabled") !== null) {
			return;
		}

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

					elmLI = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_ITEM, created.url);
					elmLI.classList.add("blinkNew");
					m_elmTreeRoot.appendChild(elmLI);

					m_objTreeFeedsData.setIfNotExist(created.id);
					setFeedVisitedState(elmLI, false);
				}

				elmLI.scrollIntoView();		// when loop terminates the elmLI is the last LI appended
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
		NewFeedPropertiesView.i.open(elmLI, "New Feed", "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFeed(elmLI, title, url, updateTitle, inSubTree) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inSubTree is true then insert new item inside the provided folder item
			inSubTree = inSubTree && elmLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

			let newBookmark = {
				index: (inSubTree ? 0 : bookmarks[0].index),			// insert as first in folder
				parentId: (inSubTree ? bookmarks[0].id : bookmarks[0].parentId),
				title: title,
				type: "bookmark",
				url: url,
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newBookmark).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_TREE_ITEM, created.url);

					if(inSubTree) {
						let elmFolderUL = elmLI.lastElementChild;
						setSubTreeState(elmLI, true);		// open the sub tree if closed
						elmFolderUL.insertBefore(newElm, elmFolderUL.firstChild);
					} else {
						elmLI.parentElement.insertBefore(newElm, elmLI);
					}

					setFeedVisitedState(newElm, false);
					m_objTreeFeedsData.set(created.id, { updateTitle: updateTitle });
					newElm.focus();
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openNewFolderProperties(elmLI) {
		NewFolderPropertiesView.i.open(elmLI, "New Folder");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createNewFolder(elmLI, title, inSubTree) {

		browser.bookmarks.get(elmLI.id).then((bookmarks) => {

			// if inSubTree is true then insert new folder inside the provided folder item
			inSubTree = inSubTree && elmLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE);

			let newFolder = {
				index: (inSubTree ? 0 : bookmarks[0].index),			// insert as first in folder
				parentId: (inSubTree ? bookmarks[0].id : bookmarks[0].parentId),
				title: title,
				type: "folder",
			};

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.create(newFolder).then((created) => {

					let newElm = createTagLI(created.id, created.title, slGlobals.CLS_RTV_LI_SUB_TREE, null);

					let elmUL = createTagUL();
					newElm.appendChild(elmUL);

					setSubTreeState(newElm, false);

					if(inSubTree) {
						let elmFolderUL = elmLI.lastElementChild;
						setSubTreeState(elmLI, true);
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
	function deleteFeed(elmLI) {

		suspendBookmarksEventHandler(() => {
			return browser.bookmarks.remove(elmLI.id).then(() => {

				if(elmLI.nextElementSibling !== null) {
					elmLI.nextElementSibling.focus();
				} else if(elmLI.previousElementSibling !== null) {
					elmLI.previousElementSibling.focus();
				} else {
					m_elmCurrentlySelected = null;
				}

				elmLI.parentElement.removeChild(elmLI);
				m_objTreeFeedsData.remove(elmLI.id);
			});
		});
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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function markAllFeedsAsVisitedState(isVisited) {

		let elms = m_elmTreeRoot.querySelectorAll("." + slGlobals.CLS_RTV_LI_TREE_ITEM + ":not(.error)");

		if(elms.length > 0) {

			for(let elm of elms) {
				elm.classList.toggle("bold", !isVisited);
				m_objTreeFeedsData.value(elm.id).lastVisited = isVisited ? slUtil.getCurrentLocaleDate().getTime() : 0;
			}
			m_objTreeFeedsData.setStorage();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openEditFeedProperties(elmLI) {

		let id = elmLI.id;

		m_objTreeFeedsData.setIfNotExist(id);
		EditFeedPropertiesView.i.open(elmLI, m_objTreeFeedsData.value(id).updateTitle);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedProperties(elmLI, newTitle, newUrl, newUpdateTitle) {

		let changes = {
			title: newTitle,
			url: newUrl,
		};

		suspendBookmarksEventHandler(() => {
			return browser.bookmarks.update(elmLI.id, changes).then((updated) => {

				elmLI.firstElementChild.textContent = updated.title;

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
	function openEditFolderProperties(elmLI) {
		EditFolderPropertiesView.i.open(elmLI);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFolderProperties(elmLI, newTitle) {

		let changes = {
			title: newTitle,
		};

		suspendBookmarksEventHandler(() => {
			return browser.bookmarks.update(elmLI.id, changes).then((updated) => {
				elmLI.firstElementChild.textContent = updated.title;
				setFeedTooltipState(elmLI);
			});
		});
	}

	//==================================================================================
	//=== Tree Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedTitle(elmLI, title) {

		// don't change title if user unchecked that option for this feed
		// don't change title to empty string
		if(m_objTreeFeedsData.value(elmLI.id).updateTitle === true && title.length > 0) {

			suspendBookmarksEventHandler(() => {
				return browser.bookmarks.update(elmLI.id, { title: title }).then((updatedNode) => {
					elmLI.firstElementChild.textContent = updatedNode.title;
				});
			});
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
	function setFeedLoadingState(elm, isLoading) {
		elm.classList.toggle("loading", isLoading);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setOneConcurrentFeedLoadingState(elm, isLoading) {

		if (isLoading && m_elmCurrentlyLoading !== null) {
			m_elmCurrentlyLoading.classList.remove("loading");
		}
		elm.classList.toggle("loading", isLoading);
		m_elmCurrentlyLoading = isLoading ? elm : null;
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
				slUtil.scrollIntoViewIfNeeded(elm.firstChild, m_elmTreeRoot.parentElement);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedVisitedState(elm, isVisited) {
		elm.classList.toggle("bold", !isVisited);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedErrorState(elm, isError, errorMsg) {

		elm.classList.toggle("error", isError);
		setFeedTooltipState(elm, isError ? "Error: " + errorMsg : undefined);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTooltipState(elmLI, secondLine = undefined, thirdLine = undefined) {

		elmLI.title = elmLI.firstElementChild.textContent;

		if(secondLine !== undefined) {
			elmLI.title += "\u000d" + secondLine;

			if(thirdLine !== undefined) {
				elmLI.title += "\u000d\u000d" + thirdLine;
			}

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

		m_semSuspendBookmarksEventHandlerReqCounter++;

		callbackPromise().catch((error) => {
			console.log("[Sage-Like]", error);
		}).finally(() => m_semSuspendBookmarksEventHandlerReqCounter--);
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
		if(m_elmTreeRoot.parentElement.style.direction === "rtl") {
			m_elmTreeRoot.parentElement.style.direction = m_elmTreeRoot.style.direction = "ltr";
		} else {
			m_elmTreeRoot.parentElement.style.direction = m_elmTreeRoot.style.direction = "rtl";
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

			browser.bookmarks.search({ title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME }).then(async (bookmarks) => {

				let rootId = null;

				for (const bookmark of bookmarks) {
					if (bookmark.type === "folder") {
						rootId = bookmark.id;
						break;
					}
				}

				if (!rootId) {
					rootId = await createOnInstallFeedsBookmarksFolder();
				}

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
				{	details: { parentId: null, title: "News", type: "folder" },
					feeds: [{ parentId: null, title: "Google World United States", url: "https://news.google.com/news/rss/headlines/section/topic/WORLD" },
							{ parentId: null, title: "Reddit World News", url: "https://www.reddit.com/r/worldnews/.rss" },
							{ parentId: null, title: "BBC News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
							{ parentId: null, title: "BuzzFeed News", url: "https://www.buzzfeed.com/world.xml" },
					],
				},
				{	details: { parentId: null, title: "Tech", type: "folder" },
					feeds: [{ parentId: null, title: "Techmeme", url: "http://www.techmeme.com/feed.xml" },
							{ parentId: null, title: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch" },
							{ parentId: null, title: "Top News - MIT", url: "https://www.technologyreview.com/topnews.rss" },
							{ parentId: null, title: "Ars Technica", url: "http://feeds.arstechnica.com/arstechnica/technology-lab" },
					],
				},
				{	details: { parentId: null, title: "DIY", type: "folder" },
					feeds: [{ parentId: null, title: "How Does She", url: "http://howdoesshe.com/category/do-it-yourself/feed" },
						{ parentId: null, title: "Remodelaholic", url: "http://www.remodelaholic.com/category/diy/feed" },
						{ parentId: null, title: "Smart School House", url: "http://www.smartschoolhouse.com/feed" },
						{ parentId: null, title: "Ana White", url: "http://www.ana-white.com/feed" },
					],
				},
				{	details: { parentId: null, title: "Sports", type: "folder" },
					feeds: [{ parentId: null, title: "RunningPhysio", url: "http://www.running-physio.com/feed" },
						{ parentId: null, title: "Goal", url: "http://www.goal.com/en/feeds/news?fmt=rss&ICID=HP" },
						{ parentId: null, title: "Bike Rumor", url: "http://feeds.feedburner.com/BikeRumor" },
						{ parentId: null, title: "CelticsBlog", url: "http://www.celticsblog.com/rss/current" },
					],
				},
			];

			let createdRoot = await browser.bookmarks.create(folderRoot);
			let createdFolder;

			m_objOpenSubTrees.clear();

			for (let idx=0; idx<folders.length; idx++) {
				folders[idx].details.parentId = createdRoot.id;
				createdFolder = await createBookmarksFolder(folders[idx]);
				m_objOpenSubTrees.set(createdFolder.id);
			}

			resolve(createdRoot.id);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function createBookmarksFolder(folder) {

		let createdFolder = await browser.bookmarks.create(folder.details);

		for (let idx=0; idx<folder.feeds.length; idx++) {
			folder.feeds[idx].parentId = createdFolder.id;
			await browser.bookmarks.create(folder.feeds[idx]);
		}
		return createdFolder;
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
		openNewFeedProperties: openNewFeedProperties,
		createNewFeed: createNewFeed,
		openNewFolderProperties: openNewFolderProperties,
		createNewFolder: createNewFolder,
		deleteFeed: deleteFeed,
		toggleFeedVisitedState: toggleFeedVisitedState,
		markAllFeedsAsVisitedState: markAllFeedsAsVisitedState,
		openEditFeedProperties: openEditFeedProperties,
		updateFeedProperties: updateFeedProperties,
		openEditFolderProperties: openEditFolderProperties,
		updateFolderProperties: updateFolderProperties,
		isFeedInTree: isFeedInTree,
		switchViewDirection: switchViewDirection,
		setFocus: setFocus,
	};

})();
