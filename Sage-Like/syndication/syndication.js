"use strict";

let syndication = (function() {

	const STANDARD_DISCOVERY_SELECTOR = "link[rel=\"alternate\" i][type=\"application/rss+xml\" i]," +		// standard publicized RSS for discovery
										"link[rel=\"alternate\" i][type=\"application/rdf+xml\" i]," +
										"link[rel=\"alternate\" i][type=\"application/atom+xml\" i]," +
										"link[rel=\"alternate\" i][type=\"application/rss+json\" i]," +
										"link[rel=\"alternate\" i][type=\"application/feed+json\" i]";

	const NON_STANDARD_ANCHOR_DISCOVERY_SELECTOR =	"a[href*=\"rss\" i]," +					// non-standard publication of RSS links
													"a[href*=\"feed\" i]," +
													"a[href*=\"atom\" i]," +
													"a[href*=\"syndicat\" i]";

	////////////////////////////////////////////////////////////////////////////////////
	function feedDiscovery(url, timeout, requestId = 0, reload = false) {

		return new Promise((resolve) => {

			let discoveredFeed = createObjectDiscoveredFeed(url, requestId);

			getFeedSourceText(url, reload, timeout).then((feedSrc) => {
				setDiscoveredFeedFromSource(discoveredFeed, feedSrc, (new URL(url)), 0);
			}).catch((error) => {
				discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: error.message});
			}).finally(() => {
				resolve(discoveredFeed);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function webPageFeedsDiscovery(txtHTML, timeout, origin, requestId, callback, aggressiveLevel = 0, reload = false) {

		return new Promise(async (resolve) => {

			let doc = g_feed.domParser.parseFromString(txtHTML, "text/html");

			let selector = STANDARD_DISCOVERY_SELECTOR;								// standard publicized RSS for discovery

			if(aggressiveLevel === 1) {
				selector += "," + NON_STANDARD_ANCHOR_DISCOVERY_SELECTOR;			// non-standard publication of RSS links
			} else if(aggressiveLevel === 2) {
				selector += ",a[href]";												// all <a> anchors links
			}

			// array of just the url links (href) as strings for easy filtering of duplicates
			let linkFeeds = Array.from(doc.querySelectorAll(selector), item => slUtil.replaceMozExtensionOriginURL(item.href.stripHtmlTags(), origin).toString());
			let iframeHosts = [];

			// will NOT check in iframes when aggressive level is 0 ('none')
			if(aggressiveLevel > 0) {
				let result = await getLinkFeedsFromFrames(doc, selector, timeout);
				linkFeeds = linkFeeds.concat(result.linkFeeds);
				iframeHosts = result.hosts;
			}

			// filter out duplicates and invalid urls
			linkFeeds = linkFeeds.filter((item, idx) => ( (linkFeeds.indexOf(item) === idx) && !!slUtil.validURL(item) ) );

			const objAbort = linkFeeds.length > 0 ? new AbortDiscovery() : null;

			resolve({ length: linkFeeds.length, abortObject: objAbort, iframeHosts: iframeHosts });

			for(let index=0, len=linkFeeds.length; index<len; index++) {

				let url = new URL(linkFeeds[index]);
				let discoveredFeed = createObjectDiscoveredFeed(url.toString(), requestId);

				getFeedSourceText(url, reload, timeout).then((feedSrc) => {

					if(objAbort.isAborted) return;		// exit immediately if aborted

					setDiscoveredFeedFromSource(discoveredFeed, feedSrc, url, index);

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
					resolve({ feedData: Feed.factoryCreateBySrc(feedSrc.text, url).getFeedData() });
				} catch (error) {
					reject(new SyndicationError("Failed to get feed data.", error));
				}

			}).catch((error) => {
				reject(error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedItems(url, timeout, reload, sortItems = true, ifNoItemsReject = true, withAttachments = false) {

		return new Promise((resolve, reject) => {

			fetchFeedData(url, timeout, reload).then((result) => {

				let list = Feed.factoryCreateByStd(result.feedData.standard, url).getFeedItems(result.feedData, sortItems, withAttachments);

				if(list.length > 0 || !ifNoItemsReject) {
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
	function getLinkFeedsFromFrames(doc, selector, timeout) {

		return new Promise((resolve) => {

			let frames = doc.getElementsByTagName("iframe");
			let allFetch = [];
			const init = { cache: "default" };

			for(let i=0, len=frames.length; i<len; i++) {

				let url = slUtil.validURL(frames[i].src);

				// if valid and visible
				if( url && (frames[i].style.display !== "none") ) {
					allFetch.push(fetchWithTimeout(url, init, timeout));
				}
			}

			let linkFeeds = [];
			let hosts = [];

			// Promise.all is fail-fast; first rejected promise will reject all immediately so convert catch error to simple regular (success) value.
			Promise.all(allFetch.map(f => f.catch((e) => { return e; }))).then(async (responses) => {

				for(let i=0, len=responses.length; i<len; i++) {

					let response = responses[i];

					if( (response instanceof Response) && response.ok ) {

						let blob = await response.blob();

						// only if text/html
						if( blob.type.includes("text/html") ) {
							let url = new URL(response.url);
							let txt = await getResponseTextFromBlob(blob, "UTF-8");
							let doc = g_feed.domParser.parseFromString(txt, "text/html");
							let links = Array.from(doc.querySelectorAll(selector), n => slUtil.replaceMozExtensionOriginURL(n.href.stripHtmlTags(), url.origin).toString()); // array of string urls
							linkFeeds = linkFeeds.concat(links);
							hosts = hosts.concat(url.host);
						}
					}
				}
				hosts = hosts.filter((item, idx, ary) => ary.indexOf(item) === idx); // filter duplicates
				resolve({ linkFeeds: linkFeeds, hosts: hosts });
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createObjectDiscoveredFeed(url, requestId) {
		return {
			status: "init",
			url: url,
			requestId: requestId,
		};
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setDiscoveredFeedFromSource(discoveredFeed, feedSrc, url, index) {

		let feedData = Feed.factoryCreateBySrc(feedSrc.text, url).getFeedData();

		if(feedData.standard === SyndicationStandard.invalid) {
			discoveredFeed = Object.assign(discoveredFeed, {status: "error", message: feedData.errorMsg});
		} else {
			discoveredFeed = Object.assign(discoveredFeed, {
				status: "OK",
				index: index,
				feedTitle: feedData.title.length > 0 ? feedData.title : url.hostname,
				lastUpdated: feedData.lastUpdated,
				format: feedData.standard,
				itemCount: feedData.itemCount,
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedSourceText(url, reload = false, timeout = 60000) {

		const init = {
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
					reject(new SyndicationError("Failed to retrieve feed source text from URL.", { status: response.status, statusText: response.statusText }));
				}

			}).catch((error) => {
				reject(new SyndicationError("Failed to fetch feed from URL.", error));
			});
		});
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
	function getXMLNoneUTF8Charset(txt) {
		let test = txt.match(g_feed.regexpXMLEncoding);
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
