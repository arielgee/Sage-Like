"use strict";

(function() {

	//////////////////////////////////////////////////////////////////////
	// Sage-Like Toolbar button
	browser.browserAction.onClicked.addListener((tab) => {
		browser.sidebarAction.open();		// not supported in  56.0
	});

	//////////////////////////////////////////////////////////////////////
	// firefox commands (keyboard)
	browser.commands.onCommand.addListener(function(command) {

		switch (command) {

			case "kb-open-sidebar":
				browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
					browser.sidebarAction.open();
				});
				break;
				//////////////////////////////////////////////////////////////
		}
	});

})();
