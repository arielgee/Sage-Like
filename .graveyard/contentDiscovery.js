"use strict";

class ContentDiscovery {

	//////////////////////////////////////////////////////////////////////
	constructor(pageData) {
		this._feeds = [];
		this._pageData = pageData;
		this._collectingPageFeeds = this._collectPageFeeds();
	}

	//////////////////////////////////////////////////////////////////////
	get feeds() {
		return this._feeds;
	}

	//////////////////////////////////////////////////////////////////////
	getExpectedPageFeedCount() {
		return new Promise((resolve) => {
			this._collectingPageFeeds.then((result) => resolve({ count: result.expectedFeedCount }));
		});
	}

	//////////////////////////////////////////////////////////////////////
	_collectPageFeeds() {

		return new Promise(async (resolve) => {

			const timeout = await prefs.getFetchTimeout() * 1000;	// to millisec
			const doc = (new DOMParser()).parseFromString(this._pageData.txtHTML, "text/html");
			const docElement = doc.documentElement;
			const winLocation = this._pageData.location;

			this._feeds = [];

			if(docElement.id === "feedHandler" && !!!this._pageData.domainName) {

				// Fx v63 build-in Feed Preview

				resolve({ expectedFeedCount: 1 });
				syndication.feedDiscovery(winLocation.toString(), timeout).then((feedData) => {
					this._feeds.push(feedData);
				});

			} else if(docElement.id === "_sage-LikeFeedPreview") {

				// Fx v64 Sage-Like Feed Preview

				resolve({ expectedFeedCount: 1 });
				let url = slUtil.getURLQueryStringValue(winLocation.toString(), "urlFeed");
				syndication.feedDiscovery(url, timeout).then((feedData) => {
					this._feeds.push(feedData);
				});

			} else if(docElement.nodeName !== "HTML") {

				// Fx XML viewer (most likely be Fx v64 and above. Before that will be handled by v63 build-in Feed Preview)

				syndication.feedDiscovery(winLocation.toString(), timeout).then((feedData) => {
					let expectedFeedCount = (feedData.status === "OK" ? 1 : 0);
					resolve({ expectedFeedCount: expectedFeedCount });
					if(expectedFeedCount > 0) this._feeds.push(feedData);
				});

			} else {

				// For regular web pages

				syndication.webPageFeedsDiscovery({ objDoc: doc }, timeout, this._pageData.origin, 0, (fd) => this._feeds.push(fd)).then((result) => {
					resolve({ expectedFeedCount: result.length });
					// XML feeds with XSLT: Due to issues from the additional fetching of the page (rate limiting),
					// the attempt to discover feeds in case where the page is an XML with XSLT was removed.
					// XML with XSLT is still discoverable from the discovery view.
				});
			}
		});
	}
}
