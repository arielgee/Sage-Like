"use strict";

let pagePopup = (function() {

	let m_elmButtonAddFeeds;
	let m_elmStatusBar;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmButtonAddFeeds = document.getElementById("btnAddFeeds");
		m_elmStatusBar = document.getElementById("statusBar");

		m_elmButtonAddFeeds.addEventListener("click", onClickButtonAdd);

		createFeedList();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmButtonAddFeeds.removeEventListener("click", onClickButtonAdd);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonAdd(event) {

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				//m_elmStatusBar.textContent ="Feeds folder not set in Options page.";
				browser.runtime.openOptionsPage();
			} else {

				let newFeedsList = collectSelectedFeeds();

				if(newFeedsList.length > 0) {
					browser.sidebarAction.open();
					//m_funcPromiseResolve(newFeedsList);
					window.close();
				}
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedList() {

		let elmSubCaption = document.getElementById("popupSubCaption");
		let elmBusyContainer = document.getElementById("busyContainer");
		let elmPageFeedsList = document.getElementById("pageFeedsList");


		// empty list if it was filled
		if(!!elmPageFeedsList.firstElementChild && elmPageFeedsList.firstElementChild !== elmBusyContainer) {
			while (elmPageFeedsList.firstElementChild) {
				elmPageFeedsList.removeChild(elmPageFeedsList.firstElementChild);
			}
		}

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			browser.tabs.sendMessage(tab[0].id, { message: slGlobals.MSG_ID_GET_PAGE_DATA }).then((response) => {

				elmSubCaption.textContent = response.title;

				let feedsLen = response.feeds.length;

				if(feedsLen < response.feedCount) {
					setTimeout(createFeedList, 2000);
					return;
				} else {
					elmBusyContainer.parentElement.removeChild(elmBusyContainer);
				}

				for (let idx=0; idx<feedsLen; idx++) {

					const feed = response.feeds[idx];

					// For some unclear reason the data type of the lastUpdated property is converted from Date to string
					// during its transfer via the response object of the tabs.sendMessage() function when delivered
					// from the content script.
					// This was tested using typeof just before the listener's resolve() in content.js and here and Its
					// type is needed in createTagLI(). So there!
					feed.lastUpdated = new Date(feed.lastUpdated);

					if(feed.status === "OK") {
						elmPageFeedsList.appendChild(createTagLI(feed));
					} else if(feed.status === "error") {
						console.log("[Sage-Like]", feed.url.toString(), feed.message);
					}
				}

				/*

				if (!!!elmPageFeedsList.firstElementChild) {
					elmPageFeedsList.appendChild(document.createElement("div"));
					elmPageFeedsList.firstElementChild.id = "busyMessage";
					elmPageFeedsList.firstElementChild.textContent = "Feeds were found, but none of them were valid."
				}
				*/

			}).catch((error) => console.log("[Sage-Like]", error));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagLI(feed) {

		let elmCheckBox = document.createElement("input");
		let elmLabel = document.createElement("label");
		let elmListItem = document.createElement("li");

		elmCheckBox.id = "chkBox" + feed.index;
		elmCheckBox.className = "feedChkBox";
		elmCheckBox.type = "checkbox";
		elmCheckBox.setAttribute("tabindex", "-1");	// only the elmListItem can get the focus

		elmLabel.className = "feedLabel";
		elmLabel.htmlFor = elmCheckBox.id;
		elmLabel.textContent = (!!feed.feedTitle && feed.feedTitle.length > 0 ? feed.feedTitle : feed.linkTitle);

		elmListItem.className = "feedItem";
		elmListItem.setAttribute("tabindex", "0");	// can get the focus
		elmListItem.setAttribute("name", elmLabel.textContent);
		elmListItem.setAttribute("href", feed.url);
		elmListItem.onclick = (e) => { if(e.target === elmListItem) elmCheckBox.click(); };
		elmListItem.onkeyup = (e) => { if(e.code.toLowerCase() === "space") elmCheckBox.click(); };

		elmListItem.title += "Feed Title:\u2003" + feed.feedTitle + "\u000d";
		elmListItem.title += "Link Title:\u2003" + feed.linkTitle + "\u000d";
		//elmListItem.title += "Title:\u2003" + feed.feedTitle + "\u000d";
		elmListItem.title += feed.format ? "Format:\u2003" + feed.format + "\u000d" : "";
		elmListItem.title += feed.lastUpdated ? "Update:\u2003" + (feed.lastUpdated.toWebExtensionLocaleString() || feed.lastUpdated) + "\u000d" : "";
		elmListItem.title += feed.items ? "Items:\u2003" + feed.items + "\u000d" : "";
		elmListItem.title += "URL:\u2003" + feed.url.toString();

		elmListItem.appendChild(elmCheckBox);
		elmListItem.appendChild(elmLabel);

		return elmListItem;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function collectSelectedFeeds() {
		return [1];
	}

})();
