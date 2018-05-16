"use strict";

let rssTreeView = (function () {

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
		elmTreeRoot = document.getElementById("rssTreeView");

		elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);

		emptyTree();
		createRSSTree();

		lineHeight = parseInt(getComputedStyle(elmTreeRoot).getPropertyValue("line-height"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

		removeTreeEventListeners();

		elmExpandAll.removeEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.removeEventListener("click", onClickExpandCollapseAll);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createRSSTree() {

		/*browser.bookmarks.search("RSS Feeds (Sage)").then((bookmarkItems) => {
			lzUtil.log(bookmarkItems[0].title, bookmarkItems[0].id);
		});*/

		browser.bookmarks.getSubTree(sageLikeGlobalConsts.BOOKMARK_FOLDER_ROOT_ID).then((bookmarkItems) => {
			if (bookmarkItems[0].children) {
				for(let child of bookmarkItems[0].children) {
					createRSSTreeItem(elmTreeRoot, child);
				}
			}
		}).catch((error) => {			
			elmTreeRoot.appendChild(createErrorTagLI("Failed to load feed folder: " + error.message));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createRSSTreeItem(parentElement, bookmarkItem) {

		let elmUL;
		let elmLI = createTagLI(bookmarkItem.id, bookmarkItem.title);

		elmLI.addEventListener("click", onClickRssTreeItem);

		if (bookmarkItem.url !== undefined) {
			lzUtil.concatClassName(elmLI, sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED);
			parentElement.appendChild(elmLI);
		} else {

			lzUtil.concatClassName(elmLI, sageLikeGlobalConsts.CLS_LI_SUB_TREE);
			parentElement.appendChild(elmLI);

			elmUL = createTagUL(false);
			elmLI.appendChild(elmUL);

			for(let child of bookmarkItem.children) {
				createRSSTreeItem(elmUL, child);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagUL(isOpen) {
		let elm = document.createElement("ul");
		return elm;
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagLI(id, textContent) {

		let elm = document.createElement("li");
		let elmCaption = document.createElement("div");
		
		elm.id = id;
		elmCaption.className = sageLikeGlobalConsts.CLS_DIV_RSS_TREE_FEED_CAPTION;
		elmCaption.textContent = textContent;
		elm.appendChild(elmCaption);
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createErrorTagLI(textContent) {
		let elm = document.createElement("li");
		lzUtil.concatClassName(elm, "errormsg");
		elm.textContent = textContent;
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickRssTreeItem(event) {
		
		let elmItem = this;
		let isFolder = lzUtil.includedInClassName(elmItem, sageLikeGlobalConsts.CLS_LI_SUB_TREE);

		// when a subtree is open the height of the LI is as the Height of the entier subtree.
		// The result is that clicking to the left of the items in the subtree (but not ON a subtree item) closes
		// the subtree. This make sure that only clicks on the top of the elements are processed.
		if((event.pageY - elmItem.offsetTop) > lineHeight) {
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
			browser.bookmarks.get(elmItem.id).then((bookmarkItem) => {

				lzUtil.log(elmItem.textContent, bookmarkItem[0].url);

				setFeedLoadingState(elmItem, true);				
				rssListView.setFeedUrl(bookmarkItem[0].url, event.shiftKey).then(() => {
					setFeedLoadingState(elmItem, false);
				});
			});
		}
		setFeedSelectionState(elmItem);

		event.stopPropagation();
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
				lzUtil.removeClassName(elmCurrentlyLoading, "loading");
			}
			lzUtil.concatClassName(elm, "loading");
			elmCurrentlyLoading = elm;
		} else {
			lzUtil.removeClassName(elm, "loading");
			elmCurrentlyLoading = null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedSelectionState = function (elm) {
		
		if(elmCurrentlySelected !== null) {
			lzUtil.removeClassName(elmCurrentlySelected, "selected");
		}

		elmCurrentlySelected = elm;
		lzUtil.concatClassName(elm, "selected");
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
