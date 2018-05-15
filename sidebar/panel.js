"use strict";

(function () {

	let elmBody;
	let elmTop;
	let elmSplitter;
	let elmBottom;

	let elmToolbar;
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
		elmTree = document.getElementById("rssTreeView");
		elmList = document.getElementById("rssListView");

		elmSplitter.addEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.addEventListener("resize", () => { setPanelLayout(); }, false);

		setPanelLayout();
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

		elmSplitter.removeEventListener("mousedown", onMouseDown_startSplitterDrag, false);
		window.removeEventListener("resize", () => { setPanelLayout(); }, false);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setPanelLayout(splitterTop) {

		splitterTop = splitterTop || elmSplitter.offsetTop;

		let splitterMargin = elmSplitter.offsetHeight + 1;

		if (splitterTop > splitterMargin && (elmBody.offsetHeight - splitterTop) > splitterMargin) {
			elmSplitter.style.top = splitterTop + "px";
			elmTop.style.height = (elmSplitter.offsetTop) + "px";
			elmBottom.style.top = (elmSplitter.offsetTop + elmSplitter.offsetHeight) + "px";
			elmBottom.style.height = (elmBody.offsetHeight - (elmTop.offsetHeight + elmSplitter.offsetHeight)) + "px";

			elmTree.style.height = (elmTop.offsetHeight - elmToolbar.offsetHeight) + "px";
			elmList.style.height = elmBottom.offsetHeight+ "px";
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

})();
