"use strict";

(function() {

	let ContextAction = Object.freeze({
		treeOpen: 1,
		treeOpenNewTab: 2,
		treeOpenNewWin: 3,
		treeCopyUrl: 4,
		treeDeleteFeed: 5,
		treeFeedProperties: 6,

		listOpen: 7,
		listOpenNewTab: 8,
		listOpenNewWin: 9,
		listCopyUrl: 10,		
	});

	let elmSidebarBody;
	let elmContextMenu;

	let elmMnuTreeOpenFeed;
	let elmMnuTreeOpenFeedNewTab;
	let elmMnuTreeOpenFeedNewWin;
	let elmMnuTreeCopyFeedUrl;
	let elmMnuTreeDeleteFeed;
	let elmMnuTreeFeedProperties;

	let elmMnuListOpenFeedItem;
	let elmMnuListOpenFeedItemNewTab;
	let elmMnuListOpenFeedItemNewWin;
	let elmMnuListCopyFeedItemUrl;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		elmSidebarBody = document.body;
		elmContextMenu = document.getElementById("mnuContextMenu");

		elmMnuTreeOpenFeed = document.getElementById("mnuTreeOpenFeed")
		elmMnuTreeOpenFeedNewTab = document.getElementById("mnuTreeOpenFeedNewTab")
		elmMnuTreeOpenFeedNewWin = document.getElementById("mnuTreeOpenFeedNewWin")
		elmMnuTreeCopyFeedUrl = document.getElementById("mnuTreeCopyFeedUrl");
		elmMnuTreeDeleteFeed = document.getElementById("mnuTreeDeleteFeed");
		elmMnuTreeFeedProperties = document.getElementById("mnuTreeFeedProperties");

		elmMnuListOpenFeedItem = document.getElementById("mnuListOpenFeedItem");
		elmMnuListOpenFeedItemNewTab = document.getElementById("mnuListOpenFeedItemNewTab");
		elmMnuListOpenFeedItemNewWin = document.getElementById("mnuListOpenFeedItemNewWin");
		elmMnuListCopyFeedItemUrl = document.getElementById("mnuListCopyFeedItemUrl");


		elmSidebarBody.addEventListener("contextmenu", onContextMenu);
		elmContextMenu.addEventListener("blur", onBlurContextMenu);
		elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);

		elmMnuTreeOpenFeed.addEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.addEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.addEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.addEventListener("click", onClickMenuCopyFeedUrl);
		elmMnuTreeDeleteFeed.addEventListener("click", onClickMenuDeleteFeed);
		elmMnuTreeFeedProperties.addEventListener("click", onClickMenuFeedProperties);

		elmMnuListOpenFeedItem.addEventListener("click", onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.addEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.addEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.addEventListener("click", onClickMenuCopyFeedItemUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		elmSidebarBody.removeEventListener("contextmenu", onContextMenu);

		elmContextMenu.removeEventListener("blur", onBlurContextMenu);
		elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);

		elmMnuTreeOpenFeed.removeEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.removeEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.removeEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.removeEventListener("click", onClickMenuCopyFeedUrl);
		elmMnuTreeDeleteFeed.removeEventListener("click", onClickMenuDeleteFeed);
		elmMnuTreeFeedProperties.removeEventListener("click", onClickMenuFeedProperties);

		elmMnuListOpenFeedItem.removeEventListener("click", onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.removeEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.removeEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.removeEventListener("click", onClickMenuCopyFeedItemUrl);


		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
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
	function onBlurContextMenu(event) {
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
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

	//==================================================================================
	//=== tree menu items
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeed(event) {
		handleTreeMenuActions(ContextAction.treeOpen);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeedNewTab(event) {
		handleTreeMenuActions(ContextAction.treeOpenNewTab);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeedNewWin(event) {
		handleTreeMenuActions(ContextAction.treeOpenNewWin);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuCopyFeedUrl(event) {
		handleTreeMenuActions(ContextAction.treeCopyUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuDeleteFeed(event) {
		handleTreeMenuActions(ContextAction.treeDeleteFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuFeedProperties(event) {
		handleTreeMenuActions(ContextAction.treeFeedProperties);
	}
	

	////////////////////////////////////////////////////////////////////////////////////
	function handleTreeMenuActions(menuAction) {

		let targetItem = elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {
			handleMenuActions(menuAction, {
				id:  targetItem.id,
				url: targetItem.getAttribute("href"),
			});
		}
		elmContextMenu.style.display = "none";
	}

	//==================================================================================
	//=== list menu items
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeedItem(event) {
		handleListMenuActions(ContextAction.listOpen);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeedItemNewTab(event) {
		handleListMenuActions(ContextAction.listOpenNewTab);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuOpenFeedItemNewWin(event) {
		handleListMenuActions(ContextAction.listOpenNewWin);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuCopyFeedItemUrl(event) {
		handleListMenuActions(ContextAction.listCopyUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleListMenuActions(menuAction) {

		let targetItem = elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {

			let url = targetItem.getAttribute("href");
			handleMenuActions(menuAction, { url: targetItem.getAttribute("href") });

			if(menuAction !== ContextAction.listCopyUrl) {
				targetItem.classList.add("visited");
				slUtil.addUrlToBrowserHistory(url, targetItem.textContent);
			}
		}
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleMenuActions(menuAction, actionData) {

		switch (menuAction) {

			case ContextAction.treeOpen:
			case ContextAction.listOpen:
				browser.tabs.update({ url: actionData.url });
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewTab:
			case ContextAction.listOpenNewTab:
				browser.tabs.create({ url: actionData.url });
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewWin:
			case ContextAction.listOpenNewWin:
				browser.windows.create({ url: actionData.url, type: "normal" });
				break;
				///////////////////////////////////////////

			case ContextAction.treeCopyUrl:
			case ContextAction.listCopyUrl:
				slUtil.copyTextToClipboard(document, actionData.url);
				break;
				///////////////////////////////////////////

			case ContextAction.treeDeleteFeed:
				rssTreeView.deleteFeed(elmContextMenu.elmTargetItem);
				break;
				///////////////////////////////////////////	

			case ContextAction.treeFeedProperties:
				feedPropertiesView.open();
				break;
				///////////////////////////////////////////
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	function showMenuItemsByClassName(className) {

		elmContextMenu.querySelectorAll("." + className).forEach((item) => {
			item.style.display = "block";
		});	

		// hide the rest
		elmContextMenu.querySelectorAll(":not(." + className + ")").forEach((item) => {
			item.style.display = "none";
		});
	}
	
})();
