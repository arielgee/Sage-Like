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
	function discoverWebSiteFeeds(txtHTML, timeout, origin, reload) {

		return new Promise((resolve) => {

			let doc = m_domParser.parseFromString(txtHTML, "text/html");

			let selector =	"link[type=\"application/rss+xml\"]," +
							"link[type=\"application/rdf+xml\"]," +
							"link[type=\"application/atom+xml\"]";

			let feeds = doc.querySelectorAll(selector);

			if(feeds.length === 0) {
				resolve({});		// if nothing found return empty list object
			} else {

				let allPromises = [];
				let feedData;
				let discoveredFeedsList = {};

				// for each feed found create a list item and create a promise that will return the feed's XML text
				feeds.forEach((feed) => {
					let url = slUtil.replaceMozExtensionOriginURL(feed.href, origin);
					discoveredFeedsList[url] = { status: "init", title: feed.title, url: url };
					allPromises.push(getFeedXMLText(url, reload, timeout));
				});

				// for all promises created above get feed data and update the list item
				// Promise.all is fail-fast; first rejected promise will reject all immediately so convert catch error to simple regular (success) value.
				Promise.all(allPromises.map(p => p.catch((e) => { return e; }))).then((feedXMLs) => {

					feedXMLs.forEach((feedXML) => {

						// if undefined then this promise was rejected; got the error (e) instead of the feedXML
						if(feedXML.txtXML !== undefined) {
							feedData = getFeedData(feedXML.txtXML);

							if(feedData.standard === SyndicationStandard.invalid) {
								discoveredFeedsList['error'] = { status: "error", message: feedData.errorMsg };
							} else {
								discoveredFeedsList[feedXML.url] = {
									status: "OK",
									title: (feedData.title.length >0 ? feedData.title : discoveredFeedsList[feedXML.url].title),
									url: discoveredFeedsList[feedXML.url].url,
									lastUpdated: feedData.lastUpdated,
									format: feedData.standard,
									items: feedData.items,
								};
							}
						} else {
							discoveredFeedsList['error'] = { status: "error", message: feedXML };
						}
					});
					resolve(discoveredFeedsList);
				});
			}
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
				reject(error);
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
				reject(error);
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
						reject("Failed to get response stream (blob). " + error.message);
					});

				} else {
					reject("Failed to retrieve feed XML from URL. " + response.status + " " + response.statusText);
				}

			}).catch((error) => {
				reject("Failed to fetch feed from URL. " + error.message);
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

		// try to avoid a stupid XML/RSS Parsing Error: junk after document element
		txtXML = txtXML.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1")

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
		//		and selectorSuffixes[6] = " > item > modified"
		const baseSelectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];
		const selectorSuffixes = baseSelectorSuffixes.concat(baseSelectorSuffixes.map(s => " > " + fallbackSelector + s))

		let lastUpdate;

		for (let selector of selectorSuffixes) {

			lastUpdate = doc.querySelector(selectorPrefix + selector);

			if(lastUpdate) {
				let txtVal = lastUpdate.textContent.replace(/\ Z$/, "");
				let dateVal = (new Date(txtVal));
				return (isNaN(dateVal) ? txtVal : dateVal);
			}
		}
		return slUtil.getCurrentLocaleDate();	// final fallback
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
