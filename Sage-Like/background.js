"use strict";

(function() {

	const INJECTABLE = {
		injectImmediately: false,
		target: { tabId: null },
		files: [
			"/common.js",
			"/syndication/helpers.js",
			"/syndication/feed.js",
			"/syndication/xmlFeed.js",
			"/syndication/jsonFeed.js",
			"/syndication/rssFeed.js",
			"/syndication/rdfFeed.js",
			"/syndication/atomFeed.js",
			"/syndication/websiteSpecificDiscovery.js",
			"/syndication/syndication.js",
			"/content.js",
		],
	};

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

	const MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW = "mnu-try-open-link-in-feed-preview";
	const ALARM_NAME_MONITOR_BOOKMARK_FEEDS = "alarm-monitorBookmarkFeeds";

	let m_currentWindowId = null;
	let m_regExpRssContentTypes = new RegExp(REGEX_RSS_CONTENT_TYPES_STRICT, "i");	// MUST BE INITIALIZED!. onWebRequestHeadersReceived() was being executed with m_regExpRssContentTypes=undefined

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	async function initialization() {

		browser.runtime.onMessage.addListener(onRuntimeMessage);				// Messages handler
		browser.runtime.onInstalled.addListener(onRuntimeInstalled);			// Sage-Like was installed
		// browser.windows.onFocusChanged.addListener(onWindowsFocusChanged);		// Change browser's current window ID
		browser.tabs.onUpdated.addListener(onTabsUpdated);						// Detect feeds in web pages	- Fx61 => extraParameters; {url:["*://*/*"], properties:["status"]}
		browser.tabs.onAttached.addListener(onTabsAttached);					// Detect feeds in web pages
		browser.action.onClicked.addListener(onBrowserActionClicked);			// Sage-Like Toolbar button - toggle sidebar
		browser.menus.onClicked.addListener(onMenusClicked);					// context menu 'Try to Open Link in Feed Preview'
		browser.alarms.onAlarm.addListener(onAlarm);							// monitor bookmark feeds

		// browser.webRequest.onHeadersReceived.addListener(						// redirect some URL feeds to feedPreview
		// 	onWebRequestHeadersReceived,
		// 	{ urls: ["http://*/*", "https://*/*"], types: ["main_frame"] },		// filter: only HTTP web pages that are top-level documents loaded into a tab.
		// 	["blocking", "responseHeaders"]
		// );

		handlePrefStrictRssContentTypes();										// Check if web response can be displayed as feedPreview
		handlePrefShowTryOpenLinkInFeedPreview();								// Try to open a link as a feed in the feedPreview

		browser.action.setBadgeBackgroundColor({ color: [0, 128, 0, 128] });
		browser.windows.getCurrent().then((winInfo) => m_currentWindowId = winInfo.id);		// Get browser's current window ID

		// start the first bookmark feeds check after 2 seconds to allow the browser's
		// initialization to terminate and possibly the sidebar to be displayed.
		browser.alarms.create(ALARM_NAME_MONITOR_BOOKMARK_FEEDS, { delayInMinutes: 1/30 });
	}

	////////////////////////////////////////////////////////////////////////////////////
	//		Event listener handlers
	////////////////////////////////////////////////////////////////////////////////////

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
		browser.sidebarAction.toggle();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onAlarm(alarmInfo) {
		if(alarmInfo.name === ALARM_NAME_MONITOR_BOOKMARK_FEEDS) {
			monitorBookmarkFeeds();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onWindowsFocusChanged(winId) {
		if(!!m_currentWindowId && winId !== browser.windows.WINDOW_ID_NONE) {
			m_currentWindowId = winId;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsUpdated(tabId, changeInfo, tab) {
		prefs.getDetectFeedsInWebPage().then((detect) => {
			if(detect) {
				// When selecting an open tab that was not loaded (browser just opened) then changeInfo is {status: "complete", url: "https://*"}
				// but the page is not realy 'complete'. Then the page is loading and when complete then there is not 'url' property. Hence !!!changeInfo.url
				if (!!changeInfo.status && changeInfo.status === "complete" && !!!changeInfo.url && IsAllowedForFeedDetection(tab.url) ) {
					handleTabChangedState(tabId);
				}
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsAttached(tabId) {
		prefs.getDetectFeedsInWebPage().then((detect) => {
			if(detect) {
				browser.tabs.get(tabId).then((tab) => {
					if (IsAllowedForFeedDetection(tab.url)) {
						handleTabChangedState(tabId);
					}
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMenusClicked(info) {
		if(info.menuItemId === MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW) {
			if(info.modifiers.includes("Shift")) {
				browser.windows.create({ url: slUtil.getFeedPreviewUrl(info.linkUrl), type: "normal" });	// in new window
			} else {
				browser.tabs.create({ url: slUtil.getFeedPreviewUrl(info.linkUrl), active: !(info.modifiers.includes("Ctrl")) });	// in new tab - 'Ctrl' for inactive
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

		// It will replace the current alarm if called due to a preference change to set a new
		// interval value or it will clear the current alarm to have no background monitoring at all.

		let nextInterval = await prefs.getCheckFeedsInterval().catch(() => nextInterval = prefs.DEFAULTS.checkFeedsInterval);

		// if interval is zero then clear alarm and do not perform background monitoring
		if(nextInterval === "0") {
			browser.alarms.clear(ALARM_NAME_MONITOR_BOOKMARK_FEEDS);
		} else {

			let isClosed = !(await browser.sidebarAction.isOpen({}).catch(() => isClosed = false));		// supported in 59.0
			let checkWhenSbClosed = await prefs.getCheckFeedsWhenSbClosed().catch(() => checkWhenSbClosed = prefs.DEFAULTS.checkFeedsWhenSbClosed);

			// background monitoring from the background page is done solely for
			// the purpose of updating the action button when the sidebar is closed
			if (isClosed && checkWhenSbClosed) {
				await checkForNewBookmarkFeeds();
			}

			if(nextInterval.includes(":")) {
				nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
			}
			browser.alarms.create(ALARM_NAME_MONITOR_BOOKMARK_FEEDS, { when: Date.now()+parseInt(nextInterval) });	// create/replace an alarm.
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
			browser.action.setBadgeText({ text: (showNewBadge ? "N" : ""), windowId: m_currentWindowId });
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

		injectContentScripts(tabId).then((result) => {

			browser.tabs.sendMessage(tabId, { id: Global.MSG_ID_GET_PAGE_FEED_COUNT }).then((response) => {
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

			INJECTABLE.target.tabId = tabId;

			try {

				await browser.scripting.executeScript(INJECTABLE);
				resolve({});

			} catch(error) {
				error.message.startsWith("redeclaration") ? resolve({ redeclarationMsg: error.message }) : reject(error);
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

		if(!detectFeedsInWebPage) {

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
	async function handlePrefShowTryOpenLinkInFeedPreview() {

		let showTryOpenLinkInFeedPreview = await prefs.getShowTryOpenLinkInFeedPreview();

		if(showTryOpenLinkInFeedPreview) {
			browser.menus.create({
				id: MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW,
				title: "Try to Open Link in Feed Preview",
				contexts: ["link"],
			});
		} else {
			browser.menus.remove(MENU_ITEM_ID_TRY_OPEN_LINK_IN_FEED_PREVIEW);	// if called from initialization(), the remove() will not find the menu.
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
