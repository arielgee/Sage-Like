"use strict";

(function() {

	let ContextAction = Object.freeze({
		treeOpen: 1,
		treeOpenNewTab: 2,
		treeOpenNewWin: 3,
		treeOpenNewPrivateWin: 4,
		treeCopyUrl: 5,
		treeDeleteFeed: 6,
		treeFeedProperties: 7,

		listOpen: 8,
		listOpenNewTab: 9,
		listOpenNewWin: 10,
		listOpenNewPrivateWin: 11,
		listToggleReadUnread: 12,
		listMarkAllRead: 13,
		listMarkAllUnread: 14,
		listCopyUrl: 153,
	});

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmContextMenu;

	let m_bCurrentContext = "";

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmSidebarBody = document.body;
		m_elmContextMenu = document.getElementById("mnuContextMenu");

		m_elmSidebarBody.addEventListener("contextmenu", onContextMenu);
		m_elmContextMenu.addEventListener("blur", onBlurContextMenu);
		m_elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
		mnuContextMenu.addEventListener("click", onClickContextMenuItem);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmSidebarBody.removeEventListener("contextmenu", onContextMenu);
		m_elmContextMenu.removeEventListener("blur", onBlurContextMenu);
		m_elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		mnuContextMenu.removeEventListener("click", onClickContextMenuItem);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onContextMenu(event) {

		let showMenu = true;
		let trgClsList = event.target.classList;

		if (trgClsList.contains(slGlobalConsts.CLS_LI_RSS_TREE_FEED)) {

			m_bCurrentContext = "treecontext";
			rssTreeView.setFeedSelectionState(event.target);

		} else if (trgClsList.contains(slGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)) {

			m_bCurrentContext = "listcontext";
			rssListView.setFeedItemSelectionState(event.target);

		} else {
			showMenu = false;
		}

		if (showMenu) {

			showMenuItemsByClassName(m_bCurrentContext);

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
				case "v":	handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
				case "c":	handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
				case "d":	handleTreeMenuActions(ContextAction.treeDeleteFeed);		break;
				case "p":	handleTreeMenuActions(ContextAction.treeFeedProperties);	break;
			}
		} else if(m_bCurrentContext === "listcontext") {
			switch (event.key.toLowerCase()) {
				case "o":	handleListMenuActions(ContextAction.listOpen);				break;
				case "t":	handleListMenuActions(ContextAction.listOpenNewTab);		break;
				case "w":	handleListMenuActions(ContextAction.listOpenNewWin);		break;
				case "v":	handleListMenuActions(ContextAction.listOpenNewPrivateWin);	break;
				case "g":	handleListMenuActions(ContextAction.listToggleReadUnread);	break;
				case "r":	handleListMenuActions(ContextAction.listMarkAllRead);		break;
				case "u":	handleListMenuActions(ContextAction.listMarkAllUnread);		break;
				case "c":	handleListMenuActions(ContextAction.listCopyUrl);			break;
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
			case "mnuTreeCopyFeedUrl":					handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
			case "mnuTreeDeleteFeed":					handleTreeMenuActions(ContextAction.treeDeleteFeed);		break;
			case "mnuTreeFeedProperties":				handleTreeMenuActions(ContextAction.treeFeedProperties);	break;
			case "mnuListOpenFeedItem":					handleListMenuActions(ContextAction.listOpen);				break;
			case "mnuListOpenFeedItemNewTab":			handleListMenuActions(ContextAction.listOpenNewTab);		break;
			case "mnuListOpenFeedItemNewWin":			handleListMenuActions(ContextAction.listOpenNewWin);		break;
			case "mnuListOpenFeedItemNewPrivateWin":	handleListMenuActions(ContextAction.listOpenNewPrivateWin);	break;
			case "mnuListToggleFeedItemReadUnread":		handleListMenuActions(ContextAction.listToggleReadUnread);	break;
			case "mnuListMarkAllFeedItemsRead":			handleListMenuActions(ContextAction.listMarkAllRead);		break;
			case "mnuListMarkAllFeedItemsUnread":		handleListMenuActions(ContextAction.listMarkAllUnread);		break;
			case "mnuListCopyFeedItemUrl":				handleListMenuActions(ContextAction.listCopyUrl);			break;
		}
	}

	//==================================================================================
	//=== menu items handlers
	//==================================================================================

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

	////////////////////////////////////////////////////////////////////////////////////
	function handleListMenuActions(menuAction) {

		let targetItem = m_elmContextMenu.elmTargetItem;

		if (targetItem !== undefined && targetItem !== null) {

			let url = targetItem.getAttribute("href");
			handleMenuActions(menuAction, { url: targetItem.getAttribute("href") });

			let openActions = [
				ContextAction.listOpen,
				ContextAction.listOpenNewTab,
				ContextAction.listOpenNewWin,
				ContextAction.listOpenNewPrivateWin
			];

			if(openActions.indexOf(menuAction) !== -1) {
				slUtil.addUrlToBrowserHistory(url, targetItem.textContent).then(() => {
					rssListView.setItemRealVisitedState(targetItem, url);
				});
			}
		}
		m_elmContextMenu.style.display = "none";
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

})();
