"use strict";

(function() {

	let m_timeoutIdMonitorBookmarkFeeds = null;

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
	// firefox commands (keyboard)
	browser.commands.onCommand.addListener((command) => {

		switch (command) {
			case "kb-open-sage-like":
				toggleSidebar();
				console.log("[Sage-Like]", "Waiting for Mozilla to fix Bug 1398833/1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465");
				break;
				//////////////////////////////////////////////////////////////
		}
	});

	//////////////////////////////////////////////////////////////////////
	// Sage-Like Toolbar button
	browser.browserAction.onClicked.addListener(toggleSidebar);
	browser.browserAction.setBadgeBackgroundColor({color: [0, 128, 0, 128]});

	// start the first bookmark feeds check after 2 seconds to allow the browser's
	// initilization to terminate and possibly the sidebar to be displayed.
	m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, 2000);

	//////////////////////////////////////////////////////////////////////
	function toggleSidebar() {

		browser.sidebarAction.open();		// supported in 57.0

		//#region Bug 1398833
		/*
			+ Bug 1398833: https://bugzilla.mozilla.org/show_bug.cgi?id=1398833
			+ sidebarAction.open/close may only be called from a user input handler

			- When (and if) it's fixed I should change the browser_action.default_title
			- string value in the manifest.json file to 'Sage-Like sidebar (Ctrl+Shift+F2)'.

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

		let nextInterval, isOpen;

		nextInterval = await prefs.getCheckFeedsInterval().catch(() => nextInterval = prefs.DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE);

		// if interval is zero then do not perform background monitoring
		if(nextInterval !== "0") {

			isOpen = await browser.sidebarAction.isOpen({}).catch(() => isOpen = true);		// supported in 59.0

			// background monitoring from the background page is done solely for
			// the purpose of updating the action button when the sidebar is closed
			if (!isOpen) {
				await checkForNewBookmarkFeeds();
			}

			// Repeat a new timeout session.
			if(nextInterval.includes(":")) {
				nextInterval = slUtil.calcMillisecondTillNextTime(nextInterval);
			}
			m_timeoutIdMonitorBookmarkFeeds = setTimeout(monitorBookmarkFeeds, Number(nextInterval));
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

				if(!objTreeFeedsData.exist(feed.id)) {
					objTreeFeedsData.set(feed.id);
				}
				objTreeFeedsData.setLastChecked(feed.id);

				try {
					let feedData = await syndication.fetchFeedData(feed.url, false, 3000);		// minimal timeout

					if(objTreeFeedsData.value(feed.id).lastVisited <= slUtil.asSafeNumericDate(feedData.lastUpdated)) {
						showNewBadge = !(await browser.sidebarAction.isOpen({}));
						break;
					}
				} catch (error) {
					console.log("[sage-like]", error);
				}
			}
			browser.browserAction.setBadgeText({ text: (showNewBadge ? "N" : "") });
			console.log("[sage-like]", "Periodic check for new feeds performed in background.");

		}).catch((error) => {
			console.log("[sage-like]", error);
		});
	}
})();
