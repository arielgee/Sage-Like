"use strict";

let discoveryView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	const AGGRESSIVE_TOOLTIP_TITLE = "Aggressive Discovery: \u000d" +
									"  \u25cf None: Check only for standardly discoverable RSS links. \u000d" +
									"  \u25cf Some: Check each hyperlink in page that its URL might suggest it links to an RSS feed. \u000d" +
                                    "  \u25cf Very: Check ALL hyperlinks in page (process may be lengthy).";

	let m_elmMainPanel = null;
	let m_elmDiscoverPanel = null;
	let m_elmDiscoverFeedsList;

	let m_elmButtonCheckmarkAll;
	let m_elmButtonRediscover;
	let m_elmAggressiveDiscoveryContainer;
	let m_elmTriTglAggressiveDiscoveryLevel;
	let m_elmButtonAdd;
	let m_elmButtonCancel;
	let m_elmLabelInfobar;

	let m_nRequestId = 0;

	let m_funcPromiseResolve = null;

	////////////////////////////////////////////////////////////////////////////////////
	function show() {

		return new Promise((resolve) => {

			initMemberElements();

			m_elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
			m_elmButtonCheckmarkAll.addEventListener("click", onClickButtonCheckmarkAll);
			m_elmButtonRediscover.addEventListener("click", onClickButtonRediscover);
			m_elmDiscoverFeedsList.addEventListener("click", onClickDiscoverFeedsList);
			m_elmDiscoverFeedsList.addEventListener("keydown", onKeyDownDiscoverFeedsList);
			m_elmTriTglAggressiveDiscoveryLevel.addEventListener("keydown", onKeyDownTriToggler);
			m_elmTriTglAggressiveDiscoveryLevel.addEventListener("mousedown", onMouseDownTriToggler);
			m_elmTriTglAggressiveDiscoveryLevel.addEventListener("keyup", onChangeTriTglAggressiveDiscoveryLevel);
			m_elmTriTglAggressiveDiscoveryLevel.addEventListener("click", onChangeTriTglAggressiveDiscoveryLevel);
			m_elmButtonAdd.addEventListener("click", onClickButtonAdd);
			m_elmButtonCancel.addEventListener("click", onClickButtonCancel);

			internalPrefs.getAggressiveDiscoveryLevel().then(level => m_elmTriTglAggressiveDiscoveryLevel.setAttribute("data-toggler-state", level));

			m_elmDiscoverPanel.classList.add("visible");
			slUtil.disableElementTree(m_elmDiscoverPanel, false);
			slUtil.disableElementTree(m_elmMainPanel, true, true, ["DIV", "LI", "INPUT"]);

			m_elmDiscoverPanel.focus()
			runDiscoverFeeds();

			m_funcPromiseResolve = resolve;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function close() {

		if(isOpen() === false) {
			return;
		}

		m_elmDiscoverPanel.classList.remove("visible");
		slUtil.disableElementTree(m_elmDiscoverPanel, true);
		slUtil.disableElementTree(m_elmMainPanel, false, false, ["DIV", "LI", "INPUT"]);
		m_nRequestId = 0;
		emptyDiscoverFeedsList();
		setStatusbarMessage("", false);

		delete m_elmButtonCheckmarkAll["slCheckmarkAction"];

		m_elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
		m_elmButtonCheckmarkAll.removeEventListener("click", onClickButtonCheckmarkAll);
		m_elmButtonRediscover.removeEventListener("click", onClickButtonRediscover);
		m_elmDiscoverFeedsList.removeEventListener("click", onClickDiscoverFeedsList);
		m_elmDiscoverFeedsList.removeEventListener("keydown", onKeyDownDiscoverFeedsList);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("keydown", onKeyDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("mousedown", onMouseDownTriToggler);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("keyup", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmTriTglAggressiveDiscoveryLevel.removeEventListener("click", onChangeTriTglAggressiveDiscoveryLevel);
		m_elmButtonAdd.removeEventListener("click", onClickButtonAdd);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);

		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmDiscoverPanel !== null && m_elmDiscoverPanel.classList.contains("visible"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMemberElements() {

		if(m_elmMainPanel === null) {
			m_elmMainPanel = document.getElementById("mainPanel");
			m_elmDiscoverPanel = document.getElementById("discoverPanel");
			m_elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
			m_elmButtonCheckmarkAll = document.getElementById("btnCheckmarkAll");
			m_elmButtonRediscover = document.getElementById("btnRediscover");
			m_elmAggressiveDiscoveryContainer = document.getElementById("aggressiveDiscoveryContainer");
			m_elmTriTglAggressiveDiscoveryLevel = document.getElementById("triTglAggressiveLevel");
			m_elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
			m_elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");
			m_elmLabelInfobar = document.getElementById("lblInfobar");

			m_elmAggressiveDiscoveryContainer.title = AGGRESSIVE_TOOLTIP_TITLE.replace(/ /g, "\u00a0");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function runDiscoverFeeds() {

		m_nRequestId = 0;
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

					if(pd.docElmId === "feedHandler" && !!!pd.domainName) {

						// Fx v63 build-in Feed Preview

						loadSingleDiscoverFeed(tab.url.toString(), pd.title);

					} else if(pd.docElmId === "_sage-LikeFeedPreview") {

						// Fx v64 Sage-Like Feed Preview

						loadSingleDiscoverFeed(decodeURIComponent(tab.url.toString().substring(slUtil.getFeedPreviewUrl("").length)), pd.title);

					} else {

						// For regular web pages

						loadDiscoverFeedsList(pd.txtHTML, (!!pd.domainName ? pd.domainName : pd.title), pd.origin);
					}

				}).catch((error) => {
					setNoFeedsMsg("Unable to access current tab.");
					//console.log("[Sage-Like]", error);
				}).finally(() => pageData.dispose());
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadSingleDiscoverFeed(strUrl, domainName) {

		m_nRequestId = Date.now();

		let timeout = await prefs.getFetchTimeout() * 1000;			// to millisec

		setDiscoverLoadingState(true);
		emptyDiscoverFeedsList();
		setStatusbarMessage(domainName, false);

		syndication.feedDiscovery(strUrl, timeout).then((feedData) => {

			if(feedData.status === "OK") {
				m_elmDiscoverFeedsList.appendChild(createTagLI(feedData));
				setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
			} else if(feedData.status === "error") {
				console.log("[Sage-Like]", feedData.url.toString(), feedData.message);
			}

			setDiscoverLoadingState(false);
			// if no feed was added to the list
			if(m_elmDiscoverFeedsList.children.length === 0) {
				setNoFeedsMsg("No valid feeds were discovered.");
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadDiscoverFeedsList(txtHTML, domainName, origin) {

		m_nRequestId = Date.now();

		let feedCount = -1, counter = 0;
		let timeout = await prefs.getFetchTimeout() * 1000;			// to millisec
		let aggressiveLevel = parseInt(await internalPrefs.getAggressiveDiscoveryLevel());

		let funcHandleDiscoveredFeed = function(feed) {

			// do not process stale requests
			if(feed.requestId === m_nRequestId) {

				if(feed.status === "OK") {
					m_elmDiscoverFeedsList.appendChild(createTagLI(feed));
					setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
				} else if(feed.status === "error") {
					console.log("[Sage-Like]", feed.url.toString(), feed.message);
				}

				// if function was called for all founded feeds
				if(feedCount === ++counter) {
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
		while(m_elmDiscoverFeedsList.firstChild) {
			m_elmDiscoverFeedsList.removeChild(m_elmDiscoverFeedsList.firstChild);
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
		elmListItem.title += "Title:\u2003" + feed.feedTitle + "\u000d";
		elmListItem.title += feed.format      ? "Format:\u2003" + feed.format + "\u000d" : "";
		elmListItem.title += feed.lastUpdated ? "Update:\u2003" + (feed.lastUpdated.toWebExtensionLocaleString() || feed.lastUpdated) + "\u000d" : "";
		elmListItem.title += feed.itemCount       ? "Items:\u2003" + feed.itemCount + "\u000d" : "";
		elmListItem.title += "URL:\u2003" + feed.url.toString();

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
		m_elmDiscoverPanel.classList.toggle("loading", isLoading);
		m_elmButtonCheckmarkAll.classList.toggle("disabled", isLoading);
		m_elmButtonRediscover.classList.toggle("disabled", isLoading);
		slUtil.disableElementTree(m_elmAggressiveDiscoveryContainer, isLoading);
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
	function setStatusbarMessage(text, isError) {
		m_elmLabelInfobar.textContent = text;
		m_elmLabelInfobar.classList.toggle("error", isError);
	}

	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownDiscoverPanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				onClickButtonAdd({});
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

		if(m_elmButtonCheckmarkAll.slCheckmarkAction === undefined) {
			m_elmButtonCheckmarkAll.slCheckmarkAction = true;
		}

		for (let item of m_elmDiscoverFeedsList.children) {
			item.firstElementChild.checked = m_elmButtonCheckmarkAll.slCheckmarkAction;
		}
		m_elmButtonCheckmarkAll.slCheckmarkAction = !m_elmButtonCheckmarkAll.slCheckmarkAction;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonRediscover(event) {
		runDiscoverFeeds();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickDiscoverFeedsList(event) {

		let target = event.target;

		if(!!target) {
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
	function onKeyDownTriToggler(event) {

		let target = event.target;

		let curState = parseInt(target.getAttribute("data-toggler-state"));

		switch (event.code) {
			case "ArrowLeft":	target.setAttribute("data-toggler-state", curState === 2 ? "1" : "0");	break;
			case "ArrowRight":	target.setAttribute("data-toggler-state", curState === 0 ? "1" : "2");	break;
			case "Home":		target.setAttribute("data-toggler-state", "0");							break;
			case "End":			target.setAttribute("data-toggler-state", "2");							break;
			default:			return;		// do not stop propagation
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
		show: show,
		close: close,
		isOpen: isOpen,
	};

})();
