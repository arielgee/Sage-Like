"use strict";

(function() {

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.title = slUtil.getQueryStringValue("prkTitle");
		document.addEventListener("focus", onFocusDocument);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onFocusDocument(event) {

		browser.tabs.getCurrent().then((tab) => {
			// delete parked url from history, keep it tidy;
			// wait for Promise to be fulfilled before update() to avoid console error: https://bugzilla.mozilla.org/show_bug.cgi?id=1389734
			browser.history.deleteUrl( { url: window.location.href }).then(() => {
				browser.tabs.update(tab.id, { url: slUtil.getQueryStringValue("prkUrl") });
			});
		});
		document.removeEventListener("focus", onFocusDocument);
	};

})();
