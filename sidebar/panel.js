"use strict";

(function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

	let m_elmBody;
	let m_elmTop;
	let m_elmSplitter;
	let m_elmBottom;

	let m_elmToolbar;
	let m_elmDiscoverFeed;
	let m_elmPreferences;

	let m_elmTree;
	let m_elmList;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	/**************************************************/
	browser.runtime.onMessage.addListener((message) => {
		if (message.id === slGlobalConsts.MSG_ID_PREFERENCE_UPDATED &&
			(message.details === slGlobalConsts.MSG_DETAILS_PREFERENCE_ALL || message.details === slGlobalConsts.MSG_DETAILS_PREFERENCE_COLORS)) {
			setPanelColorsFromPreferences();
		}
	});

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmBody = document.body;
		m_elmTop = document.getElementById("top");
		m_elmSplitter = document.getElementById("splitter");
		m_elmBottom = document.getElementById("bottom");

		m_elmToolbar = document.getElementById("toolbar");
		m_elmDiscoverFeed = document.getElementById("discoverfeed");
		m_elmPreferences = document.getElementById("preferences");

		m_elmTree = document.getElementById(slGlobalConsts.ID_UL_RSS_TREE_VIEW);
		m_elmList = document.getElementById(slGlobalConsts.ID_UL_RSS_LIST_VIEW);

		m_elmSplitter.addEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.addEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.addEventListener("resize", () => { setPanelLayout(); }, false);

		m_elmDiscoverFeed.addEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.addEventListener("click", onClickPreferences);

		setPanelColorsFromPreferences();

		// from all the onDOMContentLoaded() fired try to make sure its done last
		setTimeout(() => { setPanelLayout(); }, 150);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {

		m_elmSplitter.removeEventListener("dblclick", onDoubleClickSetSplitterPosition, false);
		m_elmSplitter.removeEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.removeEventListener("resize", () => { setPanelLayout(); }, false);

		m_elmDiscoverFeed.removeEventListener("click", onClickDiscoverFeed);
		m_elmPreferences.removeEventListener("click", onClickPreferences);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelColorsFromPreferences() {

		let style = document.documentElement.style;

		prefs.getColorBackground().then(color => { style.setProperty("--bk-color-window", color); });
		prefs.getColorDialogBackground().then(color => { style.setProperty("--bk-color-dialog", color); });
		prefs.getColorSelect().then(color => { style.setProperty("--bk-color-active", color); });
		prefs.getColorText().then(color => { style.setProperty("--color-text", color); });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setPanelLayout(splitterTop) {

		splitterTop = splitterTop || m_elmSplitter.offsetTop;

		let reduseH, sbWidth = slUtil.getScrollbarWidth(document);
		let splitterMargin = m_elmSplitter.offsetHeight + 1;

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
		window.addEventListener('mousemove', onMouseMove_dragSplitter, true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseUp_stopSplitterDrag(event) {
		window.removeEventListener('mousemove', onMouseMove_dragSplitter, true);
		window.removeEventListener("mouseup", onMouseUp_stopSplitterDrag, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMove_dragSplitter(event) {
		setPanelLayout(m_elmSplitter.offsetTop + event.movementY);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickDiscoverFeed(event) {
		discoveryView.open();
		event.stopPropagation();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPreferences(event) {
		browser.runtime.openOptionsPage();
	}
})();
