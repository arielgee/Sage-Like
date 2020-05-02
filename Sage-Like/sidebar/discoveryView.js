"use strict";

let discoveryView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	const AGGRESSIVE_TOOLTIP_TITLE = "Aggressive Discovery: \n" +
									"  \u25cf None: Check only for standardly discoverable RSS links. \n" +
									"  \u25cf Low: Check each hyperlink in page that its URL might suggest it links to an RSS feed. \n" +
									"  \u25cf High: Check ALL hyperlinks in page (process may be lengthy).";

	let m_elmDiscoverPanel = null;
	let m_elmDiscoverFeedsList;

	let m_elmButtonCheckmarkAll;
	let m_elmButtonRediscover;
	let m_elmAggressiveDiscoveryContainer;
	let m_elmTriTglAggressiveDiscoveryLevel;
	let m_elmButtonAdd;
	let m_elmButtonCancel;
	let m_elmDiscoveryStatusBar;

	let m_isLoading = false;
	let m_nRequestId = 0;
	let m_abortDiscovery = null;

	let m_funcPromiseResolve = null;

	let m_slideDownPanel = null;

	////////////////////////////////////////////////////////////////////////////////////
	function open() {

		return new Promise((resolve) => {

			initMembers();

			m_slideDownPanel.pull(true);
			panel.disable(true);

			m_elmDiscoverPanel.focus()

			m_funcPromiseResolve = resolve;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function close() {

		if(isOpen() === false) {
			return;
		}

		m_slideDownPanel.pull(false);
		panel.disable(false);

		removeEventListeners();

		m_nRequestId = 0;
		if(!!m_abortDiscovery) m_abortDiscovery.abort();
		m_abortDiscovery = null;
		setStatusbarMessage("", false);

		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmDiscoverPanel !== null && m_elmDiscoverPanel.classList.contains("visible"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMembers() {

		if(m_elmDiscoverPanel === null) {
			m_elmDiscoverPanel = document.getElementById("discoverPanel");
			m_elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
			m_elmButtonCheckmarkAll = document.getElementById("btnCheckmarkAll");
			m_elmButtonRediscover = document.getElementById("btnRediscover");
			m_elmAggressiveDiscoveryContainer = document.getElementById("aggressiveDiscoveryContainer");
			m_elmTriTglAggressiveDiscoveryLevel = document.getElementById("triTglAggressiveLevel");
			m_elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
			m_elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");
			m_elmDiscoveryStatusBar = document.getElementById("discoveryStatusBar");

			m_slideDownPanel = new SlideDownPanel(m_elmDiscoverPanel, onPullDownSlideDownPanel, onPullUpSlideDownPanel);

			if(m_elmButtonRediscover.slSavedTitle === undefined) {
				m_elmButtonRediscover.slSavedTitle = m_elmButtonRediscover.title;
			}

			m_elmAggressiveDiscoveryContainer.title = AGGRESSIVE_TOOLTIP_TITLE.replace(/ /g, "\u00a0");
		}

		internalPrefs.getAggressiveDiscoveryLevel().then(level => m_elmTriTglAggressiveDiscoveryLevel.setAttribute("data-toggler-state", level));

		addEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function runDiscoverFeeds() {

		m_nRequestId = Date.now();
		m_abortDiscovery = null;

		setDiscoverLoadingState(false);
		emptyDiscoverFeedsList();
		setStatusbarMessage("", false);

		browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {

			const tab = tabs[0];

			if(tab.status === "loading") {
				setNoFeedsMsg("Current tab is still loading.");
			} else {

				const pageData = new PageDataByInjection();

				pageData.get(tab.id).then((pd) => {

					if(!!!pd.title) pd.title = slGlobals.STR_TITLE_EMPTY;

					if( (pd.docElmId === "feedHandler" && !!!pd.domainName) || pd.isPlainText ) {

						// Fx v63 build-in Feed Preview OR browser's plaintext

						loadSingleDiscoverFeed(tab.url, (!!pd.domainName ? pd.domainName : pd.title));

					} else if(pd.docElmId === "_sage-LikeFeedPreview") {

						// Fx v64 Sage-Like Feed Preview

						loadSingleDiscoverFeed(decodeURIComponent(tab.url.substring(slUtil.getFeedPreviewUrl("").length)), pd.title);

					} else {

						// For regular web pages

						loadDiscoverFeedsList(pd.txtHTML, (!!pd.domainName ? pd.domainName : pd.title), pd.origin);
					}

				}).catch((error) => {

					if(tab.url.match(/^(about|view-source|chrome|resource):/)) {
						setNoFeedsMsg("Unable to access current tab.");
					} else {

						// Code injection failure most likely is due to "Missing host permission for the tab".
						// This usually happens with built-in browser pages like "about:" or "view-source:".
						// Since this CAN happend with the browser's devtools.jsonview and that json CAN also
						// be a feed (jsonfeed), try to acquire the feed from the URL without injection.
						loadSingleDiscoverFeed(tab.url, tab.title, error);
					}

					//console.log("[Sage-Like]", error);
				}).finally(() => pageData.dispose());
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function abortDiscoverFeeds() {

		m_nRequestId = 0;
		if(!!m_abortDiscovery) m_abortDiscovery.abort();

		setDiscoverLoadingState(false);
		sortDiscoverFeedsList();
		setStatusbarMessage(" - Aborted!", true, true);

		m_abortDiscovery = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadSingleDiscoverFeed(strUrl, domainName, injectErr = undefined) {

		const timeout = await prefs.getFetchTimeout() * 1000;			// to millisec

		setDiscoverLoadingState(true);
		emptyDiscoverFeedsList();
		setStatusbarMessage(domainName, false);

		syndication.feedDiscovery(strUrl, timeout, m_nRequestId).then((feedData) => {

			// do not process stale/aborted requests
			if(feedData.requestId === m_nRequestId) {

				if(feedData.status === "OK") {
					m_elmDiscoverFeedsList.appendChild(createTagLI(feedData));
					setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
				} else if(feedData.status === "error") {
					console.log("[Sage-Like]", feedData.url, feedData.message, ...(!!injectErr ? ["[ Inject error: ", injectErr, "]"] : []));
				}

				setDiscoverLoadingState(false);
				// if no feed was added to the list
				if(m_elmDiscoverFeedsList.children.length === 0) {
					setNoFeedsMsg("No valid feeds were discovered.");
				}
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadDiscoverFeedsList(txtHTML, domainName, origin) {

		const timeout = await prefs.getFetchTimeout() * 1000;			// to millisec
		const aggressiveLevel = parseInt(await internalPrefs.getAggressiveDiscoveryLevel());

		let feedCount = -1, counter = 0;

		let funcHandleDiscoveredFeed = function(feed) {

			// do not process stale/aborted requests
			if(feed.requestId === m_nRequestId) {

				if(feed.status === "OK") {
					m_elmDiscoverFeedsList.appendChild(createTagLI(feed));
					setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
				} else if(feed.status === "error") {
					console.log("[Sage-Like]", feed.url.toString(), feed.message);
				}

				// if function was called for all founded feeds
				if(feedCount === ++counter) {
					m_abortDiscovery = null;
					setDiscoverLoadingState(false);

					// if none of the feeds was added to the list
					if(m_elmDiscoverFeedsList.children.length === 0) {
						setNoFeedsMsg("No valid feeds were discovered.");
					} else {
						sortDiscoverFeedsList();
					}
				}
			}
		};

		setDiscoverLoadingState(true);
		emptyDiscoverFeedsList();
		setStatusbarMessage(domainName, false);
		syndication.webPageFeedsDiscovery(txtHTML, timeout, origin, m_nRequestId, funcHandleDiscoveredFeed, aggressiveLevel).then((result) => {

			if((feedCount = result.length) === 0) {
				setNoFeedsMsg("No feeds were discovered.");
				setDiscoverLoadingState(false);
			}
			m_abortDiscovery = result.abortObject;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sortDiscoverFeedsList() {

		let items = Array.from(m_elmDiscoverFeedsList.children);
		items.sort((a, b) => a.getAttribute("data-index") > b.getAttribute("data-index") ? 1 : -1);

		for(let i=0, len=items.length; i<len; i++) {
			m_elmDiscoverFeedsList.appendChild(m_elmDiscoverFeedsList.removeChild(items[i]));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function emptyDiscoverFeedsList() {
		while(m_elmDiscoverFeedsList.firstElementChild) {
			m_elmDiscoverFeedsList.removeChild(m_elmDiscoverFeedsList.firstElementChild);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagLI(feed) {

		let elmCheckBox = document.createElement("input");
		let elmLabelCaption = document.createElement("div");
		let elmLabelFormat = document.createElement("div");
		let elmLabel = document.createElement("div");
		let elmListItem = document.createElement("li");

		elmCheckBox.id = "chkBox" + feed.index;
		elmCheckBox.className = "dfChkBox";
		elmCheckBox.type = "checkbox";
		elmCheckBox.tabIndex = -1;						// only the elmListItem can get the focus

		elmLabelCaption.textContent = (!!feed.feedTitle && feed.feedTitle.length > 0 ? feed.feedTitle : slGlobals.STR_TITLE_EMPTY);
		elmLabelCaption.className = "dfLabelCaption";

		elmLabelFormat.textContent = feed.format;
		elmLabelFormat.className = "dfLabelFormat smallText";

		elmLabel.className = "dfLabel";

		elmListItem.className = "dfItem";
		elmListItem.tabIndex = 0;					// can get the focus
		elmListItem.setAttribute("name", elmLabelCaption.textContent);
		elmListItem.setAttribute("href", feed.url);
		elmListItem.setAttribute("data-index", feed.index);

		let titleText = "Title:\u2003" + feed.feedTitle + "\n" +
			(feed.format ? "Format:\u2003" + feed.format + "\n" : "") +
			(feed.lastUpdated ? "Update:\u2003" + (feed.lastUpdated.toWebExtensionLocaleString() || feed.lastUpdated) + "\n" : "") +
			(feed.itemCount ? "Items:\u2003" + feed.itemCount + "\n" : "") +
			"URL:\u2003" + feed.url.toString() +
			"\n\n\u2731 Use Middle-click to preview this feed.";
		elmListItem.title = titleText;

		elmListItem.appendChild(elmCheckBox);
		elmLabel.appendChild(elmLabelCaption);
		elmLabel.appendChild(elmLabelFormat);
		elmListItem.appendChild(elmLabel);

		return elmListItem;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setNoFeedsMsg(text) {
		let elm = document.createElement("li");
		elm.className = "dfItem novalidfeeds";
		elm.textContent = text;
		emptyDiscoverFeedsList();
		m_elmDiscoverFeedsList.appendChild(elm);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setDiscoverLoadingState(isLoading) {

		m_isLoading = isLoading;

		m_elmDiscoverPanel.classList.toggle("loading", m_isLoading);
		m_elmButtonCheckmarkAll.classList.toggle("disabled", m_isLoading);
		m_elmButtonRediscover.title = m_isLoading ? "Abort!" : m_elmButtonRediscover.slSavedTitle;
		slUtil.disableElementTree(m_elmAggressiveDiscoveryContainer, m_isLoading, false, ["DIV", "SL-TRI-TOGGLER", "SL-TRI-TOGGLER-RAIL"]);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function collectSelectedFeeds() {

		let newFeedsList = [];

		for (let item of m_elmDiscoverFeedsList.children) {
			if(item.firstElementChild && item.firstElementChild.checked) {

				let url = item.getAttribute("href");

				if(rssTreeView.isFeedInTree(url)) {
					setStatusbarMessage("Already in tree: '" + item.getAttribute("name") + "'.", true);
					return [];
				}
				newFeedsList.push( { title: item.getAttribute("name"), url: url } );
			}
		}

		if(newFeedsList.length === 0) {
			setStatusbarMessage("Nothing to add.", true);
			return [];
		}

		return newFeedsList;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setStatusbarMessage(text, isError, concatToContent = false) {
		m_elmDiscoveryStatusBar.textContent = (concatToContent ? m_elmDiscoveryStatusBar.textContent : "") + text;
		m_elmDiscoveryStatusBar.classList.toggle("error", isError);
	}

	//==================================================================================
	//=== Callbacks
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onPullDownSlideDownPanel() {
		runDiscoverFeeds();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onPullUpSlideDownPanel() {
		emptyDiscoverFeedsList();
	}

	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {
		m_elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
		m_elmButtonCheckmarkAll.addEventListener("click", onClickButtonCheckmarkAll);
		m_elmButtonRediscover.addEventListener("click", onClickButtonRediscover);
		m_elmDiscoverFeedsList.addEventListener("click", onClickDiscoverFeedsList);
		m_elmDiscoverFeedsList.addEventListener("auxclick", onClickDiscoverFeedsList);
		m_elmDiscoverFeedsList.addEventListener("keydown", onKeyDownDiscoverFeedsList);
		m_elmTriTglAggressiveDiscoveryLevel.addEventListener("keydown", onKeyDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.addEventListener("mousedown", onMouseDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.addEventListener("keyup", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmTriTglAggressiveDiscoveryLevel.addEventListener("click", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmButtonAdd.addEventListener("click", onClickButtonAdd);
		m_elmButtonCancel.addEventListener("click", onClickButtonCancel);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEventListeners() {
		m_elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
		m_elmButtonCheckmarkAll.removeEventListener("click", onClickButtonCheckmarkAll);
		m_elmButtonRediscover.removeEventListener("click", onClickButtonRediscover);
		m_elmDiscoverFeedsList.removeEventListener("click", onClickDiscoverFeedsList);
		m_elmDiscoverFeedsList.removeEventListener("auxclick", onClickDiscoverFeedsList);
		m_elmDiscoverFeedsList.removeEventListener("keydown", onKeyDownDiscoverFeedsList);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("keydown", onKeyDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("mousedown", onMouseDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("keyup", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("click", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmButtonAdd.removeEventListener("click", onClickButtonAdd);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownDiscoverPanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(document.activeElement === m_elmButtonCancel) {
					close();
				} else {
					onClickButtonAdd({});
				}
				break;
				//////////////////////////////
			case "Escape":
				close();
				break;
				//////////////////////////////
			default:
				break;
				//////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonCheckmarkAll(event) {

		// noting to checkmark
		if(m_elmDiscoverFeedsList.firstElementChild.classList.contains("novalidfeeds")) {
			return;
		}

		// use first item
		let listItems = m_elmDiscoverFeedsList.children;
		let checked = !!(listItems[0]) ? !(listItems[0].firstElementChild.checked) : false;

		for(let i=0, len=listItems.length; i<len; i++) {
			listItems[i].firstElementChild.checked = checked;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonRediscover(event) {
		if(m_isLoading) {
			abortDiscoverFeeds();
		} else {
			runDiscoverFeeds();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickDiscoverFeedsList(event) {

		let target = event.target;

		if(!!!target) return;

		if(event.button === 1) {			// middle click

			target = target.closest(".dfItem");
			if(!!target) {

				if(event.ctrlKey && event.altKey && !event.shiftKey) {

					let url = new URL(target.getAttribute("href"));
					url.searchParams.append(...(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));
					url = url.toString();

					// ++Dev Mode++: open link & link view-source in new tabs
					browser.tabs.create({ url: url, active: false });
					browser.tabs.create({ url: "view-source:" + url, active: false });

				} else {
					browser.tabs.create({ url: slUtil.getFeedPreviewUrl(target.getAttribute("href")), active: true });
				}
			}
		} else {

			if(target.classList.contains("dfChkBox")) {
				target.parentElement.focus();				// checkbox is clicked and changed, focus the list item
			} else if(target.classList.contains("dfItem") && !target.classList.contains("novalidfeeds")) {
				target.firstElementChild.click();			// list item is focused, click and changed the checkbox
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownDiscoverFeedsList(event) {

		let target = event.target;

		if(!!target && target.classList.contains("dfItem")) {

			switch (event.code) {

				case "Space":
					target.firstElementChild.click();
					break;
					/////////////////////////////////////////////////////////////////////////

				case "Home":
					if(!!m_elmDiscoverFeedsList.firstElementChild) {
						m_elmDiscoverFeedsList.firstElementChild.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				case "End":
					if(!!m_elmDiscoverFeedsList.lastElementChild) {
						m_elmDiscoverFeedsList.lastElementChild.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				case "ArrowUp":
					if(!!target.previousElementSibling) {
						target.previousElementSibling.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				case "ArrowDown":
					if(!!target.nextElementSibling) {
						target.nextElementSibling.focus();
					}
					break;
					/////////////////////////////////////////////////////////////////////////

				default:
					return;		// do not stop propagation
					/////////////////////////////////////////////////////////////////////////
			}

			event.stopPropagation();
			event.preventDefault();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTriToggler(event) {

		let target = event.target;

		let curState = parseInt(target.getAttribute("data-toggler-state"));

		switch (event.code) {

			case "ArrowLeft":
			case "ArrowUp":
				target.setAttribute("data-toggler-state", curState === 2 ? "1" : "0");
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowRight":
			case "ArrowDown":
				target.setAttribute("data-toggler-state", curState === 0 ? "1" : "2");
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Home":
			case "PageUp":
				target.setAttribute("data-toggler-state", "0");
				break;
				/////////////////////////////////////////////////////////////////////////

			case "End":
			case "PageDown":
				target.setAttribute("data-toggler-state", "2");
				break;
				/////////////////////////////////////////////////////////////////////////

			default:
				return;		// do not stop propagation
				/////////////////////////////////////////////////////////////////////////
		}

		event.stopPropagation();
		event.preventDefault();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownTriToggler(event) {

		let toggleWidth = Math.floor(event.target.clientWidth / 3);

		if (event.offsetX < toggleWidth) {
			event.target.parentElement.setAttribute("data-toggler-state", "0");
		} else if (event.offsetX < toggleWidth * 2) {
			event.target.parentElement.setAttribute("data-toggler-state", "1");
		} else {
			event.target.parentElement.setAttribute("data-toggler-state", "2");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeTriTglAggressiveDiscoveryLevel(event) {
		if(event.type === "click" || (event.type === "keyup" && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.code))) {
			internalPrefs.setAggressiveDiscoveryLevel(m_elmTriTglAggressiveDiscoveryLevel.getAttribute("data-toggler-state"));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonAdd(event) {

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				setStatusbarMessage("Feeds folder not set in Options page.", true);
				browser.runtime.openOptionsPage();
			} else {

				let newFeedsList = collectSelectedFeeds();

				if(newFeedsList.length > 0) {
					m_funcPromiseResolve(newFeedsList);
					close();
				}
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonCancel(event) {
		close();
	}

	return {
		open: open,
		close: close,
		isOpen: isOpen,
	};

})();
