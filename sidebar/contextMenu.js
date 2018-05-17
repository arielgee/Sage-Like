"use strict";

(function () {

	let ContextAction = {
		treeOpen: 1,
		treeOpenNewTab: 2,
		treeOpenNewWin: 3,
		treeCopyUrl: 4,
		listOpen: 5,
		listOpenNewTab: 6,
		listOpenNewWin: 7,
		listCopyUrl: 8,
	};

	let elmSidebarBody;
	let elmContextMenu;

	let elmMnuTreeOpenFeed;
	let elmMnuTreeOpenFeedNewTab;
	let elmMnuTreeOpenFeedNewWin;
	let elmMnuTreeCopyFeedUrl;

	let elmMnuListOpenFeedItem;
	let elmMnuListOpenFeedItemNewTab;
	let elmMnuListOpenFeedItemNewWin;
	let elmMnuListCopyFeedItemUrl;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		elmSidebarBody = document.body;
		elmContextMenu = document.getElementById("mnuContextMenu");

		elmMnuTreeOpenFeed = document.getElementById("mnuTreeOpenFeed")
		elmMnuTreeOpenFeedNewTab = document.getElementById("mnuTreeOpenFeedNewTab")
		elmMnuTreeOpenFeedNewWin = document.getElementById("mnuTreeOpenFeedNewWin")
		elmMnuTreeCopyFeedUrl = document.getElementById("mnuTreeCopyFeedUrl");

		elmMnuListOpenFeedItem = document.getElementById("mnuListOpenFeedItem");
		elmMnuListOpenFeedItemNewTab = document.getElementById("mnuListOpenFeedItemNewTab");
		elmMnuListOpenFeedItemNewWin = document.getElementById("mnuListOpenFeedItemNewWin");
		elmMnuListCopyFeedItemUrl = document.getElementById("mnuListCopyFeedItemUrl");


		elmSidebarBody.addEventListener('contextmenu', onContextMenu);
		elmContextMenu.addEventListener('blur', onBlurContextMenu);
		elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);

		elmMnuTreeOpenFeed.addEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.addEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.addEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.addEventListener('click', onClickMenuCopyFeedUrl);

		elmMnuListOpenFeedItem.addEventListener('click', onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.addEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.addEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.addEventListener("click", onClickMenuCopyFeedItemUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

		elmSidebarBody.removeEventListener('contextmenu', onContextMenu);

		elmContextMenu.removeEventListener('blur', onBlurContextMenu);
		elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);

		elmMnuTreeOpenFeed.removeEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.removeEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.removeEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.removeEventListener('click', onClickMenuCopyFeedUrl);


		elmMnuListOpenFeedItem.removeEventListener('click', onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.removeEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.removeEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.removeEventListener("click", onClickMenuCopyFeedItemUrl);


		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onContextMenu(event) {

		let showMenu = true;
		let trgClsList = event.target.classList;

		if (trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED)) {

			showMenuItemsByClassName("treecontext");
			rssTreeView.setFeedSelectionState(event.target);

		} else if (trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)) {

			showMenuItemsByClassName("listcontext");
			rssListView.setFeedItemSelectionState(event.target);

		} else {
			showMenu = false;
		}

		if (showMenu) {
			elmContextMenu.elmTargetItem = event.target;

			let x = event.clientX;
			let y = event.clientY;

			// do it first so element will have dimentions (offsetWidth > 0)
			elmContextMenu.style.display = "block";

			if ((x + elmContextMenu.offsetWidth) > elmSidebarBody.offsetWidth) {
				x = elmSidebarBody.offsetWidth - elmContextMenu.offsetWidth;
			}

			if ((y + elmContextMenu.offsetHeight) > elmSidebarBody.offsetHeight) {
				y = elmSidebarBody.offsetHeight - elmContextMenu.offsetHeight;
			}

			elmContextMenu.style.left = x + "px";
			elmContextMenu.style.top = y + "px";

			elmContextMenu.focus();
		}
		event.preventDefault();
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onBlurContextMenu(event) {
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onKeyDownContextMenu(event) {

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
	}

	////////////////////////////////////////////////////////////////////////////////////
	/////////////////// tree menu items
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeed(event) {
		handleTreeMenuActions(ContextAction.treeOpen);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedNewTab(event) {
		handleTreeMenuActions(ContextAction.treeOpenNewTab);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedNewWin(event) {
		handleTreeMenuActions(ContextAction.treeOpenNewWin);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedUrl(event) {
		handleTreeMenuActions(ContextAction.treeCopyUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function handleTreeMenuActions (menuAction) {

		let targetItem = elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {

			browser.bookmarks.get(targetItem.id).then((bookmarkItem) => {

				switch (menuAction) {
					case ContextAction.treeOpen:
						browser.tabs.update({ url: bookmarkItem[0].url });
						break;
						///////////////////////////////////////////

					case ContextAction.treeOpenNewTab:
						browser.tabs.create({ url: bookmarkItem[0].url });
						break;
						///////////////////////////////////////////

					case ContextAction.treeOpenNewWin:
						browser.windows.create({ url: bookmarkItem[0].url, type: "normal" });
						break;
						///////////////////////////////////////////

					case ContextAction.treeCopyUrl:
						lzUtil.copyTextToClipboard(document, bookmarkItem[0].url);
						break;
						///////////////////////////////////////////
				}
			});
		}
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	/////////////////// list menu items
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItem(event) {
		handleListMenuActions(ContextAction.listOpen);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItemNewTab(event) {
		handleListMenuActions(ContextAction.listOpenNewTab);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItemNewWin(event) {
		handleListMenuActions(ContextAction.listOpenNewWin);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedItemUrl(event) {
		handleListMenuActions(ContextAction.listCopyUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function handleListMenuActions(menuAction) {

		let targetItem = elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {

			let visitedUrl = true;
			let url = targetItem.getAttribute("href");

			switch (menuAction) {
				case ContextAction.listOpen:
					browser.tabs.update({ url: url });
					break;
					///////////////////////////////////////////

				case ContextAction.listOpenNewTab:
					browser.tabs.create({ url: url });
					break;
					///////////////////////////////////////////

				case ContextAction.listOpenNewWin:
					browser.windows.create({ url: url });
					break;
					///////////////////////////////////////////

				case ContextAction.listCopyUrl:
					lzUtil.copyTextToClipboard(document, url);
					visitedUrl = false;
					break;
					///////////////////////////////////////////
			}

			if(visitedUrl) {
				lzUtil.concatClassName(targetItem, "visited");
				lzUtil.addUrlToBrowserHistory(url, targetItem.textContent);
			}
		}
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function showMenuItemsByClassName (className) {

		elmContextMenu.querySelectorAll("." + className).forEach((item) => {
			item.style.display = "block";
		});	

		// hide the rest
		elmContextMenu.querySelectorAll(":not(." + className + ")").forEach((item) => {
			item.style.display = "none";
		});
	}
	
})();
