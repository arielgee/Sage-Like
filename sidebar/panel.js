"use strict";

let panel = (function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmBody;
	let m_elmInfoBar;
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

	let m_viewsLoadedContentFlags = slGlobals.VIEW_CONTENT_LOAD_FLAG.NO_VIEW_LOADED;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	/**************************************************/
	browser.windows.getCurrent().then((winInfo) => {
		m_windowId = winInfo.id;
		browser.runtime.connect({name: "" + winInfo.id});	// port.name is the window ID
	});

	/**************************************************/
	browser.runtime.onMessage.addListener((message) => {

		if (message.id === slGlobals.MSG_ID_PREFERENCES_CHANGED) {

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
		}
	});

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmBody = document.body;
		m_elmInfoBar = document.getElementById("infoBar");
		m_elmTop = document.getElementById("top");
		m_elmSplitter = document.getElementById("splitter");
		m_elmBottom = document.getElementById("bottom");

		m_elmToolbar = document.getElementById("toolbar");
		m_elmDiscoverFeed = document.getElementById("discoverfeed");
		m_elmPreferences = document.getElementById("preferences");

		m_elmTree = document.getElementById(slGlobals.ID_UL_RSS_TREE_VIEW);
		m_elmList = document.getElementById(slGlobals.ID_UL_RSS_LIST_VIEW);

		m_elmInfoBar.addEventListener("click", onBlurInfoBar);
		m_elmInfoBar.addEventListener("blur", onBlurInfoBar);
		m_elmTop.addEventListener("scroll", onScrollTop);
		m_elmSplitter.addEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.addEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.addEventListener("resize", onResize, false);

		m_elmDiscoverFeed.addEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.addEventListener("click", onClickPreferences);

		// get browser default font for font-family fallback
		let browserFont = getComputedStyle(m_elmBody).getPropertyValue("font-family");
		document.documentElement.style.setProperty("--font-default-fallback", browserFont);

		setPanelDensityFromPreferences();
		setPanelFontNameFromPreferences();
		setPanelFontSizePercentFromPreferences();
		setPanelColorsFromPreferences();
		setPanelImageSetFromPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmInfoBar.removeEventListener("click", onBlurInfoBar);
		m_elmInfoBar.removeEventListener("blur", onBlurInfoBar);
		m_elmTop.removeEventListener("scroll", onScrollTop);
		m_elmSplitter.removeEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.removeEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.removeEventListener("resize", onResize, false);

		m_elmDiscoverFeed.removeEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.removeEventListener("click", onClickPreferences);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelDensityFromPreferences() {

		prefs.getUIDensity().then(value => {

			let parts = value.split(";");
			let style = document.documentElement.style;

			style.setProperty("--line-height", parts[0] + "px");
			style.setProperty("--rss-tree-indent", parts[1] + "px");
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

			style.setProperty("--url-img-open-sub-tree", imageSet.IMG_OPEN_SUB_TREE);
			style.setProperty("--url-img-closed-sub-tree", imageSet.IMG_CLOSED_SUB_TREE);
			style.setProperty("--url-img-tree-item", imageSet.IMG_TREE_ITEM);
			style.setProperty("--url-img-tree-item-loading", imageSet.IMG_TREE_ITEM_LOADING);
			style.setProperty("--url-img-tree-item-error", imageSet.IMG_TREE_ITEM_ERROR);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelLayout(splitterTop) {

		splitterTop = splitterTop || m_elmSplitter.offsetTop;
		internalPrefs.setSplitterTop(splitterTop);

		let reduseH, sbWidth = slUtil.getScrollbarWidth();
		let splitterMargin = m_elmToolbar.offsetHeight;

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
		}

		// set listview's CSS variable accordingly depending if has VScroll
		document.documentElement.style.setProperty("--rlv-scrollbar-width", (slUtil.hasVScroll(m_elmList) ? sbWidth : 0) + "px");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurInfoBar(event) {
		slUtil.showInfoBar("");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onScrollTop(event) {

		if(!m_scrollTopThrottler) {
			m_scrollTopThrottler = true;
			window.requestAnimationFrame(() => {
				internalPrefs.setTreeScrollTop(m_elmTop.scrollTop);
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

		discoveryView.show().then((newFeedsList) => {
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
	function getWindowId() {
		return m_windowId;
	}

	return {
		getWindowId: getWindowId,
		notifyViewContentLoaded: notifyViewContentLoaded,
	};

})();
