"use strict";

let rssTreeView = (function () {

	let elmReloadTree;
	let elmExpandAll;
	let elmCollapseAll;

	let elmTreeRoot;

	let elmCurrentlyLoading = null;
	let elmCurrentlySelected = null;

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

		removeTreeEventListeners();

		elmReloadTree.removeEventListener("click", onClickReloadTree);
		elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createRSSTree() {

		emptyTree();

		prefs.getRootFeedsFolderId().then((folderId) => {
			
			if(folderId === sageLikeGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				elmTreeRoot.appendChild(createErrorTagLI("The feeds folder is not set in the Options page."));
				browser.runtime.openOptionsPage();
				return;
			}

			browser.bookmarks.getSubTree(folderId).then((bookmarkItems) => {
				if (bookmarkItems[0].children) {
					for(let child of bookmarkItems[0].children) {
						createRSSTreeItem(elmTreeRoot, child);
					}
				}

				// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
				if(slUtil.hasHScroll(elmTreeRoot)) {
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
	function createRSSTreeItem(parentElement, bookmark) {

		let elmLI;

		if (bookmark.url === undefined) {		// it's a folder

			elmLI = createTagLI(bookmark.id, bookmark.title, sageLikeGlobalConsts.CLS_LI_SUB_TREE);

			let elmUL = createTagUL(false);
			elmLI.appendChild(elmUL);

			for(let child of bookmark.children) {
				createRSSTreeItem(elmUL, child);
			}

		} else {			// it's a bookmark

			elmLI = createTagLI(bookmark.id, bookmark.title === "" ? bookmark.url : bookmark.title, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED, bookmark.url);
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
	function createTagLI(id, textContent, className, href = null) {

		let elmCaption = document.createElement("div");
		let elm = document.createElement("li");

		elmCaption.className = sageLikeGlobalConsts.CLS_DIV_RSS_TREE_FEED_CAPTION;
		elmCaption.textContent = textContent;

		elm.id = id;
		elm.className = className;
		if(href !== null) {
			elm.setAttribute("href", href);
		}
		elm.appendChild(elmCaption);
		elm.addEventListener("click", onClickRssTreeItem);

		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createErrorTagLI(textContent) {
		let elm = document.createElement("li");
		slUtil.concatClassName(elm, "errormsg");
		elm.textContent = textContent;
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickRssTreeItem(event) {

		let elmItem = this;
		let isFolder = slUtil.includedInClassName(elmItem, sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entier subtree.
		// The result is that clicking on the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if((event.clientY - elmItem.getBoundingClientRect().top) > lineHeight) {
			return;
		}

		if(isFolder) {

			let elmUL = elmItem.getElementsByTagName("ul")[0];

			if (elmUL.getAttribute("rel") === "open") {
				elmUL.style.display = "none";
				elmUL.setAttribute("rel", "closed");
				elmItem.style.backgroundImage = "url(" + sageLikeGlobalConsts.IMG_CLOSED_FOLDER + ")";
			} else {
				elmUL.style.display = "block";
				elmUL.setAttribute("rel", "open");
				elmItem.style.backgroundImage = "url(" + sageLikeGlobalConsts.IMG_OPEN_FOLDER + ")";
			}
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
	function onClickReloadTree (event) {
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

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setFeedLoadingState(elm, isLoading) {

		if (isLoading === true) {

			if (elmCurrentlyLoading !== null) {
				slUtil.removeClassName(elmCurrentlyLoading, "loading");
			}
			slUtil.concatClassName(elm, "loading");
			elmCurrentlyLoading = elm;
		} else {
			slUtil.removeClassName(elm, "loading");
			elmCurrentlyLoading = null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedSelectionState = function (elm) {

		if(elmCurrentlySelected !== null) {
			slUtil.removeClassName(elmCurrentlySelected, "selected");
		}

		elmCurrentlySelected = elm;
		slUtil.concatClassName(elm, "selected");
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	function emptyTree() {
		while (elmTreeRoot.firstChild) {
			elmTreeRoot.removeChild(elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function removeTreeEventListeners() {

		let elems = elmTreeRoot.getElementsByTagName("li");

		for(let el of elems) {
			el.removeEventListener("click", onClickRssTreeItem);
		}
	}

	return {
		setFeedSelectionState: setFeedSelectionState,
	};

})();
