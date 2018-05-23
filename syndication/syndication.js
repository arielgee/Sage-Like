"use strict";

let syndication = (function () {

	let SyndicationStandard = Object.freeze({
		invalid: 0,
		RSS: 1,
		RDF: 2,
		Atom: 3,
	});

    let domParser = new DOMParser();

	////////////////////////////////////////////////////////////////////////////////////
	//
	function discoverWebSiteFeed (url) {
		
		return new Promise((resolve, reject) => {

			fetch(url).then((response) => {

				if(response.ok) {

					response.text().then((txtHTML) => {
						let doc = domParser.parseFromString(txtHTML, "text/html");

						let feedUrlsList = new Array();

						let feedUrls = doc.querySelectorAll("link[type=\"application/rss+xml\"]");

						feedUrls.forEach((url) => {
							feedUrlsList.push( { title: url.title, url: url.href } );
						});
						resolve(feedUrlsList);
					});

				} else {
					reject("Fail to retrieve feed from '" + response.url + "', " + response.status + " " + response.statusText + ".");
				}

			}).catch((error) => {
				reject("Request failed to discover feed from '" + url + "', " + error.message);
			});
		});
	}
	
    ////////////////////////////////////////////////////////////////////////////////////
    //
    function fetchFeedItems (feedUrl, reload) {

        let init = {
            cache: reload ? "reload" : "default",
		};

        return new Promise((resolve, reject) => {

			fetch(feedUrl, init).then((response) => {

				if (response.ok) {

					response.blob().then((blob) => {

						getXMLTextFromBlob(blob).then((txtXML) => {

							console.log("[Sage-Like]", feedUrl + "\n", txtXML.substr(0, 256));

							let feedData = getFeedData(txtXML);
							let list = createFeedItemsList(feedData);

							if(list.length > 0) {
								resolve(list);
							} else {
								reject("RSS feed not identified or document not valid at '" + feedUrl + "'.");
							}
						});
                    });
				} else {
                    reject("Fail to retrieve feed items from '" + response.url + "', " + response.status + " " + response.statusText + ".");
				}

			}).catch((error) => {
				reject("Request failed to fetch feed from '" + feedUrl + "', " + error.message);
			});
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createFeedItemsList (feedData) {

        let elm, FeedItem;
		let FeedItemList = new Array();

		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if([SyndicationStandard.RSS, SyndicationStandard.RDF].indexOf(feedData.standard) !== -1) {

			console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("item"));

			feedData.feeder.forEach((item) => {

				FeedItem = new Object();

				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("description") ? item.querySelector("description").textContent : "";
				FeedItem["link"] = item.querySelector("link").textContent;
                FeedItemList.push(FeedItem);
			});

		} else if(feedData.standard === SyndicationStandard.Atom) {

			console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

			feedData.feeder.forEach((item) => {

				FeedItem = new Object();

				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("summary") ? item.querySelector("summary").textContent : "";
				if ((elm = item.querySelector("link:not([rel])")) ||
					(elm = item.querySelector("link[rel=alternate]")) ||
					(elm = item.querySelector("link"))) {
					FeedItem["link"] = elm.getAttribute("href");
				}
				FeedItemList.push(FeedItem);
			});
        }
        return FeedItemList;
    }

	////////////////////////////////////////////////////////////////////////////////////
	//
	function getFeedData (txtXML) {

		let feedData = {
			standard: SyndicationStandard.invalid,
			feeder: {},
			xmlEncoding: "",
		};

		// try to avoid a stupid XML/RSS Parsing Error: junk after document element
		txtXML = txtXML.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1")

		// try to get XML encoding from the XML prolog
		let test = txtXML.match(/<\?xml[^>]*encoding="([^"]*)"[^>]*>/);
		if(test && test[1]) {
			feedData.xmlEncoding =  test[1];
		}

		let doc = domParser.parseFromString(txtXML, "text/xml");

        // return if XML not well-formed
        if(doc.documentElement.nodeName === "parsererror") {
			console.log("[Sage-Like]", doc.documentElement.textContent);
            return feedData;
		}

		if(doc.documentElement.localName === "rss") {				// First lets try 'RSS'
			feedData.standard = SyndicationStandard.RSS;				// https://validator.w3.org/feed/docs/rss2.html
			feedData.feeder = doc.querySelector("rss");
		} else if(doc.documentElement.localName === "RDF") {		// Then let's try 'RDF (RSS) 1.0'
			feedData.standard = SyndicationStandard.RDF;				// https://validator.w3.org/feed/docs/rss1.html; Example: http://feeds.nature.com/nature/rss/current
			feedData.feeder = doc.querySelector("RDF");
		} else if(doc.documentElement.localName === "feed") {		// FInally let's try 'Atom'
			feedData.standard = SyndicationStandard.Atom;				// https://validator.w3.org/feed/docs/atom.html
			feedData.feeder = doc.querySelector("feed");
		}
		return feedData;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function getXMLTextFromBlob (blob) {

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
	//
	function sortFeederByDate (feeder) {

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let ary = Array.prototype.slice.call(feeder, 0);

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
		return ary;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function fetch_testings(feedUrl, reload) {
		throw "Function is not for use: Documentation only.";
		/*
			This test function is for fatching an XML file with none utf-8 encoding(Windows-1255): https://www.ynet.co.il/Integration/StoryRss1854.xml
			
			I descovered that the fetch/response.text() approach (method 2) only works when the encoding is utf-8 (XML prolog). When
			the encoding is different (Windows-1255 in the test case) i get junk (question marks).
			
			The third approach (method 3) is also not resolving the issue.		
		*/

		let init = {
			cache: reload ? "reload" : "default",
		};

		fetch(feedUrl, init).then((response) => {

			if (response.ok) {
				let res1 = response.clone();
				let res2 = response.clone();
				let res3 = response.clone();

				// Method 1 - GOOD: In this way the resulting text returns hebrew chars like a charm
				res1.blob().then((blob) => {	// GOOD
					let u = URL.createObjectURL(blob);
					let x = new XMLHttpRequest();
					x.open("GET", u, false);
					x.send();
					URL.revokeObjectURL(u);
					console.log("PROB1-blob", x.responseText);
				});

				// Method 2 - BAD: In this way the resulting text returns hebrew chars as question marks
				res2.text().then((txt) => {
					console.log("PROB1-txt", txt);
				});

				// Method 3 - BAD: In this way the resulting text returns hebrew chars as question marks
				res3.blob().then((blob) => {
					let reader = new FileReader();
					reader.onload = function () {
						console.log("PROB1-file", reader.result);
					}
					reader.readAsText(blob);
				});
			}

		}).catch((error) => {
			console.log(error);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function fetchFeedItems_usingXMLHttpRequest(feedUrl, reload) {
		throw "Function is not for use: Documentation only.";
		/*
			The XMLHttpRequest is a good alternitive to the fetch() function. Setting the
			xhr.responseType to 'document' resulted in an XMLDocument with valid hebrew chars (encoding=Windows-1255).
			The only problem is that I can't handle the 'XML Parsing Error: junk after document element': http://feeds.feedburner.com/digitalwhisper
			Since it is so simple to fix it and then process the XML I prefered the fetch/response.blob()/XMLHttpRequest/responseText approach
			that I used in the fetchFeedItems() function.
		*/

		let xhr = new XMLHttpRequest();
		xhr.open('GET', feedUrl, true);

		xhr.responseType = 'document';		// If specified, responseType must be empty string or "document"
		xhr.overrideMimeType('text/xml');	// overrideMimeType() can be used to force the response to be parsed as XML

		xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 200) {
					console.log("[=x=]", (typeof xhr.responseText), xhr.responseText);

					let xmlDoc = xhr.responseXML;
					let fdr = xmlDoc.querySelectorAll("item");

					fdr.forEach((item) => {
						console.log("[=x=]", item.querySelector("title").textContent);
					});
				}
			}
		};
		xhr.send();
	}

    //////////////////////////////////////////
    return {
        discoverWebSiteFeed: discoverWebSiteFeed,
        fetchFeedItems: fetchFeedItems,
	};
	
})();
