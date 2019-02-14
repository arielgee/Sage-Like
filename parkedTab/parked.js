"use strict";

(function() {

	let onFocusDocument = (event) => {

		browser.tabs.getCurrent().then((tab) => {
			browser.tabs.update(tab.tabId, { url: slUtil.getQueryStringValue("prkUrl") });
			browser.history.deleteUrl( { url: window.location.href });		// delete parked url from history, keep it tidy
		});
		document.removeEventListener("focus", onFocusDocument);
	};

	document.title = decodeURI(slUtil.getQueryStringValue("prkTitle"));
	document.addEventListener("focus", onFocusDocument);

})();
