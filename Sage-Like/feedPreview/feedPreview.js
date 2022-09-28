"use strict";

(function () {

	// Don't remove natively empty elements (css)
	const SEL_EMPTY_ELEMENTS_NOTS = ":not(img):not(br):not(hr):not(col):not(source):not(track):not(wbr):not(embed):not(area)";
	const SELECTOR_EMPTY_ELEMENT = `${SEL_EMPTY_ELEMENTS_NOTS}:empty,${SEL_EMPTY_ELEMENTS_NOTS}:-moz-only-whitespace`;

	const JUMP_LIST_CONTAINER_TITLE = "Jump List";

	let m_URL;
	let m_urlWebPage;
	let m_elmFeedBody = null;
	let m_elmJumpListContainer = null;
	let m_elmJumpList = null;
	let m_elmAttachmentTooltip;
	let m_timeoutMouseOver = null;
	let m_hashCustomCSSSource = "";
	let m_reloadChangeSortDebouncer = null;
	let m_requestSource = Global.FEED_PREVIEW_REQ_SOURCE.NONE;
	let m_markUrlsAsVisited = prefs.MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES.none;
	let m_feedItemObserver = null;
	let m_attContainerObserver = null;
	let m_refreshInterval = null;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {

		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
		RequiredPermissions.i.init();
		browser.runtime.onMessage.addListener(onRuntimeMessage);

		injectCustomCSSSource();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case Global.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE) {
					injectReplaceCustomCSSSource({ source: message.payload });
				}

				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_SORT_FEED_ITEMS) {
					reloadChangeSortFeedItems();
				}
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onDOMContentLoaded() {

		let urlFeed = slUtil.getQueryStringValue("urlFeed");
		m_URL = new URL(urlFeed);

		m_requestSource = slUtil.getQueryStringValue("src");
		if( !(Object.values(Global.FEED_PREVIEW_REQ_SOURCE).includes(m_requestSource)) ) {
			m_requestSource = Global.FEED_PREVIEW_REQ_SOURCE.NONE;
		}

		// only if it was opend from the sidebar's tree
		if(m_requestSource === Global.FEED_PREVIEW_REQ_SOURCE.RSS_TREE_VIEW) {

			m_markUrlsAsVisited = await prefs.getMarkFeedPreviewUrlsAsVisited();

			// AND only if the pref say so
			if(m_markUrlsAsVisited === prefs.MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES.whenVisible) {
				m_feedItemObserver = new IntersectionObserver(onFeedItemIntersectionObserver, { threshold: [0.3] });
			}
		}

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

		if(!!m_elmFeedBody) {
			m_elmFeedBody.removeEventListener("mouseover", onMouseOverAttachment);
			m_elmFeedBody.removeEventListener("mouseout", onMouseOutAttachment);
			m_elmJumpListContainer.removeEventListener("click", onClickJumpListContainer);
			m_elmJumpListContainer.removeEventListener("blur", onBlurJumpListContainer);
			m_elmJumpListContainer.removeEventListener("keydown", onKeyDownJumpListContainer);
			clearInterval(m_refreshInterval);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFeedItemIntersectionObserver(entries) {
		let list = [];
		for(let i=0, len=entries.length; i<len; i++) {
			if(entries[i].isIntersecting) {
				const feedItem = entries[i].target;
				let elmUrl = feedItem.querySelector(".feedItemTitle > a");
				let elmTitle = feedItem.querySelector(".feedItemTitleText");
				list.push({ url: elmUrl.href, title: elmTitle.textContent });
				m_feedItemObserver.unobserve(feedItem);
			}
		}
		addFeedItemUrlsToBrowserHistory(list);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onAttContainerIntersectionObserver(entries) {
		for(let i=0, len=entries.length; i<len; i++) {
			if(entries[i].isIntersecting) {
				const attContainer = entries[i].target;
				const mediaObjects = attContainer.querySelectorAll(".feedItemAttachmentMediaObject");
				for(let j=0, len=mediaObjects.length; j<len; j++) {
					mediaObjects[j].src = decodeURIComponent(mediaObjects[j].getAttribute("data-url"));
				}
				m_attContainerObserver.unobserve(attContainer);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedPreview(urlFeed) {

		m_elmFeedBody = document.getElementById("feedBody");
		m_elmJumpListContainer = document.getElementById("jumpListContainer");
		m_elmJumpList = document.getElementById("jumpList");
		let elmLoadImg = document.getElementById("busyAnimLoading");
		let elmFeedTitle;

		let gettingTimeout = prefs.getFetchTimeout();
		let gettingSortItems = prefs.getSortFeedItems();

		gettingTimeout.then((timeout) => {
			gettingSortItems.then((sortItems) => {

				timeout *= 1000;	// to milliseconds

				syndication.fetchFeedItems(urlFeed, timeout, true, sortItems, false, true, (new SigninCredential())).then((result) => {

					// try to normalize url; may return null
					m_urlWebPage = slUtil.replaceMozExtensionOriginURL(result.feedData.webPageUrl, m_URL.origin);
					getFavIcon(m_URL.origin, (!!m_urlWebPage ? m_urlWebPage.origin : ""));

					m_elmFeedBody.setAttribute("data-syn-std", result.feedData.standard);
					if(result.feedData.expired) m_elmFeedBody.setAttribute("data-jsonfeed-expired", "");	// set attr only if it's true
					m_elmFeedBody.addEventListener("mouseover", onMouseOverAttachment);
					m_elmFeedBody.addEventListener("mouseout", onMouseOutAttachment);
					m_elmJumpListContainer.addEventListener("click", onClickJumpListContainer);
					m_elmJumpListContainer.addEventListener("blur", onBlurJumpListContainer);
					m_elmJumpListContainer.addEventListener("keydown", onKeyDownJumpListContainer);
					m_elmJumpListContainer.title = JUMP_LIST_CONTAINER_TITLE;

					document.title = result.feedData.title.trim().length > 0 ? result.feedData.title : m_URL.hostname;
					elmFeedTitle = createFeedTitleElements(result.feedData);

					if(result.list.length > 0) {

						let elmFeedContent = document.createElement("div");
						elmFeedContent.id = "feedContent";

						const FIRST_FAST_LOAD_PACK_SIZE = 50;

						if(result.list.length <= FIRST_FAST_LOAD_PACK_SIZE) {
							for(let idx=0, len=result.list.length; idx<len; idx++) {
								elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) );
							}
						} else {
							for(let idx=0; idx<FIRST_FAST_LOAD_PACK_SIZE; idx++) {
								elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) );
							}
							for(let idx=FIRST_FAST_LOAD_PACK_SIZE, len=result.list.length, timeout=0; idx<len; idx++) {
								setTimeout(() => elmFeedContent.appendChild( createFeedItemElements(idx, result.list[idx]) ), (timeout+=6));
							}
						}
						m_elmFeedBody.appendChild(elmFeedContent);

						if(m_markUrlsAsVisited === prefs.MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES.all) {
							addFeedItemUrlsToBrowserHistory(result.list, false);
						}

					} else {
						m_elmJumpListContainer.remove();
						createErrorContent("No RSS feed items identified in document.", (new URL(urlFeed)));	/* duplicated string from syndication.fetchFeedItems(). SAD. */
					}

				}).catch((error) => {

					document.title = m_URL.hostname;
					elmFeedTitle = createFeedTitleElements({ description: m_URL.pathname, imageUrl: "" });

					m_elmJumpListContainer.remove();
					createErrorContent(error.message, (new URL(urlFeed)));
					console.log("[Sage-Like]", "Fetch error at " + urlFeed, error.message);

				}).finally(() => {
					if(elmFeedTitle.style.direction === "rtl") {
						document.getElementById("pageHeaderContainer").style.direction = "rtl";
					}
					m_elmFeedBody.removeChild(elmLoadImg);
					document.getElementById("pageHeaderContainer").removeChild(document.getElementById("loadingLabel"));
					document.getElementById("pageHeaderContainer").appendChild(elmFeedTitle);
					removeEmptyElementsFromFeedContent();
					brutallyReinforceSvgStyle();
					startRefreshInterval();
				});
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

		if(!!m_urlWebPage) {
			elmFeedTitleTextAnchor.href = m_urlWebPage.toString();
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
		let elmJumpListItem = document.createElement("a");

		elmFeedItemContainer.id = slUtil.getUniqId("sl");
		elmFeedItemContainer.className = "feedItemContainer";
		elmFeedItemNumber.className = "feedItemNumber feedItemBigFont";
		elmFeedItem.className = "feedItem";
		elmFeedItemTitle.className = "feedItemTitle";
		elmFeedItemTitleText.className = "feedItemTitleText feedItemBigFont";
		elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
		elmFeedItemLastUpdatedTime.className = "feedItemLastUpdatedTime";
		elmFeedItemContent.className = "feedItemContent";
		elmJumpListItem.className = "jumpListAnchor";

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

		elmFeedItemNumber.textContent = idx + 1 + ".";
		elmFeedItemLink.href = feedItem.url;
		elmFeedItemTitleText.textContent = feedItem.title.trim().length > 0 ? feedItem.title : feedItem.url;
		elmFeedItemLastUpdatedTime.dateTime = feedItem.lastUpdated.toISOString();
		elmFeedItemLastUpdatedTime.textContent = slUtil.getUpdateTimeFormattedString(feedItem.lastUpdated);
		elmFeedItemLastUpdatedTime.classList.toggle("refresh", (Date.now() - feedItem.lastUpdated.getTime()) < 3600000);	// if smaller then an hour (in milliseconds)
		elmFeedItemContent.innerHTML = itemImage + itemContent;
		elmJumpListItem.textContent = `${idx+1}. ${elmFeedItemTitleText.textContent}`;
		elmJumpListItem.href = `#${elmFeedItemContainer.id}`;

		handleAbnormalURLs(elmFeedItemContent);

		elmFeedItemContainer.appendChild(elmFeedItemNumber);
		elmFeedItemContainer.appendChild(elmFeedItem);
		elmFeedItem.appendChild(elmFeedItemTitle);
		elmFeedItem.appendChild(elmFeedItemContent);

		if(feedItem.attachments.length > 0) {
			elmFeedItemAttachmentsContainer = createFeedItemAttachmentsElements(feedItem.attachments);
			elmFeedItem.appendChild(elmFeedItemAttachmentsContainer);

			if(!!!m_attContainerObserver) {
				m_attContainerObserver = new IntersectionObserver(onAttContainerIntersectionObserver, { threshold: [0] });
			}
			m_attContainerObserver.observe(elmFeedItemAttachmentsContainer);
		}

		elmFeedItemTitle.appendChild(elmFeedItemLink);
		elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
		elmFeedItemLastUpdatedText.appendChild(elmFeedItemLastUpdatedTime);
		elmFeedItemLink.appendChild(elmFeedItemTitleText);
		m_elmJumpList.appendChild(elmJumpListItem);

		elmFeedItemContainer.style.direction = slUtil.getLanguageDir(elmFeedItemTitleText.textContent);

		// only if IntersectionObserver object was created
		if(!!m_feedItemObserver) {
			m_feedItemObserver.observe(elmFeedItem);
		}

		return elmFeedItemContainer;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemAttachmentsElements(attachments) {

		let elmFeedItemAttachment;
		let elmFeedItemAttachmentLink;
		let elmFeedItemAttachmentContent;
		let elmFeedItemAttachmentImage;
		let elmFeedItemAttachmentMedia;
		let elmFeedItemAttachmentTitle;
		let elmFeedItemAttachmentsContainer;
		let att;
		let mediaType;

		elmFeedItemAttachmentsContainer = document.createElement("div");
		elmFeedItemAttachmentsContainer.className = "feedItemAttachmentsContainer";

		for(let i=0, len=attachments.length; i<len; i++) {

			att = attachments[i];

			if(att.mimeType.startsWith("audio")) {
				mediaType = "audio";
			} else if(att.mimeType.startsWith("video")) {
				mediaType = "video";
			} else if(att.mimeType.startsWith("image")) {
				mediaType = "img";
			} else {
				mediaType = "";
			}

			elmFeedItemAttachment = document.createElement("div");
			elmFeedItemAttachment.className = `feedItemAttachment ${mediaType} idx${i}`;
			elmFeedItemAttachment.setAttribute("data-title", getAttachmentTitle(att));
			elmFeedItemAttachmentsContainer.appendChild(elmFeedItemAttachment);

			elmFeedItemAttachmentLink = document.createElement("a");
			elmFeedItemAttachmentLink.className = "feedItemAttachmentLink";
			elmFeedItemAttachmentLink.href = att.url;
			elmFeedItemAttachmentLink.download = "";
			elmFeedItemAttachment.appendChild(elmFeedItemAttachmentLink);

			elmFeedItemAttachmentContent = document.createElement("div");
			elmFeedItemAttachmentContent.className = "feedItemAttachmentContent";
			elmFeedItemAttachmentLink.appendChild(elmFeedItemAttachmentContent);

			if(mediaType === "") {
				elmFeedItemAttachmentImage = document.createElement("img");
				elmFeedItemAttachmentImage.className = "feedItemAttachmentImage";
				elmFeedItemAttachmentImage.src = slUtil.getMimeTypeIconPath(att.mimeType);
				elmFeedItemAttachmentContent.appendChild(elmFeedItemAttachmentImage);
			} else {
				elmFeedItemAttachmentMedia = document.createElement(mediaType);
				elmFeedItemAttachmentMedia.className = `feedItemAttachmentMediaObject`;
				elmFeedItemAttachmentMedia.setAttribute("data-url", encodeURIComponent(att.url));	// media resources are loaded (.src = att.url) when element is visible via IntersectionObserver
				if(["audio", "video"].includes(mediaType)) {
					elmFeedItemAttachmentMedia.controls = true;
				}
				elmFeedItemAttachmentMedia.addEventListener("error", onErrorMedia);
				elmFeedItemAttachmentContent.appendChild(elmFeedItemAttachmentMedia);
			}

			elmFeedItemAttachmentTitle = document.createElement("div");
			elmFeedItemAttachmentTitle.className = "feedItemAttachmentTitle";
			elmFeedItemAttachmentTitle.textContent = att.title;
			elmFeedItemAttachmentTitle.style.direction = "initial";
			elmFeedItemAttachmentLink.appendChild(elmFeedItemAttachmentTitle);
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

			// Link to a fake anchor result in href pointing to this webExt top page - remove it
			if(["#", ""].includes(elmsWithUrl[idx].getAttribute("href"))) {
				elmsWithUrl[idx].removeAttribute("href");
				continue;
			}

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

		url.searchParams.append(...(Global.EXTRA_URL_PARAM_NO_REDIRECT_SPLIT));

		document.getElementById("errorContainer").classList.add("withMessage");
		document.getElementById("errorMessage").textContent = errorMessage;
		document.getElementById("errorMessageLink").href = url.toString();

		if(!RequiredPermissions.i.granted) {
			document.getElementById("requiredPermissionsMsg").style.display = "block";
			document.getElementById("requestPermissionsLink").addEventListener("click", async () => {
				if(await RequiredPermissions.i.request()) {
					window.location.reload();
				};
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getAttachmentTitle(attachment) {

		const FMT_ATTACHMENT_TITLE = "<p><b>Title:</b> {0}</p><p><b>URL:</b> {1}</p>";
		const FMT_ATTACHMENT_TITLE_WITH_SIZE = FMT_ATTACHMENT_TITLE + "<p><b>Size:</b> {2}</p>";

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

		let mediaObject = elmAtt.querySelector(".feedItemAttachmentMediaObject");
		if(!!mediaObject) {

			mediaObject.style.cursor = (mediaObject.readyState < 2 && mediaObject.error === null) ? "wait" : "";

			if((event.shiftKey || mediaObject.readyState < 2)) {
				const READY_STATES = ["HAVE_NOTHING", "HAVE_METADATA", "HAVE_CURRENT_DATA", "HAVE_FUTURE_DATA", "HAVE_ENOUGH_DATA"];
				const NETWORK_STATES = ["NETWORK_EMPTY", "NETWORK_IDLE", "NETWORK_LOADING", "NETWORK_NO_SOURCE"];
				console.log("[Sage-Like]", `Media object status:  readyState='${READY_STATES[mediaObject.readyState]}',  networkState='${NETWORK_STATES[mediaObject.networkState]}'`);
			}
		}

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
			m_elmJumpListContainer.title = "";
			m_elmJumpListContainer.focus();
		} else if(event.target.tagName === "A") {
			m_elmJumpListContainer.classList.remove("open");
			m_elmJumpListContainer.title = JUMP_LIST_CONTAINER_TITLE;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurJumpListContainer(event) {
		//if( !!!event.relatedTarget || !event.relatedTarget.classList.contains("jumpListAnchor") ) {
			if( !!!event.relatedTarget || !event.relatedTarget.closest(`#${m_elmJumpListContainer.id}`) ) {
			m_elmJumpListContainer.classList.remove("open");
			m_elmJumpListContainer.title = JUMP_LIST_CONTAINER_TITLE;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownJumpListContainer(event) {
		if(event.code === "Escape") {
			m_elmJumpListContainer.classList.remove("open");
			m_elmJumpListContainer.title = JUMP_LIST_CONTAINER_TITLE;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onErrorMedia(event) {

		let target = event.target;
		let attElement = target.closest(".feedItemAttachment");
		let msg;

		if(["AUDIO", "VIDEO"].includes(target.tagName)) {
			msg = (target.networkState===3 ? `Resource not loaded, may be missing [${target.error.message}].`: `Unexpected failure [${target.error.message}].`);
		} else if(target.tagName === "IMG") {
			msg = "Image not loaded.";
		}

		attElement.classList.add("loadError");
		attElement.setAttribute("data-title", attElement.getAttribute("data-title") + `<br><p><b>Error:</b> ${msg}</p>`);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectCustomCSSSource() {

		prefs.getUseCustomCSSFeedPreview().then((use) => {
			if(use) {
				prefs.getCustomCSSSource().then((source) => {
					if(source.length > 0) {

						prefs.getCustomCSSSourceHash().then((hash) => m_hashCustomCSSSource = hash );

						browser.tabs.getCurrent().then((tab) => {
							browser.scripting.insertCSS({ target: { tabId: tab.id }, css: source }).catch((err) => {
								console.log("[Sage-Like]", "Custom CSS source injection generated an error", err);
							});
						});
					}
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function injectReplaceCustomCSSSource(prev) {

		let changed;
		let using = await prefs.getUseCustomCSSFeedPreview();

		if(using) {
			changed = (await prefs.getCustomCSSSourceHash()) !== m_hashCustomCSSSource;
		} else {
			changed = (m_hashCustomCSSSource.length > 0);
		}

		let tabId = (using || changed) ? (await browser.tabs.getCurrent()).id : -1;

		if(changed && !!prev.source) {
			try {
				await browser.scripting.removeCSS({ target: { tabId: tabId }, css: prev.source });
			} catch (error) {
				console.log("[Sage-Like]", "Removing injected custom CSS source generated an error", error);
			}
			prev.source = "";
		}

		if(using) {
			let source = await prefs.getCustomCSSSource();
			if(source.length > 0) {
				prefs.getCustomCSSSourceHash().then((hash) => m_hashCustomCSSSource = hash );
				browser.scripting.insertCSS({ target: { tabId: tabId }, css: source }).catch((err) => {
					console.log("[Sage-Like]", "Custom CSS source injection generated an error", err);
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFavIcon(urlOrigin, urlOriginWebPage = "") {

		const urlDomainOrigins = [ urlOrigin ];
		const favicons = [
			"/favicon.ico",
			"/favicon.png",
			"/favicon.jpg",
			"/favicon.gif",
		];

		// if web-page url is valid insert at start; has priority.
		if(!!urlOriginWebPage && urlOriginWebPage !== urlOrigin) {
			urlDomainOrigins.splice(0, 0, urlOriginWebPage);
		}

		// create all possible sub domain url origins - IF IT'S NOT AN IPv4 ADDRESS
		if( ! urlOrigin.match(/^(https?:\/\/)?\d+\.\d+\.\d+\.\d+$/) ) {
			while(urlOrigin.match(/\/\/[^.]+\.[^.]+\.[^.]+/)) {
				urlOrigin = urlOrigin.replace(/(\/\/)[^.]+\./, "$1");
				urlDomainOrigins.push(urlOrigin);
			}
		}

		let fetchFavIcon = (faviconsUrl) => {
			return new Promise(async (resolve, reject) => {
				try {
					let response = await fetch(faviconsUrl, { cache: "force-cache" });
					let blob = await response.blob();

					if( !!blob && ("size" in blob) && (blob.size > 0) && ("type" in blob) && (blob.type.startsWith("image") )) {
						return resolve(blob);		// blob is a valid image
					}
				} catch {}
				return reject();
			});
		}

		let promises = [];

		for(let i=0, lenO=urlDomainOrigins.length; i<lenO; i++) {
			for(let j=0, lenF=favicons.length; j<lenF; j++) {
				promises.push(fetchFavIcon(urlDomainOrigins[i] + favicons[j]));
			}
		}

		Promise.any(promises).then((blob) => {

			let reader = new FileReader();
			reader.addEventListener("load", () => {
				let elmLink = document.getElementById("favicon");
				elmLink.type = blob.type;
				elmLink.href = reader.result;
			}, false);
			reader.readAsDataURL(blob);	// base64 image data

		}).catch(() => { /* Ignore errors, fallback favicon */ });
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

	////////////////////////////////////////////////////////////////////////////////////
	function reloadChangeSortFeedItems() {
		clearTimeout(m_reloadChangeSortDebouncer);
		m_reloadChangeSortDebouncer = setTimeout(async () => {
			let tab = await browser.tabs.getCurrent();
			browser.tabs.reload(tab.id);
			m_reloadChangeSortDebouncer = null;
		}, 500);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addFeedItemUrlsToBrowserHistory(list, immediately = true) {

		// not in main thread
		setTimeout(() => {

			for(let idx=0, len=list.length; idx<len; idx++) {
				const item = list[idx];
				slUtil.addUrlToBrowserHistory(item.url, (item.title.trim().length > 0 ? item.title : item.url));
			}

			browser.runtime.sendMessage({
				id: Global.MSG_ID_UPDATE_RLV_FEED_ITEMS_STATE_TO_VISITED,
				feedUrl: m_URL.toString(),
				feedItems: list.map((n) => n.url),	// just the urls
			});

		}, (immediately ? 0 : 150));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function startRefreshInterval() {

		m_refreshInterval = setInterval(() => {

			let elms = m_elmFeedBody.querySelectorAll(".feedItemLastUpdatedTime.refresh");

			if(elms.length > 0) {		// clear interval if there is nothing to refresh

				let dt, nowish = Date.now();

				for(let i=0, len=elms.length; i<len; i++) {

					dt = new Date(elms[i].dateTime);		// safe: it's an ISO date string from Date

					elms[i].textContent = slUtil.getUpdateTimeFormattedString(dt);

					if( (nowish - dt.getTime()) > 3600000 ) {			// if longer then an hour (in milliseconds) stop refreshing
						elms[i].classList.remove("refresh");
					}
				}
			} else {
				clearInterval(m_refreshInterval);
			}

		}, slUtil.randomInteger(27500, 32500)); // 30 sec interval +- 2.5 sec
	}
})();
