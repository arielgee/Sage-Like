	////////////////////////////////////////////////////////////////////////////////////
	async function handleTbButtonCheckFeedsStaleAlert(checkLastUpdate = true) {

		if(m_elmCheckTreeFeeds.slSavedTitle === undefined) {
			m_elmCheckTreeFeeds.slSavedTitle = m_elmCheckTreeFeeds.title;
		}

		const period = 604800000;		// 604800000 = 7 * 24 * 60 * 60 * 1000 ; 7 days
		const isTreeStale = checkLastUpdate ? ((Date.now() - (await internalPrefs.getFeedsTreeLastUpdate())) > period) : false;

		if(isTreeStale) {
			m_elmCheckTreeFeeds.title = "Your entire tree hasn't been updated in a while.\nYou may want to refresh to retrieve the latest updates.";
			InfoBubble.i.show(m_elmCheckTreeFeeds.title, m_elmCheckTreeFeeds, true, false, 10000);
		} else {
			m_elmCheckTreeFeeds.title = m_elmCheckTreeFeeds.slSavedTitle;
			InfoBubble.i.dismiss();
		}

		// This is here for two reasons:
		// 1. when isTreeStale is true - to avoid alerting the user more than once in a period in case he still didn't refresh the tree
		// 2. when isTreeStale is false - when it's called from checkForNewRSSTreeFeedsData() ('check feeds' button) to restart the period
		internalPrefs.setFeedsTreeLastUpdate(Date.now());
	}

