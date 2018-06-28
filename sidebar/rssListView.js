"use strict";

let rssListView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmList;

	let m_elmCurrentlySelected = null;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmList = document.getElementById(slGlobals.ID_UL_RSS_LIST_VIEW);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		disposeList();

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	//==================================================================================
	//=== List Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItems(list) {

		let index = 1;

		disposeList();
		for(let item of list) {
			appendTagIL(index++, item.title, item.desc, item.url);
		}

		// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
		if(slUtil.hasHScroll(m_elmList)) {
			m_elmList.style.height = (m_elmList.clientHeight - slUtil.getScrollbarWidth(document)) + "px";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendTagIL(index, title, desc, url) {

		let elm = document.createElement("li");

		elm.classList.add(slGlobals.CLS_RLV_LI_LIST_ITEM)
		setItemRealVisitedState(elm, url);

		elm.textContent = index.toString() + ". " + title;
		elm.title = title;
		elm.setAttribute("href", url);

		addListItemEventListeners(elm);

		m_elmList.appendChild(elm);
	}

	//==================================================================================
	//=== List Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addListItemEventListeners(elm) {
		elm.addEventListener("click", onClickFeedItem);
		elm.addEventListener("auxclick", onClickFeedItem);
		elm.addEventListener("mousedown", onClickFeedItem_preventDefault);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeListItemEventListeners(elm) {
		elm.removeEventListener("click", onClickFeedItem);
		elm.removeEventListener("auxclick", onClickFeedItem);
		elm.removeEventListener("mousedown", onClickFeedItem_preventDefault);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickFeedItem(event) {

		let elm = this;
		let handled = true;		// optimistic
		let feedItemUrl = elm.getAttribute("href");

		if (event.type === "click" && event.button === 0 && !event.ctrlKey && !event.shiftKey) {

			// open in current tab; click
			browser.tabs.update({ url: feedItemUrl });

		} else if ((event.type === "auxclick" && event.button === 1) || (event.type === "click" && event.button === 0 && event.ctrlKey)) {

			// open in new tab; middle click or ctrl+click
			browser.tabs.create({ url: feedItemUrl });

		} else if (event.type === "click" && event.button === 0 && event.shiftKey) {

			// open in new window; shift+click
			browser.windows.create({ url: feedItemUrl, type: "normal" });

		} else {
			handled = false;
		}

		if(handled) {

			setFeedItemSelectionState(elm);

			// Redirect are not saved in history. So when a feed url is
			// redirected from http to https or from feedproxy.google.com
			// to the target page it cannot be found in browser.history.
			// So this function will record the redirecting url in history
			// https://wiki.mozilla.org/Browser_History:Redirects
			slUtil.addUrlToBrowserHistory(feedItemUrl, elm.textContent).then(() => {
				setItemRealVisitedState(elm, feedItemUrl);
			});

			event.stopPropagation();
			event.preventDefault();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickFeedItem_preventDefault(event) {

		// This is to prevent the default behaviour of Fx when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		event.preventDefault();		// The 'click' event is fired anyway.
		event.stopPropagation();
	}

	//==================================================================================
	//=== List Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setItemRealVisitedState(elm, url) {

		browser.history.getVisits({ url: url }).then((vItems) => {
			if (vItems.length === 0) {
				elm.classList.add("bold");
			} else {
				elm.classList.remove("bold");
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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function markAllItemsAsVisitedState(visited) {

		let funcAddToHistory = function (e) {
			slUtil.addUrlToBrowserHistory(e.getAttribute("href"), e.textContent);
		};

		let funcDelFromHistory = function (e) {
			slUtil.deleteUrlFromBrowserHistory(e.getAttribute("href"));
		};

		let funcHistory = visited ? funcAddToHistory : funcDelFromHistory;
		let funcClassList = visited ? function(e) { e.classList.remove("bold"); } : function(e) { e.classList.add("bold"); };

		let elms = m_elmList.getElementsByTagName("li");

		if(elms[0] !== undefined && !(elms[0].classList.contains("errormsg"))) {

			for(let elm of elms) {
				funcHistory(elm);
				funcClassList(elm);
			}
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
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setListErrorMsg(textContent) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = textContent;

		disposeList();
		m_elmList.appendChild(elm);
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function switchViewDirection() {
		if(m_elmList.style.direction === "rtl") {
			m_elmList.style.direction = "ltr";
		} else {
			m_elmList.style.direction = "rtl";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeList() {

		let el;

		m_elmCurrentlySelected = null;

		while (el = m_elmList.firstChild) {
			removeListItemEventListeners(el);
			m_elmList.removeChild(el);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openAllItemsInTabs() {

		let elms = m_elmList.getElementsByTagName("li");

		if(elms[0] !== undefined && !(elms[0].classList.contains("errormsg"))) {

			for(let elm of elms) {

				let parkedTabUrl = browser.extension.getURL("/parkedTab/parked.html?prkTitle=" +
					elm.textContent.replace(/^[0-9]+\. /, "") +
					"&prkUrl=" + elm.getAttribute("href"));

				browser.tabs.create({ active: false, url: parkedTabUrl }).then((tab) => {
					slUtil.addUrlToBrowserHistory(elm.getAttribute("href"), elm.textContent).then(() => {
						setItemRealVisitedState(elm, elm.getAttribute("href"));
					});
				});
			}
		}
	}

	return {
		setFeedItems: setFeedItems,
		disposeList: disposeList,
		setListErrorMsg: setListErrorMsg,
		setFeedItemSelectionState: setFeedItemSelectionState,
		setItemRealVisitedState: setItemRealVisitedState,
		toggleItemVisitedState: toggleItemVisitedState,
		markAllItemsAsVisitedState: markAllItemsAsVisitedState,
		switchViewDirection: switchViewDirection,
		openAllItemsInTabs: openAllItemsInTabs,
	};

})();
