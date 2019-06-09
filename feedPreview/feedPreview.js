"use strict";

(function () {

	let m_URL;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		let urlFeed = decodeURIComponent(slUtil.getQueryStringValue("urlFeed"));

		m_URL = new URL(urlFeed);

		createFeedPreview(urlFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedPreview(urlFeed) {

		let elmFeedBody = document.getElementById("feedBody");
		let elmLoadImg = document.getElementById("busyAnimLoading");

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000).then((result) => {

				elmFeedBody.setAttribute("data-syn-std", result.feedData.standard);

				document.title = result.feedData.title.trim().length > 0 ? result.feedData.title : m_URL.hostname;
				let elmFeedTitle = createFeedTitleElements(result.feedData);

				let elmFeedContent = document.createElement("div");
				let elmFeedItem;

				elmFeedContent.id = "feedContent";

				for(let idx=0, len=result.list.length; idx<len; idx++) {
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
		let elmFeedTitleTexts = document.createElement("div");
		let elmFeedTitleText = document.createElement("div");
		let elmFeedDescText = document.createElement("div");
		let elmFeedTitleImage = document.createElement("div");

		elmFeedTitle.id = "feedTitle";
		elmFeedTitleTexts.id = "feedTitleTexts";
		elmFeedTitleText.id = "feedTitleText";
		elmFeedDescText.id = "feedDescriptionText";
		elmFeedTitleImage.id = "feedTitleImage";

		elmFeedTitleText.textContent = document.title;
		elmFeedDescText.textContent = feedData.description;
		elmFeedTitleImage.style.backgroundImage = "url('" + feedData.imageUrl + "')";

		elmFeedTitleTexts.appendChild(elmFeedTitleText);
		elmFeedTitleTexts.appendChild(elmFeedDescText);
		elmFeedTitle.appendChild(elmFeedTitleTexts);
		elmFeedTitle.appendChild(elmFeedTitleImage);

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

		handleAbnormalURLs(elmFeedItemContent);

		elmFeedItem.appendChild(elmFeedItemTitle);
		elmFeedItem.appendChild(elmFeedItemContent);
		elmFeedItemTitle.appendChild(elmFeedItemLink);
		elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);

		return elmFeedItem;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleAbnormalURLs(elm) {

		let url;
		let elmATags = elm.getElementsByTagName("a");

		for(let idx=0, len=elmATags.length; idx<len; idx++) {

			// Link to a fake anchor result in href pointing to this webExt top page - leave it
			if(elmATags[idx].getAttribute("href") === "#") continue;

			// modify relative URLs to absolute - for relative URLs .href is 'moz-extension://...'
			url = slUtil.replaceMozExtensionOriginURL(elmATags[idx].href, m_URL.origin);

			// replaceMozExtensionOriginURL() returns a valid URL object or null is not valid - remove non-vaild
			if(url === null) {
				elmATags[idx].removeAttribute("href");
			} else {
				elmATags[idx].href = url;
			}
		};
	}

})();
