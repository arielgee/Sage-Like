"use strict";

(function() {

	let m_timeoutIdMonitorBookmarkFeeds = null;

	//////////////////////////////////////////////////////////////////////
	// Sage-Like was installed
	browser.runtime.onInstalled.addListener((details) => {

		if(details.reason !== "install") return;

		browser.bookmarks.search({ title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME }).then((bookmarks) => {

			let isFound = false;

			for (const bookmark of bookmarks) {
				if (bookmark.type === "folder") {
					isFound = true;
					prefs.setRootFeedsFolderId(bookmark.id);
				}
			}

			if(!isFound) {

				let newFolder = {
					parentId: slGlobals.BOOKMARKS_ROOT_MENU_GUID,
					title: slGlobals.DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME,
					type: "folder",
				};

				browser.bookmarks.create(newFolder).then((created) => {

					let newFeed1 = {parentId: created.id, title: "feed1", url: "https://ariel1"};
					let newFeed2 = {parentId: created.id, title: "feed2", url: "https://ariel2"};
					let newFeed3 = {parentId: created.id, title: "feed3", url: "https://ariel3"};

					let createing1 = browser.bookmarks.create(newFeed1);
					let createing2 = browser.bookmarks.create(newFeed2);
					let createing3 = browser.bookmarks.create(newFeed3);

					createing1.then(() => {
						createing2.then(() => {
							createing3.then(() => {
								prefs.setRootFeedsFolderId(created.id);
							});
						});
					});
				});
			}

		});
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
			+ Bug 1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465
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
