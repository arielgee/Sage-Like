"use strict";

let contextMenu = (function() {

	const ContextAction = Object.freeze({
		treeOpen:				1,
		treeOpenNewTab:			2,
		treeOpenNewWin:			3,
		treeOpenNewPrivateWin:	4,
		treeOpenAllInTabs:		5,
		treeSigninFeed:			6,
		treeToggleReadUnread:	7,
		treeMarkAllRead:		8,
		treeMarkAllUnread:		9,
		treeNewFeed:			10,
		treeNewFolder:			11,
		treeCopyUrl:			12,
		treePasteUrl:			13,
		treeDeleteTreeItem:		14,
		treeProperties:			15,
		treeSummary:			16,
		treeSwitchDirection:	17,

		listOpen:				18,
		listOpenNewTab:			19,
		listOpenNewWin:			20,
		listOpenNewPrivateWin:	21,
		listOpenAllInTabs:		22,
		listToggleReadUnread:	23,
		listMarkAllRead:		24,
		listMarkAllUnread:		25,
		listCopyUrl:			26,
		listSwitchDirection:	27,
	});

	const OpenPanelActions = [
		ContextAction.treeSigninFeed,
		ContextAction.treeNewFeed,
		ContextAction.treeNewFolder,
		ContextAction.treeDeleteTreeItem,
		ContextAction.treeProperties,
		ContextAction.treeSummary,
	];

	const OpenInFeedPreviewActions = [
		ContextAction.treeOpen,
		ContextAction.treeOpenNewTab,
		ContextAction.treeOpenNewWin,
		ContextAction.treeOpenNewPrivateWin,
		// ContextAction.treeOpenAllInTabs,	// Calls rssTreeView.openAllFeedsInTabs() so url is handled there
	];

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmContextMenu;
	let m_elmEventTarget;

	let m_currentContext = "";
	let m_bActivePanelOpened = false;
	let m_isContextMenuOpen = false;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmSidebarBody = document.body;
		m_elmContextMenu = document.getElementById("mnuContextMenu");

		m_elmSidebarBody.addEventListener("contextmenu", onContextMenu);

		initializeMenu();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		closeContextMenu();

		m_elmSidebarBody.removeEventListener("contextmenu", onContextMenu);

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

		m_elmContextMenu.removeEventListener("mousemove", onMouseMoveContextMenu);
		m_elmContextMenu.removeEventListener("blur", onBlurContextMenu, true);
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

		m_elmEventTarget = event.target;

		// show default context menu for text inputs
		if(m_elmEventTarget.tagName === "INPUT" && ["text", "password"].includes(m_elmEventTarget.type.toLowerCase()))
			return;

		event.preventDefault();

		// don't show menu if tree has issues
		if ( !rssTreeView.isRssTreeCreatedOK() ) {
			browser.runtime.openOptionsPage();
			return;
		}

		m_bActivePanelOpened = false;

		let showMenu = true;

		if (TreeItemType.isFolder(m_elmEventTarget)) {

			m_currentContext = "treeitemfoldercontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (TreeItemType.isFeed(m_elmEventTarget)) {

			m_currentContext = "treeitemcontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {

			m_currentContext = "listitemcontext";
			rssListView.setFeedItemSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.closest("#" + Global.ID_UL_RSS_TREE_VIEW) !== null) {

			m_currentContext = "treecontext";
			rssTreeView.setFeedSelectionState(m_elmEventTarget);	// select folder

		} else if (m_elmEventTarget.closest("#" + Global.ID_UL_RSS_LIST_VIEW) !== null) {

			m_currentContext = "listcontext";

		} else {
			showMenu = false;
		}

		if (showMenu) {

			m_elmContextMenu.addEventListener("mousemove", onMouseMoveContextMenu);
			m_elmContextMenu.addEventListener("blur", onBlurContextMenu, true);
			m_elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
			m_elmContextMenu.addEventListener("click", onClickContextMenuItem);

			showMenuItemsByClassName(m_currentContext, m_elmEventTarget.classList);

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

			let item = m_elmContextMenu.querySelector(".contextmenuitem." + m_currentContext);	// first visible items
			if(!!item) {
				item.focus();
			} else {
				m_elmContextMenu.focus();
			}
			m_isContextMenuOpen = true;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveContextMenu(event) {
		if(event.target.classList.contains("contextmenuitem")) {
			event.target.focus();
		} else {
			m_elmContextMenu.focus();	// move focus to parent (may be an <hr> line)
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurContextMenu(event) {
		// close menu if focus is outside the context menu
		if( !!!event.relatedTarget || !!!event.relatedTarget.closest(".contextmenu") ) {
			closeContextMenu();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownContextMenu(event) {

		let elm, keyCode = event.code;

		// The 'Sign in...' menu item (acceleratorKey:'L') is an oddball. Its visibility depends not only on the
		// element context (tree feed item) but also on the element's state (unauthorized). So in order to prevent
		// the context menu from being closed (from handleTreeMenuActions()), as if some action is being performed,
		// exit here when its acceleratorKey is pressed and the 'Sign in...' menu item is not relevent.
		if((keyCode === "KeyL") && (m_currentContext === "treeitemcontext") && !TreeItemType.isUnauthorized(m_elmEventTarget)) {
			return;
		}

		event.preventDefault();

		switch(keyCode) {

			case "ArrowUp":
				elm = event.target;
				while( !!(elm = elm.previousElementSibling) ) {
					if( !!elm.offsetParent && elm.classList.contains("contextmenuitem") ) {		// visible menu item
						elm.focus();
						break;
					}
				}
				if(!!!elm) {
					elm = m_elmContextMenu.lastElementChild;
					do {
						if( !!elm.offsetParent && elm.classList.contains("contextmenuitem") ) {
							elm.focus();
							break;
						}
					} while(!!(elm = elm.previousElementSibling));
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				elm = event.target;
				while( !!(elm = elm.nextElementSibling) ) {
					if( !!elm.offsetParent && elm.classList.contains("contextmenuitem") ) {
						elm.focus();
						break;
					}
				}
				if(!!!elm) {
					elm = m_elmContextMenu.firstElementChild;
					do {
						if( !!elm.offsetParent && elm.classList.contains("contextmenuitem") ) {
							elm.focus();
							break;
						}
					} while(!!(elm = elm.nextElementSibling));
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Enter":
			case "NumpadEnter":
				handleMenuItemsAction(event.target.id);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Escape":
				closeContextMenu();
				break;
				/////////////////////////////////////////////////////////////////////////
		}

		// if key was handled then no need to continue
		if(["ArrowUp", "ArrowDown", "Enter", "NumpadEnter", "Escape"].includes(keyCode)) return;

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
				case "KeyM":	handleTreeMenuActions(ContextAction.treeSummary);			break;
				case "KeyI":	handleTreeMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "treeitemcontext") {
			switch (keyCode) {
				case "KeyO":	handleTreeMenuActions(ContextAction.treeOpen);				break;
				case "KeyT":	handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
				case "KeyW":	handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
				case "KeyV":	handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
				case "KeyL":	handleTreeMenuActions(ContextAction.treeSigninFeed);		break;
				case "KeyG":	handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
				case "KeyR":	handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyN":	handleTreeMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleTreeMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyC":	handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
				case "KeyS":	handleTreeMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyD":	handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "KeyP":	handleTreeMenuActions(ContextAction.treeProperties);		break;
				case "KeyM":	handleTreeMenuActions(ContextAction.treeSummary);			break;
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
				case "KeyM":	handleTreeMenuActions(ContextAction.treeSummary);			break;
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

		handleMenuItemsAction(event.target.id);
	}

	//==================================================================================
	//=== menu items handlers
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleMenuItemsAction(menuId) {

		switch (menuId) {
			case "mnuTreeOpenFeed":						handleTreeMenuActions(ContextAction.treeOpen);				break;
			case "mnuTreeOpenFeedNewTab":				handleTreeMenuActions(ContextAction.treeOpenNewTab);		break;
			case "mnuTreeOpenFeedNewWin":				handleTreeMenuActions(ContextAction.treeOpenNewWin);		break;
			case "mnuTreeOpenFeedNewPrivateWin":		handleTreeMenuActions(ContextAction.treeOpenNewPrivateWin);	break;
			case "mnuTreeOpenAllFeedsInNewTabs":		handleTreeMenuActions(ContextAction.treeOpenAllInTabs);		break;
			case "mnuTreeSigninFeed":					handleTreeMenuActions(ContextAction.treeSigninFeed);		break;
			case "mnuTreeToggleFeedReadUnread":			handleTreeMenuActions(ContextAction.treeToggleReadUnread);	break;
			case "mnuTreeMarkAllFeedsRead":				handleTreeMenuActions(ContextAction.treeMarkAllRead);		break;
			case "mnuTreeMarkAllFeedsUnread":			handleTreeMenuActions(ContextAction.treeMarkAllUnread);		break;
			case "mnuTreeNewFeed":						handleTreeMenuActions(ContextAction.treeNewFeed);			break;
			case "mnuTreeNewFolder":					handleTreeMenuActions(ContextAction.treeNewFolder);			break;
			case "mnuTreeCopyFeedUrl":					handleTreeMenuActions(ContextAction.treeCopyUrl);			break;
			case "mnuTreePasteFeedUrl":					handleTreeMenuActions(ContextAction.treePasteUrl);			break;
			case "mnuTreeDeleteTreeItem":				handleTreeMenuActions(ContextAction.treeDeleteTreeItem);	break;
			case "mnuTreeProperties":					handleTreeMenuActions(ContextAction.treeProperties);		break;
			case "mnuTreeSummary":						handleTreeMenuActions(ContextAction.treeSummary);			break;
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

	////////////////////////////////////////////////////////////////////////////////////
	function handleTreeMenuActions(menuAction) {

		closeContextMenu();

		// do noting if no target element
		if (!m_elmEventTarget) return;

		if(OpenPanelActions.includes(menuAction)) {
			m_bActivePanelOpened = true;
		}

		const actionData = { url: "" };

		if(OpenInFeedPreviewActions.includes(menuAction)) {
			actionData.url = slUtil.getFeedPreviewUrl(m_elmEventTarget.getAttribute("href"), Global.FEED_PREVIEW_REQ_SOURCE.RSS_TREE_VIEW);
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

		const url = m_elmEventTarget.getAttribute("href");
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
					.catch((error) => messageView.open({ text: slUtil.incognitoErrorMessage(error) }) );
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

			case ContextAction.treeSigninFeed:
				rssTreeView.signinFeed(m_elmEventTarget);
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

			case ContextAction.treeSummary:
				rssTreeView.openTreeSummary();
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
	function initializeMenu() {

		const items = m_elmContextMenu.querySelectorAll('.contextmenuitem');

		let item, shortcutKey, acceleratorKey;
		let text, index;
		let before, key, after;
		let elmWrapper, elmAcceleratorKey, elmU;

		for(let i=0, len=items.length; i<len; ++i) {

			item = items[i];
			text = item.textContent;
			elmWrapper = document.createElement("div");

			shortcutKey = item.getAttribute("data-shortcut-key");
			if(!!shortcutKey) {

				// prefer uppercase match
				index = text.indexOf(shortcutKey.toUpperCase()) || text.toLowerCase().indexOf(shortcutKey.toLowerCase());

				if(index > -1) {

					before = text.substring(0, index);
					key = text.charAt(index);
					after = text.substring(index + 1);

					if(!!before) {
						elmWrapper.appendChild(document.createTextNode(before));
					}

					elmU = document.createElement("u");
					elmU.textContent = key;
					elmWrapper.appendChild(elmU);

					if(!!after) {
						elmWrapper.appendChild(document.createTextNode(after));
					}
				} else {
					elmWrapper.textContent = text;
				}
			} else {
				elmWrapper.textContent = text;
			}
			item.textContent = "";
			item.appendChild(elmWrapper);

			acceleratorKey = item.getAttribute("data-accelerator-key");
			if(!!acceleratorKey) {
				elmAcceleratorKey = document.createElement("div");
				elmAcceleratorKey.className = "acceleratorKey";
				elmAcceleratorKey.textContent = acceleratorKey;
				item.appendChild(elmAcceleratorKey);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showMenuItemsByClassName(className, targetClassList) {

		m_elmContextMenu.classList.remove("treeitemfoldercontext", "treeitemcontext", "listitemcontext", "treecontext", "listcontext", "treeitemunauthorizedcontext");
		if(targetClassList.contains("unauthorized")) {
			m_elmContextMenu.classList.add(className, "treeitemunauthorizedcontext");
		} else {
			m_elmContextMenu.classList.add(className);
		}
	}

	return {
		close: close,
		isOpen: isOpen,
	};

})();
