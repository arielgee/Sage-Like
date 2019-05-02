"use strict";

let pagePopup = (function() {

	let m_elmCaption;
	let m_elmPageFeedsList;
	let m_elmButtonAddFeeds;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmCaption = document.getElementById("popupCaption");
		m_elmPageFeedsList = document.getElementById("pageFeedsList");
		m_elmButtonAddFeeds = document.getElementById("btnAddFeeds");

		m_elmButtonAddFeeds.addEventListener("click", onClickButtonAdd);

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			browser.tabs.sendMessage(tab[0].id, { message: slGlobals.MSG_ID_GET_PAGE_DATA }).then((response) => {

				console.log("[Sage-Like]", response);

				m_elmCaption.textContent = "Page Feeds - " + response.title;

				if(response.feeds.length < response.feedCount) {
					// add message
					return;
				} else {
					document.body.removeChild(document.getElementById("busyAnimLoading"))
				}

				for (let idx=0, len=response.feeds.length; idx<len; idx++) {
					const feed = response.feeds[idx];

					if(feed.status === "OK") {
						m_elmPageFeedsList.appendChild(createTagLI(feed));
					} else if(feed.status === "error") {
						console.log("[Sage-Like]", feed.url.toString(), feed.message);
					}

				}

			}).catch((error) => console.log("[Sage-Like]", error));
		});


	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmButtonAddFeeds.removeEventListener("click", onClickButtonAdd);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonAdd(event) {
		window.close();
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

		elmListItem.appendChild(elmCheckBox);
		elmListItem.appendChild(elmLabel);

		return elmListItem;
	}

})();
