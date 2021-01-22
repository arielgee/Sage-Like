"use strict";

(function () {

	// Don't remove natively empty elements (css)
	const SEL_EMPTY_ELEMENTS_NOTS = ":not(img):not(br):not(hr):not(col):not(source):not(track):not(wbr):not(embed):not(area)";
	const SELECTOR_EMPTY_ELEMENT = `${SEL_EMPTY_ELEMENTS_NOTS}:empty,${SEL_EMPTY_ELEMENTS_NOTS}:-moz-only-whitespace`;

	let m_URL;
	let m_elmFeedBody = null;
	let m_elmJumpListContainer = null;
	let m_elmJumpList = null;
	let m_elmAttachmentTooltip;
	let m_timeoutMouseOver = null;
	let m_hashCustomCSSSource = "";
	let m_customCSSSourceChanged = false;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {

		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
		document.addEventListener("focus", onFocusDocument);
		browser.runtime.onMessage.addListener(onRuntimeMessage);

		injectCustomCSSSource();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case slGlobals.MSG_ID_PREFERENCES_CHANGED:
				if(message.details === slGlobals.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE) {
					prefs.getUseCustomCSSFeedPreview().then((use) => {
						if(!use) {
							m_customCSSSourceChanged = (m_hashCustomCSSSource.length > 0)
						} else {
							prefs.getCustomCSSSourceHash().then((hash) => m_customCSSSourceChanged = (hash !== m_hashCustomCSSSource) );
						}
					});
				}
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		let urlFeed = decodeURIComponent(slUtil.getQueryStringValue("urlFeed"));

		m_URL = new URL(urlFeed);

		// Enable creation of CSS rules by feed origin
		document.documentElement.setAttribute("data-feedPreview-hostname", m_URL.hostname);
		document.documentElement.setAttribute("data-feedPreview-pathname", m_URL.pathname);

		m_elmAttachmentTooltip = document.getElementById("attachmentTooltip");

		createFeedPreview(urlFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
		document.removeEventListener("focus", onFocusDocument);

		if(!!m_elmFeedBody) {
			m_elmFeedBody.removeEventListener("mouseover", onMouseOverAttachment);
			m_elmFeedBody.removeEventListener("mouseout", onMouseOutAttachment);
			m_elmJumpListContainer.removeEventListener("click", onClickJumpListContainer);
			m_elmJumpListContainer.removeEventListener("blur", onBlurJumpListContainer);
			m_elmJumpListContainer.removeEventListener("keydown", onKeyDownJumpListContainer);
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
		m_elmJumpListContainer = document.getElementById("jumpListContainer");
		m_elmJumpList = document.getElementById("jumpList");
		let elmLoadImg = document.getElementById("busyAnimLoading");
		let elmFeedTitle;

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000, true, false, true).then((result) => {

				m_elmFeedBody.setAttribute("data-syn-std", result.feedData.standard);
				m_elmFeedBody.addEventListener("mouseover", onMouseOverAttachment);
				m_elmFeedBody.addEventListener("mouseout", onMouseOutAttachment);
				m_elmJumpListContainer.addEventListener("click", onClickJumpListContainer);
				m_elmJumpListContainer.addEventListener("blur", onBlurJumpListContainer);
				m_elmJumpListContainer.addEventListener("keydown", onKeyDownJumpListContainer);

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
				if(elmFeedTitle.style.direction === "rtl") {
					document.getElementById("pageHeaderContainer").style.direction = "rtl";
				}
				m_elmFeedBody.removeChild(elmLoadImg);
				document.getElementById("pageHeaderContainer").removeChild(document.getElementById("loadingLabel"));
				document.getElementById("pageHeaderContainer").appendChild(elmFeedTitle);
				removeEmptyElementsFromFeedContent();
				brutallyReinforceSvgStyle();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedTitleElements(feedData) {

		let elmFeedTitle = document.createElement("div");
		let elmFeedTitleTexts = document.createElement("div");
		let elmFeedTitleText = document.createElement("div");
		let elmFeedTitleTextAnchor = document.createElement("a");
		let elmFeedDescText = document.createElement("div");
		let elmFeedTitleImage = document.createElement("img");

		elmFeedTitle.id = "feedTitle";
		elmFeedTitleTexts.id = "feedTitleTexts";
		elmFeedTitleText.id = "feedTitleText";
		elmFeedTitleTextAnchor.id = "feedTitleTextAnchor";
		elmFeedDescText.id = "feedDescriptionText";
		elmFeedTitleImage.id = "feedTitleImage";

		let url = slUtil.replaceMozExtensionOriginURL(feedData.webPageUrl, m_URL.origin);
		if(!!url) {
			elmFeedTitleTextAnchor.href = url.toString();
		}

		elmFeedTitleTextAnchor.textContent = document.title;
		elmFeedDescText.textContent = feedData.description;
		if(feedData.imageUrl.length > 0) {
			elmFeedTitleImage.src = slUtil.replaceMozExtensionOriginURL(feedData.imageUrl, m_URL.origin);
			elmFeedTitleImage.onerror = () => elmFeedTitleImage.removeAttribute("src");
		}

		elmFeedTitleText.appendChild(elmFeedTitleTextAnchor);
		elmFeedTitleTexts.appendChild(elmFeedTitleText);
		elmFeedTitleTexts.appendChild(elmFeedDescText);
		elmFeedTitle.appendChild(elmFeedTitleTexts);
		elmFeedTitle.appendChild(elmFeedTitleImage);

		elmFeedTitle.style.direction = slUtil.getLanguageDir(elmFeedTitleText.textContent);

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
		let elmFeedItemLastUpdatedTime = document.createElement("time");
		let elmFeedItemContent = document.createElement("div");
		let elmFeedItemAttachmentsContainer;

		elmFeedItemContainer.className = "feedItemContainer";
		elmFeedItemNumber.className = "feedItemNumber feedItemBigFont";
		elmFeedItem.className = "feedItem";
		elmFeedItemTitle.className = "feedItemTitle";
		elmFeedItemTitleText.className = "feedItemTitleText feedItemBigFont";
		elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
		elmFeedItemLastUpdatedTime.className = "feedItemLastUpdatedTime";
		elmFeedItemContent.className = "feedItemContent";

		let itemContent;
		if(feedItem.htmlContent.length > 0) {
			itemContent = feedItem.htmlContent
				.stripHtmlTags(String.prototype.stripHtmlTags.regex3PlusBrTag, "<br><br>")
				.stripHtmlTags(String.prototype.stripHtmlTags.regexStartMultiBrTags, "");
		} else if (String.prototype.stripHtmlTags.regexAnyTag.test(feedItem.description)) {
			itemContent = feedItem.description
				.stripHtmlTags(String.prototype.stripHtmlTags.regex3PlusBrTag, "<br><br>")
				.stripHtmlTags(String.prototype.stripHtmlTags.regexStartMultiBrTags, "");
		} else {
			itemContent = feedItem.description
				.replace(/(\r\n)/gim, "<br>")
				.replace(/(\n)/gim, "<br>")
				.stripHtmlTags(String.prototype.stripHtmlTags.regexStartMultiBrTags, "");
		}

		// add feed-item image only if it's not included in the item content
		let itemImage = "";
		if( (feedItem.image.length > 0) && !itemContent.includes(feedItem.image) ) {
			itemImage = "<img src=\"" + feedItem.image + "\" alt=\"" + feedItem.title + "\">";
		}

		let feedItemDate = new Date(slUtil.asSafeNumericDate(feedItem.lastUpdated));

		elmFeedItemNumber.textContent = idx + 1 + ".";
		elmFeedItemLink.href = feedItem.url;
		elmFeedItemTitleText.textContent = feedItem.title.trim().length > 0 ? feedItem.title : feedItem.url;
		elmFeedItemLastUpdatedTime.dateTime = feedItemDate.toISOString();
		elmFeedItemLastUpdatedTime.textContent = `${feedItemDate.toWebExtensionLocaleString()} (${feedItemDate.getRelativeShortLocaleString()})`;
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
		elmFeedItemLastUpdatedText.appendChild(elmFeedItemLastUpdatedTime);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);

		elmFeedItemContainer.style.direction = slUtil.getLanguageDir(elmFeedItemTitleText.textContent);

		addToJumpList(idx, elmFeedItemTitleText.textContent, (elmFeedItemContainer.id = slUtil.getUniqId()));

		return elmFeedItemContainer;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addToJumpList(idx, textContent, href) {

		let elmJLItem = document.createElement("a");

		elmJLItem.className = "jumpListAnchor";
		elmJLItem.textContent = `${idx+1}. ${textContent}`;
		elmJLItem.href = `#${href}`;

		m_elmJumpList.appendChild(elmJLItem);
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
			elmFeedItemAttachmentLink.download = "";

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
			return FMT_ATTACHMENT_TITLE.format([attachment.title, decodeURIComponent(attachment.url.toString())]).escapeMarkup();
		} else {
			return FMT_ATTACHMENT_TITLE_WITH_SIZE.format([attachment.title, decodeURIComponent(attachment.url.toString()), size]).escapeMarkup();
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

		m_elmAttachmentTooltip.innerHTML = elmAtt.getAttribute("data-title").unescapeMarkup();

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

			if ((x + m_elmAttachmentTooltip.offsetWidth) > window.innerWidth) {
				x = window.innerWidth - m_elmAttachmentTooltip.offsetWidth - POS_OFFSET - slUtil.getScrollbarWidth();
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
	function onClickJumpListContainer(event) {
		if(event.target.id === "jumpListContainer") {
			m_elmJumpListContainer.classList.add("open");
			m_elmJumpListContainer.focus();
		} else if(event.target.tagName === "A") {
			m_elmJumpListContainer.classList.remove("open");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurJumpListContainer(event) {
		//if( !!!event.relatedTarget || !event.relatedTarget.classList.contains("jumpListAnchor") ) {
			if( !!!event.relatedTarget || !event.relatedTarget.closest(`#${m_elmJumpListContainer.id}`) ) {
			m_elmJumpListContainer.classList.remove("open");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownJumpListContainer(event) {
		if(event.code === "Escape") {
			m_elmJumpListContainer.classList.remove("open");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectCustomCSSSource() {

		prefs.getUseCustomCSSFeedPreview().then((use) => {
			if(use) {
				prefs.getCustomCSSSource().then((source) => {
					if(source.length > 0) {

						prefs.getCustomCSSSourceHash().then((hash) => m_hashCustomCSSSource = hash );

						browser.tabs.getCurrent().then((tab) => {
							browser.tabs.insertCSS(tab.id, { code: source, runAt: "document_start" }).catch((err) => {
								console.log("[Sage-Like]", "Custom CSS source injection generated an error", err);
							});
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

	////////////////////////////////////////////////////////////////////////////////////
	function removeEmptyElementsFromFeedContent() {

		const elmContents = document.querySelectorAll(".feedItemContent");

		for(let i=0, len=elmContents.length; i<len; i++) {
			removeEmptyElements(elmContents[i]);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEmptyElements(elm) {

		if(elm.children.length > 0) {

			for(let i=elm.children.length-1; i>=0; i--) {
				removeEmptyElements(elm.children[i]);
			}
		}
		if(elm.matches(SELECTOR_EMPTY_ELEMENT)) {
			elm.parentElement.removeChild(elm);
		}
	}

})();
