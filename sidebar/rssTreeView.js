"use strict";

(function () {

	// ID's of 'RSS Feeds (Sage)
	//const BOOKMARK_FOLDER_ROOT_ID = "3kd0htXHfE_n";		// Home 'clean' profile
	const BOOKMARK_FOLDER_ROOT_ID = "Q9MHwpjFwL2u";	// Work 'clean' profile
	//const BOOKMARK_FOLDER_ROOT_ID = "7ddrxyguHW8l";	// Work 'Fx64-Primary' profile

	const CLS_LI_SUB_TREE = "subtree";

	const IMG_CLOSED_FOLDER = "../icons/closed.png";
	const IMG_OPEN_FOLDER = "../icons/open.png";

	let elmExpandAll;
	let elmCollapseAll;
	let elmTreeRoot;
	let elmContextMenu;
	let elmMnuCopyFeedUrl;


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
		elmContextMenu = document.getElementById("mnuTreeView");
		elmMnuCopyFeedUrl = document.getElementById("mnuCopyFeedUrl");

		elmExpandAll.addEventListener("click", onClickExpandCollapseAll);
		elmCollapseAll.addEventListener("click", onClickExpandCollapseAll);

		elmTreeRoot.addEventListener('contextmenu', onContextMenu);
		elmContextMenu.addEventListener('blur', onFocusOutContextMenu);
		elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
		elmMnuCopyFeedUrl.addEventListener('click', onClickMenuCopyFeedUrl);
		

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

		elmTreeRoot.removeEventListener('contextmenu', onContextMenu);
		elmContextMenu.removeEventListener('blur', onFocusOutContextMenu);
		elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		elmMnuCopyFeedUrl.removeEventListener('click', onClickMenuCopyFeedUrl);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
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

		elmLI.addEventListener("click", onClickRssTreeItem);

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
		return elm;
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagLI(id, textContent) {
		let elm = document.createElement("li");
		elm.id = id;
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
	function onClickRssTreeItem(event) {
		
		let elmItem = this;
		let isFolder = lzUtil.includedInClassName(elmItem, CLS_LI_SUB_TREE);

		if((event.pageY - elmItem.offsetTop) > lineHeight) {
			return;
		}

		if(isFolder) {

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
				setFeedSelectionState(elmItem);
				rssListView.setFeedUrl(bookmarkItem[0].url, event.shiftKey).then(() => {
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
	function onContextMenu (event) {

		let parent = elmContextMenu.parentElement;
		let target = event.target;

		if (target.tagName.toUpperCase() === "LI" && !target.classList.contains(CLS_LI_SUB_TREE)) {

			let x = event.clientX;
			let y = event.clientY;

			// do it first so element will have dimentions (offsetWidth > 0)
			elmContextMenu.style.display = "block";

			if ((x + elmContextMenu.offsetWidth) > parent.offsetWidth) {
				x = parent.offsetWidth - elmContextMenu.offsetWidth;
			}

			if ((y + elmContextMenu.offsetHeight) > parent.offsetHeight) {
				y = parent.offsetHeight - elmContextMenu.offsetHeight;
			}

			elmContextMenu.style.left = x + "px";
			elmContextMenu.style.top = y + "px";

			elmContextMenu.elmFeedItem = target;

			elmContextMenu.focus();
		}

		event.preventDefault();
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onFocusOutContextMenu (event) {
		elmContextMenu.style.display = "none";	
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onKeyDownContextMenu (event) {

		switch (event.key.toLowerCase()) {
			case "escape":
				elmContextMenu.style.display = "none";
				break;		
			case "enter":
				elmContextMenu.style.display = "none";
				break;		
			default:
				break;
		}
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedUrl (event) {		

		if(elmContextMenu.elmFeedItem !== undefined && elmContextMenu.elmFeedItem !== null) {
			browser.bookmarks.get(elmContextMenu.elmFeedItem.id).then((bookmarkItem) => {

				let input = document.createElement("input");
				let style = input.style;
				style.height = style.width = style.borderWidth = style.padding = style.margin = 0;				
				input.value = bookmarkItem[0].url;
				document.body.appendChild(input);
				input.select();
				document.execCommand("copy");
				document.body.removeChild(input);
			});
		}
		elmContextMenu.style.display = "none";
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

})();
