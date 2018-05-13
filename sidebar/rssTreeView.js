"use strict";

(function () {

	// ID's of 'RSS Feeds (Sage)
	const BOOKMARK_FOLDER_ROOT_ID = "3kd0htXHfE_n";		// Home 'clean' profile
	//const BOOKMARK_FOLDER_ROOT_ID = "Q9MHwpjFwL2u";	// Work 'clean' profile
	//const BOOKMARK_FOLDER_ROOT_ID = "7ddrxyguHW8l";	// Work 'Fx64-Primary' profile

	const CLS_LI_SUB_TREE = "subtree";

	const IMG_CLOSED_FOLDER = "../icons/closed.png";
	const IMG_OPEN_FOLDER = "../icons/open.png";

	let elmTreeRoot;
	let elmExpandAll;
	let elmCollapseAll;

	let elmCurrentlyLoading = null;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		elmTreeRoot = document.getElementById("rssTreeView");
		elmExpandAll = document.getElementById("expandall");
		elmCollapseAll = document.getElementById("collapseall");

		elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);

		emptyTree();
		createRSSTree();
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
	function emptyTree() {
		while (elmTreeRoot.firstChild) {
			elmTreeRoot.removeChild(elmTreeRoot.firstChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createRSSTree() {

		/*browser.bookmarks.search("RSS Feeds (Sage)").then((bookmarkItems) => {
			lzUtil.log(bookmarkItems[0].title, bookmarkItems[0].id);
		});*/

		browser.bookmarks.getSubTree(BOOKMARK_FOLDER_ROOT_ID).then((bookmarkItems) => {
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

		elmLI.addEventListener("click", onclickRssTreeItem);

		if (bookmarkItem.url !== undefined) {
			parentElement.appendChild(elmLI);
		} else {

			lzUtil.concatClassName(elmLI, CLS_LI_SUB_TREE);
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
		//lzUtil.concatClassName(elm, "treeitem");
		return elm;
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagLI(id, textContent) {
		let elm = document.createElement("li");
		elm.id = id;
		//lzUtil.concatClassName(elm, "treeitem");
		elm.textContent = textContent;
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
	function onclickRssTreeItem(event) {

		let elmItem = this;
		
		if(RegExp("\\b" + CLS_LI_SUB_TREE + "\\b").test(elmItem.className)) {

			let elmUL = elmItem.getElementsByTagName("ul")[0];

			if (elmUL.getAttribute("rel") === "open") {
				elmUL.style.display = "none";
				elmUL.setAttribute("rel", "closed");
				elmItem.style.backgroundImage = "url(" + IMG_CLOSED_FOLDER + ")";
			} else {
				elmUL.style.display = "block";
				elmUL.setAttribute("rel", "open");
				elmItem.style.backgroundImage = "url(" + IMG_OPEN_FOLDER + ")";
			}
		} else {
			browser.bookmarks.get(elmItem.id).then((bookmarkItem) => {

				lzUtil.log(elmItem.textContent, bookmarkItem[0].url);

				setFeedLoadingState(elmItem, true);
				rssListView.setFeedUrl(bookmarkItem[0].url).then(() => {
					setFeedLoadingState(elmItem, false);
				});
			});
		}

		event.stopPropagation();
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickExpandCollapseAll(event) {

		let isExpand = (this.id === "expandall");
		let dis = isExpand ? "block" : "none";
		let rel = isExpand ? "open" : "closed";
		let img = isExpand ? IMG_OPEN_FOLDER : IMG_CLOSED_FOLDER;
		
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
	function removeTreeEventListeners() {

		let elems = elmTreeRoot.getElementsByTagName("li");

		for(let el of elems) {
			el.removeEventListener("click", onclickRssTreeItem);
		}
	}

})();
