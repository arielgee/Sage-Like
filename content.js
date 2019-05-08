"use strict";

class Content {

	//////////////////////////////////////////////////////////////////////
	constructor() {
		this._feeds = [];
		this._feedCount = 0;

		this._onRuntimeMessage = this._onRuntimeMessage.bind(this);

		browser.runtime.onMessage.addListener(this._onRuntimeMessage)
	}

	//////////////////////////////////////////////////////////////////////
	_onRuntimeMessage(message, sender) {

		return new Promise((resolve, reject) => {

			switch (message.id) {

				case slGlobals.MSG_ID_GET_PAGE_FEED_COUNT:
					this._collectPageFeeds().then((count) => resolve({ feedCount: count }));
					break;
					//////////////////////////////////////////////////////////////

				case slGlobals.MSG_ID_GET_PAGE_DATA:
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

		return new Promise((resolve) => {

			prefs.getFetchTimeout().then((timeout) => {

				this._feeds = [];
				this._feedCount = 0;
				timeout *= 1000;		// to millisec

				// for Fx63 Feed Preview (feedHandler)
				if(document.documentElement.id === "feedHandler" && !!!document.domain) {

					syndication.fetchFeedData(window.location, timeout).then((feedData) => {

						// feedData must be discoveredFeed
						// write some wrapper to fetchFeedData() to mimic discoverWebSiteFeeds()'s return object
						this._feeds.push(feedData);
						this._feedCount = 1;
						resolve(1);
					}).catch((error) => {
						console.log("[Sage-Like]", error);
						resolve(0);
					})

					return;
				}

				// Sage-Like Feed Preview
				// TBD

				// for regular http(s) pages
				syndication.discoverWebSiteFeeds(document.documentElement.outerHTML, timeout, window.location.origin, 0, (fd) => this._feeds.push(fd)).then((result) => {
					this._feedCount = result.length;
					resolve(this._feedCount);
				});
			});
		});
	}
};

const obj = new Content();
