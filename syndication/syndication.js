"use strict";

let syndication = (function() {

	let SyndicationStandard = Object.freeze({
		invalid: "n/a",
		RSS: "RSS",
		RDF: "RDF",
		Atom: "Atom",
	});

	let m_domParser = new DOMParser();

	////////////////////////////////////////////////////////////////////////////////////
	function discoverWebSiteFeeds(txtHTML, timeout, origin, requestId, callback, reload) {

		return new Promise((resolve) => {

			let doc = m_domParser.parseFromString(txtHTML, "text/html");

			let selector =	"link[type=\"application/rss+xml\"]," +
							"link[type=\"application/rdf+xml\"]," +
							"link[type=\"application/atom+xml\"]";

			let linkFeeds = doc.querySelectorAll(selector);

			resolve({ length: linkFeeds.length });

			linkFeeds.forEach((linkFeed, index) => {

				let url = slUtil.replaceMozExtensionOriginURL(linkFeed.href, origin);
				let discoveredFeed = {
					status: "init",
					linkTitle: linkFeed.title,
					url: url,
					requestId: requestId,
				};

				getFeedXMLText(url, reload, timeout).then((feedXML) => {

					// if undefined then this promise was rejected; got the error (e) instead of the feedXML
					if(feedXML.txtXML !== undefined) {

						let feedData = getFeedData(feedXML.txtXML);

						if(feedData.standard === SyndicationStandard.invalid) {
							discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: feedData.errorMsg});
						} else {
							discoveredFeed = Object.assign(discoveredFeed, {
								status: "OK",
								index: index,
								feedTitle: feedData.title,
								lastUpdated: feedData.lastUpdated,
								format: feedData.standard,
								items: feedData.items,
							});
						}
					} else {
						discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: feedXML.message});
					}
					callback(discoveredFeed);
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedData(url, timeout, reload) {

		return new Promise((resolve, reject) => {

			getFeedXMLText(url, reload, timeout).then((feedXML) => {

				let feedData = getFeedData(feedXML.txtXML);

				if(feedData.standard === SyndicationStandard.invalid) {
					reject("Failed to get feed data. " + feedData.errorMsg);
				} else {
					resolve(feedData);
				}

			}).catch((error) => {
				reject(error.message);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedItems(url, timeout, reload) {

		return new Promise((resolve, reject) => {

			getFeedXMLText(url, reload, timeout).then((feedXML) => {

				let feedData = getFeedData(feedXML.txtXML);

				if(feedData.standard === SyndicationStandard.invalid) {
					reject("Failed to get feed data. " + feedData.errorMsg);
				} else {
					let list = createFeedItemsList(feedData);

					if(list.length > 0) {
						resolve({ list: list, feedData: feedData});
					} else {
						reject("No RSS feed items identified in document.");
					}
				}
			}).catch((error) => {
				reject(error.message);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemsList(feedData) {

		let elm, FeedItem;
		let FeedItemList = [];

		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if([SyndicationStandard.RSS, SyndicationStandard.RDF].indexOf(feedData.standard) !== -1) {

			//console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("item"));

			feedData.feeder.forEach((item) => {

				FeedItem = new Object();

				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("description") ? item.querySelector("description").textContent : "";
				FeedItem["url"] = item.querySelector("link").textContent;
				FeedItemList.push(FeedItem);
			});

		} else if(feedData.standard === SyndicationStandard.Atom) {

			//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

			feedData.feeder.forEach((item) => {

				FeedItem = new Object();

				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("summary") ? item.querySelector("summary").textContent : "";
				if ((elm = item.querySelector("link:not([rel])")) ||
					(elm = item.querySelector("link[rel=alternate]")) ||
					(elm = item.querySelector("link"))) {
					FeedItem["url"] = elm.getAttribute("href");
				}
				FeedItemList.push(FeedItem);
			});
		}
		return FeedItemList;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedXMLText(url, reload = false, timeout = 60000) {

		let init = {
			cache: reload ? "reload" : "default",
		};

		return new Promise((resolve, reject) => {

			fetchWithTimeout(url, init, timeout).then((response) => {

				if (response.ok) {

					response.blob().then((blob) => {

						getXMLTextFromBlob(blob).then((txtXML) => {
							//console.log("[Sage-Like]", url + "\n", txtXML.substr(0, 1024));
							resolve( { url: url, txtXML: txtXML } );
						});
					}).catch((error) => {
						reject( { url: url, message: "Failed to get response stream (blob). " + error.message } );
					});

				} else {
					reject( { url: url, message: "Failed to retrieve feed XML from URL. " + response.status + " " + response.statusText } );
				}

			}).catch((error) => {
				reject( { url: url, message: "Failed to fetch feed from URL. " + error.message } );
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedData(txtXML) {

		let feedData = {
			standard: SyndicationStandard.invalid,
			xmlEncoding: "",
			feeder: {},
			title: "",
			lastUpdated: 0,
			items: 0,
			errorMsg: "",
		};

		// try to avoid a stupid XML/RSS Parsing Errors
		txtXML = txtXML.replace(RegExp("^[ \t\n\r]+"), "");							// XML declaration (prolog) not at start of document
		txtXML = txtXML.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1");		// junk after document element

		// try to get XML encoding from the XML prolog
		let test = txtXML.match(/<\?xml[^>]*encoding="([^"]*)"[^>]*>/);
		if(test && test[1]) {
			feedData.xmlEncoding = test[1];
		}

		let doc = m_domParser.parseFromString(txtXML, "text/xml");

		// return if XML not well-formed
		if(doc.documentElement.nodeName === "parsererror") {
			feedData.errorMsg = doc.documentElement.textContent.split("\n", 1)[0];	// only the first line
			return feedData;
		}

		try {
			if(doc.documentElement.localName === "rss") {							// First lets try 'RSS'
				feedData.standard = SyndicationStandard.RSS;							// https://validator.w3.org/feed/docs/rss2.html
				feedData.feeder = doc.querySelector("rss");
				feedData.title = getFeedTitle(doc, "rss > channel");
				feedData.lastUpdated = getFeedLastUpdate(doc, "rss > channel", "item");
				feedData.items = feedData.feeder.querySelectorAll("item").length;
			} else if(doc.documentElement.localName === "RDF") {					// Then let's try 'RDF (RSS) 1.0'
				feedData.standard = SyndicationStandard.RDF;							// https://validator.w3.org/feed/docs/rss1.html; Examples: http://feeds.nature.com/nature/rss/current, https://f1-gate.com/
				feedData.feeder = doc.querySelector("RDF");
				feedData.title = getFeedTitle(doc, "RDF > channel");
				feedData.lastUpdated = getFeedLastUpdate(doc, "RDF > channel", "item");
				feedData.items = feedData.feeder.querySelectorAll("item").length;
			} else if(doc.documentElement.localName === "feed") {					// FInally let's try 'Atom'
				feedData.standard = SyndicationStandard.Atom;							// https://validator.w3.org/feed/docs/atom.html
				feedData.feeder = doc.querySelector("feed");
				feedData.title = getFeedTitle(doc, "feed");
				feedData.lastUpdated = getFeedLastUpdate(doc, "feed", "entry");
				feedData.items = feedData.feeder.querySelectorAll("entry").length;
			} else {
				feedData.errorMsg = "RSS feed not identified in document";
			}
		} catch (error) {
			feedData.errorMsg = error.message;
		}
		return feedData;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getXMLTextFromBlob(blob) {

		return new Promise((resolve) => {

			let objUrl = URL.createObjectURL(blob);
			let xhr = new XMLHttpRequest();
			xhr.open("GET", objUrl);
			xhr.onload = function() {
				if(xhr.readyState === xhr.DONE && xhr.status === 200) {
					URL.revokeObjectURL(objUrl);
					resolve(xhr.responseText);
				}
			};
			xhr.send();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchWithTimeout(url, init, timeout) {

		return Promise.race([
			fetch(url, init),
			new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout) ),
		]);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedTitle(doc, selectorPrefix) {

		const selectorSuffixes = [ " > title" ];

		let title;

		for (let selector of selectorSuffixes) {
			title = doc.querySelector(selectorPrefix + selector);
			return (title ? title.textContent : "");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedLastUpdate(doc, selectorPrefix, fallbackSelector) {

		// if date was not found in the standed XML tags (baseSelectorSuffixes) get the date from the first
		// feed item (fallbackSelector) in the XML.
		// Example:
		//		If fallbackSelector = "item"
		// 		then selectorSuffixes[1] = " > modified"
		//		and fallbackSelectorSuffixes[1] = " > item > modified"
		const selectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];
		const fallbackSelectorSuffixes = selectorSuffixes.map(s => " > " + fallbackSelector + s);

		let elmLastUpdate, txtLastUpdateVal = "", dateVal = NaN;

		for (let selector of selectorSuffixes) {

			elmLastUpdate = doc.querySelector(selectorPrefix + selector);

			if(elmLastUpdate) {
				txtLastUpdateVal = elmLastUpdate.textContent.replace(/\ Z$/, "");
				dateVal = (new Date(txtLastUpdateVal));
				break;
			}
		}

		if(isNaN(dateVal)) {
			for (let selector of fallbackSelectorSuffixes) {

				elmLastUpdate = doc.querySelector(selectorPrefix + selector);

				if(elmLastUpdate) {
					dateVal = (new Date(elmLastUpdate.textContent.replace(/\ Z$/, "")));
					break;
				}
			}
		}

		if(isNaN(dateVal)) {
			return txtLastUpdateVal.length > 0 ? txtLastUpdateVal : slUtil.getCurrentLocaleDate();	// final fallback
		} else {
			return dateVal;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sortFeederByDate(feeder) {

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let ary = Array.prototype.slice.call(feeder, 0);

		if(ary[0] !== undefined) {

			for (let selector of selectores) {
				if(ary[0].querySelector(selector) !== null) {

					ary.sort((a, b) => {
						let d1 = Date.parse(a.querySelector(selector).textContent);
						let d2 = Date.parse(b.querySelector(selector).textContent);
						return d2 - d1;
					});

					break;
				}
			}
		}
		return ary;
	}

	//////////////////////////////////////////
	return {
		discoverWebSiteFeeds: discoverWebSiteFeeds,
		fetchFeedData: fetchFeedData,
		fetchFeedItems: fetchFeedItems,
	};

})();
