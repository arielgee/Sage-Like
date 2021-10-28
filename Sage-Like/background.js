"use strict";

(function() {

	const INJECTABLE = [
		{ isScript: true, details: { runAt: "document_idle", file: "/common.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/feed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/xmlFeed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/jsonFeed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/rssFeed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/rdfFeed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/atomFeed.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/syndication/syndication.js" } },
		{ isScript: true, details: { runAt: "document_idle", file: "/content.js" } },
	];

	/*** Content-Type Default Strict Behavior ***/
	// Top-level documents loaded into a tab web requests for files with MIMEs that include semantics.
	// For example, "Content-Type: application/xml" will be ignored and handled by the browser.
	// Only web requests with "Content-Type: application/rss+xml" (or rdf, atom) will be handled
	// by Sage-Like.
	// This is in accordance with Firefox version 64.0 and above (RSS support was dropped) when it started
	// to display the 'open with' dialog for files with "Content-Type: application/rss+xml" (or rdf, atom).
	const REGEX_RSS_CONTENT_TYPES_STRICT = "application/(((rss|rdf|atom)\\+xml)|((rss|feed)\\+json))";					// semantics NOT optional
	const REGEX_RSS_CONTENT_TYPES_NOT_STRICT = "(application|text)/((((rss|rdf|atom)\\+)?xml)|(((rss|feed)\\+)?json))";	// semantics optional

	const REGEXP_URL_FILTER_TAB_STATE_CHANGE = new RegExp("^((https?|file):)|" + slUtil.getFeedPreviewUrlPrefix().escapeRegExp());

	let m_windowIds = [];
	let m_currentWindowId = null;
	let m_timeoutIdMonitorBookmarkFeeds = null;
	let m_regExpRssContentTypes = new RegExp(REGEX_RSS_CONTENT_TYPES_STRICT, "i");	// MUST BE INITIALIZED!. onWebRequestHeadersReceived() was being executed with m_regExpRssContentTypes=undefined

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

			case slGlobals.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL) {
					monitorBookmarkFeeds();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE) {
					handlePrefDetectFeedsInWebPage();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES) {
					handlePrefStrictRssContentTypes();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_WAIT_AND_HIDE_POPUP:
				setTimeout(() => hidePageAction(message.tabId), message.msWait);
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW:
				return Promise.resolve(m_windowIds.includes(message.winId));
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeInstalled(details) {
		internalPrefs.setIsExtensionInstalled(details.reason === "install");

		if(details.reason === "update") {

			let parts = details.previousVersion.split(".").map((x) => parseInt(x)).filter((x) => !isNaN(x));
			let major = parts[0] || 0;
			let minor = parts[1] || 0;

			// version 1.9 added openInFeedPreview to TreeFeedsData and lastChecked to OpenTreeFolders
			if(major < 1 || (major === 1 && minor < 9) ) {
				(new OpenTreeFolders()).maintenance();
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
		// When selecting an open tab that was not loaded (browser just opened) then changeInfo is {status: "complete", url: "https://*"}
		// but the page is not realy 'complete'. Then the page is loading and when complete then there is not 'url' property. Hence !!!changeInfo.url
		if (!!changeInfo.status && changeInfo.status === "complete" && !!!changeInfo.url && tab.url.match(REGEXP_URL_FILTER_TAB_STATE_CHANGE)) {
			handleTabChangedState(tabId);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsAttached(tabId) {
		browser.tabs.get(tabId).then((tab) => {
			if (tab.url.match(REGEXP_URL_FILTER_TAB_STATE_CHANGE)) {
				handleTabChangedState(tabId);
			}
		});
	}

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

			if(details.statusCode === 200 && !details.url.includes(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT)) {

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
					let result = await syndication.fetchFeedData(feed.url, 10000, false);		// minimal timeout

					if(objTreeFeedsData.value(feed.id).lastVisited <= slUtil.asSafeNumericDate(result.feedData.lastUpdated)) {
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
	function handleTabChangedState(tabId) {

		injectContentScripts(tabId).then((result) => {

			browser.tabs.sendMessage(tabId, { id: slGlobals.MSG_ID_GET_PAGE_FEED_COUNT }).then((response) => {
				if(response.feedCount > 0) {
					showPageAction(tabId);
				} else {
					hidePageAction(tabId);
				}
			}).catch(async (error) => console.log("[Sage-Like]", "send message at " + (await browser.tabs.get(tabId)).url, error));

		}).catch(async (error) => {
			if( !error.message.toLowerCase().includes("missing host permission for the tab") ) {
				console.log("[Sage-Like]", "inject content scripts at " + (await browser.tabs.get(tabId)).url, error);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectContentScripts(tabId) {

		return new Promise(async (resolve, reject) => {

			let idx, len;

			try {

				for(idx=0, len=INJECTABLE.length; idx<len; idx++) {
					await browser.tabs.executeScript(tabId, INJECTABLE[idx].details);
				}
				resolve({});

			} catch (err) {
				err.message.startsWith("redeclaration") ? resolve({ errorIndex: idx }) : reject(new Error(`Error index: ${idx}, ${err.message}`));
			}
 		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handlePrefStrictRssContentTypes() {
		prefs.getStrictRssContentTypes().then((strict) => {
			m_regExpRssContentTypes = new RegExp(strict ? REGEX_RSS_CONTENT_TYPES_STRICT : REGEX_RSS_CONTENT_TYPES_NOT_STRICT, "i");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function handlePrefDetectFeedsInWebPage() {

		let detectFeedsInWebPage = await prefs.getDetectFeedsInWebPage();

		if(detectFeedsInWebPage) {

			browser.tabs.onUpdated.addListener(onTabsUpdated);		// Fx61 => extraParameters; {url:["*://*/*"], properties:["status"]}
			browser.tabs.onAttached.addListener(onTabsAttached);

		} else if(browser.tabs.onUpdated.hasListener(onTabsUpdated)) {

			// hasListener() will return false if handlePrefDetectFeedsInWebPage() was called from webExt loading.

			browser.tabs.onUpdated.removeListener(onTabsUpdated);
			browser.tabs.onAttached.removeListener(onTabsAttached);

			let tabs = await browser.tabs.query({});

			for (let i=0, len=tabs.length; i<len; i++) {
				browser.pageAction.isShown({ tabId: tabs[i].id }).then((shown) => {
					if(shown) {
						hidePageAction(tabs[i].id);
					}
				});
			}
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
	function hidePageAction(tabId) {

		browser.pageAction.setIcon({
			tabId: tabId,
			path: {
				19: "/icons/pagePopup-gray-19.png",
				38: "/icons/pagePopup-gray-38.png",
			},
		});
		browser.pageAction.hide(tabId);
	}

})();
