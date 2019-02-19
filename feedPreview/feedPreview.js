"use strict";

(function () {

	let m_URL;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		let urlFeed = slUtil.getQueryStringValue("urlFeed");

		m_URL = new URL(urlFeed);

		createFeedPreview(urlFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedPreview(urlFeed) {

		let elmFeedBody = document.getElementById("feedBody");
		let elmLoadImg = document.getElementById("loadingImg");

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000).then((result) => {

				document.title = result.feedData.title.trim().length > 0 ? result.feedData.title : m_URL.hostname;
				let elmFeedTitle = createFeedTitleElements(result.feedData);

				let elmFeedContent = document.createElement("div");
				let elmFeedItem;

				elmFeedContent.id = "feedContent";

				for(let idx=0; idx<result.list.length; idx++) {
					elmFeedItem = createFeedItemElements(result.list[idx]);
					elmFeedContent.appendChild(elmFeedItem);
				}

				elmFeedBody.appendChild(elmFeedTitle);
				elmFeedBody.appendChild(elmFeedContent);

			}).catch((error) => {
				document.getElementById("errorMessage").textContent = error.message;
				console.log("[Sage-Like]", error);
			}).finally(() => elmFeedBody.removeChild(elmLoadImg) );
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

		elmFeedTitleText.textContent = document.title;
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
		let elmFeedItemTitleText = document.createElement("span");
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
		elmFeedItemContent.innerHTML = feedItem.desc.stripHtmlTags(String.prototype.stripHtmlTags.regexMultiBrTag, "<br>");

		relativeToAbsoluteURLs(elmFeedItemContent);

		elmFeedItem.appendChild(elmFeedItemTitle);
		elmFeedItem.appendChild(elmFeedItemContent);
		elmFeedItemTitle.appendChild(elmFeedItemLink);
		elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);

		return elmFeedItem;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function relativeToAbsoluteURLs(elm) {

		let elmATags = elm.getElementsByTagName("a");

		for(let idx=0; idx<elmATags.length; idx++) {
			// Link to a fake anchor result in href pointing to this webExt top page
			if(elmATags[idx].getAttribute("href") !== "#") {
				elmATags[idx].href = slUtil.replaceMozExtensionOriginURL(elmATags[idx].href, m_URL.origin);
			}
		};
	}

})();
