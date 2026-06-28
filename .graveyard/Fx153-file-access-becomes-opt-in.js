
//############################################################################
// To test 'request({origins: ["file:///*"]})' place this in rssTreeView.onClickToolbarButton()

		browser.permissions.request({origins: ["<all_urls>"]}).then((granted) => {
			console.log("[Sage-Like] [permissions]", `<all_urls> permission request was ${granted ? "granted" : "DENIED"}`);
		});

		browser.permissions.contains({origins: ["<all_urls>"]}).then((answer) => {
			console.log("[Sage-Like] [permissions]", `<all_urls> permission is ${answer ? "" : "NOT "}contained`);
		});

		browser.permissions.request({origins: ["file:///*"]}).then((granted) => {
			console.log("[Sage-Like] [permissions]", `file:///* permission request was ${granted ? "granted" : "DENIED"}`);
		});

		browser.permissions.contains({origins: ["file:///*"]}).then((answer) => {
			console.log("[Sage-Like] [permissions]", `file:///* permission is ${answer ? "" : "NOT "}contained`);
		});

		browser.extension.isAllowedFileSchemeAccess().then((answer) => {
			console.log("[Sage-Like] [extension]", `file:///* permission is ${answer ? "" : "NOT "}allowed`);
		});

		return;


syndication.js
	////////////////////////////////////////////////////////////////////////////////////
	function feedDiscoveryFromSource(sourceText, url, requestId = 0) {

		const discoveredFeed = createObjectDiscoveredFeed(url, requestId);

		try {
			setDiscoveredFeedFromSource(discoveredFeed, { text: sourceText }, (new URL(url)), 0);
		} catch(error) {
			setDiscoveredFeedError(discoveredFeed, error);
		} finally {
			return Promise.resolve(discoveredFeed);
		}
	}


discoveryView.js
	////////////////////////////////////////////////////////////////////////////////////
	async function loadSingleDiscoverFeedFromSource(sourceText, strUrl, domainName) {

		setStatusbarMessage(domainName, false);

		syndication.feedDiscoveryFromSource(sourceText, strUrl, m_nRequestId).then((feedData) => {

			// do not process stale/aborted requests
			if(feedData.requestId === m_nRequestId) {

				if(feedData.status === "OK") {
					m_elmDiscoverFeedsList.appendChild(createTagLI(feedData));
					setStatusbarMessage(domainName + "\u2002(" + m_elmDiscoverFeedsList.children.length + ")", false);
				} else if(feedData.status === "error") {
					console.log("[Sage-Like]", feedData.url, feedData.message);
				}

				setDiscoverLoadingState(false);
				// if no feed was added to the list
				if(m_elmDiscoverFeedsList.children.length === 0) {
					setNoFeedsMsg("No valid feeds were discovered.");
				}
			}
		});
	}

	const isFileSchema = /^file:\/\/\//i.test(tab.url);

	if(isFileSchema) {
		loadSingleDiscoverFeedFromSource(pd.txtHTML, tab.url, (!!pd.domainName ? pd.domainName : pd.title));	// for local files
	} else {
		loadSingleDiscoverFeed(tab.url, (!!pd.domainName ? pd.domainName : pd.title));
	}
