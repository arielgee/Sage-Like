"use strict";

(function() {

	let getQueryStringValue = (field) => {
		let reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
		let value = reg.exec(window.location.href);
		return value ? value[1] : null;
	};

	let onFocusDocument = (event) => {

		browser.tabs.getCurrent().then((tab) => {
			browser.tabs.update(tab.tabId, { url: getQueryStringValue("prkUrl") });
			browser.history.deleteUrl( { url: window.location.href });		// delete parked url from history, keep it tidy
		});
		document.removeEventListener("focus", onFocusDocument);
	};

	document.title = decodeURI(getQueryStringValue("prkTitle"));
	document.addEventListener("focus", onFocusDocument);

})();
