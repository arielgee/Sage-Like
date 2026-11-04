"use strict";

const contextMenu = (function() {

	const ContextAction = Object.freeze({
		treeOpen:					1,
		treeOpenNewTab:				2,
		treeOpenNewContainerTab:	3,
		treeOpenNewWin:				4,
		treeOpenNewPrivateWin:		5,
		treeOpenAllInTabs:			6,
		treeSigninFeed:				7,
		treeToggleReadUnread:		8,
		treeMarkAllRead:			9,
		treeMarkAllUnread:			10,
		treeNewFeed:				11,
		treeNewFolder:				12,
		treeCopyUrl:				13,
		treePasteUrl:				14,
		treeDeleteTreeItem:			15,
		treeProperties:				16,
		treeSummary:				17,
		treeSwitchDirection:		18,

		listOpen:					19,
		listOpenNewTab:				20,
		listOpenNewReaderTab:		21,
		listOpenNewContainerTab:	22,
		listOpenNewWin:				23,
		listOpenNewPrivateWin:		24,
		listOpenAllInTabs:			25,
		listToggleReadUnread:		26,
		listMarkAllRead:			27,
		listMarkAllUnread:			28,
		listCopyUrl:				29,
		listSwitchDirection:		30,
	});

	const OpenPanelActions = [
		ContextAction.treeOpenNewContainerTab,
		ContextAction.treeSigninFeed,
		ContextAction.treeNewFeed,
		ContextAction.treeNewFolder,
		ContextAction.treeDeleteTreeItem,
		ContextAction.treeProperties,
		ContextAction.treeSummary,
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
	let m_userHiddenItems = [];
	let m_elmOpenedSubmenu = null;
	let m_subMenuCloseTimer = null;
	let m_isRTL = null;

	////////////////////////////////////////////////////////////////////////////////////
	function initialize() {

		m_elmSidebarBody = document.body;
		m_elmContextMenu = document.getElementById("mnuContextMenu");

		initializeHTML();

		m_elmSidebarBody.addEventListener("contextmenu", onContextMenu);
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

		closeSubMenu();

		m_elmContextMenu.removeEventListener("mousemove", onMouseMoveContextMenu);
		m_elmContextMenu.removeEventListener("blur", onBlurContextMenu, true);
		m_elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		m_elmContextMenu.removeEventListener("click", onClickContextMenuItem);

		if(m_bActivePanelOpened === false) {
			if(["tree-item-folder-ctx", "tree-item-ctx", "tree-ctx"].includes(m_currentContext)) {
				rssTreeView.setFocus();
			} else if(["list-item-ctx", "list-ctx"].includes(m_currentContext)) {
				rssListView.setFocus();
			}
		}

		m_isContextMenuOpen = false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onContextMenu(event) {

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
		m_isRTL = getComputedStyle(m_elmSidebarBody).direction === "rtl";

		if (TreeItemType.isFolder(m_elmEventTarget)) {

			m_currentContext = "tree-item-folder-ctx";
			m_userHiddenItems = await prefs.getTreeCtxMnuHiddenItems();
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (TreeItemType.isFeed(m_elmEventTarget)) {

			m_currentContext = "tree-item-ctx";
			m_userHiddenItems = await prefs.getTreeCtxMnuHiddenItems();
			rssTreeView.setFeedSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {

			m_currentContext = "list-item-ctx";
			m_userHiddenItems = await prefs.getListCtxMnuHiddenItems();
			rssListView.setFeedItemSelectionState(m_elmEventTarget);

		} else if (m_elmEventTarget.closest("#" + Global.ID_UL_RSS_TREE_VIEW) !== null) {

			m_currentContext = "tree-ctx";
			m_userHiddenItems = await prefs.getTreeCtxMnuHiddenItems();
			rssTreeView.setFeedSelectionState(m_elmEventTarget);	// select folder

		} else if ((m_elmEventTarget.closest("#" + Global.ID_UL_RSS_LIST_VIEW) !== null) && rssListView.isRssListOK()) {	// don't show menu if list has issues

			m_currentContext = "list-ctx";
			m_userHiddenItems = await prefs.getListCtxMnuHiddenItems();

		} else {
			return;
		}

		// if no menu items are visible for the current context, then don't show the context menu
		if(showRequiredMenuItems() === false) {
			return;
		}

		m_elmContextMenu.addEventListener("mousemove", onMouseMoveContextMenu);
		m_elmContextMenu.addEventListener("blur", onBlurContextMenu, true);
		m_elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
		m_elmContextMenu.addEventListener("click", onClickContextMenuItem);

		// do it first so element will have dimentions (offsetWidth > 0)
		m_elmContextMenu.style.display = "block";

		// calculate position for context menu
		const preferredX = (m_isRTL ? event.clientX - m_elmContextMenu.offsetWidth : event.clientX);
		const x = Math.max(0, Math.min(preferredX, window.innerWidth - m_elmContextMenu.offsetWidth));
		const y = Math.max(5, Math.min(event.clientY, window.innerHeight - m_elmContextMenu.offsetHeight));

		m_elmContextMenu.style.left = x + "px";
		m_elmContextMenu.style.top = y + "px";

		if( !focusFirstVisibleMenuItem(m_elmContextMenu) ) {
			m_elmContextMenu.focus();
		}
		m_isContextMenuOpen = true;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveContextMenu(event) {
		const menuItem = event.target.closest(".ctx-menu-item");

		if(event.target.closest(".ctx-menu-submenu")) {
			cancelScheduledSubMenuClose();
			menuItem?.focus();
			return;
		}

		if(!menuItem) {
			scheduleSubMenuClose();
			m_elmContextMenu.focus();	// move focus to parent (may be an <hr> line)
			return;
		}

		if(isSubMenuParent(menuItem)) {
			cancelScheduledSubMenuClose();
			if (m_elmOpenedSubmenu !== getSubMenuElement(menuItem.id)) {
				openSubMenu(menuItem);
			}
		} else {
			scheduleSubMenuClose();
		}

		menuItem.focus();
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

		let keyCode = event.code;

		// The 'Sign in...' menu item (acceleratorKey:'L') is an oddball. Its visibility depends not only on the
		// element context (tree feed item) but also on the element's state (unauthorized). So in order to prevent
		// the context menu from being closed (from handleMenuActions()), as if some action is being performed,
		// exit here when its acceleratorKey is pressed and the 'Sign in...' menu item is not relevent.
		if((keyCode === "KeyL") && (m_currentContext === "tree-item-ctx") && !TreeItemType.isUnauthorized(m_elmEventTarget)) {
			return;
		}

		event.preventDefault();

		if(m_isRTL) {
			if(keyCode === "ArrowRight")     keyCode = "ArrowLeft";
			else if(keyCode === "ArrowLeft") keyCode = "ArrowRight";
		}

		switch(keyCode) {

			case "ArrowUp":
				focusAdjacentVisibleMenuItem(event.target, false);
				return;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				focusAdjacentVisibleMenuItem(event.target, true);
				return;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowRight":
				if(isSubMenuParent(event.target)) openSubMenu(event.target, true);
				return;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowLeft":
				if(!!event.target.closest(".ctx-menu-submenu")) closeSubMenu(true);
				return;
				/////////////////////////////////////////////////////////////////////////

			case "Enter":
			case "NumpadEnter":
				isSubMenuParent(event.target) ? openSubMenu(event.target, true) : handleMenuItemsAction(event.target.id);
				return;
				/////////////////////////////////////////////////////////////////////////

			case "Escape":
				!!m_elmOpenedSubmenu ? closeSubMenu(true) : closeContextMenu();
				return;
				/////////////////////////////////////////////////////////////////////////
		}
		// if key was handled by the case above, it would have returned, so reaching here means it wasn't handled

		if(m_currentContext === "tree-item-folder-ctx") {
			switch (keyCode) {
				case "KeyN":	handleMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyS":	handleMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyA":	handleMenuActions(ContextAction.treeOpenAllInTabs);		break;
				case "KeyG":	handleMenuActions(ContextAction.treeToggleReadUnread);	break;
				case "KeyR":	handleMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyD":	handleMenuActions(ContextAction.treeDeleteTreeItem);	break;
				case "KeyP":	handleMenuActions(ContextAction.treeProperties);		break;
				case "KeyM":	handleMenuActions(ContextAction.treeSummary);			break;
				case "KeyI":	handleMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "tree-item-ctx") {
			switch (keyCode) {
				case "KeyO":	handleMenuActions(ContextAction.treeOpen);					break;
				case "KeyT":	handleMenuActions(ContextAction.treeOpenNewTab);			break;
				case "KeyB":	handleMenuActions(ContextAction.treeOpenNewContainerTab);	break;
				case "KeyW":	handleMenuActions(ContextAction.treeOpenNewWin);			break;
				case "KeyV":	handleMenuActions(ContextAction.treeOpenNewPrivateWin);		break;
				case "KeyL":	handleMenuActions(ContextAction.treeSigninFeed);			break;
				case "KeyG":	handleMenuActions(ContextAction.treeToggleReadUnread);		break;
				case "KeyR":	handleMenuActions(ContextAction.treeMarkAllRead);			break;
				case "KeyU":	handleMenuActions(ContextAction.treeMarkAllUnread);			break;
				case "KeyN":	handleMenuActions(ContextAction.treeNewFeed);				break;
				case "KeyF":	handleMenuActions(ContextAction.treeNewFolder);				break;
				case "KeyC":	handleMenuActions(ContextAction.treeCopyUrl);				break;
				case "KeyS":	handleMenuActions(ContextAction.treePasteUrl);				break;
				case "KeyD":	handleMenuActions(ContextAction.treeDeleteTreeItem);		break;
				case "KeyP":	handleMenuActions(ContextAction.treeProperties);			break;
				case "KeyM":	handleMenuActions(ContextAction.treeSummary);				break;
				case "KeyI":	handleMenuActions(ContextAction.treeSwitchDirection);		break;
			}
		} else if(m_currentContext === "list-item-ctx") {
			switch (keyCode) {
				case "KeyO":	handleMenuActions(ContextAction.listOpen);					break;
				case "KeyT":	handleMenuActions(ContextAction.listOpenNewTab);			break;
				case "KeyE":	handleMenuActions(ContextAction.listOpenNewReaderTab);		break;
				case "KeyB":	handleMenuActions(ContextAction.listOpenNewContainerTab);	break;
				case "KeyW":	handleMenuActions(ContextAction.listOpenNewWin);			break;
				case "KeyV":	handleMenuActions(ContextAction.listOpenNewPrivateWin);		break;
				case "KeyA":	handleMenuActions(ContextAction.listOpenAllInTabs);			break;
				case "KeyG":	handleMenuActions(ContextAction.listToggleReadUnread);		break;
				case "KeyR":	handleMenuActions(ContextAction.listMarkAllRead);			break;
				case "KeyU":	handleMenuActions(ContextAction.listMarkAllUnread);			break;
				case "KeyC":	handleMenuActions(ContextAction.listCopyUrl);				break;
				case "KeyI":	handleMenuActions(ContextAction.listSwitchDirection);		break;
			}
		} else if(m_currentContext === "tree-ctx") {
			switch (keyCode) {
				case "KeyR":	handleMenuActions(ContextAction.treeMarkAllRead);		break;
				case "KeyU":	handleMenuActions(ContextAction.treeMarkAllUnread);		break;
				case "KeyN":	handleMenuActions(ContextAction.treeNewFeed);			break;
				case "KeyF":	handleMenuActions(ContextAction.treeNewFolder);			break;
				case "KeyS":	handleMenuActions(ContextAction.treePasteUrl);			break;
				case "KeyM":	handleMenuActions(ContextAction.treeSummary);			break;
				case "KeyI":	handleMenuActions(ContextAction.treeSwitchDirection);	break;
			}
		} else if(m_currentContext === "list-ctx") {
			switch (keyCode) {
				case "KeyA":	handleMenuActions(ContextAction.listOpenAllInTabs);		break;
				case "KeyR":	handleMenuActions(ContextAction.listMarkAllRead);		break;
				case "KeyU":	handleMenuActions(ContextAction.listMarkAllUnread);		break;
				case "KeyI":	handleMenuActions(ContextAction.listSwitchDirection);	break;
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickContextMenuItem(event) {
		event.preventDefault();

		const target = event.target;
		if(!target.classList.contains("ctx-menu-item")) return;

		if( isSubMenuParent(target) && (m_elmOpenedSubmenu !== getSubMenuElement(target.id)) ) {
			openSubMenu(target);
		} else {
			handleMenuItemsAction(target.id);
		}
	}

	//==================================================================================
	//=== menu items handlers
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleMenuItemsAction(menuId) {

		switch (menuId) {
			case "mnuTreeOpenFeed":						handleMenuActions(ContextAction.treeOpen);					break;
			case "mnuTreeOpenFeedNewTab":				handleMenuActions(ContextAction.treeOpenNewTab);			break;
			case "mnuTreeOpenFeedNewContainerTab":		handleMenuActions(ContextAction.treeOpenNewContainerTab);	break;
			case "mnuTreeOpenFeedNewWin":				handleMenuActions(ContextAction.treeOpenNewWin);			break;
			case "mnuTreeOpenFeedNewPrivateWin":		handleMenuActions(ContextAction.treeOpenNewPrivateWin);		break;
			case "mnuTreeOpenAllFeedsInNewTabs":		handleMenuActions(ContextAction.treeOpenAllInTabs);			break;
			case "mnuTreeSigninFeed":					handleMenuActions(ContextAction.treeSigninFeed);			break;
			case "mnuTreeToggleFeedReadUnread":			handleMenuActions(ContextAction.treeToggleReadUnread);		break;
			case "mnuTreeMarkAllFeedsRead":				handleMenuActions(ContextAction.treeMarkAllRead);			break;
			case "mnuTreeMarkAllFeedsUnread":			handleMenuActions(ContextAction.treeMarkAllUnread);			break;
			case "mnuTreeNewFeed":						handleMenuActions(ContextAction.treeNewFeed);				break;
			case "mnuTreeNewFolder":					handleMenuActions(ContextAction.treeNewFolder);				break;
			case "mnuTreeCopyFeedUrl":					handleMenuActions(ContextAction.treeCopyUrl);				break;
			case "mnuTreePasteFeedUrl":					handleMenuActions(ContextAction.treePasteUrl);				break;
			case "mnuTreeDeleteTreeItem":				handleMenuActions(ContextAction.treeDeleteTreeItem);		break;
			case "mnuTreeProperties":					handleMenuActions(ContextAction.treeProperties);			break;
			case "mnuTreeSummary":						handleMenuActions(ContextAction.treeSummary);				break;
			case "mnuTreeSwitchDirection":				handleMenuActions(ContextAction.treeSwitchDirection);		break;

			case "mnuListOpenFeedItem":					handleMenuActions(ContextAction.listOpen);					break;
			case "mnuListOpenFeedItemNewTab":			handleMenuActions(ContextAction.listOpenNewTab);			break;
			case "mnuListOpenFeedItemNewReaderTab":		handleMenuActions(ContextAction.listOpenNewReaderTab);		break;
			case "mnuListOpenFeedItemNewContainerTab":	handleMenuActions(ContextAction.listOpenNewContainerTab);	break;
			case "mnuListOpenFeedItemNewWin":			handleMenuActions(ContextAction.listOpenNewWin);			break;
			case "mnuListOpenFeedItemNewPrivateWin":	handleMenuActions(ContextAction.listOpenNewPrivateWin);		break;
			case "mnuListOpenAllFeedItemsTabs":			handleMenuActions(ContextAction.listOpenAllInTabs);			break;
			case "mnuListToggleFeedItemReadUnread":		handleMenuActions(ContextAction.listToggleReadUnread);		break;
			case "mnuListMarkAllFeedItemsRead":			handleMenuActions(ContextAction.listMarkAllRead);			break;
			case "mnuListMarkAllFeedItemsUnread":		handleMenuActions(ContextAction.listMarkAllUnread);			break;
			case "mnuListCopyFeedItemUrl":				handleMenuActions(ContextAction.listCopyUrl);				break;
			case "mnuListSwitchDirection":				handleMenuActions(ContextAction.listSwitchDirection);		break;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleMenuActions(menuAction) {

		closeContextMenu();

		if (!m_elmEventTarget) return;			// do noting if no target element

		if(OpenPanelActions.includes(menuAction)) {
			m_bActivePanelOpened = true;
		}

		switch (menuAction) {

			case ContextAction.treeOpen:
				rssTreeView.openTreeItemFeedPreview(m_elmEventTarget, rssTreeView.URLOpenMethod.IN_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpen:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewTab:
				rssTreeView.openTreeItemFeedPreview(m_elmEventTarget, rssTreeView.URLOpenMethod.IN_NEW_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewTab:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_TAB);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewReaderTab:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_TAB_READER);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewContainerTab:
				rssTreeView.openTreeItemFeedPreview(m_elmEventTarget, rssTreeView.URLOpenMethod.IN_NEW_TAB_CONTAINER);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewContainerTab:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_TAB_CONTAINER);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewWin:
				rssTreeView.openTreeItemFeedPreview(m_elmEventTarget, rssTreeView.URLOpenMethod.IN_NEW_WIN);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewWin:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_WIN);
				break;
				///////////////////////////////////////////

			case ContextAction.treeOpenNewPrivateWin:
				rssTreeView.openTreeItemFeedPreview(m_elmEventTarget, rssTreeView.URLOpenMethod.IN_NEW_WIN_PRIVATE);
				break;
				///////////////////////////////////////////

			case ContextAction.listOpenNewPrivateWin:
				rssListView.openListFeedItem(m_elmEventTarget, rssListView.URLOpenMethod.IN_NEW_WIN_PRIVATE);
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
				slUtil.writeTextToClipboard(m_elmEventTarget.getAttribute("href"));
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
	function initializeHTML() {

		const fragment = document.createDocumentFragment();

		for(let i=0, len=ContextMenuItems.length; i<len; ++i) {

			const menuItem = ContextMenuItems[i];

			fragment.appendChild(createMenuItemElement(menuItem));

			if(menuItem.submenuItems) {
				const elmSubmenu = createSubMenuElement(menuItem.id);
				const submenuItems = menuItem.submenuItems;
				for(let iSub=0, lenSub=submenuItems.length; iSub<lenSub; ++iSub) {
					elmSubmenu.appendChild(createMenuItemElement(submenuItems[iSub]));
				}
				fragment.appendChild(elmSubmenu);
			}

			// if a new group is coming up then add a separator
			if( (i < ContextMenuItems.length-1) && (menuItem.group < ContextMenuItems[i+1].group) ) {
				const elmHr = document.createElement("hr");
				elmHr.className = "ctx-menu-group-separator";
				elmHr.setAttribute("data-group", menuItem.group);
				fragment.appendChild(elmHr);
			}
		}
		m_elmContextMenu.replaceChildren(fragment);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createMenuItemElement(menuItem) {

		const elm = document.createElement("div");

		// menuItem must have an id, class and group
		elm.id = menuItem.id;
		elm.className = menuItem.class;
		elm.tabIndex = 0;								// make focusable
		elm.setAttribute("data-group", menuItem.group);

		// menuItem must have a text
		const text = menuItem.text;
		const elmWrapper = document.createElement("div");

		// if menuItem has a shortcut, underline the shortcut key in the text
		if(!!menuItem.shortcut) {
			let index = text.indexOf(menuItem.shortcut.toUpperCase());	// prefer uppercase match
			if(index === -1) {
				index = text.toLowerCase().indexOf(menuItem.shortcut.toLowerCase());	// compromise with lowercase match
			}

			if(index > -1) {
				const before = text.substring(0, index);
				const key = text.charAt(index);
				const after = text.substring(index + 1);

				if(!!before) {
					elmWrapper.appendChild(document.createTextNode(before));
				}

				const elmU = document.createElement("u");
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
		elm.appendChild(elmWrapper);

		// if menuItem has an accelerator key, add it to the menu item
		if(!!menuItem.accelerator) {
			const elmAcceleratorKey = document.createElement("div");
			elmAcceleratorKey.className = "acceleratorKey";
			elmAcceleratorKey.textContent = menuItem.accelerator;
			elm.appendChild(elmAcceleratorKey);
		}

		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isSubMenuParent(elm) {
		return elm?.classList.contains("ctx-menu-submenu-parent") ?? false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getSubMenuParentElement(elmSubmenu) {
		if(!elmSubmenu) return null;
		const parentId = elmSubmenu.getAttribute("data-parent-id");
		return m_elmContextMenu.querySelector(`#${parentId}`);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSubMenuElement(parentMenuId) {
		const elmSubmenu = document.createElement("div");
		elmSubmenu.className = "ctx-menu-submenu";
		elmSubmenu.setAttribute("data-parent-id", parentMenuId);
		return elmSubmenu;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getSubMenuElement(parentMenuId) {
		return m_elmContextMenu.querySelector(`.ctx-menu-submenu[data-parent-id='${parentMenuId}']`);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openSubMenu(elmParentMenuItem, focusFirstItem = false) {

		if(!isSubMenuParent(elmParentMenuItem) || elmParentMenuItem.classList.contains("user-hidden")) return;

		closeSubMenu();

		const elmSubmenu = getSubMenuElement(elmParentMenuItem.id);
		elmSubmenu.classList.add("open");

		const rcMenu = m_elmContextMenu.getBoundingClientRect();
		const rcParent = elmParentMenuItem.getBoundingClientRect();
		const submenuWidth = elmSubmenu.offsetWidth;

		let x;
		const y = Math.max(0, Math.min(rcParent.top, window.innerHeight - elmSubmenu.offsetHeight));
		const maxViewportX = Math.max(0, window.innerWidth - submenuWidth);

		if(m_isRTL) {
			const preferredLeftX = rcMenu.left - submenuWidth + 5;
			const preferredRightX = rcMenu.right - 5;

			if(preferredLeftX >= 0) {
				x = preferredLeftX;											// Prefer opening to the left when there is enough space.
			} else if(preferredRightX <= maxViewportX) {
				x = preferredRightX;										// If left side does not fit, open fully to the right when possible.
			} else {
				x = Math.max(0, Math.min(preferredLeftX, maxViewportX));	// If neither side fully fits, open left and shift right as needed.
			}
		} else {
			const preferredRightX = rcMenu.right - 5;
			const preferredLeftX = rcMenu.left - submenuWidth + 5;

			if(preferredRightX <= maxViewportX) {
				x = preferredRightX;										// Prefer opening to the right when there is enough space.
			} else if(preferredLeftX >= 0) {
				x = preferredLeftX;											// If right side does not fit, open fully to the left when possible.
			} else {
				x = Math.max(0, Math.min(preferredRightX, maxViewportX));	// If neither side fully fits, open right and shift left as needed.
			}
		}

		elmSubmenu.style.left = x + "px";
		elmSubmenu.style.top = y + "px";

		if(focusFirstItem) {
			focusFirstVisibleMenuItem(elmSubmenu);
		}
		m_elmOpenedSubmenu = elmSubmenu;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeSubMenu(restoreFocusToParent = false) {

		cancelScheduledSubMenuClose();

		if(!m_elmOpenedSubmenu) return;
		m_elmOpenedSubmenu.classList.remove("open");

		if(restoreFocusToParent) {
			getSubMenuParentElement(m_elmOpenedSubmenu)?.focus();
		}
		m_elmOpenedSubmenu = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function scheduleSubMenuClose() {
		if(!m_elmOpenedSubmenu || m_subMenuCloseTimer) return;
		m_subMenuCloseTimer = setTimeout(() => {
			m_subMenuCloseTimer = null;
			closeSubMenu();
		}, 300);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function cancelScheduledSubMenuClose() {
		clearTimeout(m_subMenuCloseTimer);
		m_subMenuCloseTimer = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFirstVisibleMenuItem(elmMenu, additionalSelectors = "") { // additionalSelector must start with ','
		return elmMenu.querySelector(`.ctx-menu-item.${m_currentContext}:not(.user-hidden)` + (additionalSelectors || ""));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function focusFirstVisibleMenuItem(elmMenu) {
		const first = getFirstVisibleMenuItem(elmMenu);
		first?.focus();
		return !!first;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function focusAdjacentVisibleMenuItem(elmCurrent, isNext) {

		const visibleItems = Array.from(m_elmContextMenu.querySelectorAll(".ctx-menu-item")).filter(elm => !!elm.offsetParent);
		if(visibleItems.length === 0) return;

		let index = visibleItems.indexOf(elmCurrent);
		if(index === -1) {
			visibleItems[0].focus();
			return;
		}

		index = (index + (isNext ? 1 : -1) + visibleItems.length) % visibleItems.length;
		if(!visibleItems[index].closest(".ctx-menu-submenu")) {
			closeSubMenu();
		}
		visibleItems[index].focus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showRequiredMenuItems() {

		const isUnauthorized = m_elmEventTarget.classList.contains("unauthorized");
		let contextSelectors;

		////////////////////////////////////////////////////////////////////////////
		// handle the display of the context menu items based on the current context

		m_elmContextMenu.classList.remove("tree-item-folder-ctx", "tree-item-ctx", "list-item-ctx", "tree-ctx", "list-ctx", "tree-item-unauthorized-ctx");
		if(isUnauthorized) {
			m_elmContextMenu.classList.add(m_currentContext, "tree-item-unauthorized-ctx");
			contextSelectors = `.ctx-menu-item.${m_currentContext},.ctx-menu-group-separator,.tree-item-unauthorized-ctx`;
		} else {
			m_elmContextMenu.classList.add(m_currentContext);
			contextSelectors = `.ctx-menu-item.${m_currentContext},.ctx-menu-group-separator`;
		}

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// handle the display of the context menu items based on the user customization as defined in m_userHiddenItems

		const menuItemElements = m_elmContextMenu.querySelectorAll(contextSelectors);
		let lastVisibleGroup = 0;			// group number is one based, so 0 means no visible group
		let lastVisibleSeparator = null;

		for(let i=0, len=menuItemElements.length; i<len; ++i) {

			const elm = menuItemElements[i];
			const elmClsLst = elm.classList;

			// for the menu items of the current context
			if( elmClsLst.contains("ctx-menu-item") ) {

				// hide or show menu item based on the user customization as defined in m_userHiddenItems
				// note: 'mnuTreeSigninFeed' item will never be in 'm_userHiddenItems' but the separator that comes immediately after it will be hidden if needed
				if(m_userHiddenItems.includes(elm.id)) {
					elmClsLst.add("user-hidden");
				} else {
					elmClsLst.remove("user-hidden");
					lastVisibleGroup = elm.getAttribute("data-group");
				}

			} else if(elmClsLst.contains("ctx-menu-group-separator")) {

				// hide or show separator based on the visibility of the menu items in the same group
				if(elm.getAttribute("data-group") === lastVisibleGroup) {
					elmClsLst.remove("group-empty-hidden");
					lastVisibleSeparator = elm;
				} else {
					elmClsLst.add("group-empty-hidden");
				}
			}
		}

		// hide the last visible separator if it belongs to the last visible group
		if( lastVisibleSeparator?.getAttribute("data-group") === lastVisibleGroup ) {
			lastVisibleSeparator.classList.add("group-empty-hidden");
		}

		const isAnyVisible = !!getFirstVisibleMenuItem(m_elmContextMenu, ( isUnauthorized ? ",.tree-item-unauthorized-ctx" : "" ));
		return isAnyVisible;	// return true if there is at least one visible menu item
	}

	return {
		initialize: initialize,
		close: close,
		isOpen: isOpen,
	};

})();
