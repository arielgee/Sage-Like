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

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		browser.runtime.onMessage.addListener(onRuntimeMessage);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case Global.MSG_ID_RSS_TREE_CREATED_OK:

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

		document.body.addEventListener("contextmenu", onContextMenu);
		m_elmPageFeedsList.addEventListener("mousedown", onMouseDownPageFeedsList);
		m_elmPageFeedsList.addEventListener("click", onClickPageFeedsList);
		m_elmPageFeedsList.addEventListener("auxclick", onClickPageFeedsList);
		m_elmPageFeedsList.addEventListener("keydown", onKeyDownPageFeedsList);
		m_elmPageFeedsList.addEventListener("dragstart", onDragStartPageFeedsList);
		m_elmButtonAddFeeds.addEventListener("click", onClickButtonAdd);

		browser.windows.getCurrent().then((winInfo) => {
			m_windowId = winInfo.id;
			browser.runtime.sendMessage({ id: Global.MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW, winId: m_windowId }).then((isOpen) => {
				m_isSidebarOpen = isOpen;
			});
		});

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
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
		document.body.removeEventListener("contextmenu", onContextMenu);
		m_elmPageFeedsList.removeEventListener("mousedown", onMouseDownPageFeedsList);
		m_elmPageFeedsList.removeEventListener("click", onClickPageFeedsList);
		m_elmPageFeedsList.removeEventListener("auxclick", onClickPageFeedsList);
		m_elmPageFeedsList.removeEventListener("keydown", onKeyDownPageFeedsList);
		m_elmPageFeedsList.removeEventListener("dragstart", onDragStartPageFeedsList);
		m_elmButtonAddFeeds.removeEventListener("click", onClickButtonAdd);
		if(!!m_elmOptionsHref) {
			m_elmOptionsHref.removeEventListener("click", onClickOptionsPage);
		}

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onContextMenu(event) {
		event.preventDefault();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownPageFeedsList(event) {

		// The default behaviour of Fx is to call "mousedown" when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		let target = event.target;

		if(event.button === 1 || target === m_elmPageFeedsList) {
			event.stopPropagation();
			event.preventDefault();

			if(target.classList.contains("feedChkBox")) {
				target.parentElement.focus();				// checkbox is clicked, focus the list item
			} else if(target.classList.contains("feedItem")) {
				target.focus();				//  list item is clicked, focus the list item
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPageFeedsList(event) {

		let target = event.target;

		if(!!!target) return;

		if(event.button === 1) {		// middle click

			target = target.closest(".feedItem");
			if(!!target) {

				if(event.ctrlKey && event.altKey && !event.shiftKey) {

					let url = new URL(target.getAttribute("href"));
					url.searchParams.append(...(Global.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));
					url = url.toString();

					// ++Dev Mode++: open link & link view-source in new tabs
					browser.tabs.create({ url: url, active: false });
					browser.tabs.create({ url: "view-source:" + url, active: false });

				} else {
					browser.tabs.create({ url: slUtil.getFeedPreviewUrl(target.getAttribute("href")), active: event.shiftKey });
				}
			}

		} else if(event.button === 0) {			// default click

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
	function onDragStartPageFeedsList(event) {

		event.stopPropagation();

		let target = event.target;

		if(target.classList.contains("feedItem")) {

			let transfer = event.dataTransfer;
			let url = target.getAttribute("href");

			transfer.effectAllowed = "copy";
			transfer.setData("text/x-moz-url", url + "\n" + target.getAttribute("name"));
			transfer.setData("text/uri-list", url);
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
	function createFeedList(maxRepeatedCalls = 15) {

		// empty list if it was filled (leave the busyContainer)
		emptyFeedList(false);

		browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {

			let currentTabId = tabs[0].id;

			browser.tabs.sendMessage(currentTabId, { id: Global.MSG_ID_GET_CONFIRMED_PAGE_FEEDS }).then((response) => {

				document.getElementById("popupSubCaption").textContent = response.title;

				if(!response.isFeedsArraySet) {
					if(maxRepeatedCalls === 0) throw new Error("[Sage-Like] Max repeated calls to createFeedList() was reached");
					setTimeout(createFeedList, 2000, maxRepeatedCalls-1);
					return;
				}

				const feeds = response.feeds;

				// sort by index - when feed.status is "error" there is no "index". So this always result to FALSE (comparing with undefined)
				feeds.sort((a, b) => a.index > b.index ? 1 : -1);

				// empty list; remove busyContainer or if it was filled
				emptyFeedList();
				let isListEmpty = true;
				let frag = document.createDocumentFragment();

				for (let idx=0, len=feeds.length; idx<len; idx++) {

					const feed = feeds[idx];

					if(feed.status === "OK") {

						// The date type of the lastUpdated property is converted in SOME Fx versions from Date to
						// string during its transfer via the response object of the tabs.sendMessage() function when
						// delivered from the content script. Looks like intended serialization.
						// This was tested using typeof just before the listener's resolve() in content.js and here and Its
						// type is needed in createTagLI().
						// + All this is handled in createTagLI()

						frag.appendChild(createTagLI(feed));
						isListEmpty = false;
					} else if(feed.status === "error") {
						console.log("[Sage-Like]", feed.url.toString(), feed.message);
					}
				}

				if (isListEmpty) {
					document.getElementById("noticeContainer").style.display = "block";
					browser.runtime.sendMessage({ id: Global.MSG_ID_WAIT_AND_HIDE_POPUP, tabId: currentTabId, msWait: 7000 });
				} else {
					m_elmPageFeedsList.appendChild(frag);
					m_elmButtonAddFeeds.disabled = false;
				}

			}).catch((error) => {

				let elmNoticeContainer = document.getElementById("noticeContainer");

				elmNoticeContainer.firstElementChild.textContent = "Something Went Wrong!\nMost likely it's a browser issue concerning page permissions."
				elmNoticeContainer.style.display = "block";
				emptyFeedList();

				console.log("[Sage-Like]", error);
			});
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
		elmLabel.textContent = (!!feed.feedTitle && feed.feedTitle.length > 0 ? feed.feedTitle : Global.STR_TITLE_EMPTY);

		elmFormat.className = "format";
		elmFormat.textContent = feed.format;

		elmListItem.className = "feedItem";
		elmListItem.tabIndex = 0;						// can get the focus
		elmListItem.draggable = true;
		elmListItem.setAttribute("name", elmLabel.textContent);
		elmListItem.setAttribute("href", feed.url);

		// feed.lastUpdated may be missing, a string or a Date
		// A string due to the failure of xmlFeed (and NOT jsonFeed) to convert the value to
		// a Date type (_getFeedLastUpdate/_getFeedItemLastUpdate).
		let feedLastUpdate = feed.lastUpdated;
		let lastUpdated = undefined;
		if(feedLastUpdate) {
			if(feedLastUpdate instanceof Date) {
				lastUpdated = slUtil.getUpdateTimeFormattedString(feedLastUpdate);
			} else if(typeof(feedLastUpdate) === "string") {
				lastUpdated = feedLastUpdate;
			}
		}

		let titleText = "Title:\u2003" + feed.feedTitle + "\n" +
			"URL:\u2003" + decodeURIComponent(feed.url) + "\n" +
			(feed.format ? "Format:\u2003" + feed.format + "\n" : "") +
			(lastUpdated ? "Update:\u2003" + lastUpdated + "\n" : "") +
			(feed.itemCount ? "Items:\u2003" + feed.itemCount + "\n" : "") +
			(feed.expired ? "Expired:\u2003Yes\n" : "") +
			"\n\u2731 Use Middle-click to preview this feed.";
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

		browser.runtime.sendMessage({ id: Global.MSG_ID_ADD_NEW_DISCOVERED_FEEDS, winId: m_windowId, feeds: newFeedsList }).then((response) => {

			if(!!response && !!response.existInTree) {
				updateStatusBar("Already in tree: '" + response.existInTree + "'.");
			} else {
				window.close();
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateStatusBar(msg) {

		slUtil.replaceInnerContextualFragment(m_elmStatusBar, STATUS_BAR_MESSEGE_PREFIX + msg);

		m_elmOptionsHref = document.getElementById("pagePopupOptionsHref");
		if(!!m_elmOptionsHref) {
			m_elmOptionsHref.addEventListener("click", onClickOptionsPage);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function emptyFeedList(removeBusyContainer = true) {
		let elms = m_elmPageFeedsList.querySelectorAll("li" + (removeBusyContainer ? ", #busyContainer" : "") );
		for(let i=0, len=elms.length; i<len; i++) {
			m_elmPageFeedsList.removeChild(elms[i]);
		}
	}

})();
