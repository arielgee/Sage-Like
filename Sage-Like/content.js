"use strict";

class Content {

	//////////////////////////////////////////////////////////////////////
	constructor() {
		this._feeds = [];
		this._feedCount = 0;

		this._onRuntimeMessage = this._onRuntimeMessage.bind(this);

		browser.runtime.onMessage.addListener(this._onRuntimeMessage);
	}

	//////////////////////////////////////////////////////////////////////
	_onRuntimeMessage(message, sender) {

		return new Promise((resolve, reject) => {

			switch (message.id) {

				case Global.MSG_ID_GET_PAGE_FEED_COUNT:
					this._collectPageFeeds().then((count) => resolve({ feedCount: count }));
					break;
					//////////////////////////////////////////////////////////////

				case Global.MSG_ID_GET_PAGE_DATA:
					resolve({ title: document.title, feeds: this._feeds, feedCount: this._feedCount });
					break;
					//////////////////////////////////////////////////////////////

				default:
					reject();
					break;
					//////////////////////////////////////////////////////////////
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_collectPageFeeds() {

		return new Promise(async (resolve) => {

			const timeout = await prefs.getFetchTimeout() * 1000;	// to millisec
			const docElement = document.documentElement;
			const winLocation = window.location;

			this._feeds = [];
			this._feedCount = 0;

			if(docElement.id === "feedHandler" && !!!document.domain) {

				// Fx v63 build-in Feed Preview

				resolve(this._feedCount = 1);
				syndication.feedDiscovery(winLocation.toString(), timeout).then((feedData) => {
					this._feeds.push(feedData);
				});

			} else if(docElement.id === "_sage-LikeFeedPreview") {

				// Fx v64 Sage-Like Feed Preview

				resolve(this._feedCount = 1);
				let url = slUtil.getURLQueryStringValue(winLocation.toString(), "urlFeed");
				syndication.feedDiscovery(url, timeout).then((feedData) => {
					this._feeds.push(feedData);
				});

			} else if(docElement.nodeName !== "HTML") {

				// Fx XML viewer (most likely be Fx v64 and above. Before that will be handled by v63 build-in Feed Preview)

				syndication.feedDiscovery(winLocation.toString(), timeout).then((feedData) => {
					resolve(this._feedCount = (feedData.status === "OK" ? 1 : 0));
					if(this._feedCount > 0) this._feeds.push(feedData);
				});

			} else {

				// For regular web pages

				syndication.webPageFeedsDiscovery(docElement.outerHTML, timeout, winLocation.origin, 0, (fd) => this._feeds.push(fd)).then((result) => {
					if(result.length > 0) {
						this._feedCount = result.length;
						resolve(this._feedCount);
					} else {
						// if none was found, try url itself in case the page is an XML with XSLT
						syndication.feedDiscovery(winLocation.toString(), timeout).then((feedData) => {
							resolve(this._feedCount = (feedData.status === "OK" ? 1 : 0));
							if(this._feedCount > 0) this._feeds.push(feedData);
						});
					}
				});
			}
		});
	}
}

const obj = new Content();
