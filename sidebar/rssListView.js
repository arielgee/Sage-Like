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

		disposeList();

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let setFeedUrl = function (feedUrl) {

		return new Promise((resolve) => {

			disposeList();

			fetch(feedUrl).then((res) => {				

				if (res.ok) {
					res.text().then((xmlTxt) => {
						setFeedItems(xmlTxt);
					});					
				} else {
					setListErrorMsg("Fail to load feed items from '" + res.url + "'. [" + res.status + ", " + res.statusText + "]");
				}
				resolve();
			}).catch((error) => {
				setListErrorMsg("[FIX MSG] Fail to fetch feed items: " + error.message);
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

		let feeder;
		let elm;
		let title, link, desc;


		// First lets try 'RSS'
		(feeder = doc.querySelectorAll("rss")).forEach((item) => {

			// using forEach but there is just one <RSS> in decument			

			lzUtil.log("Feed: RSS v", item.getAttribute("version"));

			disposeList();

			doc.querySelectorAll("item").forEach((item) => {

				// all versions have <title> & <link>. 0.90 did do not have <description>
				title = item.querySelector("title").textContent;
				link = item.querySelector("link").textContent;
				desc = item.querySelector("description") ? item.querySelector("description").textContent : "";

				appendTagIL(title, link, desc);
			});
		});


		// if 'RSS' fail let's try 'Atom'
		if (feeder.length === 0) {
			
			(feeder = doc.querySelectorAll("feed")).forEach((item) => {

				// using forEach but there is just one <FEED> in decument

				lzUtil.log("Feed: Atom v", item.getAttribute("version"));

				disposeList();

				doc.querySelectorAll("entry").forEach((item) => {

					title = item.querySelector("title").textContent;					
					if(	(elm = item.querySelector("link:not([rel])")) ||
						(elm = item.querySelector("link[rel=alternate]")) ||
						(elm = item.querySelector("link"))	) {
						link = elm.getAttribute("href");
					}
					desc = item.querySelector("summary") ? item.querySelector("summary").textContent : "";

					appendTagIL(title, link, desc);
				});
			});
		}

		//				case "RDF Site Summary":
		// http://www.rssboard.org/rss-history
		// https://validator.w3.org/feed/docs/
		// http://web.resource.org/rss/1.0/
		// http://web.resource.org/rss/1.0/spec
		// https://validator.w3.org/feed/docs/error/InvalidRDF.html


	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendTagIL = function (title, link, desc) {

		//lzUtil.log("history: ", textContent, href, decodeURI(href), encodeURI(href));

		let elm = document.createElement("li");		

		// url's in history are decoded and encodeURI in the rss's XML.
		browser.history.search({ text: decodeURI(link), maxResults: 1 }).then((hItems) => {
			if (hItems.length > 0) {
				lzUtil.concatClassName(elm, "visited");
			}
		});

		elm.textContent = title;
		elm.setAttribute("href", link);
		elm.setAttribute("title", desc);	// show my own box to show html tags

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
		let handled = false;
		let feedItemUrl = elm.getAttribute("href");

		if (event.type === "click" && event.button === 0 && !event.ctrlKey && !event.shiftKey) {

			// open in current tab
			// left click, no keys

			browser.tabs.update({ url: feedItemUrl });
			handled = true;

		} else if ((event.type === "auxclick" && event.button === 1) || (event.type === "click" && event.button === 0 && event.ctrlKey)) {

			// open in new tab
			// middle click
			// left click + ctrl key

			browser.tabs.create({ url: feedItemUrl });
			handled = true;

		} else if (event.type === "click" && event.button === 0 && event.shiftKey) {

			// open in new window
			// left click + shift key

			browser.windows.create({ url: feedItemUrl, type: "normal" });
			handled = true;
		}

		if(handled) {
			lzUtil.concatClassName(elm, "visited");
			event.stopPropagation();
			event.preventDefault();		// a must when using <a>
		}
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
	let setListErrorMsg = function (textContent) {
		let elm = document.createElement("li");
		lzUtil.concatClassName(elm, "errormsg");
		elm.textContent = textContent;

		disposeList();
		elmList.appendChild(elm);
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	let disposeList = function () {

		let el;

		while (el = elmList.firstChild) {
			el.removeEventListener("click", onclickFeedItem);
			el.removeEventListener("auxclick", onclickFeedItem);
			el.removeEventListener("mousedown", onclickFeedItem_preventDefault);
			elmList.removeChild(el);
		}
	};
	
	return {
		setFeedUrl: setFeedUrl,
	};

})();