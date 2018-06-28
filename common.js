"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
let slGlobals = (function() {

	const ID_UL_RSS_TREE_VIEW = "rssTreeView";
	const ID_UL_RSS_LIST_VIEW = "rssListView";

	// RSS Tree View classes
	const CLS_RTV_LI_SUB_TREE = "rtvSubTree";
	const CLS_RTV_LI_TREE_ITEM = "rtvTreeItem";
	const CLS_RTV_DIV_TREE_ITEM_CAPTION = "rtvCaption";

	// RSS List View classes
	const CLS_RLV_LI_LIST_ITEM = "rlvListItem";

	const ROOT_FEEDS_FOLDER_ID_NOT_SET = "_rootFeedsFolderIdNotSet_";

	const MSG_ID_PREFERENCES_CHANGED = "msgId_preferencesChanged";
	const MSG_DETAILS_PREF_CHANGE_ALL = "msgDetails_prefChange_all";
	const MSG_DETAILS_PREF_CHANGE_ROOT_FOLDER = "msgDetails_prefChange_rootFolder";
	const MSG_DETAILS_PREF_CHANGE_COLORS = "msgDetails_prefChange_colors";
	const MSG_DETAILS_PREF_CHANGE_IMAGES = "msgDetails_prefChange_images";

	const FMT_IMAGE_SET = {
		IMG_OPEN_SUB_TREE:		"url(\"/icons/open-{0}.png\")",
		IMG_CLOSED_SUB_TREE:	"url(\"/icons/closed-{0}.png\")",
		IMG_TREE_ITEM:			"url(\"/icons/rss-{0}.png\")",
		IMG_TREE_ITEM_LOADING:	"url(\"/icons/loading-{0}.gif\")",
		IMG_TREE_ITEM_ERROR:	"url(\"/icons/error-{0}.png\")",
	};

	const IMAGE_SET_VALUES = [0, 1, 2, 3, 4, 5, 6];

	const IMAGE_SET = function(setNumber) {

		setNumber = Number(setNumber);

		if(IMAGE_SET_VALUES.indexOf(setNumber) === -1) {
			throw new Error("Invalid image set number: " + setNumber);
		}

		return {
			IMG_OPEN_SUB_TREE:		FMT_IMAGE_SET.IMG_OPEN_SUB_TREE.format([setNumber]),
			IMG_CLOSED_SUB_TREE:	FMT_IMAGE_SET.IMG_CLOSED_SUB_TREE.format([setNumber]),
			IMG_TREE_ITEM:			FMT_IMAGE_SET.IMG_TREE_ITEM.format([setNumber]),
			IMG_TREE_ITEM_LOADING:	FMT_IMAGE_SET.IMG_TREE_ITEM_LOADING.format([setNumber]),
			IMG_TREE_ITEM_ERROR:	FMT_IMAGE_SET.IMG_TREE_ITEM_ERROR.format([setNumber]),
		};
	};

	return {
		ID_UL_RSS_TREE_VIEW: ID_UL_RSS_TREE_VIEW,
		ID_UL_RSS_LIST_VIEW: ID_UL_RSS_LIST_VIEW,

		CLS_RTV_LI_SUB_TREE: CLS_RTV_LI_SUB_TREE,
		CLS_RTV_LI_TREE_ITEM: CLS_RTV_LI_TREE_ITEM,
		CLS_RTV_DIV_TREE_ITEM_CAPTION: CLS_RTV_DIV_TREE_ITEM_CAPTION,

		CLS_RLV_LI_LIST_ITEM: CLS_RLV_LI_LIST_ITEM,

		ROOT_FEEDS_FOLDER_ID_NOT_SET: ROOT_FEEDS_FOLDER_ID_NOT_SET,

		MSG_ID_PREFERENCES_CHANGED: MSG_ID_PREFERENCES_CHANGED,
		MSG_DETAILS_PREF_CHANGE_ALL: MSG_DETAILS_PREF_CHANGE_ALL,
		MSG_DETAILS_PREF_CHANGE_ROOT_FOLDER: MSG_DETAILS_PREF_CHANGE_ROOT_FOLDER,
		MSG_DETAILS_PREF_CHANGE_COLORS: MSG_DETAILS_PREF_CHANGE_COLORS,

		IMAGE_SET_VALUES: IMAGE_SET_VALUES,
		IMAGE_SET: IMAGE_SET,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let internalPrefs = (function() {

	// internal preferences

	const DEF_PREF_OPEN_SUB_TREES = {};
	const DEF_PREF_LAST_VISITED_FEEDS = {};

	const PREF_OPEN_SUB_TREES = "pref_openSubTrees";
	const PREF_LAST_VISITED_FEEDS = "pref_lastVisitedFeeds";

	//////////////////////////////////////////////////////////////////////
	function getOpenSubTrees() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_OPEN_SUB_TREES).then((result) => {
				resolve(result[PREF_OPEN_SUB_TREES] === undefined ? DEF_PREF_OPEN_SUB_TREES : result[PREF_OPEN_SUB_TREES]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setOpenSubTrees(objValue) {

		let obj = {};
		obj[PREF_OPEN_SUB_TREES] = objValue;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getLastVisitedFeeds() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_LAST_VISITED_FEEDS).then((result) => {
				resolve(result[PREF_LAST_VISITED_FEEDS] === undefined ? DEF_PREF_LAST_VISITED_FEEDS : result[PREF_LAST_VISITED_FEEDS]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setLastVisitedFeeds(objValue) {

		let obj = {};
		obj[PREF_LAST_VISITED_FEEDS] = objValue;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setOpenSubTrees(DEF_PREF_OPEN_SUB_TREES);
		this.setLastVisitedFeeds(DEF_PREF_LAST_VISITED_FEEDS);

		return {
			openSubTrees: DEF_PREF_OPEN_SUB_TREES,
			lastVisitedFeeds: DEF_PREF_LAST_VISITED_FEEDS,
		};
	}

	return {
		getOpenSubTrees: getOpenSubTrees,
		setOpenSubTrees: setOpenSubTrees,
		getLastVisitedFeeds: getLastVisitedFeeds,
		setLastVisitedFeeds: setLastVisitedFeeds,

		restoreDefaults: restoreDefaults,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let prefs = (function() {

	// user preferences

	const DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE = slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET;
	const DEF_PREF_COLOR_BACKGROUND_VALUE = "#FFFFFF";
	const DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE = "#EEEEEE";
	const DEF_PREF_COLOR_SELECT_VALUE = "#F3C8BA";
	const DEF_PREF_COLOR_TEXT_VALUE = "#000000";
	const DEF_PREF_IMAGE_SET_VALUE = 0;

	const PREF_ROOT_FEEDS_FOLDER_ID = "pref_rootFeedsFolderId";
	const PREF_COLOR_BACKGROUND_VALUE = "pref_colorBk";
	const PREF_COLOR_DIALOG_BACKGROUND_VALUE = "pref_colorDlgBk";
	const PREF_COLOR_SELECT_VALUE = "pref_colorSelect";
	const PREF_COLOR_TEXT_VALUE = "pref_colorText";
	const PREF_IMAGE_SET_VALUE = "pref_imageSet";

	//////////////////////////////////////////////////////////////////////
	function getRootFeedsFolderId() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_ROOT_FEEDS_FOLDER_ID).then((result) => {
				resolve(result[PREF_ROOT_FEEDS_FOLDER_ID] === undefined ? DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE : result[PREF_ROOT_FEEDS_FOLDER_ID]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setRootFeedsFolderId(value) {

		let obj = {};
		obj[PREF_ROOT_FEEDS_FOLDER_ID] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorBackground() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_BACKGROUND_VALUE).then((result) => {
				resolve(result[PREF_COLOR_BACKGROUND_VALUE] === undefined ? DEF_PREF_COLOR_BACKGROUND_VALUE : result[PREF_COLOR_BACKGROUND_VALUE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorBackground(value) {

		let obj = {};
		obj[PREF_COLOR_BACKGROUND_VALUE] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorDialogBackground() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_DIALOG_BACKGROUND_VALUE).then((result) => {
				resolve(result[PREF_COLOR_DIALOG_BACKGROUND_VALUE] === undefined ? DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE : result[PREF_COLOR_DIALOG_BACKGROUND_VALUE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorDialogBackground(value) {

		let obj = {};
		obj[PREF_COLOR_DIALOG_BACKGROUND_VALUE] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorSelect() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_SELECT_VALUE).then((result) => {
				resolve(result[PREF_COLOR_SELECT_VALUE] === undefined ? DEF_PREF_COLOR_SELECT_VALUE : result[PREF_COLOR_SELECT_VALUE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorSelect(value) {

		let obj = {};
		obj[PREF_COLOR_SELECT_VALUE] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorText() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_TEXT_VALUE).then((result) => {
				resolve(result[PREF_COLOR_TEXT_VALUE] === undefined ? DEF_PREF_COLOR_TEXT_VALUE : result[PREF_COLOR_TEXT_VALUE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorText(value) {

		let obj = {};
		obj[PREF_COLOR_TEXT_VALUE] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getImageSet() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_IMAGE_SET_VALUE).then((result) => {
				resolve(result[PREF_IMAGE_SET_VALUE] === undefined ? DEF_PREF_IMAGE_SET_VALUE : result[PREF_IMAGE_SET_VALUE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setImageSet(value) {

		let obj = {};
		obj[PREF_IMAGE_SET_VALUE] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setRootFeedsFolderId(DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE);
		this.setColorBackground(DEF_PREF_COLOR_BACKGROUND_VALUE);
		this.setColorDialogBackground(DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE);
		this.setColorSelect(DEF_PREF_COLOR_SELECT_VALUE);
		this.setColorText(DEF_PREF_COLOR_TEXT_VALUE);
		this.setImageSet(DEF_PREF_IMAGE_SET_VALUE);

		return {
			rootFeedsFolderId: DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE,
			colorBackground: DEF_PREF_COLOR_BACKGROUND_VALUE,
			colorDialogBackground: DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE,
			colorSelect: DEF_PREF_COLOR_SELECT_VALUE,
			colorText: DEF_PREF_COLOR_TEXT_VALUE,
			imageSet: DEF_PREF_IMAGE_SET_VALUE,
		};
	}

	return {
		getRootFeedsFolderId: getRootFeedsFolderId,
		setRootFeedsFolderId: setRootFeedsFolderId,
		getColorBackground: getColorBackground,
		setColorBackground: setColorBackground,
		getColorDialogBackground: getColorDialogBackground,
		setColorDialogBackground: setColorDialogBackground,
		getColorSelect: getColorSelect,
		setColorSelect: setColorSelect,
		getColorText: getColorText,
		setColorText: setColorText,
		getImageSet: getImageSet,
		setImageSet: setImageSet,

		restoreDefaults: restoreDefaults,
	}

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let slUtil = (function() {

	let m_savedScrollbarWidth = -1;

	//////////////////////////////////////////////////////////////////////
	String.prototype.format = function(args) {
		let str = this;
		return str.replace(String.prototype.format.regex, (item) => {
			let intVal = parseInt(item.substring(1, item.length - 1));
			let replace;
			if (intVal >= 0) {
				replace = args[intVal];
			} else if (intVal === -1) {
				replace = "{";
			} else if (intVal === -2) {
				replace = "}";
			} else {
				replace = "";
			}
			return replace;
		});
	};
	String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

	//////////////////////////////////////////////////////////////////////
	String.prototype.trunc = function(n) {
		return (this.length > n) ? this.substr(0, n - 1) + "&hellip;" : this;
	};

	//////////////////////////////////////////////////////////////////////
	String.prototype.midTrunc = function(n) {
		return (this.length > n) ? this.substr(0, n/2) + "\u2026" + this.substr(-((n-1)/2)) : this;
	};

	//////////////////////////////////////////////////////////////////////
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	//////////////////////////////////////////////////////////////////////
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

	//////////////////////////////////////////////////////////////////////
	function disableElementTree(elm, value) {

		if (elm.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		for (let i in elm.children) {
			disableElementTree(elm.children[i], value);
		}

		if (elm.disabled !== undefined) {
			elm.disabled = value;
		}

		if (value === true) {
			elm.classList.add("disabled");
		} else {
			elm.classList.remove("disabled");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function copyTextToClipboard(doc, text) {
		let input = doc.createElement("textarea");
		let style = input.style;
		style.height = style.width = style.borderWidth = style.padding = style.margin = 0;
		input.value = text;
		document.body.appendChild(input);
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addUrlToBrowserHistory(url, title) {

		let details = {
			url: url,
			title: "[sage-like] " + title.replace(/^[0-9]+\. /, ""),
		};

		return browser.history.addUrl(details);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function deleteUrlFromBrowserHistory(url) {

		return browser.history.deleteUrl( { url: url });
	}

	//////////////////////////////////////////////////////////////////////
	function getScrollbarWidth(doc) {

		if(m_savedScrollbarWidth === -1) {

			let inner = doc.createElement("p");
			inner.style.width = "100%";
			inner.style.height = "200px";

			let outer = doc.createElement("div");
			outer.style.position = "absolute";
			outer.style.top = "0px";
			outer.style.left = "0px";
			outer.style.visibility = "hidden";
			outer.style.width = "200px";
			outer.style.height = "150px";
			outer.style.overflow = "hidden";
			outer.appendChild(inner);

			doc.body.appendChild(outer);
			let w1 = inner.offsetWidth;
			outer.style.overflow = "scroll";
			let w2 = inner.offsetWidth;
			if (w1 == w2) w2 = outer.clientWidth;

			doc.body.removeChild(outer);

			m_savedScrollbarWidth = (w1 - w2);
		}
		return m_savedScrollbarWidth;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hasHScroll(elm) {
		return (elm.clientWidth < elm.scrollWidth);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getCurrentLocaleDate() {

		let now = new Date();
		let newDate = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);

		newDate.setHours(now.getHours() - (now.getTimezoneOffset() / 60));

		return newDate;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isContentOverflowing(elm) {
		return ((elm.offsetWidth - 1) < elm.scrollWidth);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hashCode(str) {

		return new Promise((resolve) => {

			let buffer = new TextEncoder("utf-8").encode(str);

			crypto.subtle.digest("SHA-256", buffer).then((buffer) => {

				let padding = "00000000";
				let value, stringValue, paddedValue;
				let hexCodes = [];
				let view = new DataView(buffer);

				for (let i=0; i<view.byteLength; i+=4) {

					value = view.getUint32(i);		// getUint32 reduces number of iterations needed; process 4 bytes each time
					stringValue = value.toString(16);	// toString(16) returns the hex representation of the number without padding

					paddedValue = (padding + stringValue).slice(-padding.length);
					hexCodes.push(paddedValue);
				}

				// Join all the hex strings into one
				resolve(hexCodes.join(""));
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sleep(timeout) {

		return new Promise((resolve) => {
			setTimeout(() => {
				console.log("[Sage-Like-sleep]", timeout);
				resolve();
			}, timeout);
		});
	}

	return {
		escapeRegExp: escapeRegExp,
		random1to100: random1to100,
		disableElementTree: disableElementTree,
		copyTextToClipboard: copyTextToClipboard,
		addUrlToBrowserHistory: addUrlToBrowserHistory,
		deleteUrlFromBrowserHistory: deleteUrlFromBrowserHistory,
		getScrollbarWidth: getScrollbarWidth,
		hasHScroll: hasHScroll,
		getCurrentLocaleDate: getCurrentLocaleDate,
		isContentOverflowing: isContentOverflowing,
		hashCode: hashCode,
		sleep: sleep,
	};

})();

