"use strict";

let rssListView = (function () {

	let elmList;

	let elmCurrentlySelected = null;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		elmList = document.getElementById("rssListView");
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload (event) {

		disposeList();

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedItems = function (list) {

		let index = 1;

		disposeList();
		for(let item of list) {
			appendTagIL(index++, item.title, item.desc, item.link);
		}

		// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
		if(slUtil.hasHScroll(elmList)) {
			elmList.style.height = (elmList.clientHeight - slUtil.getScrollbarWidth(document)) + "px";
		} 
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendTagIL = function (index, title, desc, link) {

		let elm = document.createElement("li");

		elm.classList.add(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)
		setItemVisitedStatus(elm, link);

		elm.textContent = index.toString() + ". " + title;
		//elm.setAttribute("title", desc);	// show my own box to show html tags
		elm.setAttribute("href", link);

		elm.addEventListener("click", onClickFeedItem);
		elm.addEventListener("auxclick", onClickFeedItem);
		elm.addEventListener("mousedown", onClickFeedItem_preventDefault);

		elmList.appendChild(elm);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onClickFeedItem = function (event) {

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
			elm.classList.add("visited");
			addFeedItemUrlToHistory(feedItemUrl, elm.textContent);

			event.stopPropagation();
			event.preventDefault();
		}
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onClickFeedItem_preventDefault = function (event) {

		// This is to prevent the default behaviour of Fx when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		event.preventDefault();		// The 'click' event is fired anyway.
		event.stopPropagation();
	};

	////////////////////////////////////////////////////////////////////////////////////
	// Redirect are not saved in history. So when a feed link is
	// redirected from http to https or from feedproxy.google.com
	// to the target page it cannot be found in browser.history.
	// So this function will record the un-redirected link in history
	// https://wiki.mozilla.org/Browser_History:Redirects
	let addFeedItemUrlToHistory = function (url, title) {
		
		slUtil.addUrlToBrowserHistory(url, title);
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let setItemVisitedStatus = function (elm, link) {

		browser.history.getVisits({ url: link }).then((vItems) => {
			if (vItems.length > 0) {
				elm.classList.add("visited");
			}
		});

		//#region browser.history.search()
		/*		
		let query = {
			text: decodeURI(link),
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
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedItemSelectionState = function (elm) {
		
		if(elmCurrentlySelected !== null) {
			elmCurrentlySelected.classList.remove("selected");
		}

		elmCurrentlySelected = elm;
		elm.classList.add("selected");
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let setListErrorMsg = function (textContent) {
		let elm = document.createElement("li");
		elm.classList.add("errormsg");
		elm.textContent = textContent;

		disposeList();
		elmList.appendChild(elm);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let disposeList = function () {

		let el;

		elmCurrentlySelected = null;

		while (el = elmList.firstChild) {
			el.removeEventListener("click", onClickFeedItem);
			el.removeEventListener("auxclick", onClickFeedItem);
			el.removeEventListener("mousedown", onClickFeedItem_preventDefault);
			elmList.removeChild(el);
		}
	};

	return {
		setFeedItems: setFeedItems,
		disposeList: disposeList,
		setListErrorMsg: setListErrorMsg,
		setFeedItemSelectionState: setFeedItemSelectionState,
	};

})();