"use strict";

(function() {

	let ContextAction = Object.freeze({
		treeOpen:				1,
		treeOpenNewTab:			2,
		treeOpenNewWin:			3,
		treeOpenNewPrivateWin:	4,
		treeToggleReadUnread:	5,
		treeMarkAllRead:		6,
		treeMarkAllUnread:		7,
		treeNewFeed:			8,
		treeNewFolder:			9,
		treeCopyUrl:			10,
		treeDeleteTreeItem:		11,
		treeProperties:			12,
		treeSwitchDirection:	13,

		listOpen:				14,
		listOpenNewTab:			15,
		listOpenNewWin:			16,
		listOpenNewPrivateWin:	17,
		listOpenAllInTabs:		18,
		listToggleReadUnread:	19,
		listMarkAllRead:		20,
		listMarkAllUnread:		21,
		listCopyUrl:			22,
		listSwitchDirection:	23,
	});

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmContextMenu;
	let m_elmEventTarget;

	let m_currentContext = "";
	let m_bActivePanelOpened = false;
	let m_browserVersion;				// V64 RSS support dropped

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		// V64 RSS support dropped
		slUtil.getBrowserVersion().then((version) => {
			m_browserVersion = version;
		});

		m_elmSidebarBody = document.body;
		m_elmContextMenu = document.getElementById("mnuContextMenu");

		m_elmSidebarBody.addEventListener("contextmenu", onContextMenu);
		m_elmContextMenu.addEventListener("blur", onBlurContextMenu);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		closeContextMenu();

		m_elmSidebarBody.removeEventListener("contextmenu", onContextMenu);
		m_elmContextMenu.removeEventListener("blur", onBlurContextMenu);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeContextMenu() {

		m_elmContextMenu.style.display = "none";

		m_elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		m_elmContextMenu.removeEventListener("click", onClickContextMenuItem);

		if(m_bActivePanelOpened === false) {
			if(["treeitemcontext", "treecontext"].indexOf(m_currentContext) > -1) {
				rssTreeView.setFocus();
			} else if(["listitemcontext", "listcontext"].indexOf(m_currentContext) > -1) {
				rssListView.setFocus();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onContextMenu(event) {

		m_bActivePanelOpened = false;
		m_elmEventTarget = event.target;

		let showMenu = true;
		let trgClsList = m_elmEventTarget.classList;

		if (trgClsList.contains(slGlobals.CLS_RTV_LI_SUB_TREE)) {

			m_currentContext = "treeitemfoldercontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (trgClsList.contains(slGlobals.CLS_RTV_LI_TREE_ITEM)) {

			m_currentContext = "treeitemcontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (trgClsList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {

			m_currentContext = "listitemcontext";
			rssListView.setFeedItemSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.closest("#" + slGlobals.ID_UL_RSS_TREE_VIEW) !== null) {

			m_currentContext = "treecontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);	// select folder

		} else if (m_elmEventTarget.closest("#" + slGlobals.ID_UL_RSS_LIST_VIEW) !== null) {

			m_currentContext = "listcontext";

		} else {
			showMenu = false;
		}

		if (showMenu) {

			m_elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
			m_elmContextMenu.addEventListener("click", onClickContextMenuItem);

			showMenuItemsByClassName(m_currentContext);

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
		closeContextMenu();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownContextMenu(event) {

		event.preventDefault();

		let keyLowCase = event.key.toLowerCase();

		if(keyLowCase === "escape") {
			closeContextMenu();
			return;
		}

		if(m_currentContext === "treeitemfoldercontext") {
			switch (keyLowCase) {
				case "n":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "f":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "r":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "u":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "d":	handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "p":	handleTreeMenuActions(ContextAction.treeProperties);		break;
				case "s":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "treeitemcontext") {
			switch (keyLowCase) {
				case "o":	handleTreeMenuActions(ContextAction.treeOpen);				break;
				case "t":	handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
				case "w":	handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
				case "v":	handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
				case "g":	handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
				case "r":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "u":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "n":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "f":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "c":	handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
				case "d":	handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "p":	handleTreeMenuActions(ContextAction.treeProperties);		break;
				case "s":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "listitemcontext") {
			switch (keyLowCase) {
				case "o":	handleListMenuActions(ContextAction.listOpen);				break;
				case "t":	handleListMenuActions(ContextAction.listOpenNewTab);		break;
				case "w":	handleListMenuActions(ContextAction.listOpenNewWin);		break;
				case "v":	handleListMenuActions(ContextAction.listOpenNewPrivateWin);	break;
				case "a":	handleListMenuActions(ContextAction.listOpenAllInTabs);		break;
				case "g":	handleListMenuActions(ContextAction.listToggleReadUnread);	break;
				case "r":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "u":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "c":	handleListMenuActions(ContextAction.listCopyUrl);			break;
				case "s":	handleListMenuActions(ContextAction.listSwitchDirection);	break;
			}
		} else if(m_currentContext === "treecontext") {
			switch (keyLowCase) {
				case "r":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "u":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "s":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "listcontext") {
			switch (keyLowCase) {
				case "a":	handleListMenuActions(ContextAction.listOpenAllInTabs);		break;
				case "r":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "u":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "s":	handleListMenuActions(ContextAction.listSwitchDirection);	break;
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickContextMenuItem(event) {

		event.preventDefault();

		switch (event.target.id) {
			case "mnuTreeOpenFeed":						handleTreeMenuActions(ContextAction.treeOpen);				break;
			case "mnuTreeOpenFeedNewTab":				handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
			case "mnuTreeOpenFeedNewWin":				handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
			case "mnuTreeOpenFeedNewPrivateWin":		handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
			case "mnuTreeToggleFeedReadUnread":			handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
			case "mnuTreeMarkAllFeedsRead":				handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
			case "mnuTreeMarkAllFeedsUnread":			handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
			case "mnuTreeNewFeed":						handleTreeMenuActions(ContextAction.treeNewFeed);			break;
			case "mnuTreeNewFolder":					handleTreeMenuActions(ContextAction.treeNewFolder);			break;
			case "mnuTreeCopyFeedUrl":					handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
			case "mnuTreeDeleteTreeItem":				handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
			case "mnuTreeProperties":					handleTreeMenuActions(ContextAction.treeProperties);		break;
			case "mnuTreeSwitchDirection":				handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;

			case "mnuListOpenFeedItem":					handleListMenuActions(ContextAction.listOpen);				break;
			case "mnuListOpenFeedItemNewTab":			handleListMenuActions(ContextAction.listOpenNewTab);		break;
			case "mnuListOpenFeedItemNewWin":			handleListMenuActions(ContextAction.listOpenNewWin);		break;
			case "mnuListOpenFeedItemNewPrivateWin":	handleListMenuActions(ContextAction.listOpenNewPrivateWin);	break;
			case "mnuListOpenAllFeedItemsTabs":			handleListMenuActions(ContextAction.listOpenAllInTabs);		break;
			case "mnuListToggleFeedItemReadUnread":		handleListMenuActions(ContextAction.listToggleReadUnread);	break;
			case "mnuListMarkAllFeedItemsRead":			handleListMenuActions(ContextAction.listMarkAllRead);		break;
			case "mnuListMarkAllFeedItemsUnread":		handleListMenuActions(ContextAction.listMarkAllUnread);		break;
			case "mnuListCopyFeedItemUrl":				handleListMenuActions(ContextAction.listCopyUrl);			break;
			case "mnuListSwitchDirection":				handleListMenuActions(ContextAction.listSwitchDirection);	break;
		}
	}

	//==================================================================================
	//=== menu items handlers
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleTreeMenuActions(menuAction) {

		closeContextMenu();

		// do noting if no target element
		if (!m_elmEventTarget) return;

		let openPanelActions = [
			ContextAction.treeNewFeed,
			ContextAction.treeNewFolder,
			ContextAction.treeDeleteTreeItem,
			ContextAction.treeProperties,
		];

		if(openPanelActions.indexOf(menuAction) > -1 ) {
			m_bActivePanelOpened = true;
		}

		// V64 RSS support dropped
		let noSupportOpenRssFeedActions = [
			ContextAction.treeOpen,
			ContextAction.treeOpenNewTab,
			ContextAction.treeOpenNewWin,
			ContextAction.treeOpenNewPrivateWin,
		];

		let actionData = { url: "" };

		if(noSupportOpenRssFeedActions.indexOf(menuAction) > -1 && m_browserVersion >= "64") {
			actionData.url = getFeedPreviewUrl(m_elmEventTarget.getAttribute("href"));
		} else {
			actionData.url = m_elmEventTarget.getAttribute("href");
		}

		handleMenuActions(menuAction, actionData);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleListMenuActions(menuAction) {

		closeContextMenu();

		// do noting if no target element
		if (!m_elmEventTarget) return;

		let url = m_elmEventTarget.getAttribute("href");
		handleMenuActions(menuAction, { url: url });

		let openActions = [
			ContextAction.listOpen,
			ContextAction.listOpenNewTab,
			ContextAction.listOpenNewWin,
			ContextAction.listOpenNewPrivateWin
		];

		if(openActions.indexOf(menuAction) !== -1) {
			slUtil.addUrlToBrowserHistory(url, m_elmEventTarget.textContent).then(() => {
				rssListView.setItemRealVisitedState(m_elmEventTarget, url);
			});
		}
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

			case ContextAction.treeOpenNewPrivateWin:
			case ContextAction.listOpenNewPrivateWin:
				browser.windows.create({ url: actionData.url, type: "normal", incognito: true });
				break;
				///////////////////////////////////////////

			case ContextAction.treeToggleReadUnread:
				rssTreeView.toggleFeedVisitedState(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeMarkAllRead:
				rssTreeView.markAllFeedsAsVisitedState(true);
				break;
				///////////////////////////////////////////

			case ContextAction.treeMarkAllUnread:
				rssTreeView.markAllFeedsAsVisitedState(false);
				break;
				///////////////////////////////////////////

			case ContextAction.treeNewFeed:
				rssTreeView.openNewFeedProperties(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeNewFolder:
				rssTreeView.openNewFolderProperties(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeCopyUrl:
			case ContextAction.listCopyUrl:
				slUtil.copyTextToClipboard(actionData.url);
				break;
				///////////////////////////////////////////

			case ContextAction.treeDeleteTreeItem:
				rssTreeView.deleteTreeItem(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeProperties:
				if(m_currentContext === "treeitemcontext") {
					rssTreeView.openEditFeedProperties(m_elmEventTarget);
				} else if(m_currentContext === "treeitemfoldercontext") {
					rssTreeView.openEditFolderProperties(m_elmEventTarget);
				}
				break;
				///////////////////////////////////////////

			case ContextAction.treeSwitchDirection:
				rssTreeView.switchViewDirection();
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenAllInTabs:
				rssListView.openAllItemsInTabs();
				break;
				///////////////////////////////////////////

			case ContextAction.listToggleReadUnread:
				rssListView.toggleItemVisitedState(m_elmEventTarget);
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

			case ContextAction.listSwitchDirection:
				rssListView.switchViewDirection();
				break;
				///////////////////////////////////////////
		}
	}

	//==================================================================================
	//=== helpers
	//==================================================================================

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

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedPreviewUrl(url) {
		return browser.extension.getURL("/feedPreview/feedPreview.html?urlFeed=" + url);
	}

})();
