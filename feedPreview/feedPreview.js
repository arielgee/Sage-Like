"use strict";

(function () {

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		let urlFeed = slUtil.getQueryStringValue("urlFeed");

		createFeedPreview(urlFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedPreview(urlFeed) {

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000).then((result) => {

				document.title = result.feedData.title;
				let elmFeedTitle = createFeedTitleElements(result.feedData);

				let elmFeedContent = document.createElement("div");
				let elmFeedItem;

				elmFeedContent.id = "feedContent";

				for(let idx=0; idx<result.list.length; idx++) {
					elmFeedItem = createFeedItemElements(result.list[idx]);
					elmFeedContent.appendChild(elmFeedItem);
				}

				let elmFeedBody = document.getElementById("feedBody");

				elmFeedBody.appendChild(elmFeedTitle);
				elmFeedBody.appendChild(elmFeedContent);
				elmFeedBody.removeChild(document.getElementById("loadingImg"));
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedTitleElements(feedData) {

		let elmFeedTitle = document.createElement("div");
		let elmFeedTitleText = document.createElement("div");
		let elmFeedDescText = document.createElement("div");

		elmFeedTitle.id = "feedTitle";
		elmFeedTitleText.id = "feedTitleText";
		elmFeedDescText.id = "feedDescriptionText";

		elmFeedTitleText.textContent = feedData.title;
		elmFeedDescText.textContent = feedData.description;

		elmFeedTitle.appendChild(elmFeedTitleText);
		elmFeedTitle.appendChild(elmFeedDescText);

		return elmFeedTitle;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemElements(feedItem) {

		let elmFeedItem = document.createElement("div");
		let elmFeedItemTitle = document.createElement("div");
		let elmFeedItemLink = document.createElement("a");
		let elmFeedItemTitleText = document.createElement("div");
		let elmFeedItemLastUpdatedText = document.createElement("div");
		let elmFeedItemContent = document.createElement("div");

		elmFeedItem.className = "feedItem";
		elmFeedItemTitle.className = "feedItemTitle";
		elmFeedItemTitleText.className = "feedItemTitleText";
		elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
		elmFeedItemContent.className = "feedItemContent";

		elmFeedItemLink.href = feedItem.url;
		elmFeedItemTitleText.textContent = feedItem.title;
		elmFeedItemLastUpdatedText.textContent = (new Date(slUtil.asSafeNumericDate(feedItem.lastUpdated))).toWebExtensionLocaleString();
		//elmFeedItemContent.textContent = feedItem.desc;
		elmFeedItemContent.innerHTML = feedItem.desc;

		elmFeedItem.appendChild(elmFeedItemTitle);
		elmFeedItem.appendChild(elmFeedItemContent);
		elmFeedItemTitle.appendChild(elmFeedItemLink);
		elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);

		return elmFeedItem;
	}

})();
