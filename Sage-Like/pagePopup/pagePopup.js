"use strict";

(function() {

	const STATUS_BAR_MESSEGE_PREFIX = "⚠ "; //&#9888;&ensp;

	let m_elmPageFeedsList;
	let m_elmButtonAddFeeds;
	let m_elmStatusBar;
	let m_elmOptionsHref;
	let m_newFeedsListWait4Sidebar = null;

	let m_windowId = null;
	let m_isSidebarOpen;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		browser.runtime.onMessage.addListener(onRuntimeMessage);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case slGlobals.MSG_ID_RSS_TREE_CREATED_OK:

				if(!!m_newFeedsListWait4Sidebar && m_newFeedsListWait4Sidebar.length > 0) {
					dispatchNewDiscoveredFeeds(m_newFeedsListWait4Sidebar);
				}
				m_newFeedsListWait4Sidebar = null;
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmPageFeedsList = document.getElementById("pageFeedsList");
		m_elmButtonAddFeeds = document.getElementById("btnAddFeeds");
		m_elmStatusBar = document.getElementById("statusBar");
		m_elmOptionsHref = null;

		m_elmPageFeedsList.addEventListener("click", onClickPageFeedsList);
		m_elmPageFeedsList.addEventListener("auxclick", onClickPageFeedsList);
		m_elmPageFeedsList.addEventListener("keydown", onKeyDownPageFeedsList);
		m_elmButtonAddFeeds.addEventListener("click", onClickButtonAdd);

		browser.windows.getCurrent().then((winInfo) => {
			m_windowId = winInfo.id
			browser.runtime.sendMessage({ id: slGlobals.MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW, winId: m_windowId }).then((isOpen) => {
				m_isSidebarOpen = isOpen;
			});
		});

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				m_elmPageFeedsList.style.display = "none";
				updateStatusBar("Feeds folder not set in <a href='#' id='pagePopupOptionsHref'>Options page</a>.");
				//browser.runtime.openOptionsPage();		Opening the options page closes the popup
			} else {
				createFeedList();
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		m_elmPageFeedsList.removeEventListener("click", onClickPageFeedsList);
		m_elmPageFeedsList.removeEventListener("auxclick", onClickPageFeedsList);
		m_elmPageFeedsList.removeEventListener("keydown", onKeyDownPageFeedsList);
		m_elmButtonAddFeeds.removeEventListener("click", onClickButtonAdd);
		if(!!m_elmOptionsHref) {
			m_elmOptionsHref.removeEventListener("click", onClickOptionsPage);
		}

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPageFeedsList(event) {

		let target = event.target;

		if(!!!target) return;

		if(event.button === 1) {		// middle click

			target = target.closest(".feedItem");
			if(!!target) browser.tabs.create({ url: slUtil.getFeedPreviewUrl(target.getAttribute("href")) });

		} else {

			if(target.classList.contains("feedChkBox")) {
				target.parentElement.focus();				// checkbox is clicked and changed, focus the list item
			} else if(target.classList.contains("feedItem")) {
				target.firstElementChild.click();			// list item is focused, click and changed the checkbox
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownPageFeedsList(event) {

		let target = event.target;

		if(!!target && target.classList.contains("feedItem")) {

			switch (event.code) {

				case "Space":
					target.firstElementChild.click();
					break;
					/////////////////////////////////////////////////////////////////////////

				case "Home":
					if(!!m_elmPageFeedsList.firstElementChild.nextElementSibling) {
						m_elmPageFeedsList.firstElementChild.nextElementSibling.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				case "End":
					if(!!m_elmPageFeedsList.lastElementChild) {
						m_elmPageFeedsList.lastElementChild.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				case "ArrowUp":
					if(!!target.previousElementSibling && target.previousElementSibling.classList.contains("feedItem")) {
						target.previousElementSibling.focus();
					}
					break;
					//////////////////////////////

				case "ArrowDown":
					if(!!target.nextElementSibling) {
						target.nextElementSibling.focus();
					}
					break;
					//////////////////////////////

				default:
					return;		// do not stop propagation
					//////////////////////////////
			}

			event.stopPropagation();
			event.preventDefault();
		}

	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickButtonAdd(event) {

		let newFeedsList = collectSelectedFeeds();

		if(newFeedsList.length > 0) {

			if(!m_isSidebarOpen) {

				// Problem: If sidebar is closed we need to open it AND wait for the sidebar to be loaded AND for the message listener in the rssTreeView
				//			to be registered so that the message sent in dispatchNewDiscoveredFeeds() will be received and responded to.
				// Solution: The message MSG_ID_RSS_TREE_CREATED_OK is broadcast when the tree in the sidebar has loaded. It will be received
				//			 in pagePopup.onRuntimeMessage() and only then the new feeds will be added.

				m_newFeedsListWait4Sidebar = newFeedsList;
				await browser.sidebarAction.open();
			} else {
				dispatchNewDiscoveredFeeds(newFeedsList);
			}

		} else {
			updateStatusBar("Nothing to add.");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickOptionsPage() {
		browser.runtime.openOptionsPage();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedList() {

		let elmSubCaption = document.getElementById("popupSubCaption");
		let elmBusyContainer = document.getElementById("busyContainer");


		// empty list if it was filled
		if(!!m_elmPageFeedsList.firstElementChild && m_elmPageFeedsList.firstElementChild !== elmBusyContainer) {
			while (m_elmPageFeedsList.firstElementChild) {
				m_elmPageFeedsList.removeChild(m_elmPageFeedsList.firstElementChild);
			}
		}

		browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {

			let currentTabId = tabs[0].id;

			browser.tabs.sendMessage(currentTabId, { id: slGlobals.MSG_ID_GET_PAGE_DATA }).then((response) => {

				elmSubCaption.textContent = response.title;

				const feeds = response.feeds;
				const feedsLen = feeds.length;

				if(feedsLen < response.feedCount) {
					setTimeout(createFeedList, 2000);
					return;
				} else {
					elmBusyContainer.parentElement.removeChild(elmBusyContainer);
				}

				// sort by index
				feeds.sort((a, b) => a.index > b.index ? 1 : -1);

				let isListEmpty = true;

				for (let idx=0; idx<feedsLen; idx++) {

					const feed = feeds[idx];

					// For some unclear reason the data type of the lastUpdated property is converted from Date to string
					// during its transfer via the response object of the tabs.sendMessage() function when delivered
					// from the content script.
					// This was tested using typeof just before the listener's resolve() in content.js and here and Its
					// type is needed in createTagLI(). So there!
					feed.lastUpdated = new Date(feed.lastUpdated);

					if(feed.status === "OK") {
						m_elmPageFeedsList.appendChild(createTagLI(feed));
						isListEmpty = false;
					} else if(feed.status === "error") {
						console.log("[Sage-Like]", feed.url.toString(), feed.message);
					}
				}

				if (isListEmpty) {
					document.getElementById("noticeContainer").style.display = "block";
					browser.runtime.sendMessage({ id: slGlobals.MSG_ID_WAIT_AND_HIDE_POPUP, tabId: currentTabId, msWait: 7000 });
				} else {
					m_elmButtonAddFeeds.disabled = false;
				}

			}).catch((error) => console.log("[Sage-Like]", error));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagLI(feed) {

		let elmCheckBox = document.createElement("input");
		let elmLabel = document.createElement("label");
		let elmFormat = document.createElement("span");
		let elmListItem = document.createElement("li");

		elmCheckBox.id = "chkBox" + feed.index;
		elmCheckBox.className = "feedChkBox";
		elmCheckBox.type = "checkbox";
		elmCheckBox.tabIndex = -1;						// only the elmListItem can get the focus

		elmLabel.className = "feedLabel";
		elmLabel.htmlFor = elmCheckBox.id;
		elmLabel.textContent = (!!feed.feedTitle && feed.feedTitle.length > 0 ? feed.feedTitle : slGlobals.STR_TITLE_EMPTY);

		elmFormat.className = "format";
		elmFormat.textContent = feed.format;

		elmListItem.className = "feedItem";
		elmListItem.tabIndex = 0;						// can get the focus
		elmListItem.setAttribute("name", elmLabel.textContent);
		elmListItem.setAttribute("href", feed.url);

		let titleText = "Title:\u2003" + feed.feedTitle + "\u000d" +
			(feed.format ? "Format:\u2003" + feed.format + "\u000d" : "") +
			(feed.lastUpdated ? "Update:\u2003" + (feed.lastUpdated.toWebExtensionLocaleString() || feed.lastUpdated) + "\u000d" : "") +
			(feed.itemCount ? "Items:\u2003" + feed.itemCount + "\u000d" : "") +
			"URL:\u2003" + feed.url.toString() +
			"\n\n\u2731 Use Middle-click to preview this feed.";
		elmListItem.title = titleText;

		elmListItem.appendChild(elmCheckBox);
		elmListItem.appendChild(elmLabel);
		elmListItem.appendChild(elmFormat);

		return elmListItem;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function collectSelectedFeeds() {

		let newFeedsList = [];

		for (let item of m_elmPageFeedsList.children) {
			if(!!item.firstElementChild && item.firstElementChild.checked) {
				newFeedsList.push( { title: item.getAttribute("name"), url: item.getAttribute("href") } );
			}
		}
		return newFeedsList;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function dispatchNewDiscoveredFeeds(newFeedsList) {

		browser.runtime.sendMessage({ id: slGlobals.MSG_ID_ADD_NEW_DISCOVERED_FEEDS, winId: m_windowId, feeds: newFeedsList }).then((response) => {

			if(!!response && !!response.existInTree) {
				updateStatusBar("Already in tree: '" + response.existInTree + "'.");
			} else {
				window.close();
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateStatusBar(msg) {

		m_elmStatusBar.innerHTML = STATUS_BAR_MESSEGE_PREFIX + msg;

		m_elmOptionsHref = document.getElementById("pagePopupOptionsHref");
		if(!!m_elmOptionsHref) {
			m_elmOptionsHref.addEventListener("click", onClickOptionsPage);
		}
	}

})();
