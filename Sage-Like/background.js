"use strict";

(function() {

	/*** Content-Type Default Strict Behavior ***/
	// Top-level documents loaded into a tab web requests for files with MIMEs that include semantics.
	// For example, "Content-Type: application/xml" will be ignored and handled by the browser.
	// Only web requests with "Content-Type: application/rss+xml" (or rdf, atom) will be handled
	// by Sage-Like.
	// This is in accordance with Firefox version 64.0 and above (RSS support was dropped) when it started
	// to display the 'open with' dialog for files with "Content-Type: application/rss+xml" (or rdf, atom).
	const REGEX_RSS_STRICT_CONTENT_TYPES = "application/(((rss|rdf|atom)\\+xml)|((rss|feed)\\+json))";					// semantics NOT optional
	const REGEX_RSS_LENIENT_CONTENT_TYPES = "(application|text)/((((rss|rdf|atom)\\+)?xml)|(((rss|feed)\\+)?json))";	// semantics optional

	const REGEXP_URL_FILTER_TAB_STATE_CHANGE = new RegExp("^((https?|file):)|" + slUtil.getFeedPreviewUrlPrefix().escapeRegExp());

	const MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW = "mnu-try-open-link-in-feed-preview";

	let m_windowIds = [];
	let m_currentWindowId = null;
	let m_timeoutIdMonitorBookmarkFeeds = null;
	let m_onTabsUpdatedDebouncersMap = null;
	let m_regExpRssContentTypes = new RegExp(REGEX_RSS_STRICT_CONTENT_TYPES, "i");	// MUST BE INITIALIZED!. onWebRequestHeadersReceived() was being executed with m_regExpRssContentTypes=undefined

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {

		browser.runtime.onConnect.addListener(onRuntimeConnect);				// Handle connection from panel.js
		browser.runtime.onMessage.addListener(onRuntimeMessage);				// Messages handler
		browser.runtime.onInstalled.addListener(onRuntimeInstalled);			// Sage-Like was installed
		//browser.commands.onCommand.addListener((command) => {	});				// firefox commands (keyboard)
		browser.browserAction.onClicked.addListener(onBrowserActionClicked);	// Sage-Like Toolbar button - toggle sidebar
		browser.windows.onRemoved.addListener(onWindowsRemoved);				// Remove closed windows ID from array
		browser.windows.onFocusChanged.addListener(onWindowsFocusChanged);		// Change browser's current window ID

		browser.webRequest.onHeadersReceived.addListener(						// redirect some URL feeds to feedPreview
			onWebRequestHeadersReceived,
			{ urls: ["http://*/*", "https://*/*"], types: ["main_frame"] },		// filter: only HTTP web pages that are top-level documents loaded into a tab.
			["blocking", "responseHeaders"]
		);

		handlePrefStrictRssContentTypes();										// Check if web response can be displayed as feedPreview
		handlePrefDetectFeedsInWebPage();										// Check if page has feeds for pageAction
		handlePrefShowTryOpenLinkInFeedPreview();								// Try to open a link as a feed in the feedPreview

		browser.browserAction.setBadgeBackgroundColor({ color: [0, 128, 0, 128] });
		browser.windows.getCurrent().then((winInfo) => m_currentWindowId = winInfo.id);		// Get browser's current window ID

		// start the first bookmark feeds check after 2 seconds to allow the browser's
		// initialization to terminate and possibly the sidebar to be displayed.
		m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, 2000);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//		Event listener handlers
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeConnect(port) {

		// Handle connection opened from panel.js

		// + NOTE: port.name is the window ID
		if(port.sender.id === browser.runtime.id) {

			// Connection is open from panel.js. Meaning sidebar is opened. Save ID of new window in array
			m_windowIds.push(parseInt(port.name));

			// Connection is closed. Meaning the sidebar was closed. Remove window ID from array
			// It will not be called when the browser's window is closed by the user. This is handled by onWindowsRemoved()
			port.onDisconnect.addListener((p) => {
				let winId = parseInt(p.name);
				m_windowIds = m_windowIds.filter((id) => winId !== id);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case Global.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL) {
					monitorBookmarkFeeds();
				}
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE) {
					handlePrefDetectFeedsInWebPage();
				}
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES) {
					handlePrefStrictRssContentTypes();
				}
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW) {
					handlePrefShowTryOpenLinkInFeedPreview();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case Global.MSG_ID_WAIT_AND_HIDE_POPUP:
				setTimeout(() => hidePageAction(message.tabId), message.msWait);
				break;
				/////////////////////////////////////////////////////////////////////////

			case Global.MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW:
				return Promise.resolve(m_windowIds.includes(message.winId));
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeInstalled(details) {
		internalPrefs.setIsExtensionInstalled(details.reason === "install");

		if(details.reason === "update") {

			let parts = details.previousVersion.split(".").map((x) => parseInt(x)).filter((x) => !isNaN(x));
			let prevVer = parseFloat((parts[0] || 0) + ((parts[1] || 0) / 10));

			// version 1.9 added lastChecked to OpenTreeFolders
			if(prevVer < 1.9) {
				(new OpenTreeFolders()).maintenance();
			}

			// version 1.9 added openInFeedPreview to TreeFeedsData
			// version 2.9 added ignoreUpdates to TreeFeedsData
			if(prevVer < 1.9 || prevVer < 2.9) {
				(new TreeFeedsData()).maintenance();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBrowserActionClicked() {

		if(m_windowIds.includes(m_currentWindowId)) {
			browser.sidebarAction.close();		// supported in 57.0
		} else {
			browser.sidebarAction.open();		// supported in 57.0
		}

		//#region Bug 1398833
		/*
			+ Bug 1398833: https://bugzilla.mozilla.org/show_bug.cgi?id=1398833
			+ Bug 1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465
			+ sidebarAction.open/close may only be called from a user input handler

		browser.sidebarAction.isOpen({}).then((isOpen) => {		// supported in 59.0
			if(isOpen) {
				browser.sidebarAction.close();		// supported in 57.0
			} else {
				browser.sidebarAction.open();		// supported in 57.0
			}
		});
		*/
		//#endregion
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onWindowsRemoved(removedWinId) {
		m_windowIds = m_windowIds.filter((id) => removedWinId !== id);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onWindowsFocusChanged(winId) {
		if(!!m_currentWindowId && winId !== browser.windows.WINDOW_ID_NONE) {
			m_currentWindowId = winId;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsUpdated(tabId, changeInfo, tab) {

		// When the change is the status of the tab. Can be either loading or complete.
		if ( !!changeInfo.status && IsAllowedForFeedDetection(tab.url) ) {

			clearTimeout(m_onTabsUpdatedDebouncersMap.get(tabId));

			if (changeInfo.status === "complete") {

				hidePageAction(tabId);

				m_onTabsUpdatedDebouncersMap.set(tabId, setTimeout(() => {
					handleTabChangedState(tabId);
					m_onTabsUpdatedDebouncersMap.delete(tabId);
				}, 900));
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsAttached(tabId) {
		browser.tabs.get(tabId).then((tab) => {
			if (IsAllowedForFeedDetection(tab.url)) {
				hidePageAction(tabId);
				handleTabChangedState(tabId);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMenusClicked(info) {
		if(info.menuItemId === MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW) {
			let url = !!info.linkUrl ? info.linkUrl : slUtil.validURL(info.selectionText);
			if(!!url) {
				if(info.modifiers.includes("Shift")) {
					browser.windows.create({ url: slUtil.getFeedPreviewUrl(url), type: "normal" });	// in new window
				} else {
					browser.tabs.create({ url: slUtil.getFeedPreviewUrl(url), active: !(info.modifiers.includes("Ctrl")) });	// in new tab - 'Ctrl' for inactive
				}
			} else {
				console.log("[Sage-Like]", `Invalid URL: "${info.selectionText}".`);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onWebRequestHeadersReceived(details) {

		/********************************************************************************************************************
		+ Listener is called (filtered) for requests whose targets are "http:" or "https:"
		  and for resources of type "main_frame".
			> "moz-extension://" will not handled.
			> Top-level documents loaded into a tab.
			> details.documentUrl will allways be undefined for top-level documents.

		+ Table: Details properties (rows) for each web request origin (columns)
                      ┌────────────────────┬────────────────┬──────────────────────╦╦═══════════════╦╦════════════════╗╗
                      │ requests from tree │   pagePopup    │ tree Ctrl+Alt+MClick ║║ click in page ║║ type in urlbar ║║
        ┌─────────────┼────────────────────┼────────────────┼──────────────────────╣╠═══════════════╣╠════════════════╣║
        │ documentUrl │   moz-extension    │   undefined    │      undefined       ║║   undefined   ║║   undefined    ║║
        │   originUrl │   moz-extension    │   undefined    │      undefined       ║║     http      ║║   undefined    ║║
        │        type │   xmlhttprequest   │ xmlhttprequest │      main_frame      ║║  main_frame   ║║   main_frame   ║║
        │         url │       http         │      http      │         http         ║║     http      ║║      http      ║║
        └─────────────┴────────────────────┴────────────────┴──────────────────────╩╩═══════════════╩╩════════════════╝╝
                      └──────────────────── Those are ignored. ────────────────────┘└──── Those are handled here! ────┘
		********************************************************************************************************************/

		return new Promise((resolve) => {

			//if(details.statusCode === 200) console.log("[Sage-Like] START:", details.requestId, "\n", details);

			// ++Dev Mode++
			//	When request status code is '301 Moved Permanently' the EXTRA_URL_PARAM_NO_REDIRECT parameter is removed from url and redirect is NOT skipped.
			//	As a result the view-source is displaying the feedPreview.html source.
			//	This can be fixed by storing the requestId in a `m_noRedirectRequestIds` map object and checking for it when `statusCode === 200`.
			//	BUT, this is a ++Dev Mode++ issue that I do NOT want to fix. It is not worth the overhead of managing a Map object here just for Dev-Mode functionality.
			//	And also this is not working for Fx below v84 due to lack of support for 'RequestFilter.view-source'.

			if(details.statusCode === 200 && !details.url.includes(Global.EXTRA_URL_PARAM_NO_REDIRECT)) {

				const headers = details.responseHeaders;

				if(!!headers) {

					for(let i=0, len=headers.length; i<len; i++) {

						if(headers[i].name.toLowerCase() === "content-type") {
							if(headers[i].value.match(m_regExpRssContentTypes)) {
								//console.log("[Sage-Like] END:", details.requestId, "\n", details);
								return resolve({ redirectUrl: slUtil.getFeedPreviewUrl(details.url) });
							}
							break;
						}
					}
				}
			}
			resolve({});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	//		Feed monitor
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	async function monitorBookmarkFeeds() {

		// first clear the current timeout if called from preference change to
		// set a new interval value or to have no background monitoring at all
		clearTimeout(m_timeoutIdMonitorBookmarkFeeds);
		m_timeoutIdMonitorBookmarkFeeds = null;

		let nextInterval = await prefs.getCheckFeedsInterval().catch(() => nextInterval = prefs.DEFAULTS.checkFeedsInterval);

		// if interval is zero then do not perform background monitoring
		if(nextInterval !== "0") {

			let isClosed = !(await browser.sidebarAction.isOpen({}).catch(() => isClosed = false));		// supported in 59.0
			let checkWhenSbClosed = await prefs.getCheckFeedsWhenSbClosed().catch(() => checkWhenSbClosed = prefs.DEFAULTS.checkFeedsWhenSbClosed);

			// background monitoring from the background page is done solely for
			// the purpose of updating the action button when the sidebar is closed
			if (isClosed && checkWhenSbClosed) {
				await checkForNewBookmarkFeeds();
			}

			// Repeat a new timeout session.
			if(nextInterval.includes(":")) {
				nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
			}
			m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, parseInt(nextInterval));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function checkForNewBookmarkFeeds() {

		// collect all feed urls into an array
		await slUtil.bookmarksFeedsAsCollection(true).then(async (bmFeeds) => {

			let objTreeFeedsData = new TreeFeedsData();

			await objTreeFeedsData.getStorage();

			// scan all feed urls for the first updated one
			let showNewBadge = false;
			for (let feed of bmFeeds) {

				// add if not already exists or just update the lastChecked
				objTreeFeedsData.update(feed.id);

				try {
					const msFetchTime = Date.now();
					const result = await syndication.fetchFeedData(feed.url, 10000, false);		// minimal timeout

					let msUpdateTime = slUtil.asSafeNumericDate(result.feedData.lastUpdated);
					msUpdateTime = slUtil.fixUnreliableUpdateTime(msUpdateTime, result, feed.url, msFetchTime);

					if(objTreeFeedsData.value(feed.id).lastVisited <= msUpdateTime) {
						showNewBadge = !(await browser.sidebarAction.isOpen({ windowId: m_currentWindowId }));
						break;
					}
				} catch (error) {
					console.log("[Sage-Like]", error.message);
				}
			}
			slUtil.setSafeBrowserActionBadgeText({ text: (showNewBadge ? "N" : ""), windowId: m_currentWindowId });
			//console.log("[Sage-Like]", "Periodic check for new feeds performed in background.");

		}).catch((error) => {
			console.log("[Sage-Like]", error);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	//		Helper functions
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	function IsAllowedForFeedDetection(strUrl) {
		return strUrl.match(REGEXP_URL_FILTER_TAB_STATE_CHANGE);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleTabChangedState(tabId) {

		contentHandler.getPageData(tabId).then((pageData) => {

			discoverFeeds(pageData).then((result) => {

				if(result.expectedFeedCount > 0) {
					copyConfirmedFeedsToPage(tabId, result.expectedFeedCount, result.feeds);
					showPageAction(tabId);
				}

			});

		}).catch(async (error) => {
			if( !error.message.toLowerCase().includes("missing host permission for the tab") ) {
				console.log("[Sage-Like]", `Failure to get page data by injection at ${(await browser.tabs.get(tabId)).url}`, error);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function discoverFeeds(pageData) {

		return new Promise(async (resolve) => {

			const timeout = await prefs.getFetchTimeout() * 1000;	// to millisec
			const doc = (new DOMParser()).parseFromString(pageData.txtHTML, pageData.contentType);
			const docElement = doc.documentElement;
			const winLocation = pageData.location;
			const discoverResult = {
				feeds: [],
				expectedFeedCount: 0,
			};

			if(docElement.id === "feedHandler" && !!!pageData.domainName) {

				// Fx v63 build-in Feed Preview

				discoverResult.expectedFeedCount = 1;
				resolve(discoverResult);
				syndication.feedDiscovery(winLocation, timeout).then((feedData) => {
					discoverResult.feeds.push(feedData);
				});

			} else if(docElement.id === "_sage-LikeFeedPreview") {

				// Fx v64 Sage-Like Feed Preview

				discoverResult.expectedFeedCount = 1;
				resolve(discoverResult);
				let url = slUtil.getURLQueryStringValue(winLocation, "urlFeed");
				syndication.feedDiscovery(url, timeout).then((feedData) => {
					discoverResult.feeds.push(feedData);
				});

			} else if(docElement.nodeName !== "HTML") {

				// Fx XML viewer (most likely be Fx v64 and above. Before that will be handled by v63 build-in Feed Preview)

				syndication.feedDiscovery(winLocation, timeout).then((feedData) => {
					discoverResult.expectedFeedCount = (feedData.status === "OK" ? 1 : 0);
					resolve(discoverResult);
					if(discoverResult.expectedFeedCount > 0) discoverResult.feeds.push(feedData);
				});

			} else {

				// For regular web pages

				syndication.webPageFeedsDiscovery({ url: winLocation, objDoc: doc }, timeout, pageData.origin, 0, (fd) => discoverResult.feeds.push(fd)).then((result) => {
					discoverResult.expectedFeedCount = result.length;
					resolve(discoverResult);
					// XML feeds with XSLT: Due to issues from the additional fetching of the page (rate limiting),
					// the attempt to discover feeds in case where the page is an XML with XSLT was removed.
					// XML with XSLT is still discoverable from the discovery view.
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function copyConfirmedFeedsToPage(tabId, expectedFeedCount, feeds, maxRepeatedCalls = 15) {

		if(feeds.length < expectedFeedCount) {
			if(maxRepeatedCalls === 0) throw new Error("[Sage-Like] Max repeated calls to copyConfirmedFeedsToPage() was reached");
			setTimeout(copyConfirmedFeedsToPage, 2000, tabId, expectedFeedCount, feeds, maxRepeatedCalls-1);
			return;
		}

		browser.tabs.sendMessage(tabId, { id: Global.MSG_ID_SET_CONFIRMED_PAGE_FEEDS, confirmedFeeds: feeds })
			.catch(async (error) => console.log("[Sage-Like]", `Failure to send SET_CONFIRMED_PAGE_FEEDS to ${(await browser.tabs.get(tabId)).url}`, error));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handlePrefStrictRssContentTypes() {
		prefs.getStrictRssContentTypes().then((strict) => {
			m_regExpRssContentTypes = new RegExp(strict ? REGEX_RSS_STRICT_CONTENT_TYPES : REGEX_RSS_LENIENT_CONTENT_TYPES, "i");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function handlePrefDetectFeedsInWebPage() {

		let detectFeedsInWebPage = await prefs.getDetectFeedsInWebPage();

		if(detectFeedsInWebPage) {

			m_onTabsUpdatedDebouncersMap = new Map();
			browser.tabs.onUpdated.addListener(onTabsUpdated);		// Fx61 => extraParameters; {url:["*://*/*"], properties:["status"]}
			browser.tabs.onAttached.addListener(onTabsAttached);

		} else if(browser.tabs.onUpdated.hasListener(onTabsUpdated)) {

			// hasListener() will return false if handlePrefDetectFeedsInWebPage() was called from webExt loading.

			m_onTabsUpdatedDebouncersMap.clear();
			m_onTabsUpdatedDebouncersMap = null;
			browser.tabs.onUpdated.removeListener(onTabsUpdated);
			browser.tabs.onAttached.removeListener(onTabsAttached);

			let tabs = await browser.tabs.query({ discarded: false });
			for (let i=0, len=tabs.length; i<len; i++) {
				hidePageAction(tabs[i].id);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function handlePrefShowTryOpenLinkInFeedPreview() {

		let showTryOpenLinkInFeedPreview = await prefs.getShowTryOpenLinkInFeedPreview();

		if(showTryOpenLinkInFeedPreview) {
			browser.menus.create({
				id: MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW,
				title: "Try to Open Link in Feed Preview",
				contexts: ["link", "selection"],
			});
			browser.menus.onClicked.addListener(onMenusClicked);

		} else if(browser.menus.onClicked.hasListener(onMenusClicked)) {

			// hasListener() will return false if handlePrefShowTryOpenLinkInFeedPreview() was called from webExt loading.

			browser.menus.onClicked.removeListener(onMenusClicked);
			browser.menus.remove(MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showPageAction(tabId) {

		browser.pageAction.setIcon({
			tabId: tabId,
			path: {
				19: "/icons/pagePopup-19.png",
				38: "/icons/pagePopup-38.png",
			},
		});
		browser.pageAction.show(tabId);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function hidePageAction(tabId) {

		if(await browser.pageAction.isShown({ tabId: tabId })) {
			browser.pageAction.setIcon({
				tabId: tabId,
				path: {
					19: "/icons/pagePopup-gray-19.png",
					38: "/icons/pagePopup-gray-38.png",
				},
			});
			browser.pageAction.hide(tabId);
		}
	}

})();
