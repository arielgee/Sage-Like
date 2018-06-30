"use strict";

(function() {

	//////////////////////////////////////////////////////////////////////
	// Messages handler
	//browser.runtime.onMessage.addListener((message) => {});

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

	//browser.sidebarAction.isOpen({}).then((isOpen) => {		// supported in 59.0
	//	if(!isOpen) {
			checkForNewBookmarkFeeds();
	//	}
	//});

	//////////////////////////////////////////////////////////////////////
	function toggleSidebar() {

		browser.sidebarAction.open();		// supported in 57.0

		/*	Bug 1398833: https://bugzilla.mozilla.org/show_bug.cgi?id=1398833

		browser.sidebarAction.isOpen({}).then((isOpen) => {		// supported in 59.0
			if(isOpen) {
				browser.sidebarAction.close();		// supported in 57.0
			} else {
				browser.sidebarAction.open();		// supported in 57.0
			}
		});
		*/
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function checkForNewBookmarkFeeds() {

		browser.browserAction.setBadgeText({text: ""});

		let bmFeeds = [];
		let objTreeFeedsData = new TreeFeedsData();

		await objTreeFeedsData.getStorage();

		prefs.getRootFeedsFolderId().then((folderId) => {

			if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				return;
			}

			browser.bookmarks.getSubTree(folderId).then(async (bookmarkItems) => {

				// collect all feed urls into an array
				if (bookmarkItems[0].children) {
					for (let child of bookmarkItems[0].children) {
						collectBookmarkFeeds(bmFeeds, child);
					}
				}

				// scan all feed urls for the first updated one
				for (let url of bmFeeds) {

					if(!objTreeFeedsData.exist(url)) {
						objTreeFeedsData.set(url);
					}
					objTreeFeedsData.setHandled(url);

					try {
						let feedData = await syndication.fetchFeedData(url, false, 3000);

						if(objTreeFeedsData.value(url).lastVisited <= slUtil.asSafeNumericDate(feedData.lastUpdated)) {
							browser.browserAction.setBadgeText({text: "N"});
							break;
						}
					} catch (error) {
						console.log("[sage-like]", error);
					}
				}
				console.log("[sage-like]", "checkForNewBookmarkFeeds - Done");
			}).catch((error) => {
				console.log("[sage-like]", error);
			});

		}).catch((error) => {
			console.log("[sage-like]", error);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function collectBookmarkFeeds(bmFeeds, bookmark) {

		// Is it a folder or a bookmark
		if(bookmark.url === undefined) {
			for (let child of bookmark.children) {
				collectBookmarkFeeds(bmFeeds, child);
			}
		} else {
			bmFeeds.push(bookmark.url);
		}
	}

})();
