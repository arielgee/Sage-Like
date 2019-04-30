"use strict";

(function() {

	let m_windowIds = [];
	let m_currentWindowId = null;
	let m_timeoutIdMonitorBookmarkFeeds = null;

	//////////////////////////////////////////////////////////////////////
	// Handle connection from panel.js ( NOTE: port.name is the window ID )
	browser.runtime.onConnect.addListener((port) => {

		if(port.sender.id === browser.runtime.id) {

			// Connection is open from panel.js. Meaning sidebar is opend. Save ID of new window in array
			m_windowIds.push(parseInt(port.name));

			// Connection is closed. Meaning the sidebar was closed. Remove window ID from array
			port.onDisconnect.addListener((p) => {
				let winId = parseInt(p.name);
				m_windowIds = m_windowIds.filter((id) => winId !== id);
			});
		}
	});

	//////////////////////////////////////////////////////////////////////
	// Messages handler
	browser.runtime.onMessage.addListener((message) => {

		if (message.id === slGlobals.MSG_ID_PREFERENCES_CHANGED) {

			if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
				message.details === slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL) {
				monitorBookmarkFeeds();
			}
		}
	});

	//////////////////////////////////////////////////////////////////////
	// Sage-Like was installed
	browser.runtime.onInstalled.addListener((details) => {
		internalPrefs.setIsExtensionInstalled(details.reason === "install");
	});

	//////////////////////////////////////////////////////////////////////
	// firefox commands (keyboard)
	//browser.commands.onCommand.addListener((command) => {	});

	//////////////////////////////////////////////////////////////////////
	// Sage-Like Toolbar button
	browser.browserAction.onClicked.addListener(toggleSidebar);
	browser.browserAction.setBadgeBackgroundColor({color: [0, 128, 0, 128]});

	//////////////////////////////////////////////////////////////////////
	// Remove closed windows ID from array
	browser.windows.onRemoved.addListener((removedWinId) => {
		m_windowIds = m_windowIds.filter((id) => removedWinId !== id);
	});

	//////////////////////////////////////////////////////////////////////
	// Get browser's current window ID
	browser.windows.getCurrent().then((winInfo) => {
		m_currentWindowId = winInfo.id;
	});

	//////////////////////////////////////////////////////////////////////
	// Change browser's current window ID
	browser.windows.onFocusChanged.addListener((winId) => {
		if(!!m_currentWindowId) {
			m_currentWindowId = winId;
		}
	});

	// start the first bookmark feeds check after 2 seconds to allow the browser's
	// initilization to terminate and possibly the sidebar to be displayed.
	m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, 2000);


	//////////////////////////////////////////////////////////////////////
	function toggleSidebar() {

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
					let feedData = await syndication.fetchFeedData(feed.url, 10000, false);		// minimal timeout

					if(objTreeFeedsData.value(feed.id).lastVisited <= slUtil.asSafeNumericDate(feedData.lastUpdated)) {
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
})();
