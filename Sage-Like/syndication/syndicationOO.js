"use strict";

let syndicationOO = (function() {

	const STANDARD_DISCOVERY_SELECTOR = "link[rel=\"alternate\" i][type=\"application/rss+xml\" i]," +		// standard publicized RSS for discovery
										"link[rel=\"alternate\" i][type=\"application/rdf+xml\" i]," +
										"link[rel=\"alternate\" i][type=\"application/atom+xml\" i]," +
										"link[rel=\"alternate\" i][type=\"application/rss+json\" i]," +
										"link[rel=\"alternate\" i][type=\"application/feed+json\" i]";

	const NON_STANDARD_ANCHOR_DISCOVERY_SELECTOR =	"a[href*=\"rss\" i]," +					// non-standard publication of RSS links
													"a[href*=\"feed\" i]," +
													"a[href*=\"atom\" i]," +
													"a[href*=\"syndicat\" i]";

	let m_domParser = new DOMParser();
	let m_regexpXMLEncoding = new RegExp("^\\s*<\\?xml\\b[^>]*\\bencoding\\s*=\\s*[\"']([^\"']*)[\"'][^>]*?>", "i");

	////////////////////////////////////////////////////////////////////////////////////
	function feedDiscovery(url, timeout, requestId = 0, reload) {

		return new Promise((resolve) => {

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
	function webPageFeedsDiscovery(txtHTML, timeout, origin, requestId, callback, aggressiveLevel = 0, reload) {

		return new Promise((resolve) => {

			let doc = m_domParser.parseFromString(txtHTML, "text/html");

			let selector = STANDARD_DISCOVERY_SELECTOR;								// standard publicized RSS for discovery

			if(aggressiveLevel === 1) {
				selector += "," + NON_STANDARD_ANCHOR_DISCOVERY_SELECTOR;			// non-standard publication of RSS links
			} else if(aggressiveLevel === 2) {
				selector += ",a[href]";												// all <a> anchors links
			}

			// array of just the url links (href) as strings for easy filtering of duplicates
			let linkFeeds = Array.from(doc.querySelectorAll(selector), item => slUtil.replaceMozExtensionOriginURL(item.href.stripHtmlTags(), origin).toString());

			// filter out duplicates
			linkFeeds = linkFeeds.filter((item, idx) => linkFeeds.indexOf(item) === idx);

			const objAbort = linkFeeds.length > 0 ? new AbortDiscovery() : null;

			resolve({ length: linkFeeds.length, abortObject: objAbort });

			for(let index=0, len=linkFeeds.length; index<len; index++) {

				let url = new URL(linkFeeds[index]);
				let discoveredFeed = {
					status: "init",
					url: url,
					requestId: requestId,
				};

				getFeedSourceText(url, reload, timeout).then((feedSrc) => {

					// exit immediately if aborted
					if(objAbort.isAborted) return;

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
					// Only if not aborted
					if(!objAbort.isAborted) callback(discoveredFeed);
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedData(url, timeout, reload) {

		return new Promise((resolve, reject) => {

			getFeedSourceText(url, reload, timeout).then((feedSrc) => {

				try {

					let objFeed = Feed.factoryCreateFeed(feedSrc.text, url);
					resolve({ feedData: objFeed.getFeedData() });

				} catch (error) {
					reject(new SyndicationError("Failed to get feed data.", error));
				}

			}).catch((error) => {
				reject(error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedItems(url, timeout, reload, noItemsReject = true) {

		return new Promise((resolve, reject) => {

			fetchFeedData(url, timeout, reload).then((result) => {

				let list = createFeedItemsList(result.feedData);

				if(list.length > 0 || !noItemsReject) {
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
		let i, len, item;

		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if([SyndicationStandard.RSS, SyndicationStandard.RDF].includes(feedData.standard)) {

			//console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("item"));

			for(i=0, len=feedData.feeder.length; i<len; i++) {

				item = feedData.feeder[i];
				elmLink = item.querySelector("link");

				if(elmLink) {
					// all versions have <title> & <link>. <description> is optional or missing (v0.90)
					FeedItem = createSingleListItemFeed(item.querySelector("title"),
														item.querySelector("description"),
														elmLink.textContent,
														getFeedItemLastUpdate(item));
					if (!!FeedItem) FeedItemList.push(FeedItem);
				}
			}

		} else if(feedData.standard === SyndicationStandard.Atom) {

			//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

			feedData.feeder = sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

			for(i=0, len=feedData.feeder.length; i<len; i++) {

				item = feedData.feeder[i];
				elmLink = item.querySelector("link:not([rel])") || item.querySelector("link[rel=alternate]") || item.querySelector("link");

				if(elmLink) {
					FeedItem = createSingleListItemFeed(item.querySelector("title"),
														item.querySelector("summary"),
														elmLink.getAttribute("href"),
														getFeedItemLastUpdate(item));
					if (!!FeedItem) FeedItemList.push(FeedItem);
				}
			}

		} else if(feedData.standard === SyndicationStandard.JSON) {

			//console.log("[Sage-Like]", "Feed: JSON", "v" + (feedData.jsonVersion.match(/[\d.]+$/) || "?"));

			feedData.feeder = sortJSONFeederByDate(feedData.feeder);

			for(i=0, len=feedData.feeder.length; i<len; i++) {

				item = feedData.feeder[i];

				// first option.
				// Ideally, the id is the full URL of the resource described by the item
				let itemUrl = item.id;

				if(!!!slUtil.validURL(itemUrl)) {

					// second options.
					// ++ some feeds put the url in the external_url (WTF?) 			// https://matthiasott.com/links/feed.json
					// ++ some feeds are for audio/video files as attachments (WTF?) 	// https://www.npr.org/feeds/510317/feed.json
					itemUrl = (!!item.url ? item.url : (!!item.external_url ? item.external_url : item.attachments[0].url));

					let oErr = {};
					if(!!!slUtil.validURL(itemUrl, oErr)) {
						console.log("[Sage-Like]", "URL validation", oErr.error);
						continue;		// skip and try next feed-item
					}
				}

				FeedItem = {
					title: getJSONFeedItemTitle(item).stripHtmlTags(),
					desc: getJSONFeedItemDesc(item).stripHtmlTags(),
					url: itemUrl.stripHtmlTags(),
					lastUpdated: getJSONFeedItemLastUpdate(item),
				};
				FeedItemList.push(FeedItem);
			}
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

						getResponseTextFromBlob(blob, "UTF-8").then((txt) => {

							// If no encoding was found in the text (XML or not) or the found encoding is 'UTF-8',
							// getXMLNoneUTF8Charset() returns an empty string, then all is good; resolve.
							// Otherwise, if some other encoding was found by getXMLNoneUTF8Charset(), reacquire the
							// text from the blob with the none 'UTF-8' encoding as the charset parameter.

							let charset = getXMLNoneUTF8Charset(txt);
							if(charset === "") {
								resolve({ text: txt });
							} else {
								getResponseTextFromBlob(blob, charset).then((txt) => resolve({ text: txt }) );
							}
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
		/*
			DEPRICATED
			still used by:
				feedDiscovery
				webPageFeedsDiscovery
		*/
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getResponseTextFromBlob(blob, charset) {

		return new Promise((resolve) => {

			let objUrl = URL.createObjectURL(blob);
			let xhr = new XMLHttpRequest();
			xhr.overrideMimeType("text/plain; charset=" + charset);
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
	function getJSONFeedItemTitle(item) {

		let retVal;

		if(!!item.title) {
			retVal = item.title;
		} else if(!!item.id) {
			retVal = item.id;
		} else {
			return "";
		}

		// some feed put an empty object in the summery (WTF?)			// https://matthiasott.com/articles/feed.json
		return (typeof(retVal) === "string" ? retVal : "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getJSONFeedItemDesc(item) {

		let retVal;

		if(!!item.summary) {
			retVal = item.summary;
		} else if(!!item.content_text) {
			retVal = item.content_text;
		} else if(!!item.content_html) {
			retVal = item.content_html;
		} else {
			return "";
		}

		// some feed put an empty object in the summery (WTF?)			// https://matthiasott.com/articles/feed.json
		return (typeof(retVal) === "string" ? retVal : "");
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
	function getXMLNoneUTF8Charset(txt) {
		let test = txt.match(m_regexpXMLEncoding);
		if(test && test[1] && test[1].toUpperCase() !== "UTF-8") {
			return test[1];
		}
		return "";
	}

	//////////////////////////////////////////
	return {
		feedDiscovery: feedDiscovery,
		webPageFeedsDiscovery: webPageFeedsDiscovery,
		fetchFeedData: fetchFeedData,
		fetchFeedItems: fetchFeedItems,
	};

})();
