"use strict";

(function() {

	//////////////////////////////////////////////////////////////////////
	// Sage-Like Toolbar button
	browser.browserAction.onClicked.addListener(toggleSidebar);

	//////////////////////////////////////////////////////////////////////
	// firefox commands (keyboard)
	browser.commands.onCommand.addListener((command) => {

		switch (command) {
			case "kb-open-sage-like":
				toggleSidebar();
				console.log("[Sage-Like]", "Waiting for Mozilla to fix Bug 1398833/1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465");
				break;
				//////////////////////////////////////////////////////////////
		}
	});

	//////////////////////////////////////////////////////////////////////
	function toggleSidebar() {

		browser.sidebarAction.open();		// supported in 57.0

		/*	Bug 1398833: https://bugzilla.mozilla.org/show_bug.cgi?id=1398833

		browser.sidebarAction.isOpen({}).then((isOpen) => {		// supported in 59.0
			if(isOpen) {
				browser.sidebarAction.close();		// supported in 57.0
			} else {
				browser.sidebarAction.open();		// supported in 57.0
			}
		});
		*/
	}

})();
