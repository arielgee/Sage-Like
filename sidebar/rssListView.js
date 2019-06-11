"use strict";

let rssListView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmSidebarBody;
	let m_elmList;
	let m_elmFeedItemDescPanel;
	let m_elmListViewStatusbar;
	let m_elmListViewRssTitle;

	let m_elmCurrentlySelected = null;
	let m_elmLITreeFeed = null;
	let m_observerElmLITreeFeed = null;

	let m_bPrefShowFeedItemDesc = prefs.DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE;
	let m_timeoutMouseOver = null;

	let URLOpenMethod = Object.freeze({
		INVALID: 0,
		IN_TAB: 1,
		IN_NEW_TAB: 2,
		IN_NEW_WIN: 3,
		IN_NEW_PRIVATE_WIN: 4,
	});

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);

		browser.runtime.onMessage.addListener(onRuntimeMessage);

		// observer for changes to the title of the to the tree feed
		m_observerElmLITreeFeed = new MutationObserver(() => {
			if(!!m_elmLITreeFeed && m_elmLITreeFeed.classList.contains(slGlobals.CLS_RTV_LI_TREE_ITEM)) {
				m_elmListViewRssTitle.textContent = rssTreeView.getTreeItemText(m_elmLITreeFeed);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		if (message.id === slGlobals.MSG_ID_PREFERENCES_CHANGED) {

			if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
				message.details === slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC) {
				setShowFeedItemDescFromPreferences();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmSidebarBody = document.body;
		m_elmList = document.getElementById(slGlobals.ID_UL_RSS_LIST_VIEW);
		m_elmFeedItemDescPanel = document.getElementById("feedItemDescPanel");
		m_elmListViewStatusbar = document.getElementById("listViewStatusbar");
		m_elmListViewRssTitle = document.getElementById("listViewRssTitle");

		m_elmList.addEventListener("mousedown", onMouseDownFeedList);
		m_elmList.addEventListener("keydown", onKeyDownFeedList);
		m_elmList.addEventListener("focus", onFocusFeedItem, true);
		m_elmList.addEventListener("click", onClickFeedItem);
		m_elmList.addEventListener("auxclick", onClickFeedItem);

		setShowFeedItemDescFromPreferences();

		panel.notifyViewContentLoaded(slGlobals.VIEW_CONTENT_LOAD_FLAG.LIST_VIEW_LOADED);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		disposeList();

		m_observerElmLITreeFeed = null;

		m_elmList.removeEventListener("mousedown", onMouseDownFeedList);
		m_elmList.removeEventListener("keydown", onKeyDownFeedList);
		m_elmList.removeEventListener("focus", onFocusFeedItem);
		m_elmList.removeEventListener("click", onClickFeedItem);
		m_elmList.removeEventListener("auxclick", onClickFeedItem);

		handleFeedItemDescEventListeners(false);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setShowFeedItemDescFromPreferences() {

		prefs.getShowFeedItemDesc().then(showDesc => {
			m_bPrefShowFeedItemDesc = showDesc;
			handleFeedItemDescEventListeners(m_bPrefShowFeedItemDesc);
		});
	}

	//==================================================================================
	//=== List Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItems(list, title, elmLITreeFeed) {

		let index = 1;

		disposeList();
		for(let item of list) {
			appendTagIL(index++, item.title, item.desc, item.url);
		}
		m_elmLITreeFeed = elmLITreeFeed;
		m_observerElmLITreeFeed.observe(m_elmLITreeFeed.firstElementChild.firstElementChild, { childList: true, subtree: false });

		m_elmListViewRssTitle.textContent = title;

		// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
		if(slUtil.hasHScroll(m_elmList)) {
			m_elmList.style.height = (m_elmList.clientHeight - slUtil.getScrollbarWidth()) + "px";
		}
		setStatusbarIcon(true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendTagIL(index, title, desc, url) {

		let elm = document.createElement("li");

		elm.classList.add(slGlobals.CLS_RLV_LI_LIST_ITEM)
		setItemRealVisitedState(elm, url, false);

		if(title.length === 0) title = slGlobals.STR_TITLE_EMPTY;
		desc = desc
			.trim()
			.stripHtmlTags(String.prototype.stripHtmlTags.regexImgTag)
			.stripHtmlTags(String.prototype.stripHtmlTags.regexMultiBrTag, "<br>")
			.escapeHtml();

		elm.textContent = index + ". " + title;
		elm.title = (m_bPrefShowFeedItemDesc && desc.length > 0) ? "" : title;
		elm.setAttribute("href", url);
		elm.setAttribute("tabindex", "0");
		elm.setAttribute("data-item-desc", m_bPrefShowFeedItemDesc ? desc : "");

		m_elmList.appendChild(elm);
	}

	//==================================================================================
	//=== List Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleFeedItemDescEventListeners(bAddListeners) {

		if(bAddListeners) {
			m_elmList.addEventListener("mouseover", onMouseOverFeedItem);
			m_elmList.addEventListener("mouseout", onMouseOutFeedItem);
			m_elmList.addEventListener("mousemove", onMouseMoveFeedItem);
		} else {
			m_elmList.removeEventListener("mouseover", onMouseOverFeedItem);
			m_elmList.removeEventListener("mouseout", onMouseOutFeedItem);
			m_elmList.removeEventListener("mousemove", onMouseMoveFeedItem);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusFeedItem(event) {
		setFeedItemSelectionState(event.target);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickFeedItem(event) {

		let elm = event.target;

		// only for list item elements
		if(!!elm && elm.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {

			let openMethod = URLOpenMethod.INVALID;

			if (event.type === "click" && event.button === 0 && !event.ctrlKey && !event.shiftKey) {

				// open in current tab; click
				openMethod = URLOpenMethod.IN_TAB;

			} else if ((event.type === "auxclick" && event.button === 1) || (event.type === "click" && event.button === 0 && event.ctrlKey)) {

				// open in new tab; middle click or ctrl+click
				openMethod = URLOpenMethod.IN_NEW_TAB;

			} else if (event.type === "click" && event.button === 0 && event.shiftKey) {

				// open in new window; shift+click
				openMethod = URLOpenMethod.IN_NEW_WIN;
			}

			if(openMethod !== URLOpenMethod.INVALID) {
				event.stopPropagation();
				event.preventDefault();
				openListFeedItem(elm, openMethod);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOverFeedItem(event) {

		// only for list item elements
		if(!!!event.target || !event.target.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {
			return;
		}

		event.stopPropagation();
		clearTimeout(m_timeoutMouseOver);

		if(contextMenu.isOpen()) return;	// don't display feed-item description panel when context menu is open

		let elmLI = event.target;

		// if there is a title then do not display item description
		if(elmLI.title.length > 0) return;

		m_elmFeedItemDescPanel.querySelectorAll(".descTitle")[0].textContent = elmLI.textContent.replace(/^\d+\. /, "");
		m_elmFeedItemDescPanel.querySelectorAll(".descBody")[0].innerHTML = elmLI.getAttribute("data-item-desc").unescapeHtml();

		// hide it and place it as high as possible to prevent resizing of
		// the containing sidebar when html data is retrieved
		m_elmFeedItemDescPanel.style.visibility = "hidden";
		m_elmFeedItemDescPanel.style.left = m_elmFeedItemDescPanel.style.top = "0";

		// set display=block as soon as possible to retrieve any remote html data (images, etc) and
		// panel element will have dimentions (offsetWidth > 0)
		m_elmFeedItemDescPanel.style.display = "block";
		m_elmFeedItemDescPanel.style.direction = m_elmList.style.direction;

		m_timeoutMouseOver = setTimeout(() => {

			const POS_OFFSET = 8;
			let x = m_elmFeedItemDescPanel.slLastClientX + POS_OFFSET;
			let y = m_elmFeedItemDescPanel.slLastClientY + POS_OFFSET;

			if ((x + m_elmFeedItemDescPanel.offsetWidth) > m_elmSidebarBody.offsetWidth) {
				x = m_elmSidebarBody.offsetWidth - m_elmFeedItemDescPanel.offsetWidth-1;
			}

			if ((y + m_elmFeedItemDescPanel.offsetHeight) > m_elmSidebarBody.offsetHeight) {
				y = m_elmFeedItemDescPanel.slLastClientY - m_elmFeedItemDescPanel.offsetHeight - POS_OFFSET;
			}

			m_elmFeedItemDescPanel.style.visibility = "visible";
			m_elmFeedItemDescPanel.style.left = x + "px";
			m_elmFeedItemDescPanel.style.top = y + "px";

		}, 800);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOutFeedItem(event) {

		// only for list item elements
		if(!!event.target && event.target.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {
			clearTimeout(m_timeoutMouseOver);
			m_timeoutMouseOver = null;
			m_elmFeedItemDescPanel.style.display = "none";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveFeedItem(event) {

		// only for list item elements
		if(!!event.target && event.target.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {
			m_elmFeedItemDescPanel.slLastClientX = event.clientX;
			m_elmFeedItemDescPanel.slLastClientY = event.clientY;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openListFeedItem(elm, openMethod) {

		// only for list item elements
		if(!!!elm || !elm.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) return;

		let url = elm.getAttribute("href");

		switch (openMethod) {
			case URLOpenMethod.IN_TAB:				browser.tabs.update({ url: url });										break;
			case URLOpenMethod.IN_NEW_TAB:			browser.tabs.create({ url: url });										break;
			case URLOpenMethod.IN_NEW_WIN:			browser.windows.create({ url: url, type: "normal" });					break;
			case URLOpenMethod.IN_NEW_PRIVATE_WIN:	browser.windows.create({ url: url, type: "normal", incognito: true });	break;
		}

		elm.focus();

		if(openMethod !== URLOpenMethod.IN_NEW_PRIVATE_WIN) {

			// Redirect are not saved in history. So when a feed url is
			// redirected from http to https or from feedproxy.google.com
			// to the target page it cannot be found in browser.history.
			// So this function will record the redirecting url in history
			// https://wiki.mozilla.org/Browser_History:Redirects
			slUtil.addUrlToBrowserHistory(url, elm.textContent).then(() => {
				setItemRealVisitedState(elm, url);
			});
		}
	}

	//==================================================================================
	//=== List Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownFeedList(event) {

		// The default behaviour of Fx is to call "mousedown" when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		if(event.target.classList.contains(slGlobals.CLS_RLV_LI_LIST_ITEM)) {
			event.stopPropagation();
			event.preventDefault();
			setFocus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownFeedList(event) {

		event.stopPropagation();
		event.preventDefault();

		if(event.target.getAttribute("disabled") !== null) {
			return;
		}

		let elm, elmsCount, index;
		let elmTargetLI = event.target;

		switch(event.key.toLowerCase()) {

			case "tab":
				rssTreeView.setFocus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "enter":
				openListFeedItem(elmTargetLI, event.ctrlKey ? URLOpenMethod.IN_NEW_TAB : (event.shiftKey ? URLOpenMethod.IN_NEW_WIN: URLOpenMethod.IN_TAB));
				break;
				/////////////////////////////////////////////////////////////////////////

			case "home":
				m_elmList.firstElementChild.focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "end":
				m_elmList.lastElementChild.focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "arrowup":
				elm = elmTargetLI.previousElementSibling
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "arrowdown":
				elm = elmTargetLI.nextElementSibling
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "pageup":
				elmsCount = slUtil.numberOfVItemsInViewport(elmTargetLI, m_elmList);
				index = Array.prototype.indexOf.call(m_elmList.children, elmTargetLI);
				index = index-(elmsCount-1);
				m_elmList.children[index < 0 ? 0 : index].focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "pagedown":
				elmsCount = slUtil.numberOfVItemsInViewport(elmTargetLI, m_elmList);
				index = Array.prototype.indexOf.call(m_elmList.children, elmTargetLI);
				index = index+(elmsCount-1);

				if(index >= m_elmList.children.length) {
					index = m_elmList.children.length-1;
				}
				m_elmList.children[index].focus();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "escape":
				if(m_elmFeedItemDescPanel.style.visibility === "visible") {
					onMouseOutFeedItem({ target: elmTargetLI });
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "o":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_TAB);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "t":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_TAB);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "w":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_WIN);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "v":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_PRIVATE_WIN);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "a":
				openAllItemsInTabs();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "g":
				toggleItemVisitedState(elmTargetLI);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "r":
				markAllItemsAsVisitedState(true);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "u":
				markAllItemsAsVisitedState(false);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "c":
				slUtil.copyTextToClipboard(elmTargetLI.getAttribute("href"));
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	//==================================================================================
	//=== List Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setItemRealVisitedState(elm, url, bUpdateTreeFeed = true) {

		browser.history.getVisits({ url: url }).then((vItems) => {

			elm.classList.toggle("bold", vItems.length === 0);

			if (bUpdateTreeFeed) {
				rssTreeView.updateTreeItemStats(m_elmLITreeFeed, ...(getListViewStats()));
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleItemVisitedState(elm) {
		if(elm.classList.toggle("bold")) {
			// turned to not visited
			slUtil.deleteUrlFromBrowserHistory(elm.getAttribute("href"));
		} else {
			// turned to visited
			slUtil.addUrlToBrowserHistory(elm.getAttribute("href"), elm.textContent);
		}
		rssTreeView.updateTreeItemStats(m_elmLITreeFeed, ...(getListViewStats()));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function markAllItemsAsVisitedState(isVisited) {

		let funcAddToHistory = function (e) {
			slUtil.addUrlToBrowserHistory(e.getAttribute("href"), e.textContent);
		};

		let funcDelFromHistory = function (e) {
			slUtil.deleteUrlFromBrowserHistory(e.getAttribute("href"));
		};

		let funcHistory = isVisited ? funcAddToHistory : funcDelFromHistory;

		let elms = m_elmList.getElementsByTagName("li");

		if(elms[0] !== undefined && !(elms[0].classList.contains("errormsg"))) {

			for(let elm of elms) {
				funcHistory(elm);
				elm.classList.toggle("bold", !isVisited);
			}
			rssTreeView.updateTreeItemStats(m_elmLITreeFeed, ...(getListViewStats()));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItemSelectionState(elm) {

		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.classList.remove("selected");
		}

		// select only selectable list items
		if (elm && elm.tagName === "LI") {
			m_elmCurrentlySelected = elm;
			elm.classList.add("selected");
			slUtil.scrollIntoViewIfNeeded(elm, m_elmList.parentElement);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setListErrorMsg(textContent, title) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = textContent;

		disposeList();
		m_elmList.appendChild(elm);
		m_elmListViewRssTitle.textContent = title;
		setStatusbarIcon(true);
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function switchViewDirection() {
		if(m_elmList.parentElement.style.direction === "rtl") {
			m_elmList.parentElement.style.direction = m_elmList.style.direction = m_elmListViewStatusbar.style.direction = "ltr";
		} else {
			m_elmList.parentElement.style.direction = m_elmList.style.direction = m_elmListViewStatusbar.style.direction = "rtl";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeList() {

		let el;

		m_elmCurrentlySelected = null;

		m_observerElmLITreeFeed.takeRecords();
		m_observerElmLITreeFeed.disconnect();
		m_elmLITreeFeed = null;

		while (el = m_elmList.firstChild) {
			m_elmList.removeChild(el);
		}
		setStatusbarIcon(false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openAllItemsInTabs(onlyUnread = true) {

		let elms = m_elmList.querySelectorAll("." + slGlobals.CLS_RLV_LI_LIST_ITEM + (onlyUnread ? ".bold" : ""));

		if(elms[0] !== undefined && !(elms[0].classList.contains("errormsg"))) {

			let creatingTab, addingUrl;

			for(let elm of elms) {

				let parkedTabUrl = browser.extension.getURL("/parkedTab/parked.html?prkTitle=" +
					elm.textContent.replace(/^[0-9]+\. /, "") +
					"&prkUrl=" + encodeURIComponent(elm.getAttribute("href")));

				creatingTab = browser.tabs.create({ active: false, url: parkedTabUrl });
				addingUrl = slUtil.addUrlToBrowserHistory(elm.getAttribute("href"), elm.textContent);

				creatingTab.then((tab) => {
					addingUrl.then(() => {
						setItemRealVisitedState(elm, elm.getAttribute("href"));
					});
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFocus() {
		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.focus();
		} else if(!!m_elmList.firstElementChild && m_elmList.firstElementChild.tagName === "LI") {
			m_elmList.firstElementChild.focus();
		} else {
			m_elmList.parentElement.focus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setStatusbarIcon(isVisible) {

		let sbWidth = (slUtil.hasVScroll(m_elmList) ? slUtil.getScrollbarWidth() : 0) + "px";

		document.documentElement.style.setProperty("--rlv-scrollbar-width", sbWidth);
		m_elmListViewStatusbar.classList.toggle("visible", isVisible);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getListViewStats() {

		let totalCount = m_elmList.querySelectorAll("." + slGlobals.CLS_RLV_LI_LIST_ITEM).length;
		let unreadCount = m_elmList.querySelectorAll(".bold." + slGlobals.CLS_RLV_LI_LIST_ITEM).length;

		return [
			totalCount,
			unreadCount,
		];
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getListViewTitle() {
		return m_elmListViewRssTitle.textContent;
	}

	return {
		URLOpenMethod: URLOpenMethod,

		setFeedItems: setFeedItems,
		disposeList: disposeList,
		openListFeedItem: openListFeedItem,
		setListErrorMsg: setListErrorMsg,
		setFeedItemSelectionState: setFeedItemSelectionState,
		toggleItemVisitedState: toggleItemVisitedState,
		markAllItemsAsVisitedState: markAllItemsAsVisitedState,
		switchViewDirection: switchViewDirection,
		openAllItemsInTabs: openAllItemsInTabs,
		setFocus: setFocus,
		getListViewTitle: getListViewTitle,
	};

})();
