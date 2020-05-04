"use strict";

let contextMenu = (function() {

	let ContextAction = Object.freeze({
		treeOpen:				1,
		treeOpenNewTab:			2,
		treeOpenNewWin:			3,
		treeOpenNewPrivateWin:	4,
		treeOpenAllInTabs:		5,
		treeToggleReadUnread:	6,
		treeMarkAllRead:		7,
		treeMarkAllUnread:		8,
		treeNewFeed:			9,
		treeNewFolder:			10,
		treeCopyUrl:			11,
		treePasteUrl:			12,
		treeDeleteTreeItem:		13,
		treeProperties:			14,
		treeSwitchDirection:	15,

		listOpen:				16,
		listOpenNewTab:			17,
		listOpenNewWin:			18,
		listOpenNewPrivateWin:	19,
		listOpenAllInTabs:		20,
		listToggleReadUnread:	21,
		listMarkAllRead:		22,
		listMarkAllUnread:		23,
		listCopyUrl:			24,
		listSwitchDirection:	25,
	});

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmContextMenu;
	let m_elmEventTarget;

	let m_currentContext = "";
	let m_bActivePanelOpened = false;
	let m_isContextMenuOpen = false;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

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
	function close() {
		if(isOpen()) {
			closeContextMenu();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return m_isContextMenuOpen;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeContextMenu() {

		m_elmContextMenu.style.display = "none";

		m_elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		m_elmContextMenu.removeEventListener("click", onClickContextMenuItem);

		if(m_bActivePanelOpened === false) {
			if(["treeitemfoldercontext", "treeitemcontext", "treecontext"].includes(m_currentContext)) {
				rssTreeView.setFocus();
			} else if(["listitemcontext", "listcontext"].includes(m_currentContext)) {
				rssListView.setFocus();
			}
		}

		m_isContextMenuOpen = false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onContextMenu(event) {

		event.preventDefault();

		// don't show menu if tree has issues
		if ( !rssTreeView.isRssTreeCreatedOK() ) {
			browser.runtime.openOptionsPage();
			return;
		}

		m_bActivePanelOpened = false;
		m_elmEventTarget = event.target;

		let showMenu = true;

		if (TreeItemType.isFolder(m_elmEventTarget)) {

			m_currentContext = "treeitemfoldercontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (TreeItemType.isFeed(m_elmEventTarget)) {

			m_currentContext = "treeitemcontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {

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
			m_isContextMenuOpen = true;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurContextMenu(event) {
		closeContextMenu();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownContextMenu(event) {

		event.preventDefault();

		let keyCode = event.code;

		if(keyCode === "Escape") {
			closeContextMenu();
			return;
		}

		if(m_currentContext === "treeitemfoldercontext") {
			switch (keyCode) {
				case "KeyN":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyS":	handleTreeMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyA":	handleTreeMenuActions(ContextAction.treeOpenAllInTabs);		break;
				case "KeyG":	handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
				case "KeyR":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyD":	handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "KeyP":	handleTreeMenuActions(ContextAction.treeProperties);		break;
				case "KeyI":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "treeitemcontext") {
			switch (keyCode) {
				case "KeyO":	handleTreeMenuActions(ContextAction.treeOpen);				break;
				case "KeyT":	handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
				case "KeyW":	handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
				case "KeyV":	handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
				case "KeyG":	handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
				case "KeyR":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyN":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyC":	handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
				case "KeyS":	handleTreeMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyD":	handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "KeyP":	handleTreeMenuActions(ContextAction.treeProperties);		break;
				case "KeyI":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "listitemcontext") {
			switch (keyCode) {
				case "KeyO":	handleListMenuActions(ContextAction.listOpen);				break;
				case "KeyT":	handleListMenuActions(ContextAction.listOpenNewTab);		break;
				case "KeyW":	handleListMenuActions(ContextAction.listOpenNewWin);		break;
				case "KeyV":	handleListMenuActions(ContextAction.listOpenNewPrivateWin);	break;
				case "KeyA":	handleListMenuActions(ContextAction.listOpenAllInTabs);		break;
				case "KeyG":	handleListMenuActions(ContextAction.listToggleReadUnread);	break;
				case "KeyR":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "KeyU":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "KeyC":	handleListMenuActions(ContextAction.listCopyUrl);			break;
				case "KeyI":	handleListMenuActions(ContextAction.listSwitchDirection);	break;
			}
		} else if(m_currentContext === "treecontext") {
			switch (keyCode) {
				case "KeyR":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyN":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyS":	handleTreeMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyI":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "listcontext") {
			switch (keyCode) {
				case "KeyA":	handleListMenuActions(ContextAction.listOpenAllInTabs);		break;
				case "KeyR":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "KeyU":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "KeyI":	handleListMenuActions(ContextAction.listSwitchDirection);	break;
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
			case "mnuTreeOpenAllFeedsInNewTabs":		handleTreeMenuActions(ContextAction.treeOpenAllInTabs);		break;
			case "mnuTreeToggleFeedReadUnread":			handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
			case "mnuTreeMarkAllFeedsRead":				handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
			case "mnuTreeMarkAllFeedsUnread":			handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
			case "mnuTreeNewFeed":						handleTreeMenuActions(ContextAction.treeNewFeed);			break;
			case "mnuTreeNewFolder":					handleTreeMenuActions(ContextAction.treeNewFolder);			break;
			case "mnuTreeCopyFeedUrl":					handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
			case "mnuTreePasteFeedUrl":					handleTreeMenuActions(ContextAction.treePasteUrl);			break;
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

		if(openPanelActions.includes(menuAction)) {
			m_bActivePanelOpened = true;
		}

		// V64 RSS support dropped
		let noSupportOpenRssFeedActions = [
			ContextAction.treeOpen,
			ContextAction.treeOpenNewTab,
			ContextAction.treeOpenNewWin,
			ContextAction.treeOpenNewPrivateWin,
			ContextAction.treeOpenAllInTabs,
		];

		let actionData = { url: "" };

		if(noSupportOpenRssFeedActions.includes(menuAction)) {
			actionData.url = slUtil.getFeedPreviewUrl(m_elmEventTarget.getAttribute("href"));
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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleMenuActions(menuAction, actionData) {

		switch (menuAction) {

			case ContextAction.treeOpen:
				browser.tabs.update({ url: actionData.url });
				break;
				///////////////////////////////////////////

			case ContextAction.listOpen:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewTab:
				browser.tabs.create({ url: actionData.url });
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewTab:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewWin:
				browser.windows.create({ url: actionData.url, type: "normal" });
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewWin:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_WIN);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewPrivateWin:
				browser.windows.create({ url: actionData.url, type: "normal", incognito: true })
					.catch((error) => messageView.open(slUtil.incognitoErrorMessage(error)) );
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewPrivateWin:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_PRIVATE_WIN);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenAllInTabs:
				rssTreeView.openAllFeedsInTabs(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeToggleReadUnread:
				rssTreeView.toggleVisitedState(m_elmEventTarget);
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
				slUtil.writeTextToClipboard(actionData.url);
				break;
				///////////////////////////////////////////

			case ContextAction.treePasteUrl:
				rssTreeView.pasteFeedUrlFromClipboard(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeDeleteTreeItem:
				rssTreeView.deleteTreeItem(m_elmEventTarget);
				break;
				///////////////////////////////////////////

			case ContextAction.treeProperties:
				rssTreeView.openEditTreeItemProperties(m_elmEventTarget);
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

		m_elmContextMenu.classList.remove("treeitemfoldercontext", "treeitemcontext", "listitemcontext", "treecontext", "listcontext");
		m_elmContextMenu.classList.add(className);
	}

	return {
		close: close,
		isOpen: isOpen,
	};

})();
