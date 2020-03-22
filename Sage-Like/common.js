"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
const SyndicationStandard = Object.freeze({
	invalid: "n/a",
	RSS: "RSS",
	RDF: "RDF",
	Atom: "Atom",
	JSON: "JSON",
});

/////////////////////////////////////////////////////////////////////////////////////////////
class FeedData {
	constructor() {
		this.standard = SyndicationStandard.invalid;
		this.feeder = null;
		this.title = "";
		this.imageUrl = "";
		this.description = "";
		this.lastUpdated = 0;
		this.itemCount = 0;
		this.errorMsg = "";
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class XmlFeedData extends FeedData {
	constructor() {
		super();
		this.xmlVersion = "1.0";
		this.xmlEncoding = "UTF-8";
		super.feeder = {};
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class JsonFeedData extends FeedData {
	constructor() {
		super();
		this.jsonVersion = "";
		super.feeder = [];
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class SyndicationError extends Error {
	constructor(message, errInfo = undefined) {
		if(errInfo) {
			if(errInfo instanceof Error) {
				message += " [ " + errInfo.message + " ]";
			} else if(typeof(errInfo) === "string") {
				message += " [ " + errInfo + " ]";
			}
		}
		super(message);
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class AbortDiscovery {
	constructor() {
		this._abort = false;
	}
	abort() {
		this._abort = true;
	}
	get isAborted() {
		return this._abort;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class Locker {

	//////////////////////////////////////////
	constructor() {
		this._lockRequestCounter = 0;
	}

	//////////////////////////////////////////
	lock() {
		this._lockRequestCounter++;
	}

	//////////////////////////////////////////
	unlock() {
		if(this._lockRequestCounter > 0) {
			this._lockRequestCounter--;
		}
	}

	//////////////////////////////////////////
	get isUnlocked() {
		return (this._lockRequestCounter === 0);
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////
class StoredKeyedItems {

	//////////////////////////////////////////
	constructor() {
		if (new.target.name === "StoredKeyedItems") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		this.clear();
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
				getting.then(() => {

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
class PageDataByInjection {

	//////////////////////////////////////////
	constructor() {

		this._MSGID_GET_PAGE_DATA = "msg_pageData_getDocumentData";

		this._CODE_INJECTION = "browser.runtime.sendMessage( { id: \"" + this._MSGID_GET_PAGE_DATA + "\"," +
															  "docElmId: document.documentElement.id," +
															  "title: document.title," +
															  "domainName: document.domain," +
															  "origin: window.location.origin," +
															  "isPlainText: document.body.children.length === 1 && " +
																		   "document.body.firstElementChild.tagName === \"PRE\" && " +
																		   "document.body.firstElementChild.children.length === 0," +
															  "txtHTML: document.documentElement.outerHTML, } );";

		this._funcPromiseResolve = null;
		this._funcPromiseReject = null;

		this._onRuntimeMessage = this._onRuntimeMessage.bind(this);

		browser.runtime.onMessage.addListener(this._onRuntimeMessage);
	}

	//////////////////////////////////////////
	dispose() {
		browser.runtime.onMessage.removeListener(this._onRuntimeMessage);
	}

	//////////////////////////////////////////////////////////////////////
	get(tabId) {

		return new Promise((resolve, reject) => {

			this._funcPromiseResolve = resolve;
			this._funcPromiseReject = reject;

			this._injectCode(tabId);
		});
	}

	//////////////////////////////////////////////////////////////////////
	_injectCode(tabId) {

		browser.tabs.executeScript(tabId, { code: this._CODE_INJECTION, runAt: "document_end" }).catch((error) => {

			if(typeof(this._funcPromiseReject) === "function") {
				this._funcPromiseReject({errorMsg: "Code injection failed.", nativeError: error });
				this._funcPromiseReject = null;
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_onRuntimeMessage(message) {

		if(message.id === this._MSGID_GET_PAGE_DATA && (typeof(this._funcPromiseResolve) === "function")) {
			this._funcPromiseResolve({
				docElmId: message.docElmId,
				title: message.title,
				domainName: message.domainName,
				origin: message.origin,
				isPlainText: message.isPlainText,
				txtHTML: message.txtHTML,
			});
			this._funcPromiseResolve = null;
		}
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////
class InfoBar {

	//////////////////////////////////////////
	static get i() {
		if(this.m_instance === undefined) {
			this.m_instance = new this();
		}
		return this.m_instance;
	}

	//////////////////////////////////////////
	constructor() {
		this.m_elmInfoBar = null;
	}

	//////////////////////////////////////////
	show(infoText, refElement = undefined, isAlertive = true, dirStyle = "", showDuration = 3500, dismissOnScroll = false) {

		if(!!!this.m_elmInfoBar) {
			this.m_elmInfoBar = document.getElementById("infoBar");
			this.m_elmInfoBar.onclick = () => this.dismiss();
		}

		const IS_GENERAL_INFO = (refElement === undefined);

		if(IS_GENERAL_INFO) {
			refElement = document.body;
			this.m_elmInfoBar.slDismissOnScroll = false;
		} else {
			this.m_elmInfoBar.slRefElement = refElement;
			this.m_elmInfoBar.slDismissOnScroll = dismissOnScroll;
		}

		// to allow for words that are <b>
		this.m_elmInfoBar.querySelector(".infoBarText").innerHTML = infoText;	// .replace(/\u000d/g, " ") when using textContent otherwise 2nd line starts after dot without space in between
		this.m_elmInfoBar.classList.toggle("alertive", isAlertive);
		this.m_elmInfoBar.classList.toggle("rightToLeftBorder", dirStyle === "rtl");
		this.m_elmInfoBar.classList.toggle("generalBorder", IS_GENERAL_INFO);			/* .generalBorder overrides .rightToLeftBorder */
		this.m_elmInfoBar.classList.replace("fadeOut", "fadeIn");

		// real inner size accounting for the scrollbars width if they exist
		const INNER_WIDTH = window.innerWidth - slUtil.getVScrollWidth();
		const INNER_HEIGHT = window.innerHeight - slUtil.getHScrollWidth();
		const RECT_REF_ELEMENT = slUtil.getElementViewportRect(refElement, INNER_WIDTH, INNER_HEIGHT);
		const TOP_OFFSET = (IS_GENERAL_INFO ? 4 : RECT_REF_ELEMENT.height - 1);
		const LEFT_OFFSET = 7;
		const CALL_TIMESTAMP = Date.now();

		let nLeft, nTop = RECT_REF_ELEMENT.top + TOP_OFFSET;

		if(IS_GENERAL_INFO) {
			nLeft = (INNER_WIDTH - this.m_elmInfoBar.offsetWidth) / 2;
		} else {
			nLeft = RECT_REF_ELEMENT.left + (dirStyle === "rtl" ? (RECT_REF_ELEMENT.width-this.m_elmInfoBar.offsetWidth-LEFT_OFFSET) : LEFT_OFFSET);
		}

		if (nLeft < 0) nLeft = 0;

		this.m_elmInfoBar.style.left = nLeft + "px";
		this.m_elmInfoBar.style.top = nTop + "px";
		this.m_elmInfoBar.slCallTimeStamp = CALL_TIMESTAMP;

		setTimeout(() => {
			if(this.m_elmInfoBar.slCallTimeStamp === CALL_TIMESTAMP) {		// fade out only if its for the last function call
				this.dismiss();
			}
		}, showDuration);
	}

	//////////////////////////////////////////
	dismiss(isScrolling = false) {

		if(!!this.m_elmInfoBar) {

			if(!isScrolling || (isScrolling && this.m_elmInfoBar.slDismissOnScroll)) {

				this.m_elmInfoBar.slCallTimeStamp = Date.now();
				this.m_elmInfoBar.classList.replace("fadeIn", "fadeOut");

				if(!!this.m_elmInfoBar.slRefElement) {
					delete this.m_elmInfoBar.slRefElement;
				}
			}
		}
	}
};

/////////////////////////////////////////////////////////////////////////////////////////////
let slGlobals = (function() {

	const ID_UL_RSS_TREE_VIEW = "rssTreeView";
	const ID_UL_RSS_LIST_VIEW = "rssListView";

	// RSS Tree View classes
	const CLS_RTV_LI_TREE_ITEM = "rtvTreeItem";
	const CLS_RTV_LI_TREE_FOLDER = "rtvTreeFolder";
	const CLS_RTV_LI_TREE_FEED = "rtvTreeFeed";
	const CLS_RTV_DIV_TREE_ITEM_CAPTION = "rtvCaption";
	const CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE = "rtvCaptionTitle";
	const CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS = "rtvCaptionStats";

	// RSS List View classes
	const CLS_RLV_LI_LIST_ITEM = "rlvListItem";

	const ROOT_FEEDS_FOLDER_ID_NOT_SET = "_rootFeedsFolderIdNotSet_";

	// Message IDs
	const MSG_ID_PREFERENCES_CHANGED					= 101;
	const MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID			= 102;
	const MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER		= 103;
	const MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER		= 104;
	const MSG_ID_GET_PAGE_FEED_COUNT					= 105;
	const MSG_ID_GET_PAGE_DATA							= 106;
	const MSG_ID_WAIT_AND_HIDE_POPUP					= 107;
	const MSG_ID_ADD_NEW_DISCOVERED_FEEDS				= 108;
	const MSG_ID_SIDEBAR_OPEN_FOR_WINDOW				= 109;

	// Message Details IDs
	const MSGD_PREF_CHANGE_ALL								= 1001;
	const MSGD_PREF_CHANGE_ROOT_FOLDER						= 1002;
	const MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL				= 1003;
	const MSGD_PREF_CHANGE_CHECK_FEEDS_WHEN_SB_CLOSED		= 1004;
	const MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD				= 1005;
	const MSGD_PREF_CHANGE_SHOW_FEED_STATS					= 1006;
	const MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC				= 1007;
	const MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY				= 1008;
	const MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS			= 1009;
	const MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE			= 1010;
	const MSGD_PREF_CHANGE_UI_DENSITY						= 1011;
	const MSGD_PREF_CHANGE_FONT_NAME						= 1012;
	const MSGD_PREF_CHANGE_FONT_SIZE_PERCENT				= 1013;
	const MSGD_PREF_CHANGE_COLORS							= 1014;
	const MSGD_PREF_CHANGE_IMAGES							= 1015;

	const BOOKMARKS_ROOT_GUID = "root________";
	const BOOKMARKS_ROOT_MENU_GUID = "menu________";
	const DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME = "Sage-Like Feeds";
	const STR_TITLE_EMPTY = "<no title>";
	const EXTRA_URL_PARAM_NO_REDIRECT_SPLIT = ["_SLWxoPenuRl", "nOtinFEeDPREVIew"];
	const EXTRA_URL_PARAM_NO_REDIRECT = EXTRA_URL_PARAM_NO_REDIRECT_SPLIT.join("=");

	const FMT_IMAGE_SET = {
		IMG_OPEN_FOLDER:		"url(\"/icons/open-{0}.png\")",
		IMG_CLOSED_FOLDER:		"url(\"/icons/closed-{0}.png\")",
		IMG_TREE_ITEM:			"url(\"/icons/rss-{0}.png\")",
		IMG_TREE_ITEM_LOADING:	"url(\"/icons/loading-{0}.gif\")",
		IMG_TREE_ITEM_ERROR:	"url(\"/icons/error-{0}.png\")",
	};

	const IMAGE_SET_VALUES = [0, 1, 2, 3, 4, 5, 6];

	const IMAGE_SET = function(setNumber) {

		setNumber = parseInt(setNumber);

		if( !(IMAGE_SET_VALUES.includes(setNumber)) ) {
			throw new Error("Invalid image set number: " + setNumber);
		}

		return {
			IMG_OPEN_FOLDER:		FMT_IMAGE_SET.IMG_OPEN_FOLDER.format([setNumber]),
			IMG_CLOSED_FOLDER:		FMT_IMAGE_SET.IMG_CLOSED_FOLDER.format([setNumber]),
			IMG_TREE_ITEM:			FMT_IMAGE_SET.IMG_TREE_ITEM.format([setNumber]),
			IMG_TREE_ITEM_LOADING:	FMT_IMAGE_SET.IMG_TREE_ITEM_LOADING.format([setNumber]),
			IMG_TREE_ITEM_ERROR:	FMT_IMAGE_SET.IMG_TREE_ITEM_ERROR.format([setNumber]),
		};
	};

	const VIEW_CONTENT_LOAD_FLAG = {
		TREE_VIEW_LOADED:	parseInt("01", 2),
		LIST_VIEW_LOADED:	parseInt("10", 2),

		NO_VIEW_LOADED:		parseInt("00", 2),
		ALL_VIEWS_LOADED:	parseInt("11", 2),
	};

	return {
		ID_UL_RSS_TREE_VIEW: ID_UL_RSS_TREE_VIEW,
		ID_UL_RSS_LIST_VIEW: ID_UL_RSS_LIST_VIEW,

		CLS_RTV_LI_TREE_ITEM: CLS_RTV_LI_TREE_ITEM,
		CLS_RTV_LI_TREE_FOLDER: CLS_RTV_LI_TREE_FOLDER,
		CLS_RTV_LI_TREE_FEED: CLS_RTV_LI_TREE_FEED,
		CLS_RTV_DIV_TREE_ITEM_CAPTION: CLS_RTV_DIV_TREE_ITEM_CAPTION,
		CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE: CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE,
		CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS: CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS,

		CLS_RLV_LI_LIST_ITEM: CLS_RLV_LI_LIST_ITEM,

		ROOT_FEEDS_FOLDER_ID_NOT_SET: ROOT_FEEDS_FOLDER_ID_NOT_SET,

		MSG_ID_PREFERENCES_CHANGED: MSG_ID_PREFERENCES_CHANGED,
		MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID: MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID,
		MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER: MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER,
		MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER: MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER,
		MSG_ID_GET_PAGE_FEED_COUNT: MSG_ID_GET_PAGE_FEED_COUNT,
		MSG_ID_GET_PAGE_DATA: MSG_ID_GET_PAGE_DATA,
		MSG_ID_WAIT_AND_HIDE_POPUP: MSG_ID_WAIT_AND_HIDE_POPUP,
		MSG_ID_ADD_NEW_DISCOVERED_FEEDS: MSG_ID_ADD_NEW_DISCOVERED_FEEDS,
		MSG_ID_SIDEBAR_OPEN_FOR_WINDOW: MSG_ID_SIDEBAR_OPEN_FOR_WINDOW,

		MSGD_PREF_CHANGE_ALL: MSGD_PREF_CHANGE_ALL,
		MSGD_PREF_CHANGE_ROOT_FOLDER: MSGD_PREF_CHANGE_ROOT_FOLDER,
		MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL: MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL,
		MSGD_PREF_CHANGE_CHECK_FEEDS_WHEN_SB_CLOSED: MSGD_PREF_CHANGE_CHECK_FEEDS_WHEN_SB_CLOSED,
		MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD: MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD,
		MSGD_PREF_CHANGE_SHOW_FEED_STATS: MSGD_PREF_CHANGE_SHOW_FEED_STATS,
		MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC: MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC,
		MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY: MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY,
		MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS: MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS,
		MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE: MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE,
		MSGD_PREF_CHANGE_UI_DENSITY: MSGD_PREF_CHANGE_UI_DENSITY,
		MSGD_PREF_CHANGE_FONT_NAME: MSGD_PREF_CHANGE_FONT_NAME,
		MSGD_PREF_CHANGE_FONT_SIZE_PERCENT: MSGD_PREF_CHANGE_FONT_SIZE_PERCENT,
		MSGD_PREF_CHANGE_COLORS: MSGD_PREF_CHANGE_COLORS,
		MSGD_PREF_CHANGE_IMAGES: MSGD_PREF_CHANGE_IMAGES,

		BOOKMARKS_ROOT_GUID: BOOKMARKS_ROOT_GUID,
		BOOKMARKS_ROOT_MENU_GUID: BOOKMARKS_ROOT_MENU_GUID,
		DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME: DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME,
		STR_TITLE_EMPTY: STR_TITLE_EMPTY,
		EXTRA_URL_PARAM_NO_REDIRECT_SPLIT: EXTRA_URL_PARAM_NO_REDIRECT_SPLIT,
		EXTRA_URL_PARAM_NO_REDIRECT: EXTRA_URL_PARAM_NO_REDIRECT,

		IMAGE_SET_VALUES: IMAGE_SET_VALUES,
		IMAGE_SET: IMAGE_SET,

		VIEW_CONTENT_LOAD_FLAG: VIEW_CONTENT_LOAD_FLAG,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let slPrototypes = (function() {

	let m_sRxATag = "</?a\\b[^>]*>";
	let m_sRxScriptTag = "<script\\b[^>]*>(([\\s\\S]*?)</\\s*\\bscript\\b\\s*>)?";
	let m_sRxAudioTag = "<audio\\b[^>]*>(([\\s\\S]*?)</\\s*\\baudio\\b\\s*>)?";
	let m_sRxVideoTag = "<video\\b[^>]*>(([\\s\\S]*?)</\\s*\\bvideo\\b\\s*>)?";
	let m_sRxLinkTag = "</?link\\b[^>]*>";
	let m_sRxFrameTag = "</?i?frame(set)?\\b[^>]*>";
	let m_sRxEmbedTag = "</?embed\\b[^>]*>";
	let m_sRxAppletTag = "</?applet\\b[^>]*>";
	let m_sRxObjectTag = "</?object\\b[^>]*>";

	let m_sRxUnsafeTags = m_sRxScriptTag + "|" + m_sRxLinkTag + "|" + m_sRxFrameTag + "|" + m_sRxEmbedTag + "|" + m_sRxAppletTag + "|" + m_sRxObjectTag;
	let m_sRxContentTags = m_sRxATag + "|" + m_sRxUnsafeTags;
	let m_sRxAudioVideoTags = m_sRxAudioTag + "|" + m_sRxVideoTag;

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
	String.prototype.consolidateWhiteSpaces = function() {
		return this
			.trim()
			.replace(String.prototype.consolidateWhiteSpaces.regexMultipleWhiteSpaces, " ")
			.replace(String.prototype.consolidateWhiteSpaces.regexWhiteSpace, " ");
	};
	String.prototype.consolidateWhiteSpaces.regexWhiteSpace = new RegExp("\\s", "g");
	String.prototype.consolidateWhiteSpaces.regexMultipleWhiteSpaces = new RegExp("\\s{2,}", "g");

	////////////////////////////////////////////////////////////////////////////////////
	String.prototype.htmlEntityToLiteral = function() {
		// this is NOT safe; may be used as an attack vector if result is displayed to user
		return this.replace(String.prototype.htmlEntityToLiteral.regex, (matched) => {
			return String.prototype.htmlEntityToLiteral.entities[matched];
		});
	};
	String.prototype.htmlEntityToLiteral.entities = {
		"&quot;": "\"",
		"&apos;": "'",
		"&amp;": "&",
		"&gt;": ">",
		"&lt;": "<",
		"&nbsp;": " ",
		"&emsp;": " ",
		"&#34;": "\"",
		"&#39;": "'",
		"&#38;": "&",
		"&#62;": ">",
		"&#60;": "<",
		"&#160;": " ",
		"&#8195;": " ",
		"&reg;": "®",
		"&copy;": "©",
		"&trade;": "™",
		"&cent;": "¢",
		"&pound;": "£",
		"&yen;": "¥",
		"&euro;": "€",
		"&raquo;": "»",
		"&laquo;": "«",
		"&bull": "•",
		"&mdash;": "—",
	};
	String.prototype.htmlEntityToLiteral.regex = new RegExp(Object.keys(String.prototype.htmlEntityToLiteral.entities).join("|"), "gim");

	//////////////////////////////////////////////////////////////////////
	String.prototype.escapeHtml = function() {
		return this.replace(String.prototype.escapeHtml.regex, (match) => {
			return String.prototype.escapeHtml.htmlReservedCharacters[match];
		});
	};
	String.prototype.escapeHtml.htmlReservedCharacters = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#039;",
	};
	String.prototype.escapeHtml.regex = new RegExp("[" + Object.keys(String.prototype.escapeHtml.htmlReservedCharacters).join("") + "]", "gm");

	//////////////////////////////////////////////////////////////////////
	String.prototype.unescapeHtml = function() {
		return this.replace(String.prototype.unescapeHtml.regex, (match) => {
			return Object.keys(String.prototype.escapeHtml.htmlReservedCharacters).find((key) => String.prototype.escapeHtml.htmlReservedCharacters[key] === match);
		});
	};
	String.prototype.unescapeHtml.regex = new RegExp(Object.values(String.prototype.escapeHtml.htmlReservedCharacters).join("|"), "gm");

	//////////////////////////////////////////////////////////////////////
	String.prototype.stripHtmlTags = function(regex = null, substitution = "") {
		if(regex) {
			return this.replace(regex, substitution)
		} else {
			return this
				.htmlEntityToLiteral()
				.replace(String.prototype.stripHtmlTags.regexContentTags, "")
				.replace(String.prototype.stripHtmlTags.regexAnyTag, " ");
		}
	};
	// I know, embed, link, cannot have any child nodes. Not taking any risks
	String.prototype.stripHtmlTags.regexContentTags = new RegExp(m_sRxContentTags, "gim");
	String.prototype.stripHtmlTags.regexAudioVideoTags = new RegExp(m_sRxAudioVideoTags, "gim");
	String.prototype.stripHtmlTags.regexATag = new RegExp(m_sRxATag, "gim");
	String.prototype.stripHtmlTags.regexScriptTag = new RegExp(m_sRxScriptTag, "gim");
	String.prototype.stripHtmlTags.regexLinkTag = new RegExp(m_sRxLinkTag, "gim");
	String.prototype.stripHtmlTags.regexFrameTag = new RegExp(m_sRxFrameTag, "gim");
	String.prototype.stripHtmlTags.regexEmbedTag = new RegExp(m_sRxEmbedTag, "gim");
	String.prototype.stripHtmlTags.regexAppletTag = new RegExp(m_sRxAppletTag, "gim");
	String.prototype.stripHtmlTags.regexObjectTag = new RegExp(m_sRxObjectTag, "gim");
	String.prototype.stripHtmlTags.regexImgTag = new RegExp("</?img\\b[^>]*>", "gim");
	String.prototype.stripHtmlTags.regexAnyTag = new RegExp("</?[a-zA-Z0-9]+\\b[^>]*>", "gm");
	String.prototype.stripHtmlTags.regexMultiBrTag = new RegExp("(</?br\\b[^>]*/?>\\s*){2,}", "gim");

	//////////////////////////////////////////////////////////////////////
	String.prototype.stripUnsafeHtmlComponents = function() {
		return this
			.htmlEntityToLiteral()
			.replace(String.prototype.stripUnsafeHtmlComponents.regexUnsafeTags, "")
			.replace(String.prototype.stripUnsafeHtmlComponents.regexJavascript, "'#striped'")
			.replace(String.prototype.stripUnsafeHtmlComponents.regexImg1x1, "")
			.replace(String.prototype.stripUnsafeHtmlComponents.regexEventAttr, "$1");
	};
	String.prototype.stripUnsafeHtmlComponents.regexUnsafeTags = new RegExp(m_sRxUnsafeTags, "gim");
	String.prototype.stripUnsafeHtmlComponents.regexJavascript = new RegExp("('\\bjavascript:([\\s\\S]*?)')|(\"\\bjavascript:([\\s\\S]*?)\")", "gim");
	String.prototype.stripUnsafeHtmlComponents.regexEventAttr = new RegExp("(<[a-zA-Z0-9]+\\b[^>]*)\\bon[a-zA-Z]+\\s*=\\s*(\"[\\s\\S]*?\"|'[\\s\\S]*?')", "gim");
	String.prototype.stripUnsafeHtmlComponents.regexImg1x1 = new RegExp("<img\\b[^>]*\\b(width|height)\\b\\s*=\\s*[\"']0*1[\"'][^>]*\\b(width|height)\\b\\s*=\\s*[\"']0*1[\"'][^>]*>", "gim");

	/*
	+ Alternatives for regexImg1x1
		1.	/<img\b[^>]*(?=[^>]*\bwidth\b\s*=\s*["']0*1["'])(?=[^>]*\bheight\b\s*=\s*["']0*1["'])[^>]*>/
			Using lookhead and shorter BUT slower. 417 steps for test case.
		2.	/<img\b[^>]*((\bwidth\b\s*=\s*["']0*1["'][^>]*\bheight\b\s*=\s*["']0*1["'])|(\bheight\b\s*=\s*["']0*1["'][^>]*\bwidth\b\s*=\s*["']0*1["']))[^>]*>/
			using '|' to match different order ('width, height' or 'height, width'). longer and faster then #1. 185 steps for test case.
		3.	/<img\b[^>]*\b(width|height)\b\s*=\s*["']0*1["'][^>]*\b(width|height)\b\s*=\s*["']0*1["'][^>]*>/
			Another way of using '|' to match different order ('width, height' or 'height, width'). faster then #1 and #2. 120 steps for test case.
			ATTENTION - HAS A FLAW: will also match 'width, width' or 'height, height'. Chosen; faster, unliklly that html tag will have the same attribute twice.
	*/

	//////////////////////////////////////////////////////////////////////
	String.prototype.escapeRegExp = function() {
		return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	//////////////////////////////////////////////////////////////////////
	Date.prototype.toWebExtensionLocaleString = function() {
		let options = {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		};
		return this.toLocaleString(undefined, options);
	}

	//////////////////////////////////////////////////////////////////////
	Date.prototype.toWebExtensionLocaleShortString = function() {
		let options = {
			day: "numeric",
			month: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		};
		return this.toLocaleString(undefined, options);
	}

	//////////////////////////////////////////////////////////////////////
	Array.prototype.includesAll = function(targetAry) {
		if(Array.isArray(targetAry)) {
			return targetAry.every((n) => this.includes(n));
		} else {
			throw "Not an instance of Array";
		}
	}

	//////////////////////////////////////////////////////////////////////
	Array.prototype.includesSome = function(targetAry) {
		if(Array.isArray(targetAry)) {
			return targetAry.some((n) => this.includes(n));
		} else {
			throw "Not an instance of Array";
		}
	}

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let internalPrefs = (function() {

	// internal preferences

	const DEF_PREF_OPEN_FOLDERS_VALUE = {};
	const DEF_PREF_TREE_FEEDS_DATA_VALUE = {};
	const DEF_PREF_IS_EXTENSION_INSTALLED_VALUE = null;
	const DEF_PREF_TREE_SELECTED_ITEM_ID_VALUE = null;
	const DEF_PREF_TREE_SCROLL_TOP_VALUE = 0;
	const DEF_PREF_SPLITTER_TOP_VALUE = undefined;
	const DEF_PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT_VALUE = 5;
	const DEF_PREF_FEEDS_FILTER_VALUE = "";
	const DEF_PREF_AGGRESSIVE_DISCOVERY_LEVEL_VALUE = "0";
	const DEF_PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT_VALUE = 3;

	const PREF_OPEN_FOLDERS = "pref_openSubTrees";
	const PREF_TREE_FEEDS_DATA = "pref_treeFeedsData";
	const PREF_IS_EXTENSION_INSTALLED = "pref_isExtensionInstalled";
	const PREF_TREE_SELECTED_ITEM_ID = "pref_treeSelectedItemId";
	const PREF_TREE_SCROLL_TOP = "pref_treeScrollTop";
	const PREF_SPLITTER_TOP = "pref_splitterTop";
	const PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT = "pref_dropInsideFolderShowMsgCount";
	const PREF_FEEDS_FILTER = "pref_feedsFilter";
	const PREF_AGGRESSIVE_DISCOVERY_LEVEL = "pref_aggressiveDiscoveryLevel";
	const PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT = "pref_hoverFilterTextBoxShowMsgCount";

	//////////////////////////////////////////////////////////////////////
	function getOpenFolders() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_OPEN_FOLDERS).then((result) => {
				resolve(result[PREF_OPEN_FOLDERS] === undefined ? DEF_PREF_OPEN_FOLDERS_VALUE : result[PREF_OPEN_FOLDERS]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setOpenSubFolders(objValue) {

		let obj = {};
		obj[PREF_OPEN_FOLDERS] = objValue;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getTreeFeedsData() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_TREE_FEEDS_DATA).then((result) => {
				resolve(result[PREF_TREE_FEEDS_DATA] === undefined ? DEF_PREF_TREE_FEEDS_DATA_VALUE : result[PREF_TREE_FEEDS_DATA]);
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
	function getIsExtensionInstalled() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_IS_EXTENSION_INSTALLED).then((result) => {
				resolve(result[PREF_IS_EXTENSION_INSTALLED] === undefined ? DEF_PREF_IS_EXTENSION_INSTALLED_VALUE : result[PREF_IS_EXTENSION_INSTALLED]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setIsExtensionInstalled(objValue) {

		let obj = {};
		obj[PREF_IS_EXTENSION_INSTALLED] = objValue;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getTreeSelectedItemId() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_TREE_SELECTED_ITEM_ID).then((result) => {
				resolve(result[PREF_TREE_SELECTED_ITEM_ID] === undefined ? DEF_PREF_TREE_SELECTED_ITEM_ID_VALUE : result[PREF_TREE_SELECTED_ITEM_ID]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setTreeSelectedItemId(value) {

		let obj = {};
		obj[PREF_TREE_SELECTED_ITEM_ID] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getTreeScrollTop() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_TREE_SCROLL_TOP).then((result) => {
				resolve(result[PREF_TREE_SCROLL_TOP] === undefined ? DEF_PREF_TREE_SCROLL_TOP_VALUE : result[PREF_TREE_SCROLL_TOP]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setTreeScrollTop(value) {

		let obj = {};
		obj[PREF_TREE_SCROLL_TOP] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getSplitterTop() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_SPLITTER_TOP).then((result) => {
				resolve(result[PREF_SPLITTER_TOP] === undefined ? DEF_PREF_SPLITTER_TOP_VALUE : result[PREF_SPLITTER_TOP]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setSplitterTop(value) {

		let obj = {};
		obj[PREF_SPLITTER_TOP] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getDropInsideFolderShowMsgCount() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT).then((result) => {
				resolve(result[PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT] === undefined ? DEF_PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT_VALUE : result[PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setDropInsideFolderShowMsgCount(value) {

		let obj = {};
		obj[PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getFeedsFilter() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_FEEDS_FILTER).then((result) => {
				resolve(result[PREF_FEEDS_FILTER] === undefined ? DEF_PREF_FEEDS_FILTER_VALUE : result[PREF_FEEDS_FILTER]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setFeedsFilter(value) {

		let obj = {};
		obj[PREF_FEEDS_FILTER] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getAggressiveDiscoveryLevel() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_AGGRESSIVE_DISCOVERY_LEVEL).then((result) => {
				resolve(result[PREF_AGGRESSIVE_DISCOVERY_LEVEL] === undefined ? DEF_PREF_AGGRESSIVE_DISCOVERY_LEVEL_VALUE : result[PREF_AGGRESSIVE_DISCOVERY_LEVEL]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setAggressiveDiscoveryLevel(value) {

		let obj = {};
		obj[PREF_AGGRESSIVE_DISCOVERY_LEVEL] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getTreeViewRestoreData() {

		return new Promise((resolve) => {

			let getting = browser.storage.local.get([
				PREF_TREE_SCROLL_TOP,
				PREF_TREE_SELECTED_ITEM_ID,
				PREF_FEEDS_FILTER,
			]);

			getting.then((result) => {
				resolve({
					treeScrollTop: result[PREF_TREE_SCROLL_TOP] === undefined ? DEF_PREF_TREE_SCROLL_TOP_VALUE : result[PREF_TREE_SCROLL_TOP],
					treeSelectedItemId: result[PREF_TREE_SELECTED_ITEM_ID] === undefined ? DEF_PREF_TREE_SELECTED_ITEM_ID_VALUE : result[PREF_TREE_SELECTED_ITEM_ID],
					feedsFilter: result[PREF_FEEDS_FILTER] === undefined ? DEF_PREF_FEEDS_FILTER_VALUE : result[PREF_FEEDS_FILTER],
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function getHoverFilterTextBoxShowMsgCount() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT).then((result) => {
				resolve(result[PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT] === undefined ? DEF_PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT_VALUE : result[PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setHoverFilterTextBoxShowMsgCount(value) {

		let obj = {};
		obj[PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT] = value;
		browser.storage.local.set(obj);
	}


	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setOpenSubFolders(DEF_PREF_OPEN_FOLDERS_VALUE);
		this.setTreeFeedsData(DEF_PREF_TREE_FEEDS_DATA_VALUE);
		this.setIsExtensionInstalled(DEF_PREF_IS_EXTENSION_INSTALLED_VALUE);
		this.setTreeSelectedItemId(DEF_PREF_TREE_SELECTED_ITEM_ID_VALUE);
		this.setTreeScrollTop(DEF_PREF_TREE_SCROLL_TOP_VALUE);
		this.setSplitterTop(DEF_PREF_SPLITTER_TOP_VALUE);
		this.setDropInsideFolderShowMsgCount(DEF_PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT_VALUE);
		this.setFeedsFilter(DEF_PREF_FEEDS_FILTER_VALUE);
		this.setAggressiveDiscoveryLevel(DEF_PREF_AGGRESSIVE_DISCOVERY_LEVEL_VALUE);
		this.setHoverFilterTextBoxShowMsgCount(DEF_PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT_VALUE);

		return {
			openSubFolders: DEF_PREF_OPEN_FOLDERS_VALUE,
			treeFeedsData: DEF_PREF_TREE_FEEDS_DATA_VALUE,
			isExtensionInstalled: DEF_PREF_IS_EXTENSION_INSTALLED_VALUE,
			treeSelectedItemId: DEF_PREF_TREE_SELECTED_ITEM_ID_VALUE,
			treeScrollTop: DEF_PREF_TREE_SCROLL_TOP_VALUE,
			splitterTop: DEF_PREF_SPLITTER_TOP_VALUE,
			dropInsideFolderShowMsgCount: DEF_PREF_DROP_INSIDE_FOLDER_SHOW_MSG_COUNT_VALUE,
			feedsFilter: DEF_PREF_FEEDS_FILTER_VALUE,
			aggressiveDiscoveryLevel: DEF_PREF_AGGRESSIVE_DISCOVERY_LEVEL_VALUE,
			hoverFilterTextBoxShowMsgCount: DEF_PREF_HOVER_FILTER_TEXT_BOX_SHOW_MSG_COUNT_VALUE,
		};
	}

	return {
		getOpenFolders: getOpenFolders,
		setOpenSubFolders: setOpenSubFolders,
		getTreeFeedsData: getTreeFeedsData,
		setTreeFeedsData: setTreeFeedsData,
		getIsExtensionInstalled: getIsExtensionInstalled,
		setIsExtensionInstalled: setIsExtensionInstalled,
		getTreeSelectedItemId: getTreeSelectedItemId,
		setTreeSelectedItemId: setTreeSelectedItemId,
		getTreeScrollTop: getTreeScrollTop,
		setTreeScrollTop: setTreeScrollTop,
		getSplitterTop: getSplitterTop,
		setSplitterTop: setSplitterTop,
		getDropInsideFolderShowMsgCount: getDropInsideFolderShowMsgCount,
		setDropInsideFolderShowMsgCount: setDropInsideFolderShowMsgCount,
		getFeedsFilter: getFeedsFilter,
		setFeedsFilter: setFeedsFilter,
		getAggressiveDiscoveryLevel: getAggressiveDiscoveryLevel,
		setAggressiveDiscoveryLevel: setAggressiveDiscoveryLevel,
		getHoverFilterTextBoxShowMsgCount: getHoverFilterTextBoxShowMsgCount,
		setHoverFilterTextBoxShowMsgCount: setHoverFilterTextBoxShowMsgCount,

		getTreeViewRestoreData: getTreeViewRestoreData,

		restoreDefaults: restoreDefaults,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let prefs = (function() {

	// user preferences

	const DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE = slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET;
	const DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE = "3600000";
	const DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE = true;
	const DEF_PREF_CHECK_FEEDS_METHOD_VALUE = "3;2000";
	const DEF_PREF_FETCH_TIMEOUT_VALUE = "60";
	const DEF_PREF_SHOW_FEED_STATS_VALUE = true;
	const DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE = true;
	const DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE = 800;
	const DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE = "#FFFDAC";
	const DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE = "#000000";
	const DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE = true;
	const DEF_PREF_UI_DENSITY_VALUE = "19;18";
	const DEF_PREF_FONT_NAME_VALUE = "(Browser Default)";
	const DEF_PREF_FONT_SIZE_PERCENT_VALUE = "100";
	const DEF_PREF_COLOR_BACKGROUND_VALUE = "#F3F3F3";
	const DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE = "#E3E3E3";
	const DEF_PREF_COLOR_SELECT_VALUE = "#F3C8BA";
	const DEF_PREF_COLOR_TEXT_VALUE = "#000000";
	const DEF_PREF_IMAGE_SET_VALUE = 0;

	const PREF_ROOT_FEEDS_FOLDER_ID = "pref_rootFeedsFolderId";
	const PREF_CHECK_FEEDS_INTERVAL = "pref_checkFeedsInterval";
	const PREF_CHECK_FEEDS_WHEN_SB_CLOSED = "pref_checkFeedsWhenSbClosed";
	const PREF_CHECK_FEEDS_METHOD = "pref_checkFeedsMethod";
	const PREF_FETCH_TIMEOUT = "pref_fetchTimeout";
	const PREF_SHOW_FEED_STATS = "pref_showFeedStats";
	const PREF_SHOW_FEED_ITEM_DESC = "pref_showFeedItemDesc";
	const PREF_FEED_ITEM_DESC_DELAY = "pref_feedItemDescDelay";
	const PREF_COLOR_FEED_ITEM_DESC_BACKGROUND = "pref_colorFeedItemDescBk";
	const PREF_COLOR_FEED_ITEM_DESC_TEXT = "pref_colorFeedItemDescText";
	const PREF_DETECT_FEEDS_IN_WEB_PAGE = "pref_detectFeedsInWebPage";
	const PREF_UI_DENSITY = "pref_UIDensity";
	const PREF_FONT_NAME = "perf_fontName";
	const PREF_FONT_SIZE_PERCENT = "perf_fontSizePercent";
	const PREF_COLOR_BACKGROUND = "pref_colorBk";
	const PREF_COLOR_DIALOG_BACKGROUND = "pref_colorDlgBk";
	const PREF_COLOR_SELECT = "pref_colorSelect";
	const PREF_COLOR_TEXT = "pref_colorText";
	const PREF_IMAGE_SET = "pref_imageSet";

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
	function getCheckFeedsWhenSbClosed() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_CHECK_FEEDS_WHEN_SB_CLOSED).then((result) => {
				resolve(result[PREF_CHECK_FEEDS_WHEN_SB_CLOSED] === undefined ? DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE : result[PREF_CHECK_FEEDS_WHEN_SB_CLOSED]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setCheckFeedsWhenSbClosed(value) {

		let obj = {};
		obj[PREF_CHECK_FEEDS_WHEN_SB_CLOSED] = value;
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
	function getShowFeedStats() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_SHOW_FEED_STATS).then((result) => {
				resolve(result[PREF_SHOW_FEED_STATS] === undefined ? DEF_PREF_SHOW_FEED_STATS_VALUE : result[PREF_SHOW_FEED_STATS]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setShowFeedStats(value) {

		let obj = {};
		obj[PREF_SHOW_FEED_STATS] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getShowFeedItemDesc() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_SHOW_FEED_ITEM_DESC).then((result) => {
				resolve(result[PREF_SHOW_FEED_ITEM_DESC] === undefined ? DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE : result[PREF_SHOW_FEED_ITEM_DESC]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setShowFeedItemDesc(value) {

		let obj = {};
		obj[PREF_SHOW_FEED_ITEM_DESC] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getFeedItemDescDelay() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_FEED_ITEM_DESC_DELAY).then((result) => {
				resolve(result[PREF_FEED_ITEM_DESC_DELAY] === undefined ? DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE : result[PREF_FEED_ITEM_DESC_DELAY]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setFeedItemDescDelay(value) {

		let obj = {};
		obj[PREF_FEED_ITEM_DESC_DELAY] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorFeedItemDescBackground() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_FEED_ITEM_DESC_BACKGROUND).then((result) => {
				resolve(result[PREF_COLOR_FEED_ITEM_DESC_BACKGROUND] === undefined ? DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE : result[PREF_COLOR_FEED_ITEM_DESC_BACKGROUND]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorFeedItemDescBackground(value) {

		let obj = {};
		obj[PREF_COLOR_FEED_ITEM_DESC_BACKGROUND] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorFeedItemDescText() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_FEED_ITEM_DESC_TEXT).then((result) => {
				resolve(result[PREF_COLOR_FEED_ITEM_DESC_TEXT] === undefined ? DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE : result[PREF_COLOR_FEED_ITEM_DESC_TEXT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorFeedItemDescText(value) {

		let obj = {};
		obj[PREF_COLOR_FEED_ITEM_DESC_TEXT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getDetectFeedsInWebPage() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_DETECT_FEEDS_IN_WEB_PAGE).then((result) => {
				resolve(result[PREF_DETECT_FEEDS_IN_WEB_PAGE] === undefined ? DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE : result[PREF_DETECT_FEEDS_IN_WEB_PAGE]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setDetectFeedsInWebPage(value) {

		let obj = {};
		obj[PREF_DETECT_FEEDS_IN_WEB_PAGE] = value;
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
	function getFontName() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_FONT_NAME).then((result) => {
				resolve(result[PREF_FONT_NAME] === undefined ? DEF_PREF_FONT_NAME_VALUE : result[PREF_FONT_NAME]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setFontName(value) {

		let obj = {};
		obj[PREF_FONT_NAME] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getFontSizePercent() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_FONT_SIZE_PERCENT).then((result) => {
				resolve(result[PREF_FONT_SIZE_PERCENT] === undefined ? DEF_PREF_FONT_SIZE_PERCENT_VALUE : result[PREF_FONT_SIZE_PERCENT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setFontSizePercent(value) {

		let obj = {};
		obj[PREF_FONT_SIZE_PERCENT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorBackground() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_BACKGROUND).then((result) => {
				resolve(result[PREF_COLOR_BACKGROUND] === undefined ? DEF_PREF_COLOR_BACKGROUND_VALUE : result[PREF_COLOR_BACKGROUND]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorBackground(value) {

		let obj = {};
		obj[PREF_COLOR_BACKGROUND] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorDialogBackground() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_DIALOG_BACKGROUND).then((result) => {
				resolve(result[PREF_COLOR_DIALOG_BACKGROUND] === undefined ? DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE : result[PREF_COLOR_DIALOG_BACKGROUND]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorDialogBackground(value) {

		let obj = {};
		obj[PREF_COLOR_DIALOG_BACKGROUND] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorSelect() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_SELECT).then((result) => {
				resolve(result[PREF_COLOR_SELECT] === undefined ? DEF_PREF_COLOR_SELECT_VALUE : result[PREF_COLOR_SELECT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorSelect(value) {

		let obj = {};
		obj[PREF_COLOR_SELECT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorText() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLOR_TEXT).then((result) => {
				resolve(result[PREF_COLOR_TEXT] === undefined ? DEF_PREF_COLOR_TEXT_VALUE : result[PREF_COLOR_TEXT]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setColorText(value) {

		let obj = {};
		obj[PREF_COLOR_TEXT] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function getImageSet() {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_IMAGE_SET).then((result) => {
				resolve(result[PREF_IMAGE_SET] === undefined ? DEF_PREF_IMAGE_SET_VALUE : result[PREF_IMAGE_SET]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setImageSet(value) {

		let obj = {};
		obj[PREF_IMAGE_SET] = value;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setRootFeedsFolderId(DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE);
		this.setCheckFeedsInterval(DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE);
		this.setCheckFeedsWhenSbClosed(DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE);
		this.setCheckFeedsMethod(DEF_PREF_CHECK_FEEDS_METHOD_VALUE);
		this.setFetchTimeout(DEF_PREF_FETCH_TIMEOUT_VALUE);
		this.setShowFeedStats(DEF_PREF_SHOW_FEED_STATS_VALUE);
		this.setShowFeedItemDesc(DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE);
		this.setFeedItemDescDelay(DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE);
		this.setColorFeedItemDescBackground(DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE);
		this.setColorFeedItemDescText(DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE);
		this.setDetectFeedsInWebPage(DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE);
		this.setUIDensity(DEF_PREF_UI_DENSITY_VALUE);
		this.setFontName(DEF_PREF_FONT_NAME_VALUE);
		this.setFontSizePercent(DEF_PREF_FONT_SIZE_PERCENT_VALUE);
		this.setColorBackground(DEF_PREF_COLOR_BACKGROUND_VALUE);
		this.setColorDialogBackground(DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE);
		this.setColorSelect(DEF_PREF_COLOR_SELECT_VALUE);
		this.setColorText(DEF_PREF_COLOR_TEXT_VALUE);
		this.setImageSet(DEF_PREF_IMAGE_SET_VALUE);

		return {
			rootFeedsFolderId: DEF_PREF_ROOT_FEEDS_FOLDER_ID_VALUE,
			checkFeedsInterval: DEF_PREF_CHECK_FEEDS_INTERVAL_VALUE,
			checkFeedsWhenSbClosed: DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE,
			checkFeedsMethod: DEF_PREF_CHECK_FEEDS_METHOD_VALUE,
			fetchTimeout: DEF_PREF_FETCH_TIMEOUT_VALUE,
			showFeedStats: DEF_PREF_SHOW_FEED_STATS_VALUE,
			showFeedItemDesc: DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE,
			feedItemDescDelay: DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE,
			colorFeedItemDescBackground: DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE,
			colorFeedItemDescText: DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE,
			detectFeedsInWebPage: DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE,
			UIDensity: DEF_PREF_UI_DENSITY_VALUE,
			fontName: DEF_PREF_FONT_NAME_VALUE,
			fontSizePercent: DEF_PREF_FONT_SIZE_PERCENT_VALUE,
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
		DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE: DEF_PREF_CHECK_FEEDS_WHEN_SB_CLOSED_VALUE,
		DEF_PREF_CHECK_FEEDS_METHOD_VALUE: DEF_PREF_CHECK_FEEDS_METHOD_VALUE,
		DEF_PREF_FETCH_TIMEOUT_VALUE: DEF_PREF_FETCH_TIMEOUT_VALUE,
		DEF_PREF_SHOW_FEED_STATS_VALUE: DEF_PREF_SHOW_FEED_STATS_VALUE,
		DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE: DEF_PREF_SHOW_FEED_ITEM_DESC_VALUE,
		DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE: DEF_PREF_FEED_ITEM_DESC_DELAY_VALUE,
		DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE: DEF_PREF_COLOR_FEED_ITEM_DESC_BACKGROUND_VALUE,
		DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE: DEF_PREF_COLOR_FEED_ITEM_DESC_TEXT_VALUE,
		DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE: DEF_PREF_DETECT_FEEDS_IN_WEB_PAGE_VALUE,
		DEF_PREF_UI_DENSITY_VALUE: DEF_PREF_UI_DENSITY_VALUE,
		DEF_PREF_FONT_NAME_VALUE: DEF_PREF_FONT_NAME_VALUE,
		DEF_PREF_FONT_SIZE_PERCENT_VALUE: DEF_PREF_FONT_SIZE_PERCENT_VALUE,
		DEF_PREF_COLOR_BACKGROUND_VALUE: DEF_PREF_COLOR_BACKGROUND_VALUE,
		DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE: DEF_PREF_COLOR_DIALOG_BACKGROUND_VALUE,
		DEF_PREF_COLOR_SELECT_VALUE: DEF_PREF_COLOR_SELECT_VALUE,
		DEF_PREF_COLOR_TEXT_VALUE: DEF_PREF_COLOR_TEXT_VALUE,
		DEF_PREF_IMAGE_SET_VALUE: DEF_PREF_IMAGE_SET_VALUE,

		getRootFeedsFolderId: getRootFeedsFolderId,
		setRootFeedsFolderId: setRootFeedsFolderId,
		getCheckFeedsInterval: getCheckFeedsInterval,
		setCheckFeedsInterval: setCheckFeedsInterval,
		getCheckFeedsWhenSbClosed: getCheckFeedsWhenSbClosed,
		setCheckFeedsWhenSbClosed: setCheckFeedsWhenSbClosed,
		getCheckFeedsMethod: getCheckFeedsMethod,
		setCheckFeedsMethod: setCheckFeedsMethod,
		getFetchTimeout: getFetchTimeout,
		setFetchTimeout: setFetchTimeout,
		getShowFeedStats: getShowFeedStats,
		setShowFeedStats: setShowFeedStats,
		getShowFeedItemDesc: getShowFeedItemDesc,
		setShowFeedItemDesc: setShowFeedItemDesc,
		getFeedItemDescDelay: getFeedItemDescDelay,
		setFeedItemDescDelay: setFeedItemDescDelay,
		getColorFeedItemDescBackground: getColorFeedItemDescBackground,
		setColorFeedItemDescBackground: setColorFeedItemDescBackground,
		getColorFeedItemDescText: getColorFeedItemDescText,
		setColorFeedItemDescText: setColorFeedItemDescText,
		getDetectFeedsInWebPage: getDetectFeedsInWebPage,
		setDetectFeedsInWebPage: setDetectFeedsInWebPage,
		getUIDensity: getUIDensity,
		setUIDensity: setUIDensity,
		getFontName: getFontName,
		setFontName: setFontName,
		getFontSizePercent: getFontSizePercent,
		setFontSizePercent: setFontSizePercent,
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
	let m_regExpDiscoveryUrlFilter = "";

	//////////////////////////////////////////////////////////////////////
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

	//////////////////////////////////////////////////////////////////////
	async function disableElementTree(elm, value, blur = false, tags = undefined) {

		for (let i=0, len=elm.children.length; i<len; i++) {
			disableElementTree(elm.children[i], value, blur, tags);
		}

		let hasTabIndex = elm.hasAttribute("tabindex");

		if(tags === undefined || tags.includes(elm.tagName) || hasTabIndex) {

			if(elm.slHasAttributeTabIndex === undefined) {
				elm.slHasAttributeTabIndex = hasTabIndex;
				elm.slTabIndexOrgValue = elm.tabIndex;
			}

			if (value === true) {
				if(elm.disabled !== undefined) elm.disabled = true;
				elm.tabIndex = -1;
				elm.setAttribute("disabled", "");
				elm.classList.add("disabled");
				if(blur) elm.classList.add("disabledBlur");
			} else {
				if(elm.disabled !== undefined) elm.disabled = false;
				if(elm.slHasAttributeTabIndex) {
					elm.tabIndex = elm.slTabIndexOrgValue;
				} else {
					elm.removeAttribute("tabindex");
				}
				elm.removeAttribute("disabled");
				elm.classList.remove("disabled", "disabledBlur");
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function copyTextToClipboard(text) {
		let restoreFocus = document.activeElement;
		let input = document.createElement("textarea");
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
	function getScrollbarWidth() {

		if(m_savedScrollbarWidth === -1) {

			let inner = document.createElement("p");
			inner.style.width = "100%";
			inner.style.height = "200px";

			let outer = document.createElement("div");
			outer.style.position = "absolute";
			outer.style.top = "0px";
			outer.style.left = "0px";
			outer.style.visibility = "hidden";
			outer.style.width = "200px";
			outer.style.height = "150px";
			outer.style.overflow = "hidden";
			outer.appendChild(inner);

			document.body.appendChild(outer);
			let w1 = inner.offsetWidth;
			outer.style.overflow = "scroll";
			let w2 = inner.offsetWidth;
			if (w1 == w2) w2 = outer.clientWidth;

			document.body.removeChild(outer);

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

		let parts = value.split(":").map(x => parseInt(x));

		let abbr = parts[0] < 12 ? "AM" : "PM";
		parts[0] = parts[0] % 12 || 12;

		// do not use join to avoid seconds
		return parts[0].toLocaleString(undefined, {minimumIntegerDigits:2}) + ":" + parts[1].toLocaleString(undefined, {minimumIntegerDigits:2}) + " " + abbr;
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
	function scrollIntoViewIfNeeded(elm, docElement, scrollBehavior = "smooth") {
		let result = isElementInViewport(elm, docElement);

		//console.log("[Sage-Like]", elm.title, result);

		if(!result.inViewport) {
			elm.scrollIntoView({
				behavior: scrollBehavior,
				block: "nearest", //(result.fromTop ? "start" : "end"),
				inline: "nearest",
			});
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
					reject("Root feeds folder id not set (bookmarksFeedsAsCollection)");
					return;
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
				if (bookmarkIds.includes(bookmark.id))  {
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
					reject("Root feeds folder id not set (isDescendantOfRoot)");
					return;
				}

				// if the feeds folder itself was modified
				if (bookmarkIds.includes(folderId)) {
					resolve(true);
					return;
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

		try {
			if(url.startsWith(m_mozExtensionOrigin)) {
				return new URL(url.replace(m_mozExtensionOrigin, ""), base);
			} else if(url.startsWith("moz-extension:")) {
				return new URL(url.replace("moz-extension:", (new URL(base)).protocol));
			}
			return new URL(url);
		} catch (error) {
			return null;	// URL is not valid
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function invertColor(color) {

		let c = color.replace(/^#/, "");

		// convert to integer and invert bytes
		c = 0xFFFFFF ^ parseInt(c, 16);

		return "#" + (("000000" + c.toString(16)).slice(-6));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function contrastColor(color) {

		let c = color.replace(/^#/, "");

		let r = parseInt(c.substring(0, 2), 16);
		let g = parseInt(c.substring(2, 4), 16);
		let b = parseInt(c.substring(4, 6), 16);

		/// World Wide Web Consortium (W3C) standard formula for
		// calculating the perceived brightness of a color
		let brightness = (r * 299 + g * 587 + b * 114) / 1000;

		return (brightness < 123) ? "#ffffff" : "#000000";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getElementViewportRect(elm, innerWidth, innerHeight) {

		const RECT = elm.getBoundingClientRect();

		let vpRect = { left: 0, top: 0, width: 0, height: 0 };

		vpRect.left = parseInt(RECT.left < 0 ? 0 : Math.min(RECT.left, innerWidth));
		vpRect.top = parseInt(RECT.top < 0 ? 0 : Math.min(RECT.top, innerHeight));

		vpRect.width = parseInt(RECT.right <= 0 ? 0 : (RECT.left < 0 ? RECT.right : Math.min(RECT.width, Math.max(innerWidth - RECT.left, 0))));
		vpRect.height = parseInt(RECT.bottom <= 0 ? 0 : (RECT.top < 0 ? RECT.bottom : Math.min(RECT.height, Math.max(innerHeight - RECT.top, 0))));

		// private cases where the element (usualy html & body) is large as the innerSpace and its starting point is negative (scrolled)
		if (RECT.left < 0 && (RECT.right + Math.abs(RECT.left) === innerWidth)) {
			vpRect.width = innerWidth;
		}
		if (RECT.top < 0 && (RECT.bottom + Math.abs(RECT.top) === innerHeight)) {
			vpRect.height = innerHeight;
		}

		return vpRect;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getHScrollWidth() {
		return (document.body.scrollWidth > (window.innerWidth - getVScrollWidthHScrollIgnored()) ? getScrollbarWidth() : 0);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getVScrollWidth() {
		return (document.body.scrollHeight > (window.innerHeight - getHScrollWidthVScrollIgnored()) ? getScrollbarWidth() : 0);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getHScrollWidthVScrollIgnored() {
		return (document.body.scrollWidth > window.innerWidth ? getScrollbarWidth() : 0);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getVScrollWidthHScrollIgnored() {
		return (document.body.scrollHeight > window.innerHeight ? getScrollbarWidth() : 0);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getQueryStringValue(field) {
		let reg = new RegExp("[?&]" + field + "=([^&#]*)", "i");
		let value = reg.exec(window.location.href);
		return value ? value[1] : null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getBrowserVersion() {
		return new Promise((resolve) => {
			browser.runtime.getBrowserInfo().then((result) => {
				resolve(result.version);
				//resolve("64"); alert("always v64");
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedPreviewUrl(url) {
		return browser.extension.getURL("/feedPreview/feedPreview.html?urlFeed=" + encodeURIComponent(url));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedPreviewUrlByBrowserVersion(url, browserVersion) {
		// V64 RSS support dropped
		return browserVersion >= "64" ? getFeedPreviewUrl(url) : url;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isRegExpValid(pattern, flags) {
		try {
			new RegExp(pattern, flags);
			return true;
		} catch (error) {
			return false;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setLimitedInterval(callback, interval, repeats) {

		let intId = setInterval(() => {
			callback();
			if(--repeats === 0) {
				clearInterval(intId);
			}
		}, interval);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function validURL(url, objRetErr) {
		try {
			return new URL(url);
		} catch (error) {
			if(typeof(objRetErr) === "object") objRetErr.error = error;
			return null;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function incognitoErrorMessage(nativeError) {
		if(!!(nativeError.toString().match(/\bpermission for incognito mode\b/))) {
			return "Sage-Like extension is not allowed in private windows.<br>You can change that from the <a href='#' id='incognitoMsgOptionsHref'>Options page</a>.";
		}
		return nativeError.toString();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getRegExpDiscoveryUrlFilter() {

		if(m_regExpDiscoveryUrlFilter === "") {
			// also accept Sage-Like feed preview URL
			m_regExpDiscoveryUrlFilter = new RegExp("^((https?|file):)|" + slUtil.getFeedPreviewUrl("").escapeRegExp());
		}
		return m_regExpDiscoveryUrlFilter;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function asSafeTypeValue(entity, asNumeric = false) {

		// if object then get first object property
		let val = (!!entity && (typeof(entity) === "object")) ? entity[Object.keys(entity)[0]] : entity;

		// only if it's valid
		if(!!val) {
			val = (asNumeric ? Number(val) : String(val));
		}
		return (val === null) ? undefined : val;		// null is undefined
	}

	////////////////////////////////////////////////////////////////////////////////////
	function asPrettyByteSize(byteSize) {

		let notation = [' Bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];

		if(byteSize === 0) return (0 + notation[0]);

		let idx = Math.floor(Math.log(byteSize) / Math.log(1024));

		return (byteSize / Math.pow(1024, idx)).toFixed(2) * 1 + notation[idx];
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getMimeTypeIconPath(mimeType) {

		let pathToIcons = "/icons/mimeType/";
		let defaultIcon = pathToIcons + "file.svg";

		if(!!!mimeType) return defaultIcon;

		let mimeTypeIcons = [

			// archive
			{ mimeType: "application/gzip", icon: "file-archive.svg" },
			{ mimeType: "application/zip", icon: "file-archive.svg" },

			// doc
			{ mimeType: "application/pdf", icon: "file-pdf.svg" },
			{ mimeType: "application/msword", icon: "file-word.svg" },
			{ mimeType: "application/vnd.ms-word", icon: "file-word.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.text", icon: "file-word.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml", icon: "file-word.svg" },
			{ mimeType: "application/vnd.ms-excel", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.spreadsheet", icon: "file-excel.svg" },
			{ mimeType: "application/vnd.ms-powerpoint", icon: "file-powerpoint.svg" },
			{ mimeType: "application/vnd.openxmlformats-officedocument.presentationml", icon: "file-powerpoint.svg" },
			{ mimeType: "application/vnd.oasis.opendocument.presentation", icon: "file-powerpoint.svg" },
			{ mimeType: "text/plain", icon: "file-text.svg" },
			{ mimeType: "text/html", icon: "file-code.svg" },
			{ mimeType: "application/json", icon: "file-code.svg" },

			// media
			{ mimeType: "image", icon: "file-image.svg" },
			{ mimeType: "audio", icon: "file-audio.svg" },
			{ mimeType: "video", icon: "file-video.svg" },
		];

		for(let i=0, len=mimeTypeIcons.length; i<len; i++) {
			if(mimeType.startsWith(mimeTypeIcons[i].mimeType)) {
				return (pathToIcons + mimeTypeIcons[i].icon);
			}
		}

		return defaultIcon;
	}

	return {
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
		contrastColor: contrastColor,
		getQueryStringValue: getQueryStringValue,
		getBrowserVersion: getBrowserVersion,
		getFeedPreviewUrl: getFeedPreviewUrl,
		getFeedPreviewUrlByBrowserVersion: getFeedPreviewUrlByBrowserVersion,
		isRegExpValid: isRegExpValid,
		setLimitedInterval: setLimitedInterval,
		validURL: validURL,
		incognitoErrorMessage: incognitoErrorMessage,
		getRegExpDiscoveryUrlFilter: getRegExpDiscoveryUrlFilter,
		getElementViewportRect: getElementViewportRect,
		getHScrollWidth: getHScrollWidth,
		getVScrollWidth: getVScrollWidth,
		asSafeTypeValue: asSafeTypeValue,
		asPrettyByteSize: asPrettyByteSize,
		getMimeTypeIconPath: getMimeTypeIconPath,
	};

})();
