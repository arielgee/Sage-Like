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

			let init = {
				cache: "reload",
			};

			fetch(feedUrl, init).then((res) => {

				if (res.ok) {
					res.text().then((xmlTxt) => {
						setFeedItems(xmlTxt);
					});					
				} else {
					setListErrorMsg("Fail to load feed items from '" + res.url + "', " + res.status + " " + res.statusText + ".");
				}
				resolve();
			}).catch((error) => {
				lzUtil.log(error);
				setListErrorMsg("Fail to fetch feed from '" + feedUrl + "', " + error.message);
				resolve();
			});
		});
	};

	////////////////////////////////////////////////////////////////////////////////////
	// https://validator.w3.org/feed/docs/
	let setFeedItems = function (xmlTxt) {

		lzUtil.log("\n", xmlTxt.substr(0, 512));

		// try to avoid a common XML/RSS Parsing Error: junk after document element
		xmlTxt = xmlTxt.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1")

		let domParser = new DOMParser();
		let doc = domParser.parseFromString(xmlTxt, "text/xml");

		let feeder, items, elm;
		let title, link, desc;


		// First lets try 'RSS'
		// https://validator.w3.org/feed/docs/rss2.html
		feeder = doc.querySelector("rss");		// There Can Be Only One


		// If 'RSS' fail let's try 'RDF Site Summary (RSS) 1.0'
		// https://validator.w3.org/feed/docs/rss1.html
		// Example: http://feeds.nature.com/nature/rss/current
		if (feeder === null) {
			feeder = doc.querySelector("RDF");		// There Can Be Only One
		}


		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if (feeder !== null) {

			lzUtil.log("Feed: " + feeder.localName.toUpperCase(), "v" + (feeder.getAttribute("version") || "?"));

			disposeList();
			
			feeder.querySelectorAll("item").forEach((item) => {

				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				title = item.querySelector("title").textContent;
				desc = item.querySelector("description") ? item.querySelector("description").textContent: "";
				link = item.querySelector("link").textContent;
				appendTagIL(title, desc, link);
			});

			} else {


			// If both 'RSS' and 'RDF Site Summary (RSS) 1.0' failed let's try 'Atom'
			// https://validator.w3.org/feed/docs/atom.html
			feeder = doc.querySelector("feed");		// There Can Be Only One

			if (feeder !== null) {

				lzUtil.log("Feed: Atom", "v" + (feeder.getAttribute("version") || "?"));

				disposeList();

				//sortFeederByDate(feeder.querySelectorAll("entry"), "modified").forEach((item) => {
				feeder.querySelectorAll("entry").forEach((item) => {

					title = item.querySelector("title").textContent;
					desc = item.querySelector("summary") ? item.querySelector("summary").textContent : "";
					if ((elm = item.querySelector("link:not([rel])")) ||
						(elm = item.querySelector("link[rel=alternate]")) ||
						(elm = item.querySelector("link"))) {
						link = elm.getAttribute("href");
					}
					appendTagIL(title, desc, link);
				});
			}
		}

		if (feeder === null) {
			setListErrorMsg("No RSS feed was identified or document is not valid.");
		}
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendTagIL = function (title, desc, link) {

		//lzUtil.log("history: ", textContent, href, decodeURI(href), encodeURI(href));

		let elm = document.createElement("li");

		setItemVisitedStatus(elm, link);

		elm.textContent = title;
		elm.setAttribute("title", desc);	// show my own box to show html tags
		elm.setAttribute("href", link);

		elm.addEventListener("click", onclickFeedItem);
		elm.addEventListener("auxclick", onclickFeedItem);
		elm.addEventListener("mousedown", onclickFeedItem_preventDefault);

		elmList.appendChild(elm);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onclickFeedItem_preventDefault = function (event) {

		// This is to prevent the default behaviour of Fx when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		event.preventDefault();		// The 'click' event is fired anyway.
		event.stopPropagation();
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let onclickFeedItem = function (event) {

		let elm = this;
		let handled = true;		// optimistic
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

		} else {
			handled = false;
		}

		if(handled) {
			lzUtil.concatClassName(elm, "visited");
			event.stopPropagation();
			event.preventDefault();
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
	let sortFeederByDate = function (feeder, selector) {
		let ary = Array.prototype.slice.call(feeder, 0);

		ary.sort((a, b) => {
			let d1 = Date.parse(a.querySelector(selector).textContent);
			let d2 = Date.parse(b.querySelector(selector).textContent);
			return d2 - d1;
		});

		return ary;
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setItemVisitedStatus = function (elm, link) {

		let query = {
		text: decodeURI(link),
		startTime: ((new Date()) - (1000*60*60*24*365*5)),		// about five year back
			maxResults: 1,
			};

				// url's in history are decoded and encodeURI in the rss's XML.
				browser.history.search(query).then((hItems) => {
			if (hItems.length > 0) {
				lzUtil.concatClassName(elm, "visited");
			}
		});		
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