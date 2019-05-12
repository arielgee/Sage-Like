"use strict";

let discoveryView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmMainPanel = null;
	let m_elmDiscoverPanel = null;
	let m_elmDiscoverFeedsList;

	let m_elmButtonCheckmarkAll;
	let m_elmButtonRediscover;
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
			m_elmButtonAdd.addEventListener("click", onClickButtonAdd);
			m_elmButtonCancel.addEventListener("click", onClickButtonCancel);

			m_elmDiscoverPanel.style.display = "block";
			slUtil.disableElementTree(m_elmMainPanel, true);

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

		slUtil.disableElementTree(m_elmMainPanel, false);
		m_elmDiscoverPanel.style.display = "none";
		m_nRequestId = 0;
		emptyDiscoverFeedsList();
		setStatusbarMessage("", false);

		m_elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
		m_elmButtonCheckmarkAll.removeEventListener("click", onClickButtonCheckmarkAll);
		m_elmButtonRediscover.removeEventListener("click", onClickButtonRediscover);
		m_elmButtonAdd.removeEventListener("click", onClickButtonAdd);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);

		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmDiscoverPanel !== null && m_elmDiscoverPanel.style.display === "block");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMemberElements() {

		if(m_elmMainPanel === null) {
			m_elmMainPanel = document.getElementById("mainPanel");
			m_elmDiscoverPanel = document.getElementById("discoverPanel");
			m_elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
			m_elmButtonCheckmarkAll = document.getElementById("btnCheckmarkAll");
			m_elmButtonRediscover = document.getElementById("btnRediscover");
			m_elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
			m_elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");
			m_elmLabelInfobar = document.getElementById("lblInfobar");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function runDiscoverFeeds() {

		m_nRequestId = 0;
		setDiscoverLoadingState(false);
		emptyDiscoverFeedsList();
		setStatusbarMessage("", false);

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			if(tab[0].status === "loading") {
				setNoFeedsMsg("Current tab is still loading.");
			} else {

				const pageData = new PageDataByInjection();

				pageData.get(tab[0].id).then((pd) => {
					loadDiscoverFeedsList(pd.txtHTML, (!!pd.domainName ? pd.domainName : pd.title), pd.origin);
				}).catch((error) => {
					setNoFeedsMsg("Unable to access current tab.");
					//console.log("[Sage-Like]", error);
				}).finally(() => pageData.dispose());
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadDiscoverFeedsList(txtHTML, domainName, origin) {

		m_nRequestId = Date.now();

		let feedCount = -1, counter = 0;
		let timeout = await prefs.getFetchTimeout();

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
		syndication.webPageFeedsDiscovery(txtHTML, timeout*1000, origin, m_nRequestId, funcHandleDiscoveredFeed).then((result) => {

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
		let elmLabel = document.createElement("label");
		let elmListItem = document.createElement("li");

		elmCheckBox.id = "chkBox" + feed.index;
		elmCheckBox.className = "dfChkBox";
		elmCheckBox.type = "checkbox";
		elmCheckBox.setAttribute("tabindex", "-1");	// only the elmListItem can get the focus

		elmLabelCaption.textContent = (!!feed.feedTitle && feed.feedTitle.length > 0 ? feed.feedTitle : feed.linkTitle);
		elmLabelCaption.className = "dfLabelCaption";

		elmLabelFormat.textContent = feed.format;
		elmLabelFormat.className = "dfLabelFormat smallText";

		elmLabel.className = "dfLabel";
		//elmLabel.htmlFor = elmCheckBox.id;

		elmListItem.className = "dfItem";
		elmListItem.onclick = (e) => {
			if(e.target === elmCheckBox) {
			 	elmListItem.focus();
			} else {
				elmCheckBox.click();
			}

		};
		elmListItem.onkeyup = (e) => {
			if(e.code.toLowerCase() === "space") elmCheckBox.click();
		};
		elmListItem.setAttribute("tabindex", "0");	// can get the focus
		elmListItem.setAttribute("name", elmLabelCaption.textContent);
		elmListItem.setAttribute("href", feed.url);
		elmListItem.setAttribute("data-index", feed.index);
		//elmListItem.title += "Feed Title:\u2003" + feed.feedTitle + "\u000d";
		//elmListItem.title += "Link Title:\u2003" + feed.linkTitle + "\u000d";
		elmListItem.title += "Title:\u2003" + feed.feedTitle + "\u000d";
		elmListItem.title += feed.format      ? "Format:\u2003" + feed.format + "\u000d" : "";
		elmListItem.title += feed.lastUpdated ? "Update:\u2003" + (feed.lastUpdated.toWebExtensionLocaleString() || feed.lastUpdated) + "\u000d" : "";
		elmListItem.title += feed.items       ? "Items:\u2003" + feed.items + "\u000d" : "";
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
		m_elmButtonCheckmarkAll.classList.toggle("disabled", isLoading)
		m_elmButtonRediscover.classList.toggle("disabled", isLoading)
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
		switch (event.key.toLowerCase()) {
			case "enter":
				onClickButtonAdd({});
				break;
				//////////////////////////////
			case "escape":
				close()
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

		if(m_elmButtonCheckmarkAll.checkmarkAction === undefined) {
			m_elmButtonCheckmarkAll.checkmarkAction = true;
		}

		for (let item of m_elmDiscoverFeedsList.children) {
			item.firstElementChild.checked = m_elmButtonCheckmarkAll.checkmarkAction;
		}
		m_elmButtonCheckmarkAll.checkmarkAction = !m_elmButtonCheckmarkAll.checkmarkAction;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonRediscover(event) {
		runDiscoverFeeds();
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
