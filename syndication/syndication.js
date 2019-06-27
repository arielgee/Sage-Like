"use strict";

class SyndicationError extends Error {
	constructor(message, errInfo = undefined) {
		if(errInfo) {
			if(errInfo instanceof Error) {
				message += " [ " + errInfo.message + " ]";
			} else if(typeof(errInfo) === "string") {
				message += " [ " + errInfo + " ]";
			}
		}
		super(message);
	}
}

let syndication = (function() {

	let SyndicationStandard = Object.freeze({
		invalid: "n/a",
		RSS: "RSS",
		RDF: "RDF",
		Atom: "Atom",
		JSON: "JSON",
	});

	let m_domParser = new DOMParser();

	////////////////////////////////////////////////////////////////////////////////////
	function feedDiscovery(url, timeout, reload) {

		return new Promise((resolve) => {

			let discoveredFeed = {
				status: "init",
				url: url,
			};

			getFeedSourceText(url, reload, timeout).then((feedSrc) => {

				let feedData = getFeedData(feedSrc.text, url);

				if(feedData.standard === SyndicationStandard.invalid) {
					discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: feedData.errorMsg});
				} else {
					discoveredFeed = Object.assign(discoveredFeed, {
						status: "OK",
						index: 0,		// there is only one
						feedTitle: feedData.title,
						lastUpdated: feedData.lastUpdated,
						format: feedData.standard,
						itemCount: feedData.itemCount,
					});
				}
			}).catch((error) => {
				discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: error.message});
			}).finally(() => {
				resolve(discoveredFeed);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function webPageFeedsDiscovery(txtHTML, timeout, origin, requestId, callback, aggressive = false, reload) {

		return new Promise((resolve) => {

			let doc = m_domParser.parseFromString(txtHTML, "text/html");

			let selector =	"link[rel=\"alternate\" i][type=\"application/rss+xml\" i]," +		// standard publicized RSS for discovery
							"link[rel=\"alternate\" i][type=\"application/rdf+xml\" i]," +
							"link[rel=\"alternate\" i][type=\"application/atom+xml\" i]," +
							"link[rel=\"alternate\" i][type=\"application/json\" i]";

			let anchorRssLinks = "a[href*=\"rss\" i]," +					// non-standard publication of RSS links
								 "a[href*=\"feed\" i]," +
								 "a[href*=\"atom\" i]," +
								 "a[href*=\"syndicat\" i]";

			if(aggressive) {
				selector += "," + anchorRssLinks;
			}

			// array of just the url links (href) as strings for easy filtering of duplicates
			let linkFeeds = Array.from(doc.querySelectorAll(selector), item => slUtil.replaceMozExtensionOriginURL(item.href.stripHtmlTags(), origin).toString());

			// filter out duplicates
			linkFeeds = linkFeeds.filter((item, idx) => linkFeeds.indexOf(item) === idx);

			resolve({ length: linkFeeds.length });

			linkFeeds.forEach((linkFeed, index) => {

				let url = new URL(linkFeed);
				let discoveredFeed = {
					status: "init",
					url: url,
					requestId: requestId,
				};

				getFeedSourceText(url, reload, timeout).then((feedSrc) => {

					let feedData = getFeedData(feedSrc.text, url);

					if(feedData.standard === SyndicationStandard.invalid) {
						discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: feedData.errorMsg});
					} else {
						discoveredFeed = Object.assign(discoveredFeed, {
							status: "OK",
							index: index,
							feedTitle: feedData.title,
							lastUpdated: feedData.lastUpdated,
							format: feedData.standard,
							itemCount: feedData.itemCount,
						});
					}
				}).catch((error) => {
					discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: error.message});
				}).finally(() => {
					callback(discoveredFeed);
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedData(url, timeout, reload) {

		return new Promise((resolve, reject) => {

			getFeedSourceText(url, reload, timeout).then((feedSrc) => {

				let feedData = getFeedData(feedSrc.text, url);

				if(feedData.standard === SyndicationStandard.invalid) {
					reject(new SyndicationError("Failed to get feed data.", feedData.errorMsg));
				} else {
					resolve({ feedData: feedData });
				}

			}).catch((error) => {
				reject(error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedItems(url, timeout, reload) {

		return new Promise((resolve, reject) => {

			fetchFeedData(url, timeout, reload).then((result) => {

				let list = createFeedItemsList(result.feedData);

				if(list.length > 0) {
					resolve({ list: list, feedData: result.feedData});
				} else {
					reject(new SyndicationError("No RSS feed items identified in document."));
				}

			}).catch((error) => {
				reject(error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemsList(feedData) {

		let elmLink, FeedItem;
		let FeedItemList = [];

		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if([SyndicationStandard.RSS, SyndicationStandard.RDF].includes(feedData.standard)) {

			//console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("item"));

			feedData.feeder.forEach((item) => {

				elmLink = item.querySelector("link");

				if(elmLink) {
					// all versions have <title> & <link>. <description> is optional or missing (v0.90)
					FeedItem = createSingleListItemFeed(item.querySelector("title"),
														item.querySelector("description"),
														elmLink.textContent,
														getFeedItemLastUpdate(item));
					if (!!FeedItem) FeedItemList.push(FeedItem);
				}
			});

		} else if(feedData.standard === SyndicationStandard.Atom) {

			//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

			feedData.feeder.forEach((item) => {

				elmLink = item.querySelector("link:not([rel])") || item.querySelector("link[rel=alternate]") || item.querySelector("link");

				if(elmLink) {
					FeedItem = createSingleListItemFeed(item.querySelector("title"),
														item.querySelector("summary"),
														elmLink.getAttribute("href"),
														getFeedItemLastUpdate(item));
					if (!!FeedItem) FeedItemList.push(FeedItem);
				}
			});

		} else if(feedData.standard === SyndicationStandard.JSON) {

			//console.log("[Sage-Like]", "Feed: JSON", "v" + (feedData.jsonVersion.match(/[\d.]+$/) || "?"));

			feedData.feeder = sortJSONFeederByDate(feedData.feeder);

			feedData.feeder.forEach((item) => {

				try {
					new URL(item.url);

					FeedItem = {
						title: item.title.stripHtmlTags(),
						desc: (!!item.summary ? item.summary : (!!item.content_text ? item.content_text : "")).stripHtmlTags(),
						url: item.url.stripHtmlTags(),
						lastUpdated: getJSONFeedItemLastUpdate(item),
					};
					FeedItemList.push(FeedItem);
				} catch (error) {
					console.log("[Sage-Like]", "URL validation", error);
				}
			});
		}
		return FeedItemList;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSingleListItemFeed(elmTitle, elmDesc, strUrl, valLastUpdated) {

		try {
			new URL(strUrl);
		} catch (error) {
			console.log("[Sage-Like]", "URL validation", error);
			return null;
		}

		return {
			"title": elmTitle ? elmTitle.textContent.stripHtmlTags() : "",
			"desc": elmDesc ? elmDesc.textContent.stripUnsafeHtmlComponents() : "",
			"url": strUrl.stripHtmlTags(),
			"lastUpdated": valLastUpdated,
		};
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedSourceText(url, reload = false, timeout = 60000) {

		let init = {
			cache: reload ? "reload" : "default",
		};

		return new Promise((resolve, reject) => {

			fetchWithTimeout(url, init, timeout).then((response) => {

				if (response.ok) {

					response.blob().then((blob) => {

						getResponseTextFromBlob(blob).then((txt) => {
							//console.log("[Sage-Like]", url, "\n" + txt.substr(0, 1024));
							resolve( { text: txt } );
						});
					}).catch((error) => {
						reject(new SyndicationError("Failed to get response stream (blob).", error));
					});

				} else {
					reject(new SyndicationError("Failed to retrieve feed source text from URL.", response.status + ": " + response.statusText));
				}

			}).catch((error) => {
				reject(new SyndicationError("Failed to fetch feed from URL.", error));
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedData(text, logUrl) {

		if(text.match(/^[ \t\n\r]*<\?xml\b/i)) {			// XML prolog for RSS/RDF/Atom

			return getXMLFeedData(text, logUrl);

		} else if(text.match(/^\s*{/i)) {			// JSON version for jsonfeed

			return getJSONFeedData(text, logUrl);

		} else {

			let errMsg = "Feed format is neither XML nor JSON.";

			console.log("[Sage-Like]", "Parser Error at " + logUrl, "\n" + errMsg);
			return {
				standard: SyndicationStandard.invalid,
				errorMsg: errMsg,
			};

		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getXMLFeedData(txtXML, logUrl) {

		let feedData = {
			standard: SyndicationStandard.invalid,
			xmlVersion: "",
			xmlEncoding: "",
			feeder: {},
			title: "",
			imageUrl: "",
			description: "",
			lastUpdated: 0,
			itemCount: 0,
			errorMsg: "",
		};

		// try to get XML version from the XML prolog
		let test = txtXML.match(/^[ \t\n\r]*<\?xml\b[^>]*\bversion\s*=\s*["']([^"']*)["'][^>]*?>/);
		if(test && test[1]) {
			feedData.xmlVersion = test[1];
		}

		// try to get XML encoding from the XML prolog
		test = txtXML.match(/^[ \t\n\r]*<\?xml\b[^>]*\bencoding\s*=\s*["']([^"']*)["'][^>]*?>/);
		if(test && test[1]) {
			feedData.xmlEncoding = test[1];
		}

		txtXML = removeXMLParsingErrors(txtXML, feedData.xmlVersion);

		// This line is the one that throw to the console the log line 'XML Parsing Error: not well-formed' at
		// the location of: 'moz-extension://66135a72-02a1-4a68-a040-60511bfea6a2/sidebar/panel.html'.
		let doc = m_domParser.parseFromString(txtXML, "text/xml");

		// return if XML not well-formed
		if(doc.documentElement.nodeName === "parsererror") {

			console.log("[Sage-Like]", "Parser Error at " + logUrl, "\n" + doc.documentElement.textContent);

			// the first line and the error location
			let found = doc.documentElement.textContent.match(/^(.*)[\s\S]*(line number \d+, column \d+):.*/i);
			feedData.errorMsg = (found[1] ? found[1] + ". " : "") + (found[2] ? found[2] : "");
			return feedData;
		}

		try {
			if(doc.documentElement.localName === "rss") {							// First lets try 'RSS'
				feedData.standard = SyndicationStandard.RSS;							// https://validator.w3.org/feed/docs/rss2.html
				feedData.feeder = doc.querySelector("rss");
				feedData.title = getNodeTextContent(doc, "rss > channel > title");
				feedData.imageUrl = getNodeTextContent(doc, "rss > channel > image > url");
				feedData.description = getNodeTextContent(doc, "rss > channel > description");
				feedData.lastUpdated = getFeedLastUpdate(doc, "rss > channel", "item");
				feedData.itemCount = feedData.feeder.querySelectorAll("item").length;
			} else if(doc.documentElement.localName === "RDF") {					// Then let's try 'RDF (RSS) 1.0'
				feedData.standard = SyndicationStandard.RDF;							// https://validator.w3.org/feed/docs/rss1.html; Examples: http://feeds.nature.com/nature/rss/current, https://f1-gate.com/
				feedData.feeder = doc.querySelector("RDF");
				feedData.title = getNodeTextContent(doc, "RDF > channel > title");
				feedData.imageUrl = getNodeTextContent(doc, "RDF > image > url");
				feedData.description = getNodeTextContent(doc, "RDF > channel > description");
				feedData.lastUpdated = getFeedLastUpdate(doc, "RDF > channel", "item");
				feedData.itemCount = feedData.feeder.querySelectorAll("item").length;
			} else if(doc.documentElement.localName === "feed") {					// FInally let's try 'Atom'
				feedData.standard = SyndicationStandard.Atom;							// https://validator.w3.org/feed/docs/atom.html
				feedData.feeder = doc.querySelector("feed");
				feedData.title = getNodeTextContent(doc, "feed > title");
				feedData.imageUrl = getNodeTextContent(doc, "feed > logo", "feed > icon");
				feedData.description = getNodeTextContent(doc, "feed > subtitle");
				feedData.lastUpdated = getFeedLastUpdate(doc, "feed", "entry");
				feedData.itemCount = feedData.feeder.querySelectorAll("entry").length;
			} else {
				feedData.errorMsg = "RSS feed not identified in document";
			}
		} catch (error) {
			feedData.errorMsg = error.message;
		}
		return feedData;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getJSONFeedData(txtJson, logUrl) {

		let feedData = {
			standard: SyndicationStandard.invalid,
			jsonVersion: "",
			feeder: [],
			title: "",
			imageUrl: "",
			description: "",
			lastUpdated: 0,
			itemCount: 0,
			errorMsg: "",
		};

		let oJson;

		try {
			oJson = JSON.parse(txtJson);

			if(!!!oJson.version) throw { message: "Invalid jsonfeed, top-level string 'version:' is undefined." };
			if(!oJson.version.startsWith("https://jsonfeed.org/version/")) throw { message: "invalid jsonfeed, unexpected version value. '" +  oJson.version + "'"};

		} catch (error) {
			console.log("[Sage-Like]", "Parser Error at " + logUrl, "\n" + error.message);
			feedData.errorMsg = error.message
			return feedData;
		}

		try {
			feedData.standard = SyndicationStandard.JSON;					// https://daringfireball.net/feeds/json
			feedData.jsonVersion = oJson.version.match(/[\d.]+$/)[0];
			feedData.feeder = oJson.items;
			feedData.title = (!!oJson.title ? oJson.title.stripHtmlTags() : "");
			feedData.imageUrl = (!!oJson.icon ? oJson.icon : (!!oJson.favicon ? oJson.favicon : "")).stripHtmlTags();
			feedData.description = (!!oJson.description ? oJson.description.stripHtmlTags() : "");
			feedData.lastUpdated = getJSONFeedLastUpdate(oJson.items);
			feedData.itemCount = oJson.items.length;

			//console.log("[Sage-Like feedData]", feedData);

		} catch (error) {
			feedData.errorMsg = error.message;
		}
		return feedData
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getResponseTextFromBlob(blob) {

		return new Promise((resolve) => {

			let objUrl = URL.createObjectURL(blob);
			let xhr = new XMLHttpRequest();
			xhr.overrideMimeType("text/plain");
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
	function getNodeTextContent(doc, selector, fallbackSelector) {
		let node = doc.querySelector(selector);

		if(!!node) {
			return node.textContent.stripHtmlTags()
		} else if(!!fallbackSelector) {
			node = doc.querySelector(fallbackSelector);
			return (node ? node.textContent.stripHtmlTags() : "");
		} else {
			return "";
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
	function getFeedItemLastUpdate(item) {

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let elmLastUpdated, txtLastUpdatedVal = "",  dateVal = NaN;

		for (let selector of selectores) {

			elmLastUpdated = item.querySelector(selector);
			if(elmLastUpdated) {
				txtLastUpdatedVal = elmLastUpdated.textContent.replace(/\ Z$/, "");
				dateVal = (new Date(txtLastUpdatedVal));
				break;
			}
		}

		if(isNaN(dateVal)) {
			txtLastUpdatedVal = txtLastUpdatedVal.stripHtmlTags();
			return txtLastUpdatedVal.length > 0 ? txtLastUpdatedVal : slUtil.getCurrentLocaleDate();	// fallback
		} else {
			return dateVal;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getJSONFeedLastUpdate(items) {

		let dateVal = new Date(items.reduce((prv, cur) => prv.date_modified > cur.date_modified ? prv : cur ).date_modified);

		if(isNaN(dateVal)) {
			dateVal = new Date(items.reduce((prv, cur) => prv.date_published > cur.date_published ? prv : cur ).date_published);
			return isNaN(dateVal) ? slUtil.getCurrentLocaleDate() : dateVal;
		} else {
			return dateVal;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getJSONFeedItemLastUpdate(item) {

		let dateVal = new Date(item.date_modified);

		if(isNaN(dateVal)) {
			dateVal = new Date(item.date_published);
			return isNaN(dateVal) ? slUtil.getCurrentLocaleDate() : dateVal;
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
						let aNode = a.querySelector(selector);
						let bNode = b.querySelector(selector);
						let d1 = aNode ? Date.parse(aNode.textContent) : 0;
						let d2 = bNode ? Date.parse(bNode.textContent) : 0;
						return d2 - d1;
					});

					break;
				}
			}
		}
		return ary;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sortJSONFeederByDate(feeder) {

		let ary = Array.prototype.slice.call(feeder, 0);

		if(!!(ary[0])) {

			ary.sort((a, b) => {
				let v1 = Date.parse(a.date_modified || a.date_published);
				let v2 = Date.parse(b.date_modified || b.date_published);
				let d1 = isNaN(v1) ? 0 : v1;
				let d2 = isNaN(v2) ? 0 : v2;
				return d2 - d1;
			});
		}
		return ary;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeXMLParsingErrors(txtXML, xmlVersion) {

		// try to avoid stupid XML/RSS Parsing Errors
		txtXML = txtXML.replace(RegExp("^[ \t\n\r]+"), "");							// XML declaration (prolog) not at start of document
		txtXML = txtXML.replace(RegExp("(</(rss|feed|(([a-zA-Z0-9-_.]+:)?RDF))>)[\\S\\s]+"), "$1");		// junk after document element

		// remove invalid characters
		if(xmlVersion === "1.0") {
			// xml 1.0	-	https://www.w3.org/TR/REC-xml/#charsets
			txtXML = txtXML.replace(RegExp("[^\u0009\r\n\u0020-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+", "ug"), "");
		} else if(xmlVersion === "1.1") {
			// xml 1.1	-	https://www.w3.org/TR/2006/REC-xml11-20060816/#charsets
			txtXML = txtXML.replace(RegExp("[^\u0001-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+", "ug"), "");
		}

		return txtXML;
	}

	//////////////////////////////////////////
	return {
		feedDiscovery: feedDiscovery,
		webPageFeedsDiscovery: webPageFeedsDiscovery,
		fetchFeedData: fetchFeedData,
		fetchFeedItems: fetchFeedItems,
	};

})();
