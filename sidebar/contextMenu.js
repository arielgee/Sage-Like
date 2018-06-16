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
		listToggleReadUnread: 10,
		listMarkAllRead: 11,
		listMarkAllUnread: 12,
		listCopyUrl: 13,
	});

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmContextMenu;

	let m_elmMnuTreeOpenFeed;
	let m_elmMnuTreeOpenFeedNewTab;
	let m_elmMnuTreeOpenFeedNewWin;
	let m_elmMnuTreeCopyFeedUrl;
	let m_elmMnuTreeDeleteFeed;
	let m_elmMnuTreeFeedProperties;

	let m_elmMnuListOpenFeedItem;
	let m_elmMnuListOpenFeedItemNewTab;
	let m_elmMnuListOpenFeedItemNewWin;
	let m_elmMnuListToggleFeedItemReadUnread;
	let m_elmMnuListMarkAllFeedItemsRead;
	let m_elmMnuListMarkAllFeedItemsUnread;
	let m_elmMnuListCopyFeedItemUrl;

	let m_bCurrentContext = "";

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmSidebarBody = document.body;
		m_elmContextMenu = document.getElementById("mnuContextMenu");

		m_elmMnuTreeOpenFeed = document.getElementById("mnuTreeOpenFeed")
		m_elmMnuTreeOpenFeedNewTab = document.getElementById("mnuTreeOpenFeedNewTab")
		m_elmMnuTreeOpenFeedNewWin = document.getElementById("mnuTreeOpenFeedNewWin")
		m_elmMnuTreeCopyFeedUrl = document.getElementById("mnuTreeCopyFeedUrl");
		m_elmMnuTreeDeleteFeed = document.getElementById("mnuTreeDeleteFeed");
		m_elmMnuTreeFeedProperties = document.getElementById("mnuTreeFeedProperties");

		m_elmMnuListOpenFeedItem = document.getElementById("mnuListOpenFeedItem");
		m_elmMnuListOpenFeedItemNewTab = document.getElementById("mnuListOpenFeedItemNewTab");
		m_elmMnuListOpenFeedItemNewWin = document.getElementById("mnuListOpenFeedItemNewWin");
		m_elmMnuListToggleFeedItemReadUnread = document.getElementById("mnuListToggleFeedItemReadUnread");
		m_elmMnuListMarkAllFeedItemsRead = document.getElementById("mnuListMarkAllFeedItemsRead");
		m_elmMnuListMarkAllFeedItemsUnread = document.getElementById("mnuListMarkAllFeedItemsUnread");
		m_elmMnuListCopyFeedItemUrl = document.getElementById("mnuListCopyFeedItemUrl");


		m_elmSidebarBody.addEventListener("contextmenu", onContextMenu);
		m_elmContextMenu.addEventListener("blur", onBlurContextMenu);
		m_elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);

		m_elmMnuTreeOpenFeed.addEventListener("click", onClickMenuOpenFeed);
		m_elmMnuTreeOpenFeedNewTab.addEventListener("click", onClickMenuOpenFeedNewTab);
		m_elmMnuTreeOpenFeedNewWin.addEventListener("click", onClickMenuOpenFeedNewWin);
		m_elmMnuTreeCopyFeedUrl.addEventListener("click", onClickMenuCopyFeedUrl);
		m_elmMnuTreeDeleteFeed.addEventListener("click", onClickMenuDeleteFeed);
		m_elmMnuTreeFeedProperties.addEventListener("click", onClickMenuFeedProperties);

		m_elmMnuListOpenFeedItem.addEventListener("click", onClickMenuOpenFeedItem);
		m_elmMnuListOpenFeedItemNewTab.addEventListener("click", onClickMenuOpenFeedItemNewTab);
		m_elmMnuListOpenFeedItemNewWin.addEventListener("click", onClickMenuOpenFeedItemNewWin);
		m_elmMnuListToggleFeedItemReadUnread.addEventListener("click", onClickMenuToggleFeedItemReadUnread);
		m_elmMnuListMarkAllFeedItemsRead.addEventListener("click", onClickMenuMarkAllFeedItemsRead);
		m_elmMnuListMarkAllFeedItemsUnread.addEventListener("click", onClickMenuMarkAllFeedItemsUnread);
		m_elmMnuListCopyFeedItemUrl.addEventListener("click", onClickMenuCopyFeedItemUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmSidebarBody.removeEventListener("contextmenu", onContextMenu);

		m_elmContextMenu.removeEventListener("blur", onBlurContextMenu);
		m_elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);

		m_elmMnuTreeOpenFeed.removeEventListener("click", onClickMenuOpenFeed);
		m_elmMnuTreeOpenFeedNewTab.removeEventListener("click", onClickMenuOpenFeedNewTab);
		m_elmMnuTreeOpenFeedNewWin.removeEventListener("click", onClickMenuOpenFeedNewWin);
		m_elmMnuTreeCopyFeedUrl.removeEventListener("click", onClickMenuCopyFeedUrl);
		m_elmMnuTreeDeleteFeed.removeEventListener("click", onClickMenuDeleteFeed);
		m_elmMnuTreeFeedProperties.removeEventListener("click", onClickMenuFeedProperties);

		m_elmMnuListOpenFeedItem.removeEventListener("click", onClickMenuOpenFeedItem);
		m_elmMnuListOpenFeedItemNewTab.removeEventListener("click", onClickMenuOpenFeedItemNewTab);
		m_elmMnuListOpenFeedItemNewWin.removeEventListener("click", onClickMenuOpenFeedItemNewWin);
		m_elmMnuListToggleFeedItemReadUnread.removeEventListener("click", onClickMenuToggleFeedItemReadUnread);
		m_elmMnuListMarkAllFeedItemsRead.removeEventListener("click", onClickMenuMarkAllFeedItemsRead);
		m_elmMnuListMarkAllFeedItemsUnread.removeEventListener("click", onClickMenuMarkAllFeedItemsUnread);
		m_elmMnuListCopyFeedItemUrl.removeEventListener("click", onClickMenuCopyFeedItemUrl);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onContextMenu(event) {

		let showMenu = true;
		let trgClsList = event.target.classList;

		if (trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED)) {

			m_bCurrentContext = "treecontext";
			showMenuItemsByClassName(m_bCurrentContext);
			rssTreeView.setFeedSelectionState(event.target);

		} else if (trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)) {

			m_bCurrentContext = "listcontext";
			showMenuItemsByClassName(m_bCurrentContext);
			rssListView.setFeedItemSelectionState(event.target);

		} else {
			showMenu = false;
		}

		if (showMenu) {
			m_elmContextMenu.elmTargetItem = event.target;

			let x = event.clientX;
			let y = event.clientY;

			// do it first so element will have dimentions (offsetWidth > 0)
			m_elmContextMenu.style.display = "block";

			if ((x + m_elmContextMenu.offsetWidth) > m_elmSidebarBody.offsetWidth) {
				x = m_elmSidebarBody.offsetWidth - m_elmContextMenu.offsetWidth;
			}

			if ((y + m_elmContextMenu.offsetHeight) > m_elmSidebarBody.offsetHeight) {
				y = m_elmSidebarBody.offsetHeight - m_elmContextMenu.offsetHeight;
			}

			m_elmContextMenu.style.left = x + "px";
			m_elmContextMenu.style.top = y + "px";

			m_elmContextMenu.focus();
		}
		event.preventDefault();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurContextMenu(event) {
		m_elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownContextMenu(event) {

		event.preventDefault();

		if(event.key.toLowerCase() === "escape") {
			m_elmContextMenu.style.display = "none";
			return;
		}

		if(m_bCurrentContext === "treecontext") {
			switch (event.key.toLowerCase()) {
				case "o":	handleTreeMenuActions(ContextAction.treeOpen);				break;
				case "t":	handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
				case "w":	handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
				case "c":	handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
				case "d":	handleTreeMenuActions(ContextAction.treeDeleteFeed);		break;
				case "p":	handleTreeMenuActions(ContextAction.treeFeedProperties);	break;
			}
		} else if(m_bCurrentContext === "listcontext") {
			switch (event.key.toLowerCase()) {
				case "o":	handleListMenuActions(ContextAction.listOpen);				break;
				case "t":	handleListMenuActions(ContextAction.listOpenNewTab);		break;
				case "w":	handleListMenuActions(ContextAction.listOpenNewWin);		break;
				case "g":	handleListMenuActions(ContextAction.listToggleReadUnread);	break;
				case "r":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "u":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "c":	handleListMenuActions(ContextAction.listCopyUrl);			break;
			}
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

		let targetItem = m_elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {
			handleMenuActions(menuAction, {
				id:  targetItem.id,
				url: targetItem.getAttribute("href"),
			});
		}
		m_elmContextMenu.style.display = "none";
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
	function onClickMenuToggleFeedItemReadUnread(event) {
		handleListMenuActions(ContextAction.listToggleReadUnread);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuMarkAllFeedItemsRead(event) {
		handleListMenuActions(ContextAction.listMarkAllRead);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuMarkAllFeedItemsUnread(event) {
		handleListMenuActions(ContextAction.listMarkAllUnread);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickMenuCopyFeedItemUrl(event) {
		handleListMenuActions(ContextAction.listCopyUrl);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleListMenuActions(menuAction) {

		let targetItem = m_elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {

			let url = targetItem.getAttribute("href");
			handleMenuActions(menuAction, { url: targetItem.getAttribute("href") });

			let openActions = [ContextAction.listOpen, ContextAction.listOpenNewTab, ContextAction.listOpenNewWin];

			if(openActions.indexOf(menuAction) !== -1) {
				slUtil.addUrlToBrowserHistory(url, targetItem.textContent).then(() => {
					rssListView.setItemRealVisitedState(targetItem, url);
				});
			}
		}
		m_elmContextMenu.style.display = "none";
	}

	//==================================================================================
	//=== helpers
	//==================================================================================

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
				rssTreeView.deleteFeed(m_elmContextMenu.elmTargetItem);
				break;
				///////////////////////////////////////////

			case ContextAction.treeFeedProperties:
				rssTreeView.openPropertiesView(m_elmContextMenu.elmTargetItem);
				break;
				///////////////////////////////////////////

			case ContextAction.listToggleReadUnread:
				rssListView.toggleItemVisitedState(m_elmContextMenu.elmTargetItem);
				break;
				///////////////////////////////////////////

			case ContextAction.listMarkAllRead:
				rssListView.markAllItemsAsVisitedState(true);
				break;
				///////////////////////////////////////////

			case ContextAction.listMarkAllUnread:
				rssListView.markAllItemsAsVisitedState(false);
				break;
				///////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showMenuItemsByClassName(className) {

		m_elmContextMenu.querySelectorAll("." + className).forEach((item) => {
			item.style.display = "block";
		});

		// hide the rest
		m_elmContextMenu.querySelectorAll(":not(." + className + ")").forEach((item) => {
			item.style.display = "none";
		});
	}

})();
