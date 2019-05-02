"use strict";

(function () {

	let m_feeds = [];
	let m_feedCount = 0;

	//////////////////////////////////////////////////////////////////////
	browser.runtime.onMessage.addListener((request, sender) => {

		return new Promise((resolve, reject) => {

			switch (request.message) {

				case slGlobals.MSG_ID_GET_PAGE_FEED_COUNT:
					collectPageFeeds().then((count) => resolve({ feedCount: count }));
					break;
					//////////////////////////////////////////////////////////////

				case slGlobals.MSG_ID_GET_PAGE_DATA:
					resolve({ title: document.title, feeds: m_feeds, feedCount: m_feedCount });
					break;
					//////////////////////////////////////////////////////////////

				default:
					reject();
					break;
					//////////////////////////////////////////////////////////////
			}
		});
	});

	//////////////////////////////////////////////////////////////////////
	function collectPageFeeds() {

		return new Promise((resolve) => {

			prefs.getFetchTimeout().then((timeout) => {

				m_feeds = [];
				m_feedCount = 0;

				syndication.discoverWebSiteFeeds(document.documentElement.outerHTML, timeout*1000, window.location.origin, 0, (fd) => m_feeds.push(fd)).then((result) => {
					m_feedCount = result.length;
					resolve(m_feedCount);
				});
			});
		});
	}

})();
