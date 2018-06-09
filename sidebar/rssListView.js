"use strict";

let rssListView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let elmList;

	let elmCurrentlySelected = null;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		elmList = document.getElementById("rssListView");
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
		if(slUtil.hasHScroll(elmList)) {
			elmList.style.height = (elmList.clientHeight - slUtil.getScrollbarWidth(document)) + "px";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendTagIL(index, title, desc, url) {

		let elm = document.createElement("li");

		elm.classList.add(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)
		setItemVisitedStatus(elm, url);

		elm.textContent = index.toString() + ". " + title;
		elm.title = title;
		elm.setAttribute("href", url);

		addListItemEventListeners(elm);

		elmList.appendChild(elm);
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
			addFeedItemUrlToHistory(feedItemUrl, elm.textContent);
			elm.classList.remove("bold");  // instead of setItemVisitedStatus() becouse it's async

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
	function setItemVisitedStatus(elm, url) {

		browser.history.getVisits({ url: url }).then((vItems) => {
			if (vItems.length === 0) {
				elm.classList.add("bold");
			} else {
				elm.classList.remove("bold");
			}
		});

//#region browser.history.search()
		/*
		let query = {
			text: decodeURI(url),
			startTime: ((new Date()) - (1000 * 60 * 60 * 24 * 365 * 5)),		// about five year back
			maxResults: 1,
		};

		// url's in history are decoded and encodeURI in the rss's XML.
		browser.history.search(query).then((hItems) => {
			if (hItems.length > 0) {
				elm.classList.add("visited");
			}
		});
		*/
//#endregion
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItemSelectionState(elm) {

		if(elmCurrentlySelected !== null) {
			elmCurrentlySelected.classList.remove("selected");
		}

		elmCurrentlySelected = elm;
		elm.classList.add("selected");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setListErrorMsg(textContent) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = textContent;

		disposeList();
		elmList.appendChild(elm);
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	// Redirect are not saved in history. So when a feed url is
	// redirected from http to https or from feedproxy.google.com
	// to the target page it cannot be found in browser.history.
	// So this function will record the un-redirected url in history
	// https://wiki.mozilla.org/Browser_History:Redirects
	function addFeedItemUrlToHistory(url, title) {

		slUtil.addUrlToBrowserHistory(url, title);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeList() {

		let el;

		elmCurrentlySelected = null;

		while (el = elmList.firstChild) {
			removeListItemEventListeners(el);
			elmList.removeChild(el);
		}
	}

	return {
		setFeedItems: setFeedItems,
		disposeList: disposeList,
		setListErrorMsg: setListErrorMsg,
		setFeedItemSelectionState: setFeedItemSelectionState,
	};

})();