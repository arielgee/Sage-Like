"use strict";

let rssListView = (function () {

	let elmList;

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

		removeListEventListeners();

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedUrl = function (feedUrl) {

		return new Promise((resolve) => {

			removeListEventListeners();
			emptyList();

			fetch(feedUrl).then((res) => {

				if (res.ok) {
					res.text().then((xmlTxt) => {
						setFeedItems(xmlTxt);
					});					
				} else {
					lzUtil.log(res);
					appendErrorTagIL("Failed to load feed items: " + res.status + ", " + res.statusText);
				}
				resolve();
			}).catch((error) => {
				appendErrorTagIL("Failed to fetch feed items: " + error.message);
				resolve();
			});

			/***************************************************************/
			/***************************************************************/
			/***************************************************************/
/*
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				lzUtil.log(xhr);
				if (xhr.readyState == XMLHttpRequest.DONE) {
					lzUtil.log(xhr.response);
				}
			}
			xhr.open('GET', feedUrl, true);
			xhr.send(null);			
*/
		});
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedItems = function(xmlTxt) {

		lzUtil.log("\n", xmlTxt);

		let domParser = new DOMParser();
		let doc = domParser.parseFromString(xmlTxt, "text/xml");

		doc.querySelectorAll("rss").forEach((item) => {
			switch(item.getAttribute("version")) {
				case "0.90":
					lzUtil.log("rss 0.90: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "0.91":
					lzUtil.log("rss 0.91: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "0.92":
					lzUtil.log("rss 0.29: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "1.0":
					lzUtil.log("rss 1.0: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "1.1":
					lzUtil.log("rss 1.0: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "2.0":
					lzUtil.log("rss 2.0: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////

				case "2.0.1":
					lzUtil.log("rss 2.0: ", item.getAttribute("version"));
					break;
					////////////////////////////////////////////////////////
			};
			
		});

		doc.querySelectorAll("item").forEach((item) => {		
			if(item.querySelector("title") && item.querySelector("link")) {
				appendTagIL(	item.querySelector("title").textContent,
								item.querySelector("link").textContent);
			}
		});

	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendTagIL = function (textContent, href) {
		let elm = document.createElement("li");
		//lzUtil.concatClassName(elm, "listitem");
		elm.textContent = textContent;
		elm.setAttribute("href", encodeURI(href));

		elm.addEventListener("click", onclickFeedItem);
		elm.addEventListener("auxclick", onclickFeedItem);
		elm.addEventListener("mousedown", onclickFeedItem_preventDefault);

		elmList.appendChild(elm);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onclickFeedItem_preventDefault = function(event) {

		// This is to prevent the default behaviour of Fx when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'
		
		event.preventDefault();		// The 'click' event is fired anyway.
		event.stopPropagation();
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onclickFeedItem = function(event) {

		let elm = this;
		let feedItemUrl = elm.getAttribute("href");

		if (event.type === "click" && event.button === 0 && !event.ctrlKey && !event.shiftKey) {

			// open in current tab
			// left click, no keys

			browser.tabs.update({ url: feedItemUrl });

		} else if ((event.type === "auxclick" && event.button === 1) || (event.type === "click" && event.button === 0 && event.ctrlKey)) {

			// open in new tab
			// middle click
			// left click + ctrl key

			browser.tabs.create({ url: feedItemUrl });

		} else if (event.type === "click" && event.button === 0 && event.shiftKey) {

			// open in new window
			// left click + shift key

			browser.windows.create({ url: feedItemUrl, type: "normal" });
		}

		event.stopPropagation();
		event.preventDefault();		// a must when using <a>
	};


	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendTagIL_asLink_fontCannotBeUnbold = function (textContent, href) {
		let li = document.createElement("li");
		let a = document.createElement("a");

		a.textContent = textContent;
		a.setAttribute("href", encodeURI(href));
		a.addEventListener("click", onclickFeedItem);

		li.appendChild(a);
		elmList.appendChild(li);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendErrorTagIL = function (textContent) {
		let elm = document.createElement("li");
		lzUtil.concatClassName(elm, "errormsg");
		elm.textContent = textContent;
		elmList.appendChild(elm);
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let emptyList = function () {
		while (elmList.firstChild) {
			elmList.removeChild(elmList.firstChild);
		}
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function removeListEventListeners() {

		let elems = elmList.getElementsByTagName("li");

		for(let el of elems) {
			el.removeEventListener("click", onclickFeedItem);
			el.removeEventListener("auxclick", onclickFeedItem);
			el.removeEventListener("mousedown", onclickFeedItem_preventDefault);
		}
	}
	
	return {
		setFeedUrl: setFeedUrl,
	};

})();