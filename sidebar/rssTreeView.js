"use strict";

let rssTreeView = (function () {

	let elmReloadTree;
	let elmExpandAll;
	let elmCollapseAll;

	let elmTreeRoot;

	let elmCurrentlyLoading = null;
	let elmCurrentlySelected = null;
	let elmCurrentlyDragged = null;

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
	let objCurrentlyDraggedOver = new CurrentlyDraggedOver();

	let lineHeight = 15;

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

		createRSSTree();

		lineHeight = parseInt(getComputedStyle(elmTreeRoot).getPropertyValue("line-height"));
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
	function createRSSTree() {

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

			elmLI = createTagLI(bookmark.id, bookmark.title, sageLikeGlobalConsts.CLS_LI_SUB_TREE, null, true);

			let elmUL = createTagUL(false);
			elmLI.appendChild(elmUL);

			for (let child of bookmark.children) {
				createTreeItem(elmUL, child);
			}

		} else { // it's a bookmark

			elmLI = createTagLI(bookmark.id, bookmark.title === "" ? bookmark.url : bookmark.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, bookmark.url, true);
		}
		parentElement.appendChild(elmLI);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagUL(isOpen) {
		let elm = document.createElement("ul");
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagLI(id, textContent, className, href = null, draggable = false) {

		let elmCaption = document.createElement("div");
		let elm = document.createElement("li");

		elmCaption.className = sageLikeGlobalConsts.CLS_DIV_RSS_TREE_FEED_CAPTION;
		elmCaption.textContent = textContent;

		elm.id = id;
		elm.className = className;
		if (href !== null) {
			elm.setAttribute("href", href);
		}
		if(draggable === true) {
			elm.setAttribute("draggable", "true");
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
		let isFolder = elmItem.classList.contains(sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entier subtree.
		// The result is that clicking on the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if(!eventOccureInItemLineHeight(event, elmItem)) {
			return;
		}

		if (isFolder) {
			toggleTreeFolderState(elmItem);
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
	
		let isFolder = this.classList.contains(sageLikeGlobalConsts.CLS_LI_SUB_TREE);		

		if(isFolder) {
	
			// when a subtree is open the height of the LI is as the Height of the entier subtree.
			// The result is that hovering on the left of the items in the subtree (but not ON a subtree item) marks
			// the subtree as a drop target. This makes sure that only hovers above the top of the elements are processed
			if(!eventOccureInItemLineHeight(event, this)) {
				event.dataTransfer.dropEffect = "none";
				return false;
			}

			// it's a folder - lingering
			if(this.id === objCurrentlyDraggedOver.id) {

				let isFolderClosed = (this.getElementsByTagName("ul")[0].getAttribute("rel") !== "open");

				if(isFolderClosed && objCurrentlyDraggedOver.lingered) {
					// mouse has lingered enough, open the closed folder
					setTreeFolderState(this, true);
				}

			} else {
				// it's a folder - just in
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

		// nothing to do if dropped in the same location OR in a folder (sub tree)
		if(elmDropTarget === elmCurrentlyDragged) {
			elmCurrentlyDragged.classList.remove("dragged");
		} else {

			console.log("[sage-like-moved]", elmCurrentlyDragged.id);
			console.log("[sage-like-repleaced]", elmDropTarget.id);

			browser.bookmarks.get([elmCurrentlyDragged.id, elmDropTarget.id]).then((bookmarkItems) => {

				let newIndex;

				if(bookmarkItems[0].parentId == bookmarkItems[1].parentId) {

					if(bookmarkItems[0].id === elmCurrentlyDragged.id)
				}

				
				let destination = {
					parentId: bookmarkItems[0].parentId,
					index: bookmarkItems[0].index,
				};
				console.log("[sage-like-repleaced]", destination);

				browser.bookmarks.move(elmCurrentlyDragged.id, destination).then((bookmarkItem) => {

					elmCurrentlyDragged.parentElement.removeChild(elmCurrentlyDragged);

					let dropHTML = event.dataTransfer.getData("text/html");
					elmDropTarget.insertAdjacentHTML("beforebegin", dropHTML);
					addSubTreeItemsEventListeners(elmDropTarget.previousSibling);
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

		let isExpand = (this.id === "expandall");
		let dis = isExpand ? "block" : "none";
		let rel = isExpand ? "open" : "closed";
		let img = isExpand ? sageLikeGlobalConsts.IMG_OPEN_FOLDER : sageLikeGlobalConsts.IMG_CLOSED_FOLDER;

		let elems = elmTreeRoot.getElementsByTagName("ul");

		for (let elm of elems) {
			elm.style.display = dis;
			elm.setAttribute("rel", rel);
			elm.parentElement.style.backgroundImage = "url(" + img + ")";
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
			one has been completed. Better the pacing the creations using setTimeout(), yuck!
		*/

		// while index in pointing to an object in the array
		if(bookmarksList.length > index) {

			browser.bookmarks.create(bookmarksList[index]).then((createdNode) => {

				let elmLI = createTagLI(createdNode.id, createdNode.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, createdNode.url);
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
	function toggleTreeFolderState(elmTreeItem) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (elmUL.getAttribute("rel") === "open") {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
		} else {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
		}	
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setTreeFolderState(elmTreeItem, open) {

		let elmUL = elmTreeItem.getElementsByTagName("ul")[0];

		if (open && (elmUL.getAttribute("rel") !== "open")) {
			setSubTreeVisibility(elmTreeItem, elmUL, true);
		} else if (!open && (elmUL.getAttribute("rel") === "open")) {
			setSubTreeVisibility(elmTreeItem, elmUL, false);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setSubTreeVisibility(elmLI, elmUL, open) {
		elmUL.style.display = (open ? "block" : "none");
		elmUL.setAttribute("rel", (open ? "open" : "closed"));
		elmLI.style.backgroundImage = "url(" + (open ? sageLikeGlobalConsts.IMG_OPEN_FOLDER : sageLikeGlobalConsts.IMG_CLOSED_FOLDER) + ")";	
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setFeedLoadingState(elm, isLoading) {

		if (isLoading === true) {

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