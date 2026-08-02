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
		listOpenNewContainerTab:	21,
		listOpenNewWin:				22,
		listOpenNewPrivateWin:		23,
		listOpenAllInTabs:			24,
		listToggleReadUnread:		25,
		listMarkAllRead:			26,
		listMarkAllUnread:			27,
		listCopyUrl:				28,
		listSwitchDirection:		29,
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

		const isRTL = getComputedStyle(m_elmSidebarBody).direction === "rtl";
		let logicalX = (isRTL ? (m_elmSidebarBody.offsetWidth - event.clientX) : event.clientX);
		let y = event.clientY;

		// do it first so element will have dimentions (offsetWidth > 0)
		m_elmContextMenu.style.display = "block";

		if ((logicalX + m_elmContextMenu.offsetWidth) > m_elmSidebarBody.offsetWidth) {
			logicalX = m_elmSidebarBody.offsetWidth - m_elmContextMenu.offsetWidth;
		}

		if ((y + m_elmContextMenu.offsetHeight) > m_elmSidebarBody.offsetHeight) {
			y = m_elmSidebarBody.offsetHeight - m_elmContextMenu.offsetHeight;
		}

		if(isRTL) {
			m_elmContextMenu.style.right = logicalX + "px";
		} else {
			m_elmContextMenu.style.left = logicalX + "px";
		}
		m_elmContextMenu.style.top = y + "px";

		const item = m_elmContextMenu.querySelector(`.ctx-menu-item.${m_currentContext}:not(.user-hidden)`);	// first visible items
		if(!!item) {
			item.focus();
		} else {
			m_elmContextMenu.focus();
		}
		m_isContextMenuOpen = true;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveContextMenu(event) {
		if(event.target.classList.contains("ctx-menu-item")) {
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
		// the context menu from being closed (from handleMenuActions()), as if some action is being performed,
		// exit here when its acceleratorKey is pressed and the 'Sign in...' menu item is not relevent.
		if((keyCode === "KeyL") && (m_currentContext === "tree-item-ctx") && !TreeItemType.isUnauthorized(m_elmEventTarget)) {
			return;
		}

		event.preventDefault();

		switch(keyCode) {

			case "ArrowUp":
				elm = event.target;
				while( !!(elm = elm.previousElementSibling) ) {
					if( !!elm.offsetParent && elm.classList.contains("ctx-menu-item") ) {		// visible menu item
						elm.focus();
						break;
					}
				}
				if(!!!elm) {
					elm = m_elmContextMenu.lastElementChild;
					do {
						if( !!elm.offsetParent && elm.classList.contains("ctx-menu-item") ) {
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
					if( !!elm.offsetParent && elm.classList.contains("ctx-menu-item") ) {
						elm.focus();
						break;
					}
				}
				if(!!!elm) {
					elm = m_elmContextMenu.firstElementChild;
					do {
						if( !!elm.offsetParent && elm.classList.contains("ctx-menu-item") ) {
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
		handleMenuItemsAction(event.target.id);
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
		let prevMenuItemGroup = 1;

		for(let i=0, len=ContextMenuItems.length; i<len; ++i) {

			const menuItem = ContextMenuItems[i];
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

			// if previous menuItem group is less than current menuItem group, add a seperator
			if(prevMenuItemGroup < menuItem.group) {
				const elmHr = document.createElement("hr");
				elmHr.className = "ctx-menu-sep";
				elmHr.setAttribute("data-group", prevMenuItemGroup);
				fragment.appendChild(elmHr);
				prevMenuItemGroup = menuItem.group;
			}
			fragment.appendChild(elm);
		}

		m_elmContextMenu.replaceChildren(fragment);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showRequiredMenuItems() {

		const isUnauthorized = m_elmEventTarget.classList.contains("unauthorized");

		////////////////////////////////////////////////////////////////////////////
		// handle the display of the context menu items based on the current context

		m_elmContextMenu.classList.remove("tree-item-folder-ctx", "tree-item-ctx", "list-item-ctx", "tree-ctx", "list-ctx", "tree-item-unauthorized-ctx");
		if(isUnauthorized) {
			m_elmContextMenu.classList.add(m_currentContext, "tree-item-unauthorized-ctx");
		} else {
			m_elmContextMenu.classList.add(m_currentContext);
		}

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// handle the display of the context menu items based on the user customization as defined in m_userHiddenItems

		const menuItemElements = m_elmContextMenu.children;
		let lastVisibleGroup = 0;			// group number is one based, so 0 means no visible group
		let lastVisibleSeparator = null;

		for(let i=0, len=menuItemElements.length; i<len; ++i) {

			const elm = menuItemElements[i];
			const elmClsLst = elm.classList;

			// for the menu items of the current context
			if( elmClsLst.contains("ctx-menu-item") && elmClsLst.contains(m_currentContext) || (isUnauthorized && elmClsLst.contains("tree-item-unauthorized-ctx")) ) {

				// hide or show menu item based on the user customization as defined in m_userHiddenItems
				if(m_userHiddenItems.includes(elm.id)) {
					elmClsLst.add("user-hidden");
				} else {
					elmClsLst.remove("user-hidden");
					lastVisibleGroup = elm.getAttribute("data-group");
				}

			} else if(elmClsLst.contains("ctx-menu-sep")) {

				// hide or show separator based on the visibility of the menu items in the same group
				if(elm.getAttribute("data-group") === lastVisibleGroup) {
					elmClsLst.remove("user-hidden");
					lastVisibleSeparator = elm;
				} else {
					elmClsLst.add("user-hidden");
				}
			}
		}

		// hide the last visible separator if it belongs to the last visible group
		if( !!lastVisibleSeparator && lastVisibleSeparator.getAttribute("data-group") === lastVisibleGroup ) {
			lastVisibleSeparator.classList.add("user-hidden");
		}

		return lastVisibleGroup > 0;	// return true if there is at least one visible menu item
	}

	return {
		initialize: initialize,
		close: close,
		isOpen: isOpen,
	};

})();
