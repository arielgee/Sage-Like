"use strict";

let panel = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmBody;
	let m_elmMainPanel;
	let m_elmTop;
	let m_elmSplitter;
	let m_elmBottom;

	let m_elmToolbar;
	let m_elmDiscoverFeed;
	let m_elmPreferences;

	let m_elmTree;
	let m_elmList;

	let m_panelLayoutThrottler = false;
	let m_scrollTopThrottler = false;

	let m_windowId = null;

	let m_lineHeight = 19;
	let m_treeIndent = 18;

	let m_viewsLoadedContentFlags = slGlobals.VIEW_CONTENT_LOAD_FLAG.NO_VIEW_LOADED;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);

		browser.windows.getCurrent().then((winInfo) => {
			m_windowId = winInfo.id;
			browser.runtime.connect({name: "" + winInfo.id});	// port.name is the window ID
		});

		browser.runtime.onMessage.addListener(onRuntimeMessage);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case slGlobals.MSG_ID_PREFERENCES_CHANGED:
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_ANIMATED_SLIDE_DOWN_PANEL) {
					setAnimatedSlideDownPanelFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_UI_DENSITY) {
					setPanelDensityFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_FONT_NAME) {
					setPanelFontNameFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_FONT_SIZE_PERCENT) {
					setPanelFontSizePercentFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_COLORS) {
					setPanelColorsFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_IMAGES) {
					setPanelImageSetFromPreferences();
				}
				if (message.details === slGlobals.MSGD_PREF_CHANGE_ALL ||
					message.details === slGlobals.MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS) {
					setFeedItemsDescColorsFromPreferences();
				}
				break;
				/////////////////////////////////////////////////////////////////////////

			case slGlobals.MSG_ID_CLOSE_ALL_SIDEBAR_PANELS:
				closeAllSidebarPanels();
				break;
				/////////////////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmBody = document.body;
		m_elmMainPanel = document.getElementById("mainPanel");
		m_elmTop = document.getElementById("top");
		m_elmSplitter = document.getElementById("splitter");
		m_elmBottom = document.getElementById("bottom");

		m_elmToolbar = document.getElementById("toolbar");
		m_elmDiscoverFeed = document.getElementById("discoverfeed");
		m_elmPreferences = document.getElementById("preferences");

		m_elmTree = document.getElementById(slGlobals.ID_UL_RSS_TREE_VIEW);
		m_elmList = document.getElementById(slGlobals.ID_UL_RSS_LIST_VIEW);

		window.addEventListener("resize", onResize, false);
		m_elmBody.addEventListener("keydown", onKeyDownBody);
		m_elmTop.addEventListener("scroll", onScrollTop);
		m_elmSplitter.addEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.addEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		m_elmDiscoverFeed.addEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.addEventListener("click", onClickPreferences);

		// get browser default font for font-family fallback
		let browserFont = getComputedStyle(m_elmBody).getPropertyValue("font-family");
		document.documentElement.style.setProperty("--font-default-fallback", browserFont);

		setAnimatedSlideDownPanelFromPreferences();
		setPanelDensityFromPreferences();
		setPanelFontNameFromPreferences();
		setPanelFontSizePercentFromPreferences();
		setPanelColorsFromPreferences();
		setPanelImageSetFromPreferences();
		setFeedItemsDescColorsFromPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		window.removeEventListener("resize", onResize, false);
		m_elmBody.removeEventListener("keydown", onKeyDownBody);
		m_elmTop.removeEventListener("scroll", onScrollTop);
		m_elmSplitter.removeEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.removeEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		m_elmDiscoverFeed.removeEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.removeEventListener("click", onClickPreferences);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setAnimatedSlideDownPanelFromPreferences() {
		prefs.getAnimatedSlideDownPanel().then((animate) => {
			document.documentElement.style.setProperty("--transition-duration-slide-down-panel", animate ? "300ms" : "0");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelDensityFromPreferences() {

		prefs.getUIDensity().then(value => {

			let parts = value.split(";");
			let style = document.documentElement.style;

			m_lineHeight = parseInt(parts[0]);
			m_treeIndent = parseInt(parts[1]);

			style.setProperty("--line-height-rss-view", m_lineHeight + "px");
			style.setProperty("--rss-tree-indent", m_treeIndent + "px");
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelFontNameFromPreferences() {

		prefs.getFontName().then(name => {

			if (name === prefs.DEF_PREF_FONT_NAME_VALUE) {
				m_elmTop.style.fontFamily = m_elmBottom.style.fontFamily = "";
			} else {
				document.documentElement.style.setProperty("--font-sidebar", name);
				m_elmTop.style.fontFamily = m_elmBottom.style.fontFamily = "var(--font-family-sidebar)";
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelFontSizePercentFromPreferences() {

		prefs.getFontSizePercent().then(percent => {
			m_elmTop.style.fontSize = m_elmBottom.style.fontSize = parseInt(percent) + "%";
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelColorsFromPreferences() {

		let style = document.documentElement.style;

		prefs.getColorBackground().then(color => {
			style.setProperty("--bk-color-window", color);
			style.setProperty("--bk-color-window-contrasted", slUtil.contrastColor(color));
		});
		prefs.getColorDialogBackground().then(color => {
			style.setProperty("--bk-color-dialog", color);
			style.setProperty("--bk-color-dialog-contrasted", slUtil.contrastColor(color));
			style.setProperty("--bk-color-dialog-contrasted-alfa", slUtil.contrastColor(color) + "80");
		});
		prefs.getColorSelect().then(color => {
			style.setProperty("--bk-color-active", color);
			style.setProperty("--bk-color-active-contrasted", slUtil.contrastColor(color));
		});
		prefs.getColorText().then(color => { style.setProperty("--color-text", color); });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelImageSetFromPreferences() {

		prefs.getImageSet().then(setNumber => {

			let style = document.documentElement.style;
			let imageSet = slGlobals.IMAGE_SET(setNumber);

			style.setProperty("--url-img-open-folder", imageSet.IMG_OPEN_FOLDER);
			style.setProperty("--url-img-closed-folder", imageSet.IMG_CLOSED_FOLDER);
			style.setProperty("--url-img-tree-item", imageSet.IMG_TREE_ITEM);
			style.setProperty("--url-img-tree-item-loading", imageSet.IMG_TREE_ITEM_LOADING);
			style.setProperty("--url-img-tree-item-error", imageSet.IMG_TREE_ITEM_ERROR);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setFeedItemsDescColorsFromPreferences() {

		let style = document.documentElement.style;

		prefs.getColorFeedItemDescBackground().then(color => { style.setProperty("--bk-color-feed-item-desc", color); });
		prefs.getColorFeedItemDescText().then(color => { style.setProperty("--color-text-feed-item-desc", color); });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelLayout(splitterTop) {

		splitterTop = splitterTop || m_elmSplitter.offsetTop;

		let reduseH, sbWidth = slUtil.getScrollbarWidth();
		let splitterMargin = m_elmToolbar.offsetHeight;

		// is splitter is bellow the total height
		if((m_elmBody.offsetHeight - splitterTop) <= splitterMargin) {
			splitterTop = m_elmBody.offsetHeight - splitterMargin - 1;
		}

		if (splitterTop > splitterMargin && (m_elmBody.offsetHeight - splitterTop) > splitterMargin) {
			m_elmSplitter.style.top = splitterTop + "px";
			m_elmTop.style.height = (m_elmSplitter.offsetTop - m_elmToolbar.offsetHeight) + "px";
			m_elmBottom.style.top = (m_elmSplitter.offsetTop + m_elmSplitter.offsetHeight) + "px";
			m_elmBottom.style.height = (m_elmBody.offsetHeight - (m_elmSplitter.offsetTop + m_elmSplitter.offsetHeight)) + "px";

			// HScroll causes an un-nessesery VScroll, so if has HScroll reduse height to accommodate
			reduseH = slUtil.hasHScroll(m_elmTree) ? sbWidth : 0;
			m_elmTree.style.height = (m_elmTop.offsetHeight - reduseH) + "px";

			reduseH = slUtil.hasHScroll(m_elmList) ? sbWidth : 0;
			m_elmList.style.height = (m_elmBottom.offsetHeight - reduseH) + "px";

			internalPrefs.setSplitterTop(splitterTop);
		}

		// set listview's CSS variable accordingly depending if has VScroll
		rssListView.updateLayoutWidth();

		// side bar resizing escapes the contextMenu and the infoBubble
		contextMenu.close();
		InfoBubble.i.dismiss();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownBody(event) {
		if(event.code === "Escape") {
			closeAllSidebarPanels();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onScrollTop(event) {

		if(!m_scrollTopThrottler) {
			m_scrollTopThrottler = true;
			window.requestAnimationFrame(() => {
				internalPrefs.setTreeScrollTop(m_elmTop.scrollTop);
				InfoBubble.i.dismiss(true);
				m_scrollTopThrottler = false;
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDoubleClickSetSplitterPosition(event) {

		if(event.shiftKey) {
			setPanelLayout(m_elmBody.offsetHeight * 0.333);
		} else if(event.ctrlKey) {
			setPanelLayout(m_elmBody.offsetHeight * 0.666);
		} else {
			setPanelLayout(m_elmBody.offsetHeight * 0.5);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDown_startSplitterDrag(event) {
		window.addEventListener("mouseup", onMouseUp_stopSplitterDrag, false);
		window.addEventListener("mousemove", onMouseMove_dragSplitter, true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseUp_stopSplitterDrag(event) {
		window.removeEventListener("mousemove", onMouseMove_dragSplitter, true);
		window.removeEventListener("mouseup", onMouseUp_stopSplitterDrag, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMove_dragSplitter(event) {

		if(!m_panelLayoutThrottler) {
			m_panelLayoutThrottler = true;
			window.requestAnimationFrame(() => {
				setPanelLayout(m_elmSplitter.offsetTop + event.movementY);
				m_panelLayoutThrottler = false;
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onResize(event) {

		if(!m_panelLayoutThrottler) {
			m_panelLayoutThrottler = true;
			window.requestAnimationFrame(() => {
				setPanelLayout();
				m_panelLayoutThrottler = false;
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickDiscoverFeed(event) {
		event.stopPropagation();

		discoveryView.open().then((newFeedsList) => {
			rssTreeView.addNewFeeds(newFeedsList);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPreferences(event) {
		browser.runtime.openOptionsPage();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function notifyViewContentLoaded(viewContentLoadFlag) {

		m_viewsLoadedContentFlags |= viewContentLoadFlag;

		// set panel layout only after the content of rssTreeView & rssListView was loaded
		if(m_viewsLoadedContentFlags === slGlobals.VIEW_CONTENT_LOAD_FLAG.ALL_VIEWS_LOADED) {
			internalPrefs.getSplitterTop().then((splitterTop) => setPanelLayout(splitterTop));
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeAllSidebarPanels(event) {
		messageView.close();
		discoveryView.close();
		NewFeedPropertiesView.close();
		NewFolderPropertiesView.close();
		EditFeedPropertiesView.close();
		EditFolderPropertiesView.close();
		InfoBubble.i.dismiss();
		rssListView.hideVisibleFeedItemDescPanel();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getWindowId() {
		return m_windowId;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disable(value) {

		if (value === true) {

			m_elmMainPanel.setAttribute("disabled", "");
			m_elmMainPanel.classList.add("disabled", "disabledBlur");

			m_elmTop.setAttribute("disabled", "");
			m_elmTop.classList.add("disabled", "disabledBlur");
			m_elmTop.tabIndex = -1;

			m_elmBottom.setAttribute("disabled", "");
			m_elmBottom.classList.add("disabled", "disabledBlur");
			m_elmBottom.tabIndex = -1;

			m_elmSplitter.setAttribute("disabled", "");
			m_elmSplitter.classList.add("disabled", "disabledBlur");

		} else {

			m_elmMainPanel.removeAttribute("disabled");
			m_elmMainPanel.classList.remove("disabled", "disabledBlur");

			m_elmTop.removeAttribute("disabled");
			m_elmTop.classList.remove("disabled", "disabledBlur");
			m_elmTop.tabIndex = 0;

			m_elmBottom.removeAttribute("disabled");
			m_elmBottom.classList.remove("disabled", "disabledBlur");
			m_elmBottom.tabIndex = 0;

			m_elmSplitter.removeAttribute("disabled");
			m_elmSplitter.classList.remove("disabled", "disabledBlur");
		}
		disableToolbar(value);
		rssTreeView.disable(value);
		rssListView.disable(value);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function disableToolbar(value) {

		let elms = m_elmToolbar.querySelectorAll("#toolbar > .button, #filterWidget > .button");
		let elmTextContainer = document.getElementById("filterTextBoxContainer");

		// handle enable/disable state only if the filter widget is open
		if(!elmTextContainer.parentElement.classList.contains("opened")) {
			elmTextContainer = null;
		}

		if (value === true) {

			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].setAttribute("disabled", "");
				elms[i].classList.add("disabled", "disabledBlur");
			}

		} else {

			for(let i=0, len=elms.length; i<len; i++) {
				elms[i].removeAttribute("disabled");
				elms[i].classList.remove("disabled", "disabledBlur");
			}
		}

		if(!!elmTextContainer) {
			slUtil.disableElementTree(elmTextContainer, value, true);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getDensity() {
		return {
			lineHeight: m_lineHeight,
			treeIndent: m_treeIndent,
		}
	}

	return {
		getWindowId: getWindowId,
		notifyViewContentLoaded: notifyViewContentLoaded,
		disable: disable,
		getDensity: getDensity,
	};

})();
