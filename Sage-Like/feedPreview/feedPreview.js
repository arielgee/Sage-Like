"use strict";

(function () {

	let m_URL;
	let m_elmAttachmentTooltip;
	let m_timeoutMouseOver = null;

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

		m_elmAttachmentTooltip = document.getElementById("attachmentTooltip");

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
		let elmFeedTitle;

		prefs.getFetchTimeout().then((timeout) => {
			syndication.fetchFeedItems(urlFeed, timeout * 1000, true, false, true).then((result) => {

				elmFeedBody.setAttribute("data-syn-std", result.feedData.standard);
				elmFeedBody.addEventListener("mouseover", onMouseOverAttachment);
				elmFeedBody.addEventListener("mouseout", onMouseOutAttachment);

				document.title = result.feedData.title.trim().length > 0 ? result.feedData.title : m_URL.hostname;
				elmFeedTitle = createFeedTitleElements(result.feedData);

				let elmFeedContent = document.createElement("div");
				elmFeedContent.id = "feedContent";

				if(result.list.length > 0) {
					for(let idx=0, len=result.list.length; idx<len; idx++) {
						elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) );
					}
					elmFeedBody.appendChild(elmFeedContent);
				} else {
					createErrorContent("No RSS feed items identified in document.", (new URL(urlFeed)));	/* duplicated string from syndication.fetchFeedData(). SAD. */
				}

			}).catch((error) => {

				document.title = m_URL.hostname;
				elmFeedTitle = createFeedTitleElements({ description: m_URL.pathname, imageUrl: "" });

				createErrorContent(error.message, (new URL(urlFeed)));
				console.log("[Sage-Like]", "Fetch Error at " + urlFeed, error);

			}).finally(() => {
				elmFeedBody.removeChild(elmLoadImg);
				document.getElementById("pageHeaderContainer").appendChild(elmFeedTitle);
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
		let itemContent;

		elmFeedItemContainer.className = "feedItemContainer";
		elmFeedItemNumber.className = "feedItemNumber feedItemBigFont";
		elmFeedItem.className = "feedItem";
		elmFeedItemTitle.className = "feedItemTitle";
		elmFeedItemTitleText.className = "feedItemTitleText feedItemBigFont";
		elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
		elmFeedItemContent.className = "feedItemContent";

		if( (itemContent = feedItem.htmlContent).length > 0) {
			itemContent = itemContent.stripHtmlTags(String.prototype.stripHtmlTags.regexMultiBrTag, "<br>");
		} else {
			itemContent = feedItem.description.stripHtmlTags(String.prototype.stripHtmlTags.regexMultiBrTag, "<br>");
		}

		elmFeedItemNumber.textContent = idx + 1 + ".";
		elmFeedItemLink.href = feedItem.url;
		elmFeedItemTitleText.textContent = feedItem.title;
		elmFeedItemLastUpdatedText.textContent = (new Date(slUtil.asSafeNumericDate(feedItem.lastUpdated))).toWebExtensionLocaleString();
		elmFeedItemContent.innerHTML = itemContent;

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
			elmFeedItemAttachmentImage.src = getMimeTypeIcon(att.mimeType);

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
	function getMimeTypeIcon(mimeType) {

		let pathToIcons = "/icons/mimeType/";
		let defaultIcon = pathToIcons + "file.svg";

		if(!!!mimeType) return defaultIcon;

		let mimeTypeIcons = [

			// archive
			{ mimeType: "application/gzip", icon: "file-archive.svg" },
			{ mimeType: "application/zip", icon: "file-archive.svg" },

			// doc
			{ mimeType: "application/pdf", icon: "file-pdf.svg" },
			{ mimeType: "application/msword", icon: "file-word.svg" },
			{ mimeType: "application/vnd.ms-word", icon: "file-word.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.text", icon: "file-word.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml", icon: "file-word.svg" },
			{ mimeType: "application/vnd.ms-excel", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.spreadsheet", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.ms-powerpoint", icon: "file-powerpoint.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.presentationml", icon: "file-powerpoint.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.presentation", icon: "file-powerpoint.svg" },
			{ mimeType: "text/plain", icon: "file-text.svg" },
			{ mimeType: "text/html", icon: "file-code.svg" },
			{ mimeType: "application/json", icon: "file-code.svg" },

			// media
			{ mimeType: "image", icon: "file-image.svg" },
			{ mimeType: "audio", icon: "file-audio.svg" },
			{ mimeType: "video", icon: "file-video.svg" },
		];

		for(let i=0, len=mimeTypeIcons.length; i<len; i++) {
			if(mimeType.startsWith(mimeTypeIcons[i].mimeType)) {
				return (pathToIcons + mimeTypeIcons[i].icon);
			}
		}

		return defaultIcon;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getAttachmentTitle(attachment) {

		const FMT_ATTACHMENT_TITLE = "<p><b>Title:</b> {0}</p><p><b>URL:</b> {1}</p>";
		const FMT_ATTACHMENT_TITLE_WITH_SIZE = FMT_ATTACHMENT_TITLE + "<p><b>Size:</b> {2}";

		let size = slUtil.asPrettyByteSize(attachment.byteSize || 0);

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

		// hide it and place it as high as possible to prevent resizing of
		// the container when html data is retrieved
		m_elmAttachmentTooltip.style.visibility = "hidden";
		m_elmAttachmentTooltip.style.left = m_elmAttachmentTooltip.style.top = "0";

		// set display=block as soon as possible to retrieve any remote html data (images, etc) and
		// panel element will have dimentions (offsetWidth > 0)
		m_elmAttachmentTooltip.style.display = "block";

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

			m_elmAttachmentTooltip.style.visibility = "visible";
			m_elmAttachmentTooltip.style.left = x + "px";
			m_elmAttachmentTooltip.style.top = y + "px";

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
})();
