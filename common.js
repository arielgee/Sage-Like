"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class StoredKeyedItems {

	//////////////////////////////////////////
	constructor() {
		if (new.target === "StoredKeyedItems") {
			throw new Error("Don't do that");
		}
		this.clear();
	}

	//////////////////////////////////////////
	getStorage() {
		throw new Error("Don't do that");
	}

	//////////////////////////////////////////
	setStorage() {
		throw new Error("Don't do that");
	}

	//////////////////////////////////////////
	set(key, value = undefined) {
		this._items[key] = ( (value === undefined) || (value === null) ) ? "x" : value;
		this.setStorage();
	}

	//////////////////////////////////////////
	remove(key) {
		delete this._items[key];
		this.setStorage();
	}

	//////////////////////////////////////////
	get length() {
		return Object.keys(this._items).length;
	}

	//////////////////////////////////////////
	exist(key) {
		return this._items.hasOwnProperty(key);
	}

	//////////////////////////////////////////
	value(key) {
		return this._items.hasOwnProperty(key) ? this._items[key] : undefined;
	}

	//////////////////////////////////////////
	clear() {
		this._items = {}; //Object.create(null);
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////
class TreeFeedsData extends StoredKeyedItems {

	//////////////////////////////////////////
	constructor() {
		super();
	}

	//////////////////////////////////////////
	getStorage() {
		return new Promise((resolve) => {
			internalPrefs.getTreeFeedsData().then((items) => {
				this._items = items;
				resolve(this.length);
			});
		});
	}

	//////////////////////////////////////////
	setStorage() {
		internalPrefs.setTreeFeedsData(this._items);
	}

	//////////////////////////////////////////
	set(key, properties) {
		let defProp = { lastChecked: Date.now(), lastVisited: 0, updateTitle: true };
		let valProp = Object.assign(defProp, this.value(key));
		let newProp = Object.assign(valProp, properties);
		super.set(key, {
			lastChecked: valProp.lastChecked,		// the lastChecked propertey is protected and cannot be modified by set()
			lastVisited: newProp.lastVisited,
			updateTitle: newProp.updateTitle,
		});
	}

	//////////////////////////////////////////
	setIfNotExist(key) {
		if(!super.exist(key)) {
			this.set(key);
		}
	}

	//////////////////////////////////////////
	setLastChecked(key) {
		if(super.exist(key)) {
			this._items[key].lastChecked = Date.now();
		}
	}

	//////////////////////////////////////////
	purge() {
		// test case: Moved/Reused bookmark id value; bookmark moved or deleted and a new one created with same id value.

		return new Promise((resolve) => {

			let collecting = slUtil.bookmarksFeedsAsCollection(false);
			let getting = this.getStorage();

			collecting.then((bmFeeds) => {
				getting.then((length) => {

					//console.log("[Sage-Like]", "purging");
					for(let key in this._items) {

						// remove from object if its not in the feeds collection and is older then 24 hours
						if( (bmFeeds[key] === undefined) && (this._items[key].lastChecked < (Date.now() - 86400000)  ) ) {
							//console.log("[Sage-Like]", "purged", key, this._items[key]);
							super.remove(key);
						}
					}
					resolve();
				}).catch(() => {});
			}).catch(() => {});
		});
	}
};

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
	const MSGD_PREF_CHANGE_ALL = "msgDetails_prefChange_all";
	const MSGD_PREF_CHANGE_ROOT_FOLDER = "msgDetails_prefChange_rootFolder";
	const MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL = "msgDetails_prefChange_checkFeedsInterval";
	const MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD = "msgDetails_prefChange_checkFeedsMethod";
	const MSGD_PREF_CHANGE_UI_DENSITY = "msgDetails_prefChange_UIDensity";
	const MSGD_PREF_CHANGE_COLORS = "msgDetails_prefChange_colors";
	const MSGD_PREF_CHANGE_IMAGES = "msgDetails_prefChange_images";


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
		MSGD_PREF_CHANGE_ALL: MSGD_PREF_CHANGE_ALL,
		MSGD_PREF_CHANGE_ROOT_FOLDER: MSGD_PREF_CHANGE_ROOT_FOLDER,
		MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL: MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL,
		MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD: MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD,
		MSGD_PREF_CHANGE_UI_DENSITY: MSGD_PREF_CHANGE_UI_DENSITY,
		MSGD_PREF_CHANGE_COLORS: MSGD_PREF_CHANGE_COLORS,
		MSGD_PREF_CHANGE_IMAGES: MSGD_PREF_CHANGE_IMAGES,

		IMAGE_SET_VALUES: IMAGE_SET_VALUES,
		IMAGE_SET: IMAGE_SET,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let internalPrefs = (function() {

	// internal preferences

	const DEF_PREF_OPEN_SUB_TREES = {};
	const DEF_PREF_TREE_FEEDS_DATA = {};

	const PREF_OPEN_SUB_TREES = "pref_openSubTrees";
	const PREF_TREE_FEEDS_DATA = "pref_treeFeedsData";

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
	function getTreeFeedsData() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_TREE_FEEDS_DATA).then((result) => {
				resolve(result[PREF_TREE_FEEDS_DATA] === undefined ? DEF_PREF_TREE_FEEDS_DATA : result[PREF_TREE_FEEDS_DATA]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setTreeFeedsData(objValue) {

		let obj = {};
		obj[PREF_TREE_FEEDS_DATA] = objValue;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setOpenSubTrees(DEF_PREF_OPEN_SUB_TREES);
		this.setTreeFeedsData(DEF_PREF_TREE_FEEDS_DATA);

		return {
			openSubTrees: DEF_PREF_OPEN_SUB_TREES,
			treeFeedsData: DEF_PREF_TREE_FEEDS_DATA,
		};
	}

	return {
		getOpenSubTrees: getOpenSubTrees,
		setOpenSubTrees: setOpenSubTrees,
		getTreeFeedsData: getTreeFeedsData,
		setTreeFeedsData: setTreeFeedsData,

		restoreDefaults: restoreDefaults,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let prefs = (function() {

	// user preferences

	const DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE = slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET;
	const DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE = "3600000";
	const DEF_PREF_CHECK_FEEDS_METHOD_VALUE = "3;2000";
	const DEF_PREF_FETCH_TIMEOUT_VALUE = "60";
	const DEF_PREF_UI_DENSITY_VALUE = "19;18";
	const DEF_PREF_COLOR_BACKGROUND_VALUE = "#FFFFFF";
	const DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE = "#EEEEEE";
	const DEF_PREF_COLOR_SELECT_VALUE = "#F3C8BA";
	const DEF_PREF_COLOR_TEXT_VALUE = "#000000";
	const DEF_PREF_IMAGE_SET_VALUE = 0;

	const PREF_ROOT_FEEDS_FOLDER_ID = "pref_rootFeedsFolderId";
	const PREF_CHECK_FEEDS_INTERVAL = "pref_checkFeedsInterval";
	const PREF_CHECK_FEEDS_METHOD = "pref_checkFeedsMethod";
	const PREF_FETCH_TIMEOUT = "pref_fetchTimeout";
	const PREF_UI_DENSITY = "pref_UIDensity";
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
	function getCheckFeedsInterval() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_CHECK_FEEDS_INTERVAL).then((result) => {
				resolve(result[PREF_CHECK_FEEDS_INTERVAL] === undefined ? DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE : result[PREF_CHECK_FEEDS_INTERVAL]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setCheckFeedsInterval(value) {

		let obj = {};
		obj[PREF_CHECK_FEEDS_INTERVAL] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getCheckFeedsMethod() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_CHECK_FEEDS_METHOD).then((result) => {
				resolve(result[PREF_CHECK_FEEDS_METHOD] === undefined ? DEF_PREF_CHECK_FEEDS_METHOD_VALUE : result[PREF_CHECK_FEEDS_METHOD]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setCheckFeedsMethod(value) {

		let obj = {};
		obj[PREF_CHECK_FEEDS_METHOD] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getFetchTimeout() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_FETCH_TIMEOUT).then((result) => {
				resolve(result[PREF_FETCH_TIMEOUT] === undefined ? DEF_PREF_FETCH_TIMEOUT_VALUE : result[PREF_FETCH_TIMEOUT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setFetchTimeout(value) {

		let obj = {};
		obj[PREF_FETCH_TIMEOUT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getUIDensity() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_UI_DENSITY).then((result) => {
				resolve(result[PREF_UI_DENSITY] === undefined ? DEF_PREF_UI_DENSITY_VALUE : result[PREF_UI_DENSITY]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setUIDensity(value) {

		let obj = {};
		obj[PREF_UI_DENSITY] = value;
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
		this.setCheckFeedsInterval(DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE);
		this.setCheckFeedsMethod(DEF_PREF_CHECK_FEEDS_METHOD_VALUE);
		this.setFetchTimeout(DEF_PREF_FETCH_TIMEOUT_VALUE);
		this.setUIDensity(DEF_PREF_UI_DENSITY_VALUE);
		this.setColorBackground(DEF_PREF_COLOR_BACKGROUND_VALUE);
		this.setColorDialogBackground(DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE);
		this.setColorSelect(DEF_PREF_COLOR_SELECT_VALUE);
		this.setColorText(DEF_PREF_COLOR_TEXT_VALUE);
		this.setImageSet(DEF_PREF_IMAGE_SET_VALUE);

		return {
			rootFeedsFolderId: DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE,
			checkFeedsInterval: DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE,
			checkFeedsMethod: DEF_PREF_CHECK_FEEDS_METHOD_VALUE,
			fetchTimeout: DEF_PREF_FETCH_TIMEOUT_VALUE,
			UIDensity: DEF_PREF_UI_DENSITY_VALUE,
			colorBackground: DEF_PREF_COLOR_BACKGROUND_VALUE,
			colorDialogBackground: DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE,
			colorSelect: DEF_PREF_COLOR_SELECT_VALUE,
			colorText: DEF_PREF_COLOR_TEXT_VALUE,
			imageSet: DEF_PREF_IMAGE_SET_VALUE,
		};
	}

	return {
		DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE: DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE,
		DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE: DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE,
		DEF_PREF_CHECK_FEEDS_METHOD_VALUE: DEF_PREF_CHECK_FEEDS_METHOD_VALUE,
		DEF_PREF_FETCH_TIMEOUT_VALUE: DEF_PREF_FETCH_TIMEOUT_VALUE,
		DEF_PREF_UI_DENSITY_VALUE: DEF_PREF_UI_DENSITY_VALUE,
		DEF_PREF_COLOR_BACKGROUND_VALUE: DEF_PREF_COLOR_BACKGROUND_VALUE,
		DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE: DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE,
		DEF_PREF_COLOR_SELECT_VALUE: DEF_PREF_COLOR_SELECT_VALUE,
		DEF_PREF_COLOR_TEXT_VALUE: DEF_PREF_COLOR_TEXT_VALUE,
		DEF_PREF_IMAGE_SET_VALUE: DEF_PREF_IMAGE_SET_VALUE,

		getRootFeedsFolderId: getRootFeedsFolderId,
		setRootFeedsFolderId: setRootFeedsFolderId,
		getCheckFeedsInterval: getCheckFeedsInterval,
		setCheckFeedsInterval: setCheckFeedsInterval,
		getCheckFeedsMethod: getCheckFeedsMethod,
		setCheckFeedsMethod: setCheckFeedsMethod,
		getFetchTimeout: getFetchTimeout,
		setFetchTimeout: setFetchTimeout,
		getUIDensity: getUIDensity,
		setUIDensity: setUIDensity,
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
	let m_mozExtensionOrigin = "";

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

	////////////////////////////////////////////////////////////////////////////////////
	String.prototype.replaceEntityDefinitions = function() {

		let str = this;

		return str.replace(String.prototype.replaceEntityDefinitions.regex, (matched) => {
			return String.prototype.replaceEntityDefinitions.entities[matched];
		} );

	};
	String.prototype.replaceEntityDefinitions.entities = {
		"&quot;": "\"",
		"&amp;": "&",
		"&gt;": ">",
		"&lt;": "<",
		"&copy;": "©",
		"&trade;": "™",
		"&reg;": "®",
	};
	String.prototype.replaceEntityDefinitions.regex = new RegExp(Object.keys(String.prototype.replaceEntityDefinitions.entities).join("|"), "gi");

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
			if(elm.getAttribute("tabindex") === "0") {
				elm.setAttribute("tabindex", "-1");
			}
			elm.setAttribute("disabled", "");
			elm.classList.add("disabled");
		} else {
			if(elm.getAttribute("tabindex") === "-1") {
				elm.setAttribute("tabindex", "0");
			}
			elm.removeAttribute("disabled");
			elm.classList.remove("disabled");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function copyTextToClipboard(doc, text) {
		let restoreFocus = doc.activeElement;
		let input = doc.createElement("textarea");
		let style = input.style;
		style.height = style.width = style.borderWidth = style.padding = style.margin = 0;
		input.value = text;
		document.body.appendChild(input);
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
		restoreFocus.focus();
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
	function hasVScroll(elm) {
		return (elm.clientHeight < elm.scrollHeight);
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
	function asSafeNumericDate(dateValue) {

		// dateValue could be text
		let safeDate = new Date(dateValue);

		// another try
		if(isNaN(safeDate)) {

			let now = new Date();
			let modDateValue = dateValue.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}:\d{1,2}:\d{1,2})$/, "$3-$2-$1T$4");	// assume dd/mm/yyyy hh:MM:ss

			// if modification was successfull => yyyy-mm-ddThh:MM:ss
			if(modDateValue.search(/^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}:\d{1,2}$/) > -1) {
				safeDate = new Date((new Date(modDateValue)).getTime() + now.getTimezoneOffset() * 60 * 1000);
				safeDate.setHours(safeDate.getHours() - (now.getTimezoneOffset() / 60));
			}
		}

		// make sure date is valid and save as simple numeric
		return (!isNaN(safeDate) && (safeDate instanceof Date)) ? safeDate.getTime() : getCurrentLocaleDate();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sleep(timeout) {
		return new Promise((resolve) => {
			setTimeout(() => resolve(), timeout);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function formatTimeWithAbbreviations(value) {

		let parts = value.split(":");

		let abbr = Number(parts[0]) < 12 ? "AM" : "PM";
		parts[0] = Number(parts[0]) % 12 || 12;

		// do not use join to avoid seconds
		return parts[0] + ":" + parts[1] + " " + abbr;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function calcMillisecondTillNextTime(timeValue) {

		let parts = timeValue.split(":");
		let now = new Date();
		let theDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1], 0, 0);

		let diff = theDate.getTime() - now.getTime();

		if(diff < 0) {
			// date in the past
			theDate.setDate(theDate.getDate() + 1);
			diff = theDate.getTime() - now.getTime();
		}
		return diff;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isElementInViewport(elm, viewElement) {
		let rect = elm.getBoundingClientRect();
		let viewRect = viewElement.getBoundingClientRect();

		//console.dir(rect);
		//console.dir(viewRect);

		let inViewport = (rect.top >= viewRect.top &&
			rect.left >= viewRect.left &&
			rect.bottom <= (viewRect.height + viewRect.top) &&
			rect.right <= (viewRect.width + viewRect.left))

		let fromTop = rect.top < viewRect.top;
		let fromBottom = rect.bottom > (viewRect.height + viewRect.top);

		return {
			inViewport: inViewport,
			fromTop: fromTop,
			fromBottom: fromBottom,
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function scrollIntoViewIfNeeded(elm, docElement) {
		let result = isElementInViewport(elm, docElement);

		//console.log("[sage-like]", result);

		if(!result.inViewport) {
			elm.scrollIntoView(result.fromTop);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function numberOfVItemsInViewport(elm, elmViewport) {

		let rectElm = elm.getBoundingClientRect();
		let rectView = elmViewport.getBoundingClientRect();

		return parseInt(rectView.height / rectElm.height);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function bookmarksFeedsAsCollection(asArray) {

		return new Promise((resolve, reject) => {

			let bmFeeds = asArray ? [] : {};
			let collectFeeds = function (bmFeeds, bookmark) {
				if (bookmark.type === "folder") {
					for (let child of bookmark.children) {
						collectFeeds(bmFeeds, child);
					}
				} else if (bookmark.type === "bookmark") {
					if(asArray) {
						bmFeeds.push({ id: bookmark.id, url: bookmark.url });
					} else {
						bmFeeds[bookmark.id] = { id: bookmark.id, url: bookmark.url };
					}
				}
			};

			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					reject("Root feeds folder id not set");
				}

				browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
					collectFeeds(bmFeeds, bookmarks[0]);
					resolve(bmFeeds);
				}).catch((error) => reject(error));
			}).catch((error) => reject(error));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isDescendantOfRoot(bookmarkIds) {

		return new Promise((resolve, reject) => {

			let isDescendant = false;
			let isChildDescendant = function (bookmark) {
				if(bookmarkIds.indexOf(bookmark.id) > -1)  {
					isDescendant = true;
					return;
				} else {
					if (bookmark.type === "folder") {
						for (let child of bookmark.children) {
							isChildDescendant(child);
						}
					}
				}
			};

			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					reject("Root feeds folder id not set");
				}

				browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
					isChildDescendant(bookmarks[0]);
					resolve(isDescendant);
				}).catch((error) => reject(error));
			}).catch((error) => reject(error));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function reloadSageLikeWebExtensionAndTab() {
		setTimeout(() => {
			browser.tabs.reload({ bypassCache: true });
			browser.runtime.reload();
		}, 10);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function replaceMozExtensionOriginURL(url, base) {

		if(m_mozExtensionOrigin === "") {
			m_mozExtensionOrigin = browser.extension.getURL("");
		}

		if(url.startsWith(m_mozExtensionOrigin)) {
			return new URL(url.replace(m_mozExtensionOrigin, ""), base);
		}
		return new URL(url);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function invertColor(color) {

		let c = color.replace(/^#/, "");

		// convert to integer and invert bytes
		c = 0xFFFFFF ^ parseInt(c, 16);

		return "#" + (("000000" + c.toString(16)).slice(-6));
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
		hasVScroll: hasVScroll,
		getCurrentLocaleDate: getCurrentLocaleDate,
		isContentOverflowing: isContentOverflowing,
		hashCode: hashCode,
		asSafeNumericDate: asSafeNumericDate,
		sleep: sleep,
		formatTimeWithAbbreviations: formatTimeWithAbbreviations,
		calcMillisecondTillNextTime: calcMillisecondTillNextTime,
		isElementInViewport: isElementInViewport,
		scrollIntoViewIfNeeded: scrollIntoViewIfNeeded,
		numberOfVItemsInViewport: numberOfVItemsInViewport,
		bookmarksFeedsAsCollection: bookmarksFeedsAsCollection,
		isDescendantOfRoot: isDescendantOfRoot,
		reloadSageLikeWebExtensionAndTab: reloadSageLikeWebExtensionAndTab,
		replaceMozExtensionOriginURL: replaceMozExtensionOriginURL,
		invertColor: invertColor,
	};

})();
