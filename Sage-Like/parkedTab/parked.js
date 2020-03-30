"use strict";

(function() {

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.title = decodeURI(slUtil.getQueryStringValue("prkTitle"));
		document.addEventListener("focus", onFocusDocument);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusDocument(event) {

		browser.tabs.getCurrent().then((tab) => {
			browser.tabs.update(tab.id, { url: decodeURIComponent(slUtil.getQueryStringValue("prkUrl")) });
			browser.history.deleteUrl( { url: window.location.href });		// delete parked url from history, keep it tidy
		});
		document.removeEventListener("focus", onFocusDocument);
	};

})();
