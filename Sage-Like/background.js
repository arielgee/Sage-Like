"use strict";

(function() {

	const REGEX_RSS_CONTENT_TYPES = new RegExp("(application/(rss\\+)?(xml|json))|(application/(rdf\\+)?xml)|(application/(atom\\+)?xml)", "i");
	//const REGEX_RSS_CONTENT_TYPES = new RegExp("((application|text)/(rss\\+)?(xml|json))|((application|text)/(rdf\\+)?xml)|((application|text)/(atom\\+)?xml)", "i");

	let m_windowIds = [];
	let m_currentWindowId = null;
	let m_timeoutIdMonitorBookmarkFeeds = null;
	let m_regExpUrlFilter;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {

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

		handlePrefDetectFeedsInWebPage();										// Check if page has feeds for pageAction

		browser.browserAction.setBadgeBackgroundColor({ color: [0, 128, 0, 128] });
		browser.windows.getCurrent().then((winInfo) => m_currentWindowId = winInfo.id);		// Get browser's current window ID

		m_regExpUrlFilter = slUtil.getRegExpDiscoveryUrlFilter();

		// start the first bookmark feeds check after 2 seconds to allow the browser's
		// initilization to terminate and possibly the sidebar to be displayed.
		m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, 2000);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//		Event listener handlers
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeConnect(port) {

		// Handle connection opend from panel.js

		// + NOTE: port.name is the window ID
		if(port.sender.id === browser.runtime.id) {

			// Connection is open from panel.js. Meaning sidebar is opend. Save ID of new window in array
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
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_WAIT_AND_HIDE_POPUP:
				setTimeout(() => hidePageAction(message.tabId), message.msWait);
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_SIDEBAR_OPEN_FOR_WINDOW:
				return Promise.resolve(m_windowIds.includes(message.winId));
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeInstalled(details) {
		internalPrefs.setIsExtensionInstalled(details.reason === "install");
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
		if(!!m_currentWindowId) {
			m_currentWindowId = winId;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsUpdated(tabId, changeInfo, tab) {
		// When selecting an open tab that was not loaded (browser just opened) then changeInfo is {status: "complete", url: "https://*"}
		// but the page is not realy 'complete'. Then the page is loading and when complete then there is not 'url' property. Hence !!!changeInfo.url
		if (!!changeInfo.status && changeInfo.status === "complete" && !!!changeInfo.url && tab.url.match(m_regExpUrlFilter)) {
			handleTabChangedState(tabId);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsAttached(tabId) {
		browser.tabs.get(tabId).then((tab) => {
			if (tab.url.match(m_regExpUrlFilter)) {
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
																					└──── Those are handled here! ────┘
		********************************************************************************************************************/

		return new Promise((resolve) => {


			if(details.statusCode === 200 && !details.url.includes(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT)) {

				const headers = details.responseHeaders;

				if(!!headers) {

					for(let i=0, len=headers.length; i<len; i++) {

						if(headers[i].name.toLowerCase() === "content-type") {
							if(headers[i].value.match(REGEX_RSS_CONTENT_TYPES)) {
								resolve({ redirectUrl: slUtil.getFeedPreviewUrl(details.url) });
								return;
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

		let nextInterval = await prefs.getCheckFeedsInterval().catch(() => nextInterval = prefs.DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE);

		// if interval is zero then do not perform background monitoring
		if(nextInterval !== "0") {

			let isClosed = !(await browser.sidebarAction.isOpen({}).catch(() => isClosed = false));		// supported in 59.0
			let checkWhenSbClosed = await prefs.getCheckFeedsWhenSbClosed().catch(() => checkWhenSbClosed = prefs.DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE);

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

				objTreeFeedsData.setIfNotExist(feed.id);
				objTreeFeedsData.setLastChecked(feed.id);

				try {
					let result = await syndication.fetchFeedData(feed.url, 10000, false);		// minimal timeout

					if(objTreeFeedsData.value(feed.id).lastVisited <= slUtil.asSafeNumericDate(result.feedData.lastUpdated)) {
						showNewBadge = !(await browser.sidebarAction.isOpen({}));
						break;
					}
				} catch (error) {
					console.log("[Sage-Like]", error);
				}
			}
			browser.browserAction.setBadgeText({ text: (showNewBadge ? "N" : "") });
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

		}).catch(async (error) => {console.log("[Sage-Like]", "inject content scripts at " + (await browser.tabs.get(tabId)).url, error);});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectContentScripts(tabId) {

		return new Promise((resolve, reject) => {

			browser.tabs.executeScript(tabId, { file: "/common.js", runAt: "document_end" }).then(() => {
				browser.tabs.executeScript(tabId, { file: "/syndication/syndication.js", runAt: "document_end" }).then(() => {
					browser.tabs.executeScript(tabId, { file: "/content.js", runAt: "document_end" }).then(() => {

						resolve({ errorCode: 0 });

					}).catch((err) => { err.message.startsWith("redeclaration") ? resolve({ errorCode: -3 }) : reject(err); } );
				}).catch((err) => { err.message.startsWith("redeclaration") ? resolve({ errorCode: -2 }) : reject(err); } );
			}).catch((err) => { err.message.startsWith("redeclaration") ? resolve({ errorCode: -1 }) : reject(err); } );
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
