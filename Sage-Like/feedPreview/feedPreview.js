"use strict";

(function () {

	let m_URL;
	let m_imgMissingImage;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {

		m_imgMissingImage = new Image();
		m_imgMissingImage.src = "/icons/sageLike-48.png";

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

				let url = new URL(urlFeed);
				let elmErrMsgLink = document.getElementById("errorMessageLink");

				url.searchParams.append(...(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));
				elmErrMsgLink.href = url.toString();
				elmErrMsgLink.textContent = "\nOpen in browser";		// to show the newline it needs 'white-space: pre-line;'

				console.log("[Sage-Like]", "Fetch Error at " + urlFeed, error);

			}).finally(() => elmFeedBody.removeChild(elmLoadImg) );
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedTitleElements(feedData) {

		let elmFeedTitle = document.createElement("div");
		let elmFeedTitleTexts = document.createElement("div");
		let elmFeedTitleText = document.createElement("div");
		let elmFeedDescText = document.createElement("div");
		let elmFeedTitleImage = document.createElement("img");

		elmFeedTitle.id = "feedTitle";
		elmFeedTitleTexts.id = "feedTitleTexts";
		elmFeedTitleText.id = "feedTitleText";
		elmFeedDescText.id = "feedDescriptionText";
		elmFeedTitleImage.id = "feedTitleImage";

		elmFeedTitleText.textContent = document.title;
		elmFeedDescText.textContent = feedData.description;
		if(feedData.imageUrl.length > 0) {
			elmFeedTitleImage.src = slUtil.replaceMozExtensionOriginURL(feedData.imageUrl, m_URL.origin);
			elmFeedTitleImage.onerror = () => elmFeedTitleImage.src = createMissingImage();
		}

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

	////////////////////////////////////////////////////////////////////////////////////
	function createMissingImage() {

		const id = "slCanvasNoImage";
		const bgColor = "#d8d8d8";
		const fgColor = "#cc0000";

		let canvasMissingImage = document.getElementById(id);

		if(canvasMissingImage === null) {
			canvasMissingImage = document.createElement("canvas");
			canvasMissingImage.id = id;
			canvasMissingImage.width = canvasMissingImage.height = 80;
		}

		const ctx = canvasMissingImage.getContext("2d");

		// background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvasMissingImage.width, canvasMissingImage.height);

		// image
		ctx.drawImage(m_imgMissingImage, 16, 8);

		// text
		ctx.fillStyle = fgColor;
		ctx.font = "bold 16pt serif";
		ctx.fillText("Oops...", 10, 35);
		ctx.font = "10pt Segoe UI";
		ctx.fillText("Missing!", 16, 70);

		return canvasMissingImage.toDataURL();
	}

})();
