"use strict";

const rssListView = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	const URLOpenMethod = {
		INVALID: 0,
		IN_TAB: 1,
		IN_NEW_TAB: 2,
		IN_NEW_TAB_CONTAINER: 3,
		IN_NEW_WIN: 4,
		IN_NEW_WIN_PRIVATE: 5,
		IN_NEW_TAB_READER: 6,		// open in Reader Mode and if fails, open in normal page
		IN_NEW_TAB_READER_P2R: 7,	// open in normal page and then switch to Reader Mode (toggleReaderMode)
	};

	let m_elmSidebarBody;
	let m_elmList;
	let m_elmFeedItemDescPanel;
	let m_elmFeedItemDescAttachments;
	let m_elmListViewStatusbar;
	let m_elmListViewRssTitle;

	let m_elmCurrentlySelected = null;
	let m_elmLITreeFeed = null;
	let m_observerElmLITreeFeed = null;

	let m_bPrefShowFeedItemDesc = prefs.DEFAULTS.showFeedItemDesc;
	let m_msPrefFeedItemDescDelay = prefs.DEFAULTS.feedItemDescDelay;
	let m_timeoutMouseOver = null;
	let m_abortCtrlEvents = [];		// abortController used to remove event handlers

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

		browser.runtime.onMessage.addListener(onRuntimeMessage);

		// observer for changes to the title of the to the tree feed
		m_observerElmLITreeFeed = new MutationObserver(() => {
			if(TreeItemType.isFeed(m_elmLITreeFeed)) {
				m_elmListViewRssTitle.textContent = rssTreeView.getTreeItemText(m_elmLITreeFeed);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case Global.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC) {
					setShowFeedItemDescFromPreferences();
				}

				// Pref for tooltip delay is already retrieved when: message.details === Global.MSGD_PREF_CHANGE_ALL
				if (message.details === Global.MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY) {
					setFeedItemDescDelayFromPreferences();
				}

				if (message.details === Global.MSGD_PREF_CHANGE_ALL ||
					message.details === Global.MSGD_PREF_CHANGE_INCREASE_UNVISITED_FONT_SIZE) {
					setIncreaseUnvisitedFontSizeFromPreferences();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case Global.MSG_ID_UPDATE_RLV_FEED_ITEMS_STATE_TO_VISITED:
				updateFeedItemsStateToVisited(message.feedUrl, message.feedItems);
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmSidebarBody = document.body;
		m_elmList = document.getElementById(Global.ID_UL_RSS_LIST_VIEW);
		m_elmFeedItemDescPanel = document.getElementById("feedItemDescPanel");
		m_elmListViewStatusbar = document.getElementById("listViewStatusbar");
		m_elmListViewRssTitle = document.getElementById("listViewRssTitle");

		m_elmFeedItemDescAttachments = m_elmFeedItemDescPanel.querySelector(".descAttachments");

		m_elmList.addEventListener("mousedown", onMouseDownFeedList);
		m_elmList.addEventListener("keydown", onKeyDownFeedList);
		m_elmList.addEventListener("focus", onFocusFeedItem, true);
		m_elmList.addEventListener("click", onClickFeedItem);
		m_elmList.addEventListener("auxclick", onClickFeedItem);

		setShowFeedItemDescFromPreferences();
		setIncreaseUnvisitedFontSizeFromPreferences();

		panel.notifyViewContentLoaded(Global.VIEW_CONTENT_LOAD_FLAG.LIST_VIEW_LOADED);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setShowFeedItemDescFromPreferences() {

		prefs.getShowFeedItemDesc().then(showDesc => {
			m_bPrefShowFeedItemDesc = showDesc;
			if(m_bPrefShowFeedItemDesc) {
				setFeedItemDescDelayFromPreferences();
			}
			handleFeedItemDescEventListeners(m_bPrefShowFeedItemDesc);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setIncreaseUnvisitedFontSizeFromPreferences() {

		prefs.getIncreaseUnvisitedFontSize().then(increase => {

			let sheets = document.styleSheets;

			for(let i=0, len=sheets.length; i<len; i++) {

				if(typeof(sheets[i].href) === "string" && sheets[i].href.includes("rssListView.css")) {

					let rules = sheets[i].cssRules;

					for(let j=0, len=rules.length; j<len; j++) {
						if(typeof(rules[j].selectorText) === "string" && rules[j].selectorText === "#rssListView li.bold") {
							rules[j].style.cssText = (increase ? "font-weight: bold; font-size: 1.05em;" : "font-weight: bold;");
							break;
						}
					}
					break;
				}
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItemDescDelayFromPreferences() {

		prefs.getFeedItemDescDelay().then(delayMillisec => {
			m_msPrefFeedItemDescDelay = delayMillisec;
		});
	}

	//==================================================================================
	//=== List Creation
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItems(list, title, elmLITreeFeed) {

		const FIRST_FAST_LOAD_PACK_SIZE = 1000;

		disposeList();
		let frag = document.createDocumentFragment();
		if(list.length <= FIRST_FAST_LOAD_PACK_SIZE) {
			for(let i=0, len=list.length; i<len; i++) {
				frag.appendChild(createTagIL(i+1, list[i]));
			}
			m_elmList.appendChild(frag);
		} else {
			for(let i=0; i<FIRST_FAST_LOAD_PACK_SIZE; i++) {
				frag.appendChild(createTagIL(i+1, list[i]));
			}
			m_elmList.appendChild(frag);
			for(let i=FIRST_FAST_LOAD_PACK_SIZE, len=list.length; i<len; i++) {
				setTimeout(() => m_elmList.appendChild(createTagIL(i+1, list[i]), 10));
			}
		}
		m_elmLITreeFeed = elmLITreeFeed;
		m_observerElmLITreeFeed.observe(m_elmLITreeFeed.firstElementChild.querySelector("." + Global.CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE), { childList: true, subtree: false });

		m_elmListViewRssTitle.textContent = title;

		// HScroll causes an un-nessesery VScroll. so if has HScroll reduse height to accommodate
		if(slUtil.hasHScroll(m_elmList)) {
			m_elmList.style.height = (m_elmList.clientHeight - slUtil.getScrollbarWidth()) + "px";
		}
		setStatusbarIcon(true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagIL(index, item) {

		let title = item.title;
		let desc = item.description;
		let url = item.url;
		let attachments = item.attachments;
		let elm = document.createElement("li");

		elm.classList.add(Global.CLS_RLV_LI_LIST_ITEM);
		setItemRealVisitedState(elm, url, false);

		if(title.length === 0) title = url;		// Global.STR_TITLE_EMPTY ; url.split("/").reduceRight((p, c) => (c.length>0 && p==="<{in^it}>") ? c : p, "<{in^it}>");
		desc = desc
			.replaceHTMLTags(String.HTML_PATTERN.reAnyImgTag)
			.replaceHTMLTags(String.HTML_PATTERN.reAnyAnchorTag)
			.replaceHTMLTags(String.HTML_PATTERN.reAudioVideoTag)
			.replaceHTMLTags(String.HTML_PATTERN.reMultiBrTags, "<br>")
			.replaceHTMLTags(String.HTML_PATTERN.reStyleAttribute)
			.escapeMarkup()
			.trim();

		elm.textContent = index + ". " + title;
		elm.title = (m_bPrefShowFeedItemDesc && (desc.length > 0 || attachments.length > 0)) ? "" : title;
		elm.setAttribute("href", url);
		elm.tabIndex = 0;
		elm.setAttribute("data-item-desc", m_bPrefShowFeedItemDesc ? desc : "");

		if(attachments.length > 0) {
			let atts = "";
			for(let i=0, len=attachments.length; i<len; i++) {
				atts += (attachments[i].mimeType.length > 0 ? attachments[i].mimeType : "file") + ",";
			}
			elm.setAttribute("data-attach-mimetypes", atts.slice(0, -1));	// remove last ','
		}

		return elm;
	}

	//==================================================================================
	//=== List Item Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleFeedItemDescEventListeners(bAddListeners) {

		if(bAddListeners) {
			m_elmList.addEventListener("mouseover", onMouseOverFeedItem);
			m_elmList.addEventListener("mouseout", onMouseOutFeedItem);
			m_elmList.addEventListener("mousemove", onMouseMoveFeedItem);
		} else {
			m_elmList.removeEventListener("mouseover", onMouseOverFeedItem);
			m_elmList.removeEventListener("mouseout", onMouseOutFeedItem);
			m_elmList.removeEventListener("mousemove", onMouseMoveFeedItem);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusFeedItem(event) {
		setFeedItemSelectionState(event.target);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickFeedItem(event) {

		let elm = event.target;

		// only for list item elements
		if(event.detail === 1 && !!elm && elm.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {

			let openMethod = URLOpenMethod.INVALID;

			if(event.button === 0) {

				if(!event.ctrlKey && !event.shiftKey) {

					// default-click
					let prefOpenMethod = await prefs.getFeedItemOpenMethod();
					if(prefOpenMethod === prefs.FEED_ITEM_OPEN_METHOD_VALUES.openInNewTab) {
						openMethod = URLOpenMethod.IN_NEW_TAB;
					} else if(prefOpenMethod === prefs.FEED_ITEM_OPEN_METHOD_VALUES.openInTab) {
						openMethod = URLOpenMethod.IN_TAB;
					}

				} else if(event.ctrlKey) {

					// ctrl+click
					openMethod = URLOpenMethod.IN_NEW_TAB;

				} else if(event.shiftKey) {

					// shift+click
					openMethod = URLOpenMethod.IN_NEW_WIN;
				}

			} else if(event.button === 1) {

				// middle-click
				let prefOpenMethod = await prefs.getFeedItemOpenMethod();
				if(prefOpenMethod === prefs.FEED_ITEM_OPEN_METHOD_VALUES.openInTab) {
					openMethod = URLOpenMethod.IN_NEW_TAB;
				} else if(prefOpenMethod === prefs.FEED_ITEM_OPEN_METHOD_VALUES.openInNewTab) {
					openMethod = URLOpenMethod.IN_TAB;
				}
			}

			if(openMethod !== URLOpenMethod.INVALID) {
				event.stopPropagation();
				event.preventDefault();
				openListFeedItem(elm, openMethod);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOverFeedItem(event) {

		// only for list item elements
		if(!!!event.target || !event.target.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
			return;
		}

		event.stopPropagation();
		clearTimeout(m_timeoutMouseOver);

		if(contextMenu.isOpen()) return;	// don't display feed-item description panel when context menu is open

		let elmLI = event.target;

		// if there is a title then do not display item description
		if(elmLI.title.length > 0) return;

		m_elmFeedItemDescPanel.querySelector(".descTitle").textContent = elmLI.textContent;			// Remove numbering from title: .replace(/^\d+\. /, "")
		slUtil.replaceInnerContent(m_elmFeedItemDescPanel.querySelector(".descBody"), elmLI.getAttribute("data-item-desc").unescapeMarkup());

		createFeedItemDescAttachments(elmLI);

		// hide it and place it as high as possible to prevent resizing of
		// the containing sidebar when html data is retrieved
		m_elmFeedItemDescPanel.style.visibility = "hidden";
		m_elmFeedItemDescPanel.style.left = m_elmFeedItemDescPanel.style.top = "0";

		// set display=block as soon as possible to retrieve any remote html data (images, etc) and
		// panel element will have dimentions (offsetWidth > 0)
		m_elmFeedItemDescPanel.style.display = "block";

		m_timeoutMouseOver = setTimeout(() => {

			const POS_OFFSET = 8;
			const isRTL = getComputedStyle(m_elmSidebarBody).direction === "rtl";
			let x = (!!m_elmFeedItemDescPanel.slLastClientX ? m_elmFeedItemDescPanel.slLastClientX : event.clientX);
			let y = (!!m_elmFeedItemDescPanel.slLastClientY ? m_elmFeedItemDescPanel.slLastClientY : event.clientY) + POS_OFFSET;

			let logicalX = (isRTL ? (m_elmSidebarBody.offsetWidth - x) : x) + POS_OFFSET;

			if ((logicalX + m_elmFeedItemDescPanel.offsetWidth) > m_elmSidebarBody.offsetWidth) {
				logicalX = m_elmSidebarBody.offsetWidth - m_elmFeedItemDescPanel.offsetWidth-1;
			}

			if ((y + m_elmFeedItemDescPanel.offsetHeight) > m_elmSidebarBody.offsetHeight) {
				y = m_elmFeedItemDescPanel.slLastClientY - m_elmFeedItemDescPanel.offsetHeight - POS_OFFSET;
				if(y < 0) y = 0;		// may happend if the sidebar height is shorter then the height of the desc panel
			}

			// The desc panel will immediately be hidden by onMouseOutFeedItem() when the sidebar height is so short/narrow
			// that the desc panel will appeare right bellow the cursor.

			m_elmFeedItemDescPanel.style.visibility = "visible";
			if(isRTL) {
				m_elmFeedItemDescPanel.style.right = logicalX + "px";
			} else {
				m_elmFeedItemDescPanel.style.left = logicalX + "px";
			}
			m_elmFeedItemDescPanel.style.top = y + "px";

		}, m_msPrefFeedItemDescDelay);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOutFeedItem(event) {

		// only for list item elements
		if(!!event.target && event.target.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
			hideFeedItemDescPanel();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveFeedItem(event) {

		// only for list item elements
		if(!!event.target && event.target.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
			m_elmFeedItemDescPanel.slLastClientX = event.clientX;
			m_elmFeedItemDescPanel.slLastClientY = event.clientY;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openListFeedItem(elm, openMethod) {

		// only for list item elements
		if(!!!elm || !elm.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) return;

		let url = elm.getAttribute("href");

		switch (openMethod) {
			case URLOpenMethod.IN_TAB:					openFeedItemInTab(url);									break;
			case URLOpenMethod.IN_NEW_TAB:				browser.tabs.create({ url: url });						break;
			case URLOpenMethod.IN_NEW_TAB_CONTAINER:	panel.showOpenInContainerPicker(url);					break;
			case URLOpenMethod.IN_NEW_WIN:				browser.windows.create({ url: url, type: "normal" });	break;
			case URLOpenMethod.IN_NEW_WIN_PRIVATE:		openFeedItemInWinPrivate(url);							break;
			case URLOpenMethod.IN_NEW_TAB_READER:		openFeedItemInReader(url);								break;
			case URLOpenMethod.IN_NEW_TAB_READER_P2R:	openFeedItemInReader_Page2Reader(url);					break;
		}

		elm.focus();

		if(openMethod !== URLOpenMethod.IN_NEW_WIN_PRIVATE) {

			// Redirect are not saved in history. So when a feed url is
			// redirected from http to https or from feedproxy.google.com
			// to the target page it cannot be found in browser.history.
			// So this function will record the redirecting url in history
			// https://wiki.mozilla.org/Browser_History:Redirects
			slUtil.addUrlToBrowserHistory(url, elm.textContent).then(() => {
				setItemRealVisitedState(elm, url);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function openFeedItemInTab(url) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		tabs[0].pinned ? browser.tabs.create({ url: url }) : browser.tabs.update({ url: url }); // respect pinned tab and open in new tab if pinned
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openFeedItemInWinPrivate(url) {
		browser.windows.create({ url: url, type: "normal", incognito: true })
			.catch((error) => messageView.open({ text: slUtil.incognitoErrorMessage(error) }) );
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function openFeedItemInReader(url) {

		let finalCleanupTimer;
		let cleanupTimer = null;
		let isInjectionResolved = false;

		const cleanupAndFinalize = async () => {
			clearTimeout(finalCleanupTimer);
			clearTimeout(cleanupTimer);
			browser.tabs.onUpdated.removeListener(fallbackListener);
			if(isInjectionResolved) {
				const count = await internalPrefs.getMsgShowCountReaderModeFailed();
				if(count>0) internalPrefs.setMsgShowCountReaderModeFailed(count-1);
			}
		};
		const fallbackListener = async (tabId, changeInfo) => {

			if(changeInfo.status === "loading") {
				clearTimeout(cleanupTimer);		// cancel any previous cleanup since the page is reloading (may be a redirect)
				isInjectionResolved = false;
				return;
			}

			if(changeInfo.status === "complete" && !isInjectionResolved) {
				clearTimeout(cleanupTimer);
				const message = "Reader Mode failed to load the article. The page has been opened in normal mode.";
				const dismissTimeout = (await internalPrefs.getMsgShowCountReaderModeFailed()) > 0 ? 15000 : 8000;	// first n failures: 15 seconds, Subsequent failures: 8 seconds
				injectPageNotification(tabId, message, Global.MSG_ID_DONT_SHOW_READER_MODE_FAILED_MSG, document.documentElement.dir, dismissTimeout);
				isInjectionResolved = true;
				cleanupTimer = setTimeout(cleanupAndFinalize, 800);	// cleanup after 0.8 sec; give time for any redirects to occur before removing the listener.
			}
		};
		const readerListener = async (tabId, changeInfo, tabInfo) => {
			if(changeInfo.status === "complete") {
				browser.tabs.onUpdated.removeListener(readerListener);

				// FRAGILE! - if reader successful => has no title property. if fails => title for English language is: "Failed to load article from page" (language dependent)
				// when the result is 404 the reader fails and STILL there is no title!!! - I got no solution for this case.
				if(!!tabInfo.title && tabInfo.title.length > 0) {
					if(await internalPrefs.getShowReaderModeFailedMsg()) {
						browser.tabs.onUpdated.addListener(fallbackListener, { properties: ["status"], tabId: tabId });
					}
					browser.tabs.update(tabId, { url: url });
				}
			}
		};
		const readerUrl = [ `about:reader?url=${encodeURIComponent(url)}` ];
		const tab = await browser.tabs.create({ url: url, openInReaderMode: true });

		browser.tabs.onUpdated.addListener(readerListener, { properties: ["status"], tabId: tab.id, urls: readerUrl });
		finalCleanupTimer = setTimeout(cleanupAndFinalize, 60000);	// 1 min
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function openFeedItemInReader_Page2Reader(url) {
		let finalCleanupTimer;
		const listener = (tabId, changeInfo) => {
			if(changeInfo.status === "complete") {
				clearTimeout(finalCleanupTimer);
				browser.tabs.onUpdated.removeListener(listener);
				browser.tabs.toggleReaderMode(tabId).catch(error => console.log("[Sage-Like]", "Open feed-item in reader mode", error) );
			}
		};
		const tab = await browser.tabs.create({ url: url });

		browser.tabs.onUpdated.addListener(listener, { properties: ["status"], tabId: tab.id });
		finalCleanupTimer = setTimeout(() => browser.tabs.onUpdated.removeListener(listener), 60000);	// 1 min
	}

	//==================================================================================
	//=== List Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownFeedList(event) {

		// The default behaviour of Fx is to call "mousedown" when
		// clicking with the middle button (scroll).
		// Next event, for middle button, will be 'auxclick'

		if(event.button === 1 || event.target === m_elmList) {
			event.stopPropagation();
			event.preventDefault();
			setFocus();
		}
		InfoBubble.i.dismiss();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownFeedList(event) {

		if(event.target.getAttribute("disabled") !== null) {
			return;
		}

		let keyCode = event.code;
		let elm, elmsCount, index;
		let elmTargetLI = event.target;

		if(event.ctrlKey && event.key === "Insert") {
			keyCode = "KeyC";
		}

		switch (keyCode) {

			case "Tab":
				if(event.shiftKey) {
					rssTreeView.setFocus();
				} else {
					document.documentElement.focus();	// document's <HTML>
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Enter":
			case "NumpadEnter":
				openListFeedItem(elmTargetLI, event.ctrlKey ? URLOpenMethod.IN_NEW_TAB : (event.shiftKey ? URLOpenMethod.IN_NEW_WIN : URLOpenMethod.IN_TAB));
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Home":
				elm = m_elmList.firstElementChild;
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "End":
				elm = m_elmList.lastElementChild;
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowUp":
				elm = elmTargetLI.previousElementSibling;
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				elm = elmTargetLI.nextElementSibling;
				if(elm !== null) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageUp":
				elmsCount = slUtil.numberOfVItemsInViewport(elmTargetLI, m_elmList);
				index = Array.prototype.indexOf.call(m_elmList.children, elmTargetLI);
				index = index-(elmsCount-1);
				elm = m_elmList.children[index < 0 ? 0 : index];
				if(!!elm) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageDown":
				elmsCount = slUtil.numberOfVItemsInViewport(elmTargetLI, m_elmList);
				index = Array.prototype.indexOf.call(m_elmList.children, elmTargetLI);
				index = index+(elmsCount-1);

				if(index >= m_elmList.children.length) {
					index = m_elmList.children.length-1;
				}
				elm = m_elmList.children[index < 0 ? 0 : index];
				if(!!elm) {
					elm.focus();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyO":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_TAB);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyT":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_TAB);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyE":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_TAB_READER);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyB":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_TAB_CONTAINER);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyW":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_WIN);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyV":
				openListFeedItem(elmTargetLI, URLOpenMethod.IN_NEW_WIN_PRIVATE);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyA":
				openAllItemsInTabs();
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyG":
				if(elmTargetLI.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
					toggleItemVisitedState(elmTargetLI);
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyR":
				markAllItemsAsVisitedState(true);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyU":
				markAllItemsAsVisitedState(false);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "KeyC":
				if(elmTargetLI.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
					slUtil.writeTextToClipboard(elmTargetLI.getAttribute("href"));
				} else if(elmTargetLI.classList.contains("errormsg")) {
					let text = document.getSelection().toString();
					if(text.length > 0) {
						slUtil.writeTextToClipboard(text);
					} else {
						slUtil.writeTextToClipboard(elmTargetLI.textContent);
					}
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			default:
				return;		// do not stop propagation
				/////////////////////////////////////////////////////////////////////////
		}

		event.stopPropagation();
		event.preventDefault();
	}

	//==================================================================================
	//=== List Items status
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function setItemRealVisitedState(elm, url, bUpdateTreeFeed = true) {

		browser.history.getVisits({ url: url }).then((vItems) => {

			elm.classList.toggle("bold", vItems.length === 0);

			if (bUpdateTreeFeed) {
				rssTreeView.updateTreeItemStats(m_elmLITreeFeed, getListViewStats());
				rssTreeView.setTreeFeedDataLastStatusMembers(m_elmLITreeFeed);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleItemVisitedState(elm) {
		if(elm.classList.toggle("bold")) {
			// turned to not visited
			slUtil.deleteUrlFromBrowserHistory(elm.getAttribute("href"));
		} else {
			// turned to visited
			slUtil.addUrlToBrowserHistory(elm.getAttribute("href"), elm.textContent);
		}
		rssTreeView.updateTreeItemStats(m_elmLITreeFeed, getListViewStats());
		rssTreeView.setTreeFeedDataLastStatusMembers(m_elmLITreeFeed);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function markAllItemsAsVisitedState(isVisited) {

		let elms = m_elmList.querySelectorAll("." + Global.CLS_RLV_LI_LIST_ITEM);

		if(elms.length > 0) {

			if(isVisited) {
				for(let i=0, len=elms.length; i<len; i++) {
					slUtil.addUrlToBrowserHistory(elms[i].getAttribute("href"), elms[i].textContent);
					elms[i].classList.remove("bold");
				}
			} else {
				for(let i=0, len=elms.length; i<len; i++) {
					slUtil.deleteUrlFromBrowserHistory(elms[i].getAttribute("href"));
					elms[i].classList.add("bold");
				}
			}
			rssTreeView.updateTreeItemStats(m_elmLITreeFeed, getListViewStats());
			rssTreeView.setTreeFeedDataLastStatusMembers(m_elmLITreeFeed);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateFeedItemsStateToVisited(feedUrl, feedItems) {
		if(!!m_elmLITreeFeed && feedUrl === m_elmLITreeFeed.getAttribute("href")) {
			let elms = m_elmList.querySelectorAll(".bold." + Global.CLS_RLV_LI_LIST_ITEM);
			for(let i=0, lenI=feedItems.length; i<lenI; i++) {
				for(let j=0, lenJ=elms.length; j<lenJ; j++) {
					if( decodeURIComponent(feedItems[i]) === decodeURIComponent(elms[j].getAttribute("href")) ) {
						elms[j].classList.remove("bold");
						//break;

						// Real life case. A feed with multiple adjacent items with the same url are not all getting un-bolded.
						// This is when the option 'When opening Feed Preview, mark as "read"' is 'Each feed-item as it becomes visible'.
						// The feed: https://codeberg.org/20-100/uni-STC.atom
						//
						// So instead of breaking right after finding the matching item and removing its bold, I'll also check the
						// next item in the elms collection to see if it's also with the same URL.
						// This is done by adjusting the loop's lenJ variable to a one more iteration beyond the current J index.
						lenJ = Math.min(j+2, elms.length);
					}
				}
			}
			rssTreeView.updateTreeItemStats(m_elmLITreeFeed, getListViewStats());
			rssTreeView.setTreeFeedDataLastStatusMembers(m_elmLITreeFeed);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItemSelectionState(elm) {

		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.classList.remove("selected");
		}

		// select only selectable list items
		if (!!elm && elm.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
			m_elmCurrentlySelected = elm;
			elm.classList.add("selected");
			slUtil.scrollIntoViewIfNeeded(elm, m_elmList.parentElement);
		} else {
			m_elmCurrentlySelected = null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setListErrorMsg(textContent, title, url) {
		const elmLi = document.createElement("li");
		const elmInner = document.createElement("div");
		const elmImg = document.createElement("img");
		const elmSpan = document.createElement("span");

		elmLi.className = "errormsg";
		elmLi.tabIndex = 0;
		elmInner.className = "innerErrormsg";
		elmInner.title = "Failed URL: " + decodeURIComponent(url);
		elmImg.className = "img-errormsg";
		elmImg.src = "/icons/errormsg.png";
		elmSpan.textContent = textContent;

		elmInner.append(elmImg, elmSpan);
		elmLi.append(elmInner);

		disposeList();
		m_elmList.appendChild(elmLi);
		m_elmListViewRssTitle.textContent = title;
		setStatusbarIcon(true);

		if(!RequiredPermissions.i.granted && textContent.includes("NetworkError when attempting to fetch resource")) {

			const style = "margin-block:6px 0; margin-inline:18px 6px; padding:6px 10px;";
			const result = slUtil.createMissingPermissionsDocFrag(style);
			elmLi.appendChild(result.docFragment);
			elmLi.style.paddingBottom = "6px";

			let newLen = m_abortCtrlEvents.push(new AbortController());
			document.getElementById(result.learnMoreAnchorId).addEventListener("click", async () => {
				panel.askForRequiredPermissions();
			}, { signal: m_abortCtrlEvents[newLen-1].signal });

			newLen = m_abortCtrlEvents.push(new AbortController());
			document.getElementById(result.reqPermAnchorId).addEventListener("click", async () => {
				if(await RequiredPermissions.i.request()) {
					window.location.reload();
				};
			}, { signal: m_abortCtrlEvents[newLen-1].signal });
		}
	}

	//==================================================================================
	//=== Utils
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function createFeedItemDescAttachments(elmLI) {

		if(elmLI.hasAttribute("data-attach-mimetypes")) {

			let mimeTypes = elmLI.getAttribute("data-attach-mimetypes").split(","); /* .filter(e => e.length > 0);*/

			let frag = document.createDocumentFragment();
			frag.append(...m_elmFeedItemDescAttachments.children);

			frag.replaceChildren();

			for(let i=0, len=mimeTypes.length; i<len; i++) {
				(frag.appendChild(document.createElement("img"))).src = slUtil.getMimeTypeIconPath(mimeTypes[i]);
			}
			m_elmFeedItemDescAttachments.appendChild(frag);

			m_elmFeedItemDescAttachments.style.borderColor = getComputedStyle(m_elmFeedItemDescAttachments).getPropertyValue("color").replace(/^(rgb)(\([0-9, ]+)(\))$/, "$1a$2, 0.5$3");
			m_elmFeedItemDescAttachments.classList.add("notEmpty");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hideVisibleFeedItemDescPanel() {
		if(m_elmFeedItemDescPanel.style.visibility === "visible") {
			hideFeedItemDescPanel();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hideFeedItemDescPanel() {
		clearTimeout(m_timeoutMouseOver);
		m_timeoutMouseOver = null;
		m_elmFeedItemDescPanel.style.display = "none";
		m_elmFeedItemDescPanel.style.visibility = "hidden";
		m_elmFeedItemDescAttachments.classList.remove("notEmpty");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function switchViewDirection() {
		if(getComputedStyle(m_elmList).direction === "rtl") {
			m_elmList.parentElement.dir = m_elmList.dir = m_elmListViewStatusbar.dir = "ltr";
		} else {
			m_elmList.parentElement.dir = m_elmList.dir = m_elmListViewStatusbar.dir = "rtl";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disposeList() {

		while(m_abortCtrlEvents.length > 0) {
			m_abortCtrlEvents.pop().abort();
		}

		m_elmCurrentlySelected = null;
		hideFeedItemDescPanel();

		m_observerElmLITreeFeed.takeRecords();
		m_observerElmLITreeFeed.disconnect();
		m_elmLITreeFeed = null;

		m_elmList.replaceChildren();
		setStatusbarIcon(false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openAllItemsInTabs(onlyUnread = true) {

		let elm, elms = m_elmList.querySelectorAll("." + Global.CLS_RLV_LI_LIST_ITEM + (onlyUnread ? ".bold" : ""));

		for(let i=0, len=elms.length; i<len; i++) {
			openItemInParkedTab((elm = elms[i]), elm.getAttribute("href"), elm.textContent);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function openItemInParkedTab(elm, url, title) {

		let parkedTabUrl = slUtil.getParkedTabUrl(url, title.replace(/^[0-9]+\. /, ""));
		let creatingTab = browser.tabs.create({ active: false, url: parkedTabUrl });
		let addingUrl = slUtil.addUrlToBrowserHistory(url, title);

		creatingTab.then((tab) => {
			addingUrl.then(() => {
				setItemRealVisitedState(elm, url);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFocus() {
		if(m_elmCurrentlySelected !== null) {
			m_elmCurrentlySelected.focus();
		} else if(!!m_elmList.firstElementChild && m_elmList.firstElementChild.classList.contains(Global.CLS_RLV_LI_LIST_ITEM)) {
			m_elmList.firstElementChild.focus();
		} else {
			m_elmList.focus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setStatusbarIcon(isVisible) {

		updateLayoutWidth();
		m_elmListViewStatusbar.classList.toggle("visible", isVisible);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getListViewStats() {
		return m_elmList.querySelectorAll(".bold." + Global.CLS_RLV_LI_LIST_ITEM).length;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getListViewTitle() {
		return m_elmListViewRssTitle.textContent;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disable(value) {

		if (value === true) {
			m_elmList.tabIndex = -1;
			m_elmList.setAttribute("disabled", "");
			m_elmList.classList.add("disabled", "disabledBlur");

			let elms = m_elmList.children;
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].tabIndex = -1;
				elms[i].setAttribute("disabled", "");
			}

			setStatusbarIcon(false);

		} else {
			m_elmList.tabIndex = 0;
			m_elmList.removeAttribute("disabled");
			m_elmList.classList.remove("disabled", "disabledBlur");

			let elms = m_elmList.children;
			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].tabIndex = 0;
				elms[i].removeAttribute("disabled");
			}

			setStatusbarIcon( !!(m_elmList.firstElementChild) );
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateLayoutWidth() {

		// set listview's CSS variable accordingly depending if has VScroll
		if(slUtil.hasVScroll(m_elmList)) {
			if(m_elmList.parentElement.getBoundingClientRect().width > m_elmList.scrollWidth) {
				document.documentElement.style.setProperty("--list-view-scrollbar-width", slUtil.getScrollbarWidth() + "px");
			} else {
				document.documentElement.style.setProperty("--list-view-scrollbar-width", "0px");
			}
		} else {
			document.documentElement.style.setProperty("--list-view-scrollbar-width", "0px");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isRssListOK() {
		return m_elmList.children.length > 0 && !m_elmList.firstElementChild.classList.contains("errormsg");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectPageNotification(tabId, message, msgIdDontShowMsgAgain, direction = "ltr", dismissTimeout = 12000) {

		return browser.scripting.executeScript({
			injectImmediately: false,
			target: { tabId: tabId },
			args: [message, dismissTimeout, direction, msgIdDontShowMsgAgain],
			func: (message, dismissTimeout, notificationDir, msgIdDontShowAgain) => {

				const fadeOutDuration = 500;
				const boxAlign = (document.documentElement.dir === "rtl") ? "left" : "right";
				const indicatorAlign = (notificationDir === "rtl") ? "right" : "left";

				const cssBox =	`position:fixed; top:15px; ${boxAlign}:20px; width:300px; padding:8px;` +
								`border:1px solid #423b1d; background-color:#fff3a1; color:#000; z-index:2147483647; direction:${notificationDir};` +
								`opacity:1; transition:opacity ${fadeOutDuration}ms ease; user-select:none;`;
				const cssContainer = "display:flex;";
				const cssIcon = "width:16px; height:16px;";
				const cssCaption = "font-weight:bold;";
				const cssMessage = "margin-block:2px 10px;";
				const cssCheckbox = "margin-block:auto; margin-inline:0 4px; cursor:pointer; color-scheme:light;";
				const cssChkLabel = "cursor:pointer;";
				const cssChkContainer = "display:flex; margin-block-end:4px;";
				const cssInner = "margin-inline:6px; font-family:sans-serif; font-size:12px; line-height:18px;";
				const cssClose = "width:18px; height:18px; margin-block:0 auto; margin-inline:auto 0; cursor:pointer;";
				const cssFadeOutIndicator = `position:absolute; bottom:0; ${indicatorAlign}:0; height:4px; width:100%; background-color:#008a3b;` +
											`transition:width ${dismissTimeout}ms linear;`;

				let fadeAndCloseTimer = null;

				const elmHost = document.createElement("div");
				const shadowRoot = elmHost.attachShadow({ mode: "open" });
				const elmBox = document.createElement("div");
				const close = () => {
					if(elmCheckbox.checked) browser.runtime.sendMessage({ id: msgIdDontShowAgain });
					elmHost.remove();
				};
				const fadeAndClose = () => {
					elmBox.style.opacity = "0";
					if(elmCheckbox.checked) browser.runtime.sendMessage({ id: msgIdDontShowAgain });
					setTimeout(() => elmHost.remove(), fadeOutDuration+100);
				};
				const setFadeOutIndicator = (show) => {
					if(show) {
						elmFadeOutIndicator.style.width = "100%";
						elmFadeOutIndicator.style.display = "block";
						setTimeout(() => elmFadeOutIndicator.style.width = "0%", 100);
					} else {
						elmFadeOutIndicator.style.display = "none";
					}
				};
				const onMEnterClearFadeTimeout = () => {
					clearTimeout(fadeAndCloseTimer);
					fadeAndCloseTimer = null;
					setFadeOutIndicator(false);
				};
				const onMLeaveResetFadeTimeout = () => {
					if(fadeAndCloseTimer === null) {
						fadeAndCloseTimer = setTimeout(fadeAndClose, dismissTimeout);
						setFadeOutIndicator(true);
					}
				};
				elmBox.style.cssText = cssBox;
				elmBox.addEventListener("mouseenter", onMEnterClearFadeTimeout);
				elmBox.addEventListener("mouseleave", onMLeaveResetFadeTimeout);

				const elmIcon = document.createElement("img");
				elmIcon.style.cssText = cssIcon;
				elmIcon.src = browser.runtime.getURL("/icons/sageLike-16.png");
				elmIcon.alt = "Sage-Like";

				const elmClose = document.createElement("img");
				elmClose.style.cssText = cssClose;
				elmClose.src = browser.runtime.getURL("/icons/clear.png");
				elmClose.alt = "Close";
				elmClose.addEventListener("click", close);

				const elmCaption = document.createElement("div");
				elmCaption.style.cssText = cssCaption;
				elmCaption.textContent = "Sage-Like";

				const elmMessage = document.createElement("div");
				elmMessage.style.cssText = cssMessage;
				elmMessage.textContent = message;

				const elmCheckbox = document.createElement("input");
				elmCheckbox.id = "chk-dont-show-notification-again";
				elmCheckbox.style.cssText = cssCheckbox;
				elmCheckbox.type = "checkbox";

				const elmChkLabel = document.createElement("label");
				elmChkLabel.style.cssText = cssChkLabel;
				elmChkLabel.setAttribute("for", "chk-dont-show-notification-again");
				elmChkLabel.textContent = "Don't show this message again";

				const elmChkContainer = document.createElement("div");
				elmChkContainer.style.cssText = cssChkContainer;
				elmChkContainer.append(elmCheckbox, elmChkLabel);

				const elmInner = document.createElement("div");
				elmInner.style.cssText = cssInner;
				elmInner.append(elmCaption, elmMessage, elmChkContainer);

				const elmContainer = document.createElement("div");
				elmContainer.style.cssText = cssContainer;
				elmContainer.append(elmIcon, elmInner, elmClose);

				const elmFadeOutIndicator = document.createElement("div");
				elmFadeOutIndicator.style.cssText = cssFadeOutIndicator;

				elmBox.append(elmContainer, elmFadeOutIndicator);
				shadowRoot.appendChild(elmBox);
				document.body.appendChild(elmHost);
				fadeAndCloseTimer = setTimeout(fadeAndClose, dismissTimeout);	// auto close
				setTimeout(() => elmFadeOutIndicator.style.width = "0%", 100);
			}
		});
	}

	return {
		URLOpenMethod: URLOpenMethod,

		setFeedItems: setFeedItems,
		disposeList: disposeList,
		openListFeedItem: openListFeedItem,
		setListErrorMsg: setListErrorMsg,
		setFeedItemSelectionState: setFeedItemSelectionState,
		toggleItemVisitedState: toggleItemVisitedState,
		markAllItemsAsVisitedState: markAllItemsAsVisitedState,
		switchViewDirection: switchViewDirection,
		openAllItemsInTabs: openAllItemsInTabs,
		setFocus: setFocus,
		getListViewTitle: getListViewTitle,
		disable: disable,
		hideVisibleFeedItemDescPanel: hideVisibleFeedItemDescPanel,
		updateLayoutWidth: updateLayoutWidth,
		isRssListOK: isRssListOK,
	};

})();
