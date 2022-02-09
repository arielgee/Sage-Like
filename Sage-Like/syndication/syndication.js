"use strict";

/////////////////////////////////////////////////////////////////////////////////////////////
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

			getFeedSourceText(url, reload, timeout).then((result) => {
				setDiscoveredFeedFromSource(discoveredFeed, result, (new URL(url)), 0);
			}).catch((error) => {
				setDiscoveredFeedError(discoveredFeed, error);
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
			let linkFeeds = Array.from(doc.querySelectorAll(selector), item => (slUtil.replaceMozExtensionOriginURL(item.href.stripHtmlTags(), origin) || "").toString());	// logical OR expression as short-circuit evaluation
			let iframeHosts = [];

			// will NOT check in iframes when aggressive level is 0 ('none')
			if(aggressiveLevel > 0) {
				let result = await discoverFeedLinksInFrames(doc, selector, timeout);
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
				objAbort.fetchControllers.push(new AbortController());

				getFeedSourceText(url, reload, timeout, undefined, objAbort.fetchControllers[index]).then((result) => {

					if(objAbort.isAborted) return;		// exit immediately if aborted

					setDiscoveredFeedFromSource(discoveredFeed, result, url, index);

				}).catch((error) => {

					if(objAbort.isAborted) return;		// exit immediately if aborted

					setDiscoveredFeedError(discoveredFeed, error, index);

				}).finally(() => {
					// Only if not aborted
					if(!objAbort.isAborted) callback(discoveredFeed);
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedData(url, timeout, reload, signinCred) {

		return new Promise((resolve, reject) => {

			getFeedSourceText(url, reload, timeout, signinCred).then((result) => {

				try {
					resolve({ feedData: Feed.factoryCreateBySrc(result.text, url).getFeedData() });
				} catch (error) {
					reject(new SyndicationError("Failed to get feed data.", error));
				}

			}).catch((error) => {
				reject(error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchFeedItems(url, timeout, reload, sortItems = true, ifNoItemsReject = true, withAttachments = false, signinCred) {

		return new Promise((resolve, reject) => {

			fetchFeedData(url, timeout, reload, signinCred).then((result) => {

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
	function isUnauthorizedError(errorObject) {
		return (!!errorObject && typeof(errorObject.httpResponseStatus) === "function" && errorObject.httpResponseStatus() === 401);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function discoverFeedLinksInFrames(doc, selector, timeout) {

		return new Promise((resolve) => {

			// include an 'Authorization' header with empty username and password so that the sign-in
			// dialog 'Authorization Required - Mozilla Firefox' will not be displayed when performing sidebar discovery.
			// See comment in getFeedSourceText() about '401 Unauthorized' response.
			const options = {
				method: "GET",
				headers: Global.HEADER_AUTHORIZATION_BASIC_NULL,
				cache: "default",
			};

			let frames = doc.getElementsByTagName("iframe");
			let allFetch = [];

			for(let i=0, len=frames.length; i<len; i++) {

				let url = slUtil.validURL(frames[i].src);

				// if valid and visible
				if( url && (frames[i].style.display !== "none") ) {
					allFetch.push(slUtil.fetchWithTimeout(url, options, timeout));
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
	function setDiscoveredFeedError(discoveredFeed, errorObject, index = -1) {
		discoveredFeed = Object.assign(discoveredFeed, {
			status: "error",
			message: errorObject.message,
			unauthorized: isUnauthorizedError(errorObject),
		},
		(index > -1) ? { index: index } : {});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedSourceText(url, reload = false, timeout = 60000, signinCred = new SigninCredential({}) /*empty username/password*/, abortController = null) {

		const options = {
			method: "GET",
			headers: {},
			cache: reload ? "reload" : "default",
		};

		if( !(signinCred instanceof SigninCredential) ) {
			throw new Error("Parameter 'signinCred' is not an instance of SigninCredential.");
		} else if(signinCred.initialized) {

			/*
				'401 Unauthorized' Response
					* Behaviour When 'Authorization' header is NOT provided in the options parameter:
						+ Fx v93: A login dialog 'Authorization Required - Mozilla Firefox' is displayed. Will not display if fetch is done from background.js.
						+ Fx v59: No dialog is displayed.
					* Behaviour When 'Authorization' header IS provided in the options parameter with empty username/password:
						+ Fx v93: No dialog is displayed.
						+ Fx v59: No dialog is displayed.
			*/

			// add 'Authorization' header if an initialized SigninCredential was provided
			options.headers["Authorization"] = "Basic " + btoa(`${signinCred.username}:${signinCred.password}`);
		}

		return new Promise((resolve, reject) => {

			slUtil.fetchWithTimeout(url, options, timeout, abortController).then((response) => {

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
					reject(new SyndicationError("Failed to retrieve feed source from URL.", { status: response.status, statusText: response.statusText }));
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
		isUnauthorizedError: isUnauthorizedError,
	};

})();
