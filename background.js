"use strict";

(function () {

	const BROWSER_ACTION_IMAGE_PATHS = {
		32: "icons/lizard-32.png",
		48: "icons/lizard-48.png",
	};

	const BROWSER_ACTION_GRAY_IMAGE_PATHS = {
		32: "icons/lizard-gray-32.png",
		48: "icons/lizard-gray-48.png",
	};

	const PAGE_ACTION_IMAGE_PATHS = {
		19: "icons/lizard-19.png",
		38: "icons/lizard-38.png",
	};

	const PAGE_ACTION_GRAY_IMAGE_PATHS = {
		19: "icons/lizard-gray-19.png",
		38: "icons/lizard-gray-38.png",
	};

	const WTF_IMAGE_PATH = { 48: "icons/lizard-wtf-48.png" };

	const VIEW_SOURCE_PAGE = "viewSource/viewSource.html";

	const DEF_NOTIFICATION_TIMEOUT = 4300;

	const PAGE_CONTEXT = ["audio", "editable", "image", "link", "page", "password", "selection", "video"];
	const TOOLS_MENU_CONTEXT = ["tools_menu"];

	let lizardToggleStateMenuID = -1;

	let lastInjectTime = 0;

	//////////////////////////////////////////////////////////////////////
	// SageLike Toolbar button
	browser.browserAction.onClicked.addListener((tab) => {
			sendReq(tab);
		});

	//////////////////////////////////////////////////////////////////////
	// firefox commands (keyboard)
	browser.commands.onCommand.addListener(function (command) {
	
		switch (command) {

			case "kb-open-sidebar":
				browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
					sendReq(tabs[0]);
				});
				break;
				//////////////////////////////////////////////////////////////

		}
	});

	//////////////////////////////////////////////////////////////////////
	// 
	function sendReq(tab) {
		browser.sidebarAction.open();
	}

})();
