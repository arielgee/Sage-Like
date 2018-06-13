"use strict";

let rssTreeView = (function() {

	//==================================================================================
	//=== Class Declerations
	//==================================================================================

	class StoredKeyedItems {
		constructor() {
			if (new.target === "StoredKeyedItems") {
				throw new Error("Don't do that");
			}
			this.clear();
		}
		getStorage() {
			throw new Error("Don't do that");
		}
		setStorage() {
			throw new Error("Don't do that");
		}
		set(key, value = undefined) {
			this._items[key] = ( (value === undefined) || (value === null) ) ? "x" : value;
			this.setStorage();
		}
		remove(key) {
			delete this._items[key];
			this.setStorage();
		}
		exist(key) {
			return this._items.hasOwnProperty(key);
		}
		value(key) {
			return this._items.hasOwnProperty(key) ? this._items[key] : null;
		}
		clear() {
			this._items = {};
		}
	};

	class OpenSubTrees extends StoredKeyedItems {
		getStorage() {
			return new Promise((resolve) => {
				prefs.getOpenSubTrees().then((items) => {
					this._items = items;
					resolve();
				});
			});
		}
		setStorage() {
			prefs.setOpenSubTrees(this._items);
		}
	};

	class LastVisitedFeeds extends StoredKeyedItems {
		getStorage() {
			return new Promise((resolve) => {
				prefs.getLastVisitedFeeds().then((items) => {
					this._items = items;
					resolve();
				});
			});
		}
		setStorage() {
			prefs.setLastVisitedFeeds(this._items);
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

	let elmCheckTreeFeeds;
	let elmExpandAll;
	let elmCollapseAll;

	let elmTreeRoot;

	let elmCurrentlyLoading;
	let elmCurrentlySelected;
	let elmCurrentlyDragged = null;

	let lineHeight = 21;

	let objOpenSubTrees = new OpenSubTrees();
	let objLastVisitedFeeds = new LastVisitedFeeds();
	let objCurrentlyDraggedOver = new CurrentlyDraggedOver();


	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		elmExpandAll = document.getElementById("expandall");
		elmCollapseAll = document.getElementById("collapseall");
		elmCheckTreeFeeds = document.getElementById("checkTreeFeeds");
		elmTreeRoot = document.getElementById("rssTreeView");

		elmCheckTreeFeeds.addEventListener("click", onClickCheckTreeFeeds);
		elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);

		lineHeight = parseInt(getComputedStyle(elmTreeRoot).getPropertyValue("line-height"));

		createRSSTree();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		removeAllTreeItemsEventListeners();

		elmCheckTreeFeeds.removeEventListener("click", onClickCheckTreeFeeds);
		elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	//==================================================================================
	//=== Tree Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function createRSSTree() {

		// get subtree's open/closed statuses from local storage
		await objOpenSubTrees.getStorage();

		disposeTree();
		elmCurrentlyLoading = null;
		elmCurrentlySelected = null;
	
		prefs.getRootFeedsFolderId().then((folderId) => {

			if (folderId === sageLikeGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				elmTreeRoot.appendChild(createErrorTagLI("The feeds folder is not set in the Options page."));
				browser.runtime.openOptionsPage();
				return;
			}

			browser.bookmarks.getSubTree(folderId).then((bookmarkItems) => {
				if (bookmarkItems[0].children) {
					for (let child of bookmarkItems[0].children) {
						createTreeItem(elmTreeRoot, child);
					}
				}

				// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
				if (slUtil.hasHScroll(elmTreeRoot)) {
					elmTreeRoot.style.height = (elmTreeRoot.clientHeight - slUtil.getScrollbarWidth(document)) + "px";
				}
				processRSSTreeFeedsData();

			}).catch((error) => {
				elmTreeRoot.appendChild(createErrorTagLI("Failed to load feed folder: " + error.message));
				browser.runtime.openOptionsPage();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTreeItem(parentElement, bookmark) {

		let elmLI;

		if (bookmark.url === undefined) { // it's a folder

			elmLI = createTagLI(bookmark.id, bookmark.title, sageLikeGlobalConsts.CLS_LI_SUB_TREE, null);

			let elmUL = createTagUL();
			elmLI.appendChild(elmUL);

			setSubTreeState(elmLI, objOpenSubTrees.exist(bookmark.id));

			for (let child of bookmark.children) {
				createTreeItem(elmUL, child);
			}

		} else { // it's a bookmark

			elmLI = createTagLI(bookmark.id, bookmark.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, bookmark.url);
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

		elmCaption.className = sageLikeGlobalConsts.CLS_DIV_RSS_TREE_FEED_CAPTION;
		elmCaption.textContent = textContent;

		elm.id = id;
		elm.className = className;
		elm.setAttribute("draggable", "true");
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
	async function processRSSTreeFeedsData() {

		await objLastVisitedFeeds.getStorage();

		// getElementsByTagName is faster then querySelectorAll
		let elmLIs = elmTreeRoot.getElementsByTagName("li")

		for(let elmLI of elmLIs) {
			if(elmLI.classList.contains(sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED)) {
				processFeedData(elmLI, elmLI.getAttribute("href"));
			}
		};
	}

	////////////////////////////////////////////////////////////////////////////////////
	function processFeedData(elmLI, url) {

		setFeedLoadingState(elmLI, true);

		syndication.fetchFeedData(url).then((feedData) => {

			handleFeedUpdateDate(elmLI, url, new Date(feedData.lastUpdated)); // lastUpdated could be text
			setFeedTitle(elmLI, feedData.title);

		}).catch((error) => {
			setFeedErrorState(elmLI, true, error);
		}).finally(() => {	// wait for Fx v58
			setFeedLoadingState(elmLI, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleFeedUpdateDate(elmLI, url, lastUpdated) {

		// make sure date is valid and save as simple numeric
		let updateTime = (!isNaN(lastUpdated) && (lastUpdated instanceof Date)) ? lastUpdated.getTime() : Date.now();
		setFeedTooltipState(elmLI, "Updated: " + (new Date(updateTime)).toLocaleString());

		if(!objLastVisitedFeeds.exist(url)) {
			objLastVisitedFeeds.set(url, 0);
		}
		setFeedVisitedState(elmLI, objLastVisitedFeeds.value(url) > updateTime);
	}

	//==================================================================================
	//=== Tree Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addTreeItemEventListeners(elm) {
		elm.addEventListener("click", onClickTreeItem, false);
		elm.addEventListener("dragstart", onDragStartTreeItem, false);
		elm.addEventListener("dragenter", onDragEnterTreeItem, false)
		elm.addEventListener("dragover", onDragOverTreeItem, false);
		elm.addEventListener("dragleave", onDragLeaveTreeItem, false);
		elm.addEventListener("dragend", onDragEndTreeItem, false);
		elm.addEventListener("drop", onDropTreeItem, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeTreeItemEventListeners(elm) {
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
	function onClickTreeItem(event) {

		let elmLI = this;
		let isSubTree = elmLI.classList.contains(sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entier subtree.
		// The result is that clicking on the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if(!eventOccureInItemLineHeight(event, elmLI)) {
			return;
		}

		if (isSubTree) {
			toggleSubTreeState(elmLI);
		} else {

			// remove here if is error
			setFeedErrorState(elmLI, false);

			rssListView.disposeList();

			let url = elmLI.getAttribute("href");

			setOneConcurrentFeedLoadingState(elmLI, true);

			syndication.fetchFeedItems(url, event.shiftKey).then((result) => {

				let feedUpdate = new Date(result.feedData.lastUpdated);	// could be text
				setFeedTooltipState(elmLI, "Updated: " + (isNaN(feedUpdate) ? (new Date).toLocaleString() : feedUpdate.toLocaleString()));
				
				setFeedVisitedState(elmLI, true);
				objLastVisitedFeeds.set(url, slUtil.getCurrentLocaleDate().getTime());

				setFeedTitle(elmLI, result.feedData.title);

				rssListView.setFeedItems(result.list);

			}).catch((error) => {
				setFeedErrorState(elmLI, true, error);
				rssListView.setListErrorMsg(error);
			}).finally(() => {	// wait for Fx v58
				setOneConcurrentFeedLoadingState(elmLI, false);
			});
		}
		setFeedSelectionState(elmLI);

		event.stopPropagation();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDragStartTreeItem(event) {

		event.stopPropagation();

		elmCurrentlyDragged = this;

		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", elmCurrentlyDragged.outerHTML);

		elmCurrentlyDragged.classList.add("dragged");
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEnterTreeItem(event) {
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onDragOverTreeItem(event) {

		event.stopPropagation();
		event.preventDefault();

		// prevent element from been droped into itself.
		if(elmCurrentlyDragged.contains(this)) {
			event.dataTransfer.dropEffect = "none";
			return false;
		}

		let isSubTree = this.classList.contains(sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		if(isSubTree) {

			// when a subtree is open the height of the LI is as the Height of the entier subtree.
			// The result is that hovering on the left of the items in the subtree (but not ON a subtree item) marks
			// the subtree as a drop target. This makes sure that only hovers above the top of the elements are processed
			if(!eventOccureInItemLineHeight(event, this)) {
				event.dataTransfer.dropEffect = "none";
				return false;
			}

			// it's a SubTree - lingering
			if(this.id === objCurrentlyDraggedOver.id) {

				let isSubTreeClosed = (this.getElementsByTagName("ul")[0].getAttribute("rel") !== "open");

				if(isSubTreeClosed && objCurrentlyDraggedOver.lingered) {
					// mouse has lingered enough, open the closed SubTree
					setSubTreeState(this, true);
				}

			} else {
				// it's a SubTree - just in
				objCurrentlyDraggedOver.set(this.id);
			}
		}

		this.classList.add("draggedOver");
		event.dataTransfer.dropEffect = "move";
		return false;
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onDragLeaveTreeItem(event) {
		this.classList.remove("draggedOver");
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onDragEndTreeItem(event) {
		elmCurrentlyDragged.classList.remove("dragged");
		this.classList.remove("draggedOver");
		objCurrentlyDraggedOver.init();
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onDropTreeItem(event) {

		// prevent propagation from the perent (subtree)
		event.stopPropagation();

		let elmDropTarget = this;

		// nothing to do if dropped in the same location OR in a SubTree
		if(elmDropTarget === elmCurrentlyDragged) {
			elmCurrentlyDragged.classList.remove("dragged");
		} else {

			browser.bookmarks.get(elmCurrentlyDragged.id).then((dragged) => {
				browser.bookmarks.get(elmDropTarget.id).then((drop) => {

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

					browser.bookmarks.move(elmCurrentlyDragged.id, destination).then((moved) => {

						elmCurrentlyDragged.parentElement.removeChild(elmCurrentlyDragged);

						let dropHTML = event.dataTransfer.getData("text/html");
						elmDropTarget.insertAdjacentHTML("beforebegin", dropHTML);
						addSubTreeItemsEventListeners(elmDropTarget.previousSibling);
					});
				});
			});
		}
		elmDropTarget.classList.remove("draggedOver");
		return false;
	};

	//==================================================================================
	//=== Toolbar Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickCheckTreeFeeds(event) {

		if(event.shiftKey && event.ctrlKey && event.altKey) {
			rssListView.disposeList();
			createRSSTree();
		} else {
			processRSSTreeFeedsData();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExpandCollapseAll(event) {

		let elemULs = elmTreeRoot.getElementsByTagName("ul");

		for (let elmUL of elemULs) {
			if(this.id === "expandall") {
				setSubTreeState(elmUL.parentElement, true);
				objOpenSubTrees.set(elmUL.parentElement.id);
			} else {
				setSubTreeState(elmUL.parentElement, false);
				objOpenSubTrees.remove(elmUL.parentElement.id);
			}
		}
	}

	//==================================================================================
	//=== Adding New Tree Items (discovery)
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addNewFeeds(newFeedsList) {

		let last = elmTreeRoot.lastElementChild;
		if (last === null || last.id === undefined || last.id === "") {
			return;
		}

		browser.bookmarks.get(last.id).then((foundNodes) => {

			let counter = 1;
			let bookmarksList = [];

			for(let feed of newFeedsList) {

				bookmarksList.push( {
					index: foundNodes[0].index + (counter++),
					parentId: foundNodes[0].parentId,
					title: feed.title,
					url: feed.url,
				} );
			}

			createBookmarksSequentially(bookmarksList, 0);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createBookmarksSequentially(bookmarksList, index) {

		/*
			Because bookmarks.create() is an asynchronous function the creation of multiple bookmarks
			sequentially is performed to the same index (last index) and will appear in reverse order.

			This recursive/asynchronous function makes sure the next create is performed after the preveuse
			one has been completed. Better then pacing the creations using setTimeout(), yuck!
		*/

		// while index in pointing to an object in the array
		if(bookmarksList.length > index) {

			browser.bookmarks.create(bookmarksList[index]).then((created) => {

				let elmLI = createTagLI(created.id, created.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, created.url);
				elmLI.classList.add("blinkNew");
				setFeedVisitedState(elmLI, false);
				elmTreeRoot.appendChild(elmLI);			

				createBookmarksSequentially(bookmarksList, ++index);

				// this will happend after the last element was appended
				if(bookmarksList.length === index) {
					elmLI.scrollIntoView();
					blinkNewlyAddedFeeds();
				}
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function blinkNewlyAddedFeeds() {

		elmTreeRoot.querySelectorAll(".blinkNew").forEach((elm) => {
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
	//=== Item Properties
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedProperties(elmLI, newTitle, newLocation) {
		
		let changes = {
			title: newTitle,
			url: newLocation,
		};

		browser.bookmarks.update(elmLI.id, changes).then((bookmarkItem) => {
			elmLI.firstElementChild.textContent = newTitle;
			elmLI.setAttribute("href", newLocation);
		}).catch((error) => {
			console.log("[Sage-Like]", error);
		});
	}
	
	//==================================================================================
	//=== Context Menu Actions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function deleteFeed(elmLI) {
		browser.bookmarks.remove(elmLI.id).then(() => {
			elmLI.parentElement.removeChild(elmLI);
			objLastVisitedFeeds.remove(elmLI.id);
		});		
	}
	
	//==================================================================================
	//=== Tree Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedTitle(elmLI, title) {
		
		// don't change title to empty string
		if(title.length > 0) {
			browser.bookmarks.update(elmLI.id, { title: title }).then((updatedNode) => {
				elmLI.firstElementChild.textContent = updatedNode.title;
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleSubTreeState(elmTreeItem) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (elmUL.getAttribute("rel") === "open") {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
			objOpenSubTrees.remove(elmTreeItem.id);
		} else {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
			objOpenSubTrees.set(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setSubTreeState(elmTreeItem, open) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (open) {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
			objOpenSubTrees.set(elmTreeItem.id);
		} else {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
			objOpenSubTrees.remove(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////	
	function setSubTreeVisibility(elmLI, elmUL, open) {
		// Don't Call This Directlly
		elmUL.style.display = (open ? "block" : "none");
		elmUL.setAttribute("rel", (open ? "open" : "closed"));
		elmLI.style.backgroundImage = "url(" + (open ? sageLikeGlobalConsts.IMG_OPEN_SUB_TREE : sageLikeGlobalConsts.IMG_CLOSED_SUB_TREE) + ")";
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

			if (elmCurrentlyLoading !== null) {
				elmCurrentlyLoading.classList.remove("loading");
			}
			elm.classList.add("loading");
			elmCurrentlyLoading = elm;
		} else {
			elm.classList.remove("loading");
			elmCurrentlyLoading = null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedSelectionState(elm) {

		if (elmCurrentlySelected !== null) {
			elmCurrentlySelected.classList.remove("selected");
		}

		elmCurrentlySelected = elm;
		elm.classList.add("selected");
	};

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
	function removeAllTreeItemsEventListeners() {

		let elems = elmTreeRoot.getElementsByTagName("li");

		for (let elm of elems) {
			removeTreeItemEventListeners(elm);
		}
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function disposeTree() {

		removeAllTreeItemsEventListeners();
		while (elmTreeRoot.firstChild) {
			elmTreeRoot.removeChild(elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function eventOccureInItemLineHeight(evt, elm) {

		// This function checks if the event has occured in the top part of the element
		return ((evt.clientY - elm.getBoundingClientRect().top) <= lineHeight)
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
		deleteFeed: deleteFeed,
		updateFeedProperties: updateFeedProperties,
	};

})();