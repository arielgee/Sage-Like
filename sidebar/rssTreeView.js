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
			this.dispose();
		}
		getStorage() {
			throw new Error("Don't do that");
		}
		setStorage() {
			throw new Error("Don't do that");
		}
		add(key, value = undefined) {
			this._items[key] = (value === undefined ? "x" : value);
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
		dispose() {
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

	class LastUpdatedFeeds extends StoredKeyedItems {
		getStorage() {
			return new Promise((resolve) => {
				prefs.getLastUpdatedFeeds().then((items) => {
					this._items = items;
					resolve();
				});
			});
		}
		setStorage() {
			prefs.setLastUpdatedFeeds(this._items);
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

	let elmReloadTree;
	let elmExpandAll;
	let elmCollapseAll;

	let elmTreeRoot;

	let elmCurrentlyLoading = null;
	let elmCurrentlySelected = null;
	let elmCurrentlyDragged = null;

	let lineHeight = 21;

	let objOpenSubTrees = new OpenSubTrees();
	let objLastUpdatedFeeds = new LastUpdatedFeeds();
	let objCurrentlyDraggedOver = new CurrentlyDraggedOver();


	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		elmExpandAll = document.getElementById("expandall");
		elmCollapseAll = document.getElementById("collapseall");
		elmReloadTree = document.getElementById("reloadtree");
		elmTreeRoot = document.getElementById("rssTreeView");

		elmReloadTree.addEventListener("click", onClickReloadTree);
		elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);

		lineHeight = parseInt(getComputedStyle(elmTreeRoot).getPropertyValue("line-height"));

		createRSSTree();
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

		removeAllTreeItemsEventListeners();

		elmReloadTree.removeEventListener("click", onClickReloadTree);
		elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	//==================================================================================
	//=== Tree Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	//
	async function createRSSTree() {

		// get subtree's open/closed statuses from local storage
		await objOpenSubTrees.getStorage();

		disposeTree();

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
	//
	function createTreeItem(parentElement, bookmark) {

		let elmLI;

		if (bookmark.url === undefined) { // it's a folder

			elmLI = createTagLI(bookmark.id, bookmark.title, sageLikeGlobalConsts.CLS_LI_SUB_TREE, null);

			let elmUL = createTagUL();
			elmLI.appendChild(elmUL);

			if(objOpenSubTrees.exist(bookmark.id)) {
				setSubTreeVisibility(elmLI, elmUL, true);
			}

			for (let child of bookmark.children) {
				createTreeItem(elmUL, child);
			}

		} else { // it's a bookmark

			elmLI = createTagLI(bookmark.id, bookmark.title === "" ? bookmark.url : bookmark.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, bookmark.url);
		}
		parentElement.appendChild(elmLI);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagUL() {
		let elmUL = document.createElement("ul");
		return elmUL;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagLI(id, textContent, className, href = null) {

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
		addTreeItemEventListeners(elm);

		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
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
	//
	async function processRSSTreeFeedsData() {
	
		// getElementsByTagName is faster
		await objLastUpdatedFeeds.getStorage();


		console.log("[Sage-Like-objLastUpdatedFeeds]", objLastUpdatedFeeds);

		elmTreeRoot.querySelectorAll("." + sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED).forEach((elmLI) => {

			setFeedLoadingState(elmLI, true);

			syndication.fetchFeedData(elmLI.getAttribute("href")).then((feedData) => {

				let dateVal = new Date(feedData.LastUpdated);	// could be text
				let feedUrl = elmLI.getAttribute("href");

				if(objLastUpdatedFeeds.exist(feedUrl)) {
					console.log("[Sage-Like-objLastUpdatedFeeds]", feedData.title, "exist");

					if(objLastUpdatedFeeds.value < dateVal) {
						elmLI.classList.remove("visited");
					} else {
						elmLI.classList.add("visited");
					}
				} else {

					console.log("[Sage-Like-objLastUpdatedFeeds]", feedData.title, "NOT-exit");
					
					// make sure a Date() is added
					objLastUpdatedFeeds.add(feedUrl, (isNaN(dateVal) ? Date.now() : dateVal));
					elmLI.classList.remove("visited");
				}

				setFeedLoadingState(elmLI, false);
			}).catch((error) => {
				setFeedLoadingState(elmLI, false);
			});			
		});

	}
	
	//==================================================================================
	//=== Tree Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	//
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
	//
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
	//
	function addSubTreeItemsEventListeners(elm) {

		addTreeItemEventListeners(elm);
		for(let child of elm.children) {
			addSubTreeItemsEventListeners(child);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickTreeItem(event) {

		let elmItem = this;
		let isSubTree = elmItem.classList.contains(sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entier subtree.
		// The result is that clicking on the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if(!eventOccureInItemLineHeight(event, elmItem)) {
			return;
		}

		if (isSubTree) {
			toggleSubTreeState(elmItem);
		} else {

			rssListView.disposeList();

			let urlFeed = elmItem.getAttribute("href");

			setFeedLoadingState(elmItem, true);
			syndication.fetchFeedItems(urlFeed, event.shiftKey).then((list) => {
				rssListView.setFeedItems(list);
				setFeedLoadingState(elmItem, false);
			}).catch((error) => {
				rssListView.setListErrorMsg(error);
				setFeedLoadingState(elmItem, false);
			})/*.finally(() => {	// wait for Fx v58
				setFeedLoadingState(elmItem, false);
			})*/;
		}
		setFeedSelectionState(elmItem);

		event.stopPropagation();
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDragStartTreeItem(event) {

		event.stopPropagation();

		elmCurrentlyDragged = this;

		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", elmCurrentlyDragged.outerHTML);

		elmCurrentlyDragged.classList.add("dragged");
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDragEnterTreeItem(event) {
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
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
	//
	function onDragLeaveTreeItem(event) {
		this.classList.remove("draggedOver");
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDragEndTreeItem(event) {
		elmCurrentlyDragged.classList.remove("dragged");
		this.classList.remove("draggedOver");
		objCurrentlyDraggedOver.init();
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
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

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickReloadTree(event) {

		rssListView.disposeList();
		createRSSTree();
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickExpandCollapseAll(event) {

		let elemULs = elmTreeRoot.getElementsByTagName("ul");

		for (let elmUL of elemULs) {
			if(this.id === "expandall") {
				setSubTreeVisibility(elmUL.parentElement, elmUL, true);
				objOpenSubTrees.add(elmUL.parentElement.id);
			} else {
				setSubTreeVisibility(elmUL.parentElement, elmUL, false);
				objOpenSubTrees.remove(elmUL.parentElement.id);
			}
		}
	}

	//==================================================================================
	//=== Adding New Tree Items (discovery)
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	//
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
					url: feed.link,
				} );
			}

			createBookmarksDependently(bookmarksList, 0);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createBookmarksDependently(bookmarksList, index) {

		/*
			Because bookmarks.create() is an asynchronous function the creation of multiple bookmarks
			sequentially is performed to the same index (last index) and will appear in reverse order.

			This recursive/asynchronous function makes sure the next create is performed after the preveuse
			one has been completed. Better then pacing the creations using setTimeout(), yuck!
		*/

		// while index in pointing to an object in the array
		if(bookmarksList.length > index) {

			browser.bookmarks.create(bookmarksList[index]).then((created) => {

				let elmLI = createTagLI(created.id, created.title === "" ? created.url : created.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, created.url);
				elmTreeRoot.appendChild(elmLI);

				createBookmarksDependently(bookmarksList, ++index);
			});
		}
	}

	//==================================================================================
	//=== Tree Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	//
	function toggleSubTreeState(elmTreeItem) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (elmUL.getAttribute("rel") === "open") {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
			objOpenSubTrees.remove(elmTreeItem.id);
		} else {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
			objOpenSubTrees.add(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setSubTreeState(elmTreeItem, open) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (open && (elmUL.getAttribute("rel") !== "open")) {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
			objOpenSubTrees.add(elmTreeItem.id);
		} else if (!open && (elmUL.getAttribute("rel") === "open")) {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
			objOpenSubTrees.remove(elmTreeItem.id);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setSubTreeVisibility(elmLI, elmUL, open) {

		elmUL.style.display = (open ? "block" : "none");
		elmUL.setAttribute("rel", (open ? "open" : "closed"));
		elmLI.style.backgroundImage = "url(" + (open ? sageLikeGlobalConsts.IMG_OPEN_SUB_TREE : sageLikeGlobalConsts.IMG_CLOSED_SUB_TREE) + ")";
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setFeedLoadingState(elm, loading) {

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
	//
	function setFeedSelectionState(elm) {

		if (elmCurrentlySelected !== null) {
			elmCurrentlySelected.classList.remove("selected");
		}

		elmCurrentlySelected = elm;
		elm.classList.add("selected");
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setFeedVisitedState(elm, visited) {
		
		if(visited === true) {
			elm.classList.add("visited");
		} else {
			elm.classList.remove("visited");
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
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
	//
	function disposeTree() {

		removeAllTreeItemsEventListeners();
		while (elmTreeRoot.firstChild) {
			elmTreeRoot.removeChild(elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function eventOccureInItemLineHeight(evt, elm) {

		// This function checks if the event has occured in the top part of the element
		return ((evt.clientY - elm.getBoundingClientRect().top) <= lineHeight)
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
		addNewFeeds: addNewFeeds,
	};

})();