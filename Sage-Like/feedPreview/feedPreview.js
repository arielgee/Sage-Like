"use strict";

(function () {

	let m_URL;
	let m_elmFeedBody = null;
	let m_elmAttachmentTooltip;
	let m_timeoutMouseOver = null;
	let m_hashCustomCSSSource = "";
	let m_customCSSSourceChanged = false;

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {

		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
		document.addEventListener("focus", onFocusDocument);
		browser.runtime.onMessage.addListener(onRuntimeMessage);

		injectCustomCSSSource();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case slGlobals.MSG_ID_CUSTOM_CSS_SOURCE_CHANGED:
				prefs.getUseCustomCSSFeedPreview().then((use) => {
					if(!use) {
						m_customCSSSourceChanged = (m_hashCustomCSSSource.length > 0)
					} else {
						prefs.getCustomCSSSourceHash().then((hash) => m_customCSSSourceChanged = (hash !== m_hashCustomCSSSource) );
					}
				});
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		let urlFeed = decodeURIComponent(slUtil.getQueryStringValue("urlFeed"));

		m_URL = new URL(urlFeed);

		m_elmAttachmentTooltip = document.getElementById("attachmentTooltip");

		createFeedPreview(urlFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		if(!!m_elmFeedBody) {
			m_elmFeedBody.removeEventListener("mouseover", onMouseOverAttachment);
			m_elmFeedBody.removeEventListener("mouseout", onMouseOutAttachment);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusDocument(event) {

		if(m_customCSSSourceChanged) {
			browser.tabs.reload();
		}
		m_customCSSSourceChanged = false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedPreview(urlFeed) {

		m_elmFeedBody = document.getElementById("feedBody");
		let elmLoadImg = document.getElementById("busyAnimLoading");
		let elmFeedTitle;

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000, true, false, true).then((result) => {

				m_elmFeedBody.setAttribute("data-syn-std", result.feedData.standard);
				m_elmFeedBody.addEventListener("mouseover", onMouseOverAttachment);
				m_elmFeedBody.addEventListener("mouseout", onMouseOutAttachment);

				document.title = result.feedData.title.trim().length > 0 ? result.feedData.title : m_URL.hostname;
				elmFeedTitle = createFeedTitleElements(result.feedData);

				let elmFeedContent = document.createElement("div");
				elmFeedContent.id = "feedContent";

				if(result.list.length > 0) {
					for(let idx=0, len=result.list.length; idx<len; idx++) {
						if(idx<100) {
							elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) );
						} else {
							setTimeout(() => elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) ), 10);
						}
					}
					m_elmFeedBody.appendChild(elmFeedContent);
				} else {
					createErrorContent("No RSS feed items identified in document.", (new URL(urlFeed)));	/* duplicated string from syndication.fetchFeedData(). SAD. */
				}

			}).catch((error) => {

				document.title = m_URL.hostname;
				elmFeedTitle = createFeedTitleElements({ description: m_URL.pathname, imageUrl: "" });

				createErrorContent(error.message, (new URL(urlFeed)));
				console.log("[Sage-Like]", "Fetch error at " + urlFeed, error);

			}).finally(() => {
				m_elmFeedBody.removeChild(elmLoadImg);
				document.getElementById("pageHeaderContainer").appendChild(elmFeedTitle);
				brutallyReinforceSvgStyle();
			});
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
			elmFeedTitleImage.onerror = () => elmFeedTitleImage.removeAttribute("src");
		}

		elmFeedTitleTexts.appendChild(elmFeedTitleText);
		elmFeedTitleTexts.appendChild(elmFeedDescText);
		elmFeedTitle.appendChild(elmFeedTitleTexts);
		elmFeedTitle.appendChild(elmFeedTitleImage);

		return elmFeedTitle;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemElements(idx, feedItem) {

		let elmFeedItemContainer = document.createElement("div");
		let elmFeedItemNumber = document.createElement("div");
		let elmFeedItem = document.createElement("div");
		let elmFeedItemTitle = document.createElement("div");
		let elmFeedItemLink = document.createElement("a");
		let elmFeedItemTitleText = document.createElement("span");
		let elmFeedItemLastUpdatedText = document.createElement("div");
		let elmFeedItemContent = document.createElement("div");
		let elmFeedItemAttachmentsContainer;

		elmFeedItemContainer.className = "feedItemContainer";
		elmFeedItemNumber.className = "feedItemNumber feedItemBigFont";
		elmFeedItem.className = "feedItem";
		elmFeedItemTitle.className = "feedItemTitle";
		elmFeedItemTitleText.className = "feedItemTitleText feedItemBigFont";
		elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
		elmFeedItemContent.className = "feedItemContent";

		let itemContent = ((feedItem.htmlContent.length > 0) ? feedItem.htmlContent : feedItem.description);
		itemContent.stripHtmlTags(String.prototype.stripHtmlTags.regexMultiBrTag, "<br>");

		// add feed-item image only if it's not included in the item content
		let itemImage = "";
		if( (feedItem.image.length > 0) && !itemContent.includes(feedItem.image) ) {
			itemImage = "<img src=\"" + feedItem.image + "\" alt=\"" + feedItem.title + "\">";
		}

		elmFeedItemNumber.textContent = idx + 1 + ".";
		elmFeedItemLink.href = feedItem.url;
		elmFeedItemTitleText.textContent = feedItem.title;
		elmFeedItemLastUpdatedText.textContent = (new Date(slUtil.asSafeNumericDate(feedItem.lastUpdated))).toWebExtensionLocaleString();
		elmFeedItemContent.innerHTML = itemImage + itemContent;

		handleAbnormalURLs(elmFeedItemContent);

		elmFeedItemAttachmentsContainer = createFeedItemAttachmentsElements(feedItem.attachments);

		elmFeedItemContainer.appendChild(elmFeedItemNumber);
		elmFeedItemContainer.appendChild(elmFeedItem);
		elmFeedItem.appendChild(elmFeedItemTitle);
		elmFeedItem.appendChild(elmFeedItemContent);
		if(elmFeedItemAttachmentsContainer.children.length > 0) {
			elmFeedItem.appendChild(elmFeedItemAttachmentsContainer);
		}
		elmFeedItemTitle.appendChild(elmFeedItemLink);
		elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);

		return elmFeedItemContainer;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemAttachmentsElements(attachments) {

		let elmFeedItemAttachment;
		let elmFeedItemAttachmentLink;
		let elmFeedItemAttachmentImage;
		let elmFeedItemAttachmentTitle;
		let elmFeedItemAttachmentsContainer = document.createElement("div");
		let att;

		elmFeedItemAttachmentsContainer.className = "feedItemAttachmentsContainer";

		for(let i=0, len=attachments.length; i<len; i++) {

			att = attachments[i];

			elmFeedItemAttachment = document.createElement("div");
			elmFeedItemAttachment.className = "feedItemAttachment idx" + i;
			elmFeedItemAttachment.setAttribute("data-title", getAttachmentTitle(att));

			elmFeedItemAttachmentLink = document.createElement("a");
			elmFeedItemAttachmentLink.className = "feedItemAttachmentLink";
			elmFeedItemAttachmentLink.href = att.url;

			elmFeedItemAttachmentImage = document.createElement("img");
			elmFeedItemAttachmentImage.className = "feedItemAttachmentImage";
			elmFeedItemAttachmentImage.src = slUtil.getMimeTypeIconPath(att.mimeType);

			elmFeedItemAttachmentTitle = document.createElement("div");
			elmFeedItemAttachmentTitle.className = "feedItemAttachmentTitle";
			elmFeedItemAttachmentTitle.textContent = att.title;

			elmFeedItemAttachment.appendChild(elmFeedItemAttachmentLink);
			elmFeedItemAttachmentLink.appendChild(elmFeedItemAttachmentImage);
			elmFeedItemAttachmentLink.appendChild(elmFeedItemAttachmentTitle);
			elmFeedItemAttachmentsContainer.appendChild(elmFeedItemAttachment);
		}

		return elmFeedItemAttachmentsContainer;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleAbnormalURLs(elm) {

		/*
			.getAttribute("href") - returns the attribute text value
			.href - returns the full path URL;
		*/
		let url;
		let elmsWithUrl = elm.getElementsByTagName("a");

		for(let idx=0, len=elmsWithUrl.length; idx<len; idx++) {

			// Link to a fake anchor result in href pointing to this webExt top page - leave it
			if(elmsWithUrl[idx].getAttribute("href") === "#") continue;

			// modify relative URLs to absolute - for relative URLs .href is 'moz-extension://...'
			url = slUtil.replaceMozExtensionOriginURL(elmsWithUrl[idx].href, m_URL.origin);

			// replaceMozExtensionOriginURL() returns a valid URL object or null is not valid - remove non-vaild
			if(url === null) {
				elmsWithUrl[idx].removeAttribute("href");
			} else {
				elmsWithUrl[idx].href = url;
			}
		}

		elmsWithUrl = elm.getElementsByTagName("img");

		for(let idx=0, len=elmsWithUrl.length; idx<len; idx++) {

			// modify relative URLs to absolute - for relative URLs .src is 'moz-extension://...'
			url = slUtil.replaceMozExtensionOriginURL(elmsWithUrl[idx].src, m_URL.origin);

			if(url === null) {
				elmsWithUrl[idx].removeAttribute("src");
			} else {
				elmsWithUrl[idx].src = url;
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createErrorContent(errorMessage, url) {

		url.searchParams.append(...(slGlobals.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));

		document.getElementById("errorContainer").classList.add("withMessage");
		document.getElementById("errorMessage").textContent = errorMessage;
		document.getElementById("errorMessageLink").href = url.toString();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getAttachmentTitle(attachment) {

		const FMT_ATTACHMENT_TITLE = "<p><b>Title:</b> {0}</p><p><b>URL:</b> {1}</p>";
		const FMT_ATTACHMENT_TITLE_WITH_SIZE = FMT_ATTACHMENT_TITLE + "<p><b>Size:</b> {2}";

		let size = slUtil.asPrettyByteSize(attachment.byteSize);

		// no size is zero
		if(!!!size || size.startsWith("0 ")) {
			return FMT_ATTACHMENT_TITLE.format([attachment.title, attachment.url.toString()]);
		} else {
			return FMT_ATTACHMENT_TITLE_WITH_SIZE.format([attachment.title, attachment.url.toString(), size]);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOverAttachment(event) {

		let elmAtt;

		// only if it's an attachment
		if(!!!event.target || !!!(elmAtt = event.target.closest(".feedItemAttachment"))) {
			return;
		}

		event.stopPropagation();
		clearTimeout(m_timeoutMouseOver);

		m_elmAttachmentTooltip.innerHTML = elmAtt.getAttribute("data-title");

		let tooltipStyle = m_elmAttachmentTooltip.style;

		// hide it and place it as high as possible to prevent resizing of
		// the container when html data is retrieved
		tooltipStyle.visibility = "hidden";
		tooltipStyle.left = tooltipStyle.top = "0";

		// set display=block as soon as possible to retrieve any remote html data (images, etc) and
		// panel element will have dimentions (offsetWidth > 0)
		tooltipStyle.display = "block";

		m_timeoutMouseOver = setTimeout(() => {

			const POS_OFFSET = 8;
			let x = elmAtt.offsetLeft + POS_OFFSET;
			let y = elmAtt.offsetTop - m_elmAttachmentTooltip.offsetHeight - POS_OFFSET;

			if (x < window.scrollX) {
				x = elmAtt.offsetLeft + elmAtt.offsetWidth + POS_OFFSET;
			}

			if (y < window.scrollY) {
				y = elmAtt.offsetTop + elmAtt.offsetHeight + POS_OFFSET;
			}

			tooltipStyle.visibility = "visible";
			tooltipStyle.left = x + "px";
			tooltipStyle.top = y + "px";

		}, 100);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOutAttachment(event) {

		if(!!event.target && !!event.target.closest(".feedItemAttachment")) {
			clearTimeout(m_timeoutMouseOver);
			m_timeoutMouseOver = null;
			m_elmAttachmentTooltip.style.display = "none";
			m_elmAttachmentTooltip.style.visibility = "hidden";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectCustomCSSSource() {

		prefs.getUseCustomCSSFeedPreview().then((use) => {
			if(use) {
				prefs.getCustomCSSSource().then((source) => {
					if(source.length > 0) {

						prefs.getCustomCSSSourceHash().then((hash) => m_hashCustomCSSSource = hash );

						browser.tabs.insertCSS({ code: source, runAt: "document_start" }).then(() => {}).catch((err) => {
							console.log("[Sage-Like]", "Custom CSS source injection generated an error", err);
						});
					}
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function brutallyReinforceSvgStyle() {

		/*
			GOTYA MADERFAKER!!!

			Had this feed (http://feeds.feedburner.com/TechCrunch) with 2 svg elements that would not abide to
			CSS rule '.feedItemContent svg' in feedPreview.css. No matter what I did.

			So, after more than an hour of fiddling around, I had to get brutal and this is the result.
		*/

		let i, len, cssText;
		let rules = document.styleSheets[0].cssRules;

		for(i=0, len=rules.length; i<len; i++) {
			if(typeof(rules[i].selectorText) === "string" && rules[i].selectorText.match(/(^|[, ])\.feedItemContent svg\b/gim)) {
				cssText = rules[i].style.cssText;
				break;
			}
		}

		let elmSvgs = m_elmFeedBody.getElementsByTagName("svg");

		for(i=0, len=elmSvgs.length; i<len; i++) {
			elmSvgs[i].style.cssText = cssText;
		}
	}
})();
