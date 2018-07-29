"use strict";

let discoveryView = (function() {

	const MSGID_GET_DOC_TEXT_HTML = "msgGetDocumentTextHTML";

	const CODE_INJECTION = "browser.runtime.sendMessage( { id: \"" + MSGID_GET_DOC_TEXT_HTML + "\"," +
														  "txtHTML: document.documentElement.outerHTML," +
														  "domainName: document.domain," +
														  "origin: window.location.origin, } );";

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmMainPanel = null;
	let m_elmDiscoverPanel = null;
	let m_elmDiscoverFeedsList;

	let m_elmButtonRediscover;
	let m_elmButtonAdd;
	let m_elmButtonCancel;
	let m_elmLabelInfobar;

	let m_nRequestId = 0;


	/**************************************************/
	browser.runtime.onMessage.addListener((message) => {
		if(message.id === MSGID_GET_DOC_TEXT_HTML) {
			loadDiscoverFeedsList(message.txtHTML, message.domainName, message.origin);
		}
	});

	////////////////////////////////////////////////////////////////////////////////////
	function open() {

		m_elmMainPanel = document.getElementById("mainPanel");
		m_elmDiscoverPanel = document.getElementById("discoverPanel");
		m_elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
		m_elmButtonRediscover = document.getElementById("btnRediscover");
		m_elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
		m_elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");
		m_elmLabelInfobar = document.getElementById("lblInfobar");

		m_elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
		m_elmButtonRediscover.addEventListener("click", onClickButtonRediscover);
		m_elmButtonAdd.addEventListener("click", onClickButtonAdd);
		m_elmButtonCancel.addEventListener("click", onClickButtonCancel);

		m_elmDiscoverPanel.style.display = "block";
		slUtil.disableElementTree(m_elmMainPanel, true);

		m_elmDiscoverPanel.focus()
		runDiscoverFeeds();
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
	function runDiscoverFeeds() {

		m_nRequestId = 0;
		setDiscoverLoadingState(false);
		emptyDiscoverFeedsList();
		setStatusbarMessage("", false);

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			if(tab[0].status === "loading") {
				setNoFeedsMsg("Current tab is still loading.");
				return;
			}

			browser.tabs.executeScript(tab[0].id, { code: CODE_INJECTION, runAt: "document_start" }).catch((error) => {
				setNoFeedsMsg("Unable to access current tab.");
				//console.log("[Sage-Like]", error);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function loadDiscoverFeedsList(txtHTML, domainName, origin) {

		m_nRequestId = Date.now();

		let feedCount = -1, counter = 0;
		let timeout = await prefs.getFetchTimeout();

		let funcHandleDiscoveredFeed = function(feed) {

			// do not prosess stale requests
			if(feed.requestId === m_nRequestId) {

				if(feed.status === "OK") {
					m_elmDiscoverFeedsList.appendChild(createTagLI(feed));
					setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
				} else if(feed.status === "error") {
					console.log("[sage-like]", feed.url.toString(), feed.message);
				}

				// if last found feed was added
				if(feedCount === ++counter) {
					setDiscoverLoadingState(false);
				}
			}
		};

		setDiscoverLoadingState(true);
		emptyDiscoverFeedsList();
		setStatusbarMessage(domainName, false);
		syndication.discoverWebSiteFeeds(txtHTML, timeout*1000, origin, m_nRequestId, funcHandleDiscoveredFeed).then((result) => {

			if((feedCount = result.length) === 0) {
				setNoFeedsMsg("No valid feeds were discovered.");
				setDiscoverLoadingState(false);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function loadDiscoverFeedsList_X(txtHTML, domainName, origin) {

		setDiscoverLoadingState(true);
		setStatusbarMessage(domainName, false);
		prefs.getFetchTimeout().then((timeout) => {
			syndication.discoverWebSiteFeeds(txtHTML, timeout*1000, origin).then((discoveredFeedsList) => {

				emptyDiscoverFeedsList();

				let feed, index = 1
				for(let key in discoveredFeedsList) {

					feed = discoveredFeedsList[key];

					if(feed.status === "OK") {
						m_elmDiscoverFeedsList.appendChild(createTagLI(index++, feed.title, feed.url, feed.lastUpdated, feed.format, feed.items));
					} else if(feed.status === "error") {
						console.log("[sage-like]", key, feed.message);
					}
				}
				if(m_elmDiscoverFeedsList.children.length === 0) {
					setNoFeedsMsg("No valid feeds were discovered.");
				}
				setDiscoverLoadingState(false);
			});
		});
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

		elmCheckBox.id = "chkBox" + feed.index.toString();
		elmCheckBox.className = "dfChkBox";
		elmCheckBox.type = "checkbox";

		elmLabelCaption.textContent = (feed.titleFeed.length > 0 ? feed.titleFeed : feed.titleLink);
		elmLabelCaption.className = "dfLabelCaption";

		elmLabelFormat.textContent = feed.format;
		elmLabelFormat.className = "dfLabelFormat smallText";

		elmLabel.className = "dfLabel";
		elmLabel.htmlFor = elmCheckBox.id;

		elmListItem.className = "dfItem";
		elmListItem.setAttribute("name", elmLabelCaption.textContent);
		elmListItem.setAttribute("href", feed.url);
		//elmListItem.title += "Feed Title:\u0009" + feed.titleFeed + "\u000d";
		//elmListItem.title += "Link Title:\u0009" + feed.titleLink + "\u000d";
		elmListItem.title += "Title:\u0009\u0009" + feed.titleFeed + "\u000d";
		elmListItem.title += feed.format      ? "Format:\u0009\u0009" + feed.format + "\u000d" : "";
		elmListItem.title += feed.lastUpdated ? "Update:\u0009\u0009" + (feed.lastUpdated.toLocaleString() || feed.lastUpdated) + "\u000d" : "";
		elmListItem.title += feed.items       ? "Items:\u0009\u0009" + feed.items + "\u000d" : "";
		elmListItem.title += "URL:\u0009\u0009" + feed.url;

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
	function onClickButtonRediscover(event) {
		runDiscoverFeeds();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonAdd(event) {

		prefs.getRootFeedsFolderId().then((folderId) => {

			if(folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
				setStatusbarMessage("Feeds folder not set in Options page.", true);
			} else {

				let newFeedsList = collectSelectedFeeds();

				if(newFeedsList.length > 0) {
					rssTreeView.addNewFeeds(newFeedsList);
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
