"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
///
let sageLikeGlobalConsts = (function() {

	const CLS_DIV_TOOLBAR = "toolbar";
	const CLS_DIV_SPLITTER = "splitter";

	const CLS_LI_SUB_TREE = "subtree";
	const CLS_LI_RSS_TREE_FEED = "rsstreefeed";
	const CLS_LI_RSS_LIST_FEED_ITEM = "rsslistfeeditem";

	const CLS_DIV_RSS_TREE_FEED_CAPTION = "caption";

	const IMG_CLOSED_SUB_TREE = "/icons/closed.png";
	const IMG_OPEN_SUB_TREE = "/icons/open.png";

	const ROOT_FEEDS_FOLDER_ID_NOT_SET = "_rootFeedsFolderIdNotSet_";

	return {
		CLS_DIV_TOOLBAR: CLS_DIV_TOOLBAR,
		CLS_DIV_SPLITTER: CLS_DIV_SPLITTER,
		CLS_LI_SUB_TREE: CLS_LI_SUB_TREE,
		CLS_LI_RSS_TREE_FEED: CLS_LI_RSS_TREE_FEED,
		CLS_LI_RSS_LIST_FEED_ITEM: CLS_LI_RSS_LIST_FEED_ITEM,
		CLS_DIV_RSS_TREE_FEED_CAPTION: CLS_DIV_RSS_TREE_FEED_CAPTION,
		IMG_CLOSED_SUB_TREE: IMG_CLOSED_SUB_TREE,
		IMG_OPEN_SUB_TREE: IMG_OPEN_SUB_TREE,

		ROOT_FEEDS_FOLDER_ID_NOT_SET: ROOT_FEEDS_FOLDER_ID_NOT_SET,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let prefs = (function() {

	const DEF_PREF_OPEN_SUB_TREES = {};
	const DEF_PREF_LAST_VISITED_FEEDS = {};
	const DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE = sageLikeGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET;

	const PREF_OPEN_SUB_TREES = "pref_openSubTrees";
	const PREF_LAST_VISITED_FEEDS = "pref_lastVisitedFeeds";
	const PREF_ROOT_FEEDS_FOLDER_ID = "pref_rootFeedsFolderId";

	//////////////////////////////////////////////////////////////////////
	let getOpenSubTrees = function() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_OPEN_SUB_TREES).then((result) => {
                resolve(result[PREF_OPEN_SUB_TREES] === undefined ? DEF_PREF_OPEN_SUB_TREES : result[PREF_OPEN_SUB_TREES]);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setOpenSubTrees = function(objValue) {

		let obj = {};
		obj[PREF_OPEN_SUB_TREES] = objValue;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getLastVisitedFeeds = function() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_LAST_VISITED_FEEDS).then((result) => {
                resolve(result[PREF_LAST_VISITED_FEEDS] === undefined ? DEF_PREF_LAST_VISITED_FEEDS : result[PREF_LAST_VISITED_FEEDS]);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setLastVisitedFeeds = function(objValue) {

		let obj = {};
		obj[PREF_LAST_VISITED_FEEDS] = objValue;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getRootFeedsFolderId = function() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_ROOT_FEEDS_FOLDER_ID).then((result) => {
                resolve(result[PREF_ROOT_FEEDS_FOLDER_ID] === undefined ? DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE : result[PREF_ROOT_FEEDS_FOLDER_ID]);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setRootFeedsFolderId = function(value) {

		let obj = {};
		obj[PREF_ROOT_FEEDS_FOLDER_ID] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let restoreDefaults = function() {
		this.setOpenSubTrees(DEF_PREF_OPEN_SUB_TREES);
		this.setLastVisitedFeeds(DEF_PREF_LAST_VISITED_FEEDS);
		this.setRootFeedsFolderId(DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE);

		return {
			openSubTrees: DEF_PREF_OPEN_SUB_TREES,
			lastUpdatedFeeds: DEF_PREF_LAST_VISITED_FEEDS,
			rootFeedsFolderId: DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE,
		};
	};

	return {
		getOpenSubTrees: getOpenSubTrees,
		setOpenSubTrees: setOpenSubTrees,
		getLastVisitedFeeds: getLastVisitedFeeds,
		setLastVisitedFeeds: setLastVisitedFeeds,
		getRootFeedsFolderId: getRootFeedsFolderId,
		setRootFeedsFolderId: setRootFeedsFolderId,

		restoreDefaults: restoreDefaults,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let slUtil = (function() {

	let local_savedScrollbarWidth = -1;


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
	let escapeRegExp = function(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	};

	//////////////////////////////////////////////////////////////////////
	let random1to100 = function() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	};

	//////////////////////////////////////////////////////////////////////
	let disableElementTree = function(elm, value) {

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
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let copyTextToClipboard = function(doc, text) {
		let input = doc.createElement("textarea");
		let style = input.style;
		style.height = style.width = style.borderWidth = style.padding = style.margin = 0;
		input.value = text;
		document.body.appendChild(input);
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let addUrlToBrowserHistory = function(url, title) {

		let details = {
			url: url,
			title: "[sage-like] " + title,
		};

		browser.history.addUrl(details);
	};

	//////////////////////////////////////////////////////////////////////
	//
	let getScrollbarWidth = function(doc) {

		if(local_savedScrollbarWidth === -1) {

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

			local_savedScrollbarWidth = (w1 - w2);
		}
		return local_savedScrollbarWidth;
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let hasHScroll = function(elm) {
		return (elm.clientWidth < elm.scrollWidth);
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let getCurrentLocaleDate = function() {

		let now = new Date();
		let newDate = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);

		newDate.setHours(now.getHours() - (now.getTimezoneOffset() / 60));

		return newDate;
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let isContentOverflowing = function(elm) {
		return (elm.offsetWidth < elm.scrollWidth);
	};

	return {
		escapeRegExp: escapeRegExp,
		random1to100: random1to100,
		disableElementTree: disableElementTree,
		copyTextToClipboard: copyTextToClipboard,
		addUrlToBrowserHistory: addUrlToBrowserHistory,
		getScrollbarWidth: getScrollbarWidth,
		hasHScroll: hasHScroll,
		getCurrentLocaleDate: getCurrentLocaleDate,
		isContentOverflowing: isContentOverflowing,
	};
})();

