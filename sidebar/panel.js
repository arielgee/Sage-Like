"use strict";

(function() {

	let elmBody;
	let elmTop;
	let elmSplitter;
	let elmBottom;

	let elmToolbar;
	let elmDiscoverFeed;
	let elmPreferences;
	
	let elmTree;
	let elmList;


	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		elmBody = document.body;
		elmTop = document.getElementById("top");
		elmSplitter = document.getElementById("splitter");
		elmBottom = document.getElementById("bottom");

		elmToolbar = document.getElementById("toolbar");
		elmDiscoverFeed = document.getElementById("discoverfeed");
		elmPreferences = document.getElementById("preferences");

		elmTree = document.getElementById("rssTreeView");
		elmList = document.getElementById("rssListView");

		elmSplitter.addEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.addEventListener("resize", () => { setPanelLayout(); }, false);

		elmDiscoverFeed.addEventListener("click", onClickDiscoverFeed);
		elmPreferences.addEventListener("click", onClickPreferences);

		// from all the onDOMContentLoaded() fired try to make sure its done last
		setTimeout(() => { setPanelLayout(); }, 150);
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

		elmSplitter.removeEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.removeEventListener("resize", () => { setPanelLayout(); }, false);

		elmDiscoverFeed.removeEventListener("click", onClickDiscoverFeed);
		elmPreferences.removeEventListener("click", onClickPreferences);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setPanelLayout(splitterTop) {

		splitterTop = splitterTop || elmSplitter.offsetTop;

		let reduseH, sbWidth = slUtil.getScrollbarWidth(document);
		let splitterMargin = elmSplitter.offsetHeight + 1;

		if (splitterTop > splitterMargin && (elmBody.offsetHeight - splitterTop) > splitterMargin) {
			elmSplitter.style.top = splitterTop + "px";
			elmTop.style.height = (elmSplitter.offsetTop - elmToolbar.offsetHeight) + "px";
			elmBottom.style.top = (elmSplitter.offsetTop + elmSplitter.offsetHeight) + "px";
			elmBottom.style.height = (elmBody.offsetHeight - (elmSplitter.offsetTop + elmSplitter.offsetHeight)) + "px";

			// HScroll causes an un-nessesery VScroll, so if has HScroll reduse height to accommodate
			reduseH = slUtil.hasHScroll(elmTree) ? sbWidth : 0;
			elmTree.style.height = (elmTop.offsetHeight - reduseH) + "px";

			reduseH = slUtil.hasHScroll(elmList) ? sbWidth : 0;
			elmList.style.height = (elmBottom.offsetHeight - reduseH) + "px";
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onMouseDown_startSplitterDrag(event) {
		window.addEventListener("mouseup", onMouseUp_stopSplitterDrag, false);
		window.addEventListener('mousemove', onMouseMove_dragSplitter, true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onMouseUp_stopSplitterDrag(event) {
		window.removeEventListener('mousemove', onMouseMove_dragSplitter, true);
		window.removeEventListener("mouseup", onMouseUp_stopSplitterDrag, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onMouseMove_dragSplitter(event) {
		setPanelLayout(elmSplitter.offsetTop + event.movementY);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickDiscoverFeed(event) {			
		discoverView.open();
		event.stopPropagation();
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickPreferences(event) {
		browser.runtime.openOptionsPage();
	}
	
})();
