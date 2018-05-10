"use strict";

(function () {

	const BOOKMARK_FOLDER_ROOT_ID = "Q9MHwpjFwL2u";		// id of 'RSS Feeds (Sage) 'clean' profile
	//const BOOKMARK_FOLDER_ROOT_ID = "7ddrxyguHW8l";		// id of 'RSS Feeds (Sage)' '' 'Fx64-Primary' profile

	const IMG_CLOSED_FOLDER = "../icons/closed.gif";
	const IMG_OPEN_FOLDER = "../icons/open.gif";

	let elmTreeRoot;
	let elmExpandAll;
	let elmCollapseAll;

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

		elmExpandAll.removeEventListener("click", onClickExpandAll);
		elmCollapseAll.removeEventListener("click", onClickCollapseAll);

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
			console.log(bookmarkItems[0].title, bookmarkItems[0].id);
		});*/

		browser.bookmarks.getSubTree(BOOKMARK_FOLDER_ROOT_ID).then((bookmarkItems) => {
			if (bookmarkItems[0].children) {
				for(let child of bookmarkItems[0].children) {
					createRSSTreeItem(elmTreeRoot, child);
				}
			}
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

			elmLI.className = "subtree";
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
	function createTagLI(id, textContent) {
		let elm = document.createElement("li");
		elm.id = id;
		//elm.className = "treeitem";
		elm.textContent = textContent;
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function createTagUL(isOpen) {
		let elm = document.createElement("ul");
		//elm.className = "treeitem";
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onclickRssTreeItem(evt) {

		let elmItem = this;

		if (elmItem.className === "subtree") {

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
				console.log(elmItem.textContent, bookmarkItem[0].url);
				rssListView.setListFromUrl(bookmarkItem[0].url);
			});
		}

		evt.stopPropagation();
	}


	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickExpandCollapseAll(evt) {

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
	/*
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickExpandAll(evt) {

		console.log(this.id);
		let elems = elmTreeRoot.getElementsByTagName("ul");

		for (let elm of elems) {
			elm.style.display = "block";
			elm.setAttribute("rel", "open");
			elm.parentElement.style.backgroundImage = "url(" + IMG_OPEN_FOLDER + ")";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickCollapseAll(evt) {

		console.log(this.id);
		let elems = elmTreeRoot.getElementsByTagName("ul");

		for (let elm of elems) {
			elm.style.display = "none";
			elm.setAttribute("rel", "closed");
			elm.parentElement.style.backgroundImage = "url(" + IMG_CLOSED_FOLDER + ")";
		}
	}
	*/
	////////////////////////////////////////////////////////////////////////////////////
	//
	function removeTreeEventListeners() {

		let elems = elmTreeRoot.getElementsByTagName("li");

		for(let el of elems) {
			el.removeEventListener("click", onclickRssTreeItem);
		}

		console.log("THOSE EVENTS ARE NOT REMOVED", elems);		
	}

})();
