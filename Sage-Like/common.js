"use strict"

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
}

/////////////////////////////////////////////////////////////////////////////////////////////
let Global = (function() {

	const _EXTRA_URL_PARAM_NO_REDIRECT_SPLIT = Object.freeze(["_SLWxoPenuRl", "nOtinFEeDPREVIew"]);

	const _VIEW_CONTENT_LOAD_FLAG = Object.freeze({
		NO_VIEW_LOADED:		parseInt("00", 2),
		TREE_VIEW_LOADED:	parseInt("01", 2),
		LIST_VIEW_LOADED:	parseInt("10", 2),
		ALL_VIEWS_LOADED:	parseInt("11", 2),
	});

	const _FEED_PREVIEW_REQ_SOURCE = Object.freeze({
		NONE: "",
		BK_WEB_REQUEST: "bwr",
		PAGE_POPUP: "ppu",
		CONTEXTMENU_TREE_HANDLER: "cth",
		DISCOVERY_VIEW: "dsv",
		RSS_TREE_VIEW: "rtv",
		CONTEXTMENU_PAGE_LINK: "cpl",
	});

	const _HEADER_AUTHORIZATION_BASIC_NULL = Object.freeze({ Authorization: "Basic " + btoa(":") });

	const _IMAGE_SET = (numOfSet) => {
		// there's 7 image sets in the '/icons' folder: 'open-[0-6].png'
		numOfSet = parseInt(numOfSet);
		if( 0>numOfSet || 6<numOfSet ) throw new Error("Invalid number of image set: " + numOfSet);

		return Object.freeze({
			IMG_OPEN_FOLDER:			"url(\"/icons/open-{0}.png\")".format([numOfSet]),
			IMG_CLOSED_FOLDER:			"url(\"/icons/closed-{0}.png\")".format([numOfSet]),
			IMG_TREE_ITEM:				"url(\"/icons/rss-{0}.png\")".format([numOfSet]),
			IMG_TREE_ITEM_LOADING:		"url(\"/icons/loading-{0}.gif\")".format([numOfSet]),
			IMG_TREE_ITEM_ERROR:		"url(\"/icons/error-{0}.png\")".format([numOfSet]),
			IMG_TREE_ITEM_UNAUTHORIZED:	"url(\"/icons/unauthorized-{0}.png\")".format([numOfSet]),
		});
	}

	return Object.freeze({
		ID_UL_RSS_TREE_VIEW: "rssTreeView",
		ID_UL_RSS_LIST_VIEW: "rssListView",

		// RSS Tree View classes
		CLS_RTV_LI_TREE_ITEM: "rtvTreeItem",
		CLS_RTV_LI_TREE_FOLDER: "rtvTreeFolder",
		CLS_RTV_LI_TREE_FEED: "rtvTreeFeed",
		CLS_RTV_DIV_TREE_ITEM_CAPTION: "rtvCaption",
		CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE: "rtvCaptionTitle",
		CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS: "rtvCaptionStats",

		// RSS List View classes
		CLS_RLV_LI_LIST_ITEM: "rlvListItem",

		// Message IDs
		MSG_ID_PREFERENCES_CHANGED:						101,
		MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID:			102,
		MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER:		103,
		MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER:		104,
		MSG_ID_GET_PAGE_FEED_COUNT:						105,
		MSG_ID_GET_PAGE_DATA:							106,
		MSG_ID_WAIT_AND_HIDE_POPUP:						107,
		MSG_ID_ADD_NEW_DISCOVERED_FEEDS:				108,
		MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW:			109,
		MSG_ID_RSS_TREE_CREATED_OK:						110,
		MSG_ID_CLOSE_ALL_SIDEBAR_PANELS:				111,
		MSG_ID_UPDATE_RLV_FEED_ITEMS_STATE_TO_VISITED:	112,

		// Message Details IDs
		MSGD_PREF_CHANGE_ALL:									1001,
		MSGD_PREF_CHANGE_ROOT_FOLDER:							1002,
		MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL:					1003,
		MSGD_PREF_CHANGE_CHECK_FEEDS_WHEN_SB_CLOSED:			1004,
		MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD:					1005,
		MSGD_PREF_CHANGE_SHOW_FEED_STATS:						1006,
		MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC:					1007,
		MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY:					1008,
		MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC_ATTACH:			1009,
		MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS:					1010,
		MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE:				1011,
		MSGD_PREF_CHANGE_UI_DENSITY:							1012,
		MSGD_PREF_CHANGE_FONT_NAME:								1013,
		MSGD_PREF_CHANGE_FONT_SIZE_PERCENT:						1014,
		MSGD_PREF_CHANGE_COLORS:								1015,
		MSGD_PREF_CHANGE_IMAGES:								1016,
		MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE:						1017,
		MSGD_PREF_CHANGE_ANIMATED_SLIDE_DOWN_PANEL:				1018,
		MSGD_PREF_CHANGE_SORT_FEED_ITEMS:						1019,
		MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES:				1020,
		MSGD_PREF_CHANGE_SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW:	1021,

		ROOT_FEEDS_FOLDER_ID_NOT_SET: "_rootFeedsFolderIdNotSet_",
		BOOKMARKS_ROOT_GUID: "root________",
		BOOKMARKS_ROOT_MENU_GUID: "menu________",
		DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME: "Sage-Like Feeds",
		STR_TITLE_EMPTY: "<no title>",
		EXTRA_URL_PARAM_NO_REDIRECT_SPLIT: _EXTRA_URL_PARAM_NO_REDIRECT_SPLIT,
		EXTRA_URL_PARAM_NO_REDIRECT: _EXTRA_URL_PARAM_NO_REDIRECT_SPLIT.join("="),

		VIEW_CONTENT_LOAD_FLAG: _VIEW_CONTENT_LOAD_FLAG,
		FEED_PREVIEW_REQ_SOURCE: _FEED_PREVIEW_REQ_SOURCE,

		HEADER_AUTHORIZATION_BASIC_NULL: _HEADER_AUTHORIZATION_BASIC_NULL,

		IMAGE_SET: _IMAGE_SET,
	});
})();

/////////////////////////////////////////////////////////////////////////////////////////////
let slPrototypes = (function() {

	let m_sRxATag = "</?a\\b[^>]*>";
	let m_sRxScriptTag = "<script\\b[^>]*>(([\\s\\S]*?)</\\s*\\bscript\\b\\s*>)?";
	let m_sRxAudioTag = "<audio\\b[^>]*>(([\\s\\S]*?)</\\s*\\baudio\\b\\s*>)?";
	let m_sRxVideoTag = "<video\\b[^>]*>(([\\s\\S]*?)</\\s*\\bvideo\\b\\s*>)?";
	let m_sRxLinkTag = "</?link\\b[^>]*>";
	let m_sRxFrameTag = "</?i?frame(set)?\\b[^>]*?>([\\s\\S]*?</i?frame(set)?\\b[^>]*?>)?";
	let m_sRxEmbedTag = "</?embed\\b[^>]*>";
	let m_sRxAppletTag = "</?applet\\b[^>]*>";
	let m_sRxObjectTag = "</?object\\b[^>]*>";
	let m_sRxStyleTag = "<style\\b[^>]*>(([\\s\\S]*?)</\\s*\\bstyle\\b\\s*>)?";
	let m_sRxBrTag = "</?br\\b[^>]*?/?>";

	let m_sRxUnsafeTags = m_sRxScriptTag + "|" + m_sRxLinkTag + "|" + m_sRxFrameTag + "|" + m_sRxEmbedTag + "|" + m_sRxAppletTag + "|" + m_sRxObjectTag + "|" + m_sRxStyleTag;
	let m_sRxContentTags = m_sRxATag + "|" + m_sRxUnsafeTags;
	let m_sRxAudioVideoTags = m_sRxAudioTag + "|" + m_sRxVideoTag;
	let m_sRxMultiBrTags = `(${m_sRxBrTag}\\s*){2,}`;
	let m_sRx3PlusBrTags = `(${m_sRxBrTag}\\s*){3,}`;
	let m_sRxStartMultiBrTags = `^(${m_sRxBrTag}\\s*)+`;

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
	}
	String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

	//////////////////////////////////////////////////////////////////////
	String.prototype.trunc = function(n) {
		return (this.length > n) ? this.substring(0, n - 1) + "\u2026" : this;
	}

	//////////////////////////////////////////////////////////////////////
	String.prototype.midTrunc = function(n) {
		return (this.length > n) ? this.slice(0, n/2) + "\u2026" + this.slice(-(n/2)) : this;
	}

	//////////////////////////////////////////////////////////////////////
	String.prototype.consolidateWhiteSpaces = function() {
		return this
			.trim()
			.replace(String.prototype.consolidateWhiteSpaces.regexMultipleWhiteSpaces, " ")
			.replace(String.prototype.consolidateWhiteSpaces.regexWhiteSpace, " ");
	}
	String.prototype.consolidateWhiteSpaces.regexWhiteSpace = new RegExp("\\s", "g");
	String.prototype.consolidateWhiteSpaces.regexMultipleWhiteSpaces = new RegExp("\\s{2,}", "g");

	////////////////////////////////////////////////////////////////////////////////////
	String.prototype.htmlEntityToLiteral = function() {
		// this is NOT safe; may be used as an attack vector if result is displayed to user
		return this
			.replace(/&(amp|#0*38);/gim, "&")	// First handle ampersand for cases like "&amp;#8211;" (long dash)
			.replace(/&#([\d]+);/gm, (matched, number) => { return String.fromCharCode(number); })	// Handle numeric entities (dec)
			.replace(String.prototype.htmlEntityToLiteral.regex, (matched) => {
				return String.prototype.htmlEntityToLiteral.entities[matched];	// Handle nemonic entities
		});
	}
	String.prototype.htmlEntityToLiteral.entities = {
		"&quot;": "\"",
		"&apos;": "'",
		"&gt;": ">",
		"&lt;": "<",
		"&nbsp;": " ",
		"&emsp;": " ",
		"&reg;": "®",
		"&copy;": "©",
		"&trade;": "™",
		"&cent;": "¢",
		"&pound;": "£",
		"&yen;": "¥",
		"&euro;": "€",
		"&raquo;": "»",
		"&laquo;": "«",
		"&bull;": "•",
		"&mdash;": "—",
	}
	String.prototype.htmlEntityToLiteral.regex = new RegExp(Object.keys(String.prototype.htmlEntityToLiteral.entities).join("|"), "gim");

	////////////////////////////////////////////////////////////////////////////////////
	String.prototype.unknownNamedEntityInXMLToDecimal = function() {
		// The only named entities known in XML are: '&amp;', '&quot;', '&lt;', '&gt;', '&apos;'.
		return this.replace(String.prototype.unknownNamedEntityInXMLToDecimal.regex, (matched) => {
			return String.prototype.unknownNamedEntityInXMLToDecimal.entities[matched];
		});
	}
	String.prototype.unknownNamedEntityInXMLToDecimal.entities = {
		"&nbsp;": "&#160;",
		"&emsp;": "&#8195;",
		"&reg;": "&#174;",
		"&copy;": "&#169;",
		"&trade;": "&#8482;",
		"&cent;": "&#162;",
		"&pound;": "&#163;",
		"&yen;": "&#165;",
		"&euro;": "&#8364;",
		"&raquo;": "&#x187;",
		"&laquo;": "&#171;",
		"&bull;": "&#8226;",
		"&mdash;": "&#8212;",
		"&ndash;": "&#8211;",
		"&thinsp;": "&#8201;",
		"&hellip;": "&#8230;",
		"&middot;": "&#183;",
		"&zwnj;": "&#8204;",
		"&zwj;": "&#8205;",
		"&rsquo;": "&#8217;",
		"&lsquo;": "&#8216;",
		"&sbquo;": "&#8218;",
		"&ldquo;": "&#8220;",
		"&rdquo;": "&#8221;",
		"&bdquo;": "&#8222;",
	}
	String.prototype.unknownNamedEntityInXMLToDecimal.regex = new RegExp(Object.keys(String.prototype.unknownNamedEntityInXMLToDecimal.entities).join("|"), "gim");

	//////////////////////////////////////////////////////////////////////
	String.prototype.escapeMarkup = function() {
		return this.replace(String.prototype.escapeMarkup.regex, (match) => {
			return String.prototype.escapeMarkup.markupReservedCharacters[match];
		});
	}
	String.prototype.escapeMarkup.markupReservedCharacters = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#039;",
	}
	String.prototype.escapeMarkup.regex = new RegExp("[" + Object.keys(String.prototype.escapeMarkup.markupReservedCharacters).join("") + "]", "gm");

	//////////////////////////////////////////////////////////////////////
	String.prototype.unescapeMarkup = function() {
		return this.replace(String.prototype.unescapeMarkup.regex, (match) => {
			return Object.keys(String.prototype.escapeMarkup.markupReservedCharacters).find((key) => String.prototype.escapeMarkup.markupReservedCharacters[key] === match);
		});
	}
	String.prototype.unescapeMarkup.regex = new RegExp(Object.values(String.prototype.escapeMarkup.markupReservedCharacters).join("|"), "gm");

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
	}
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
	String.prototype.stripHtmlTags.regexAnyTag = new RegExp("</?[a-zA-Z0-9]+\\b[^>]*?>", "gm");		// faster then: /<\/?[a-z][a-z0-9]*\b[^>]*?>/gim
	String.prototype.stripHtmlTags.regexMultiBrTag = new RegExp(m_sRxMultiBrTags, "gim");
	String.prototype.stripHtmlTags.regex3PlusBrTag = new RegExp(m_sRx3PlusBrTags, "gim");
	String.prototype.stripHtmlTags.regexStartMultiBrTags = new RegExp(m_sRxStartMultiBrTags, "i");
	String.prototype.stripHtmlTags.regexStyleTag = new RegExp(m_sRxStyleTag, "gim");
	String.prototype.stripHtmlTags.regexStyleAttr = new RegExp("\\bstyle\\s*=\\s*(\"[\\s\\S]*?\"|'[\\s\\S]*?')", "gim");

	//////////////////////////////////////////////////////////////////////
	String.prototype.stripUnsafeHtmlComponents = function() {
		let oRef = String.prototype.stripUnsafeHtmlComponents;
		return this
			.htmlEntityToLiteral()
			.replace(oRef.regexUnsafeTags, "")
			.replace(oRef.regexJavascript, "'#striped'")
			.replace(oRef.regexImg1x1, "")
			.replace(oRef.regexEventAttr, "$1");
	}
	String.prototype.stripUnsafeHtmlComponents.regexUnsafeTags = new RegExp(m_sRxUnsafeTags, "gim");
	String.prototype.stripUnsafeHtmlComponents.regexJavascript = new RegExp("('\\bjavascript:([\\s\\S]*?)')|(\"\\bjavascript:([\\s\\S]*?)\")", "gim");
	String.prototype.stripUnsafeHtmlComponents.regexImg1x1 = new RegExp("<img\\b[^>]*\\b(width|height)\\b\\s*=\\s*[\"']0*1[\"'][^>]*\\b(width|height)\\b\\s*=\\s*[\"']0*1[\"'][^>]*>", "gim");
	String.prototype.stripUnsafeHtmlComponents.regexEventAttr = new RegExp("(<[a-zA-Z0-9]+\\b[^>]*)\\bon[a-zA-Z]+\\s*=\\s*(\"[\\s\\S]*?\"|'[\\s\\S]*?')", "gim");

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
	if(typeof(String.prototype.trimStart) !== "function") {
		String.prototype.trimStart = function() {
			return this.trimLeft();
		}
	}

	//////////////////////////////////////////////////////////////////////
	Date.prototype.toWebExtensionLocaleString = function() {
		return this.toLocaleString(undefined, Date.prototype.toWebExtensionLocaleString.options);
	}
	Date.prototype.toWebExtensionLocaleString.options = { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false };

	//////////////////////////////////////////////////////////////////////
	Date.prototype.toWebExtensionLocaleShortString = function() {
		return this.toLocaleString(undefined, Date.prototype.toWebExtensionLocaleShortString.options);
	}
	Date.prototype.toWebExtensionLocaleShortString.options = { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false };

	//////////////////////////////////////////////////////////////////////
	Date.prototype.getRelativeShortLocaleString = function() {

		let oRef = Date.prototype.getRelativeShortLocaleString;
		let msSpan = Date.now() - this.getTime();
		let text = msSpan > 0 ? "% ago" : "in %";
		let o = {};

		msSpan = Math.abs(msSpan);

		if( oRef.relYear(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} year${o.v>1?`s`:``}`);
		} else if( oRef.relMon(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} month${o.v>1?`s`:``}`);
		} else if( oRef.relDay(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} day${o.v>1?`s`:``}`);
		} else if( oRef.relHour(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} hour${o.v>1?`s`:``}`);
		} else if( oRef.relMin(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} minute${o.v>1?`s`:``}`);
		} else if( oRef.relSec(msSpan, o) > 0 ) {
			return text.replace("%", `${o.v} second${o.v>1?`s`:``}`);
		} else {
			return "just now";
		}
	}
	Date.prototype.getRelativeShortLocaleString.relYear = (ms, o) => o.v = Math.trunc(ms/31536000000);	// Millisec in 1 year : 31536000000 (1000*60*60*24*365)
	Date.prototype.getRelativeShortLocaleString.relMon  = (ms, o) => o.v = Math.trunc(ms/2592000000);	// Millisec in 1 mon  :  2592000000 (1000*60*60*24*30)
	Date.prototype.getRelativeShortLocaleString.relDay  = (ms, o) => o.v = Math.trunc(ms/86400000);		// Millisec in 1 day  :    86400000 (1000*60*60*24)
	Date.prototype.getRelativeShortLocaleString.relHour = (ms, o) => o.v = Math.trunc(ms/3600000);		// Millisec in 1 hour :     3600000 (1000*60*60)
	Date.prototype.getRelativeShortLocaleString.relMin  = (ms, o) => o.v = Math.trunc(ms/60000);		// Millisec in 1 min  :       60000 (1000*60)
	Date.prototype.getRelativeShortLocaleString.relSec  = (ms, o) => o.v = Math.trunc(ms/1000);			// Millisec in 1 sec  :        1000

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

	const PREF = Object.freeze({
		OPEN_TREE_FOLDERS:						{ name: "pref_openSubTrees",					default: {}			},
		TREE_FEEDS_DATA:						{ name: "pref_treeFeedsData",					default: {}			},
		IS_EXTENSION_INSTALLED:					{ name: "pref_isExtensionInstalled",			default: null		},
		TREE_SELECTED_ITEM_ID:					{ name: "pref_treeSelectedItemId",				default: null		},
		TREE_SCROLL_TOP:						{ name: "pref_treeScrollTop",					default: 0			},
		SPLITTER_TOP:							{ name: "pref_splitterTop",						default: undefined	},
		DROP_INSIDE_FOLDER_SHOW_MSG_COUNT:		{ name: "pref_dropInsideFolderShowMsgCount",	default: 5			},
		FEEDS_FILTER:							{ name: "pref_feedsFilter",						default: ""			},
		AGGRESSIVE_DISCOVERY_LEVEL:				{ name: "pref_aggressiveDiscoveryLevel",		default: "0"		},
		MSG_SHOW_COUNT_HOVER_FILTER_TEXT_BOX:	{ name: "pref_hoverFilterTextBoxShowMsgCount",	default: 3			},
		MSG_SHOW_COUNT_REAPPLY_FILTER:			{ name: "pref_reapplyFilterShowMsgCount",		default: 3			},
		NOTEPAD_DARK_COLOR_SCHEME:				{ name: "pref_notepadDarkColorScheme",			default: undefined	},
		POPUP_SHOW_COUNT_NOTEPAD_HELP:			{ name: "pref_notepadHelpShowPopupCount",		default: 3			},
		MSG_SHOW_COUNT_UNAUTHORIZED_FEED:		{ name: "pref_unauthorizedFeedShowMsgCount",	default: 3			},
	});

	let m_localStorage = browser.storage.local;

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	function getOpenTreeFolders()					{ return _getPreferenceValue(PREF.OPEN_TREE_FOLDERS); }
	function getTreeFeedsData()						{ return _getPreferenceValue(PREF.TREE_FEEDS_DATA); }
	function getIsExtensionInstalled()				{ return _getPreferenceValue(PREF.IS_EXTENSION_INSTALLED); }
	function getTreeSelectedItemId()				{ return _getPreferenceValue(PREF.TREE_SELECTED_ITEM_ID); }
	function getTreeScrollTop()						{ return _getPreferenceValue(PREF.TREE_SCROLL_TOP); }
	function getSplitterTop()						{ return _getPreferenceValue(PREF.SPLITTER_TOP); }
	function getDropInsideFolderShowMsgCount()		{ return _getPreferenceValue(PREF.DROP_INSIDE_FOLDER_SHOW_MSG_COUNT); }
	function getFeedsFilter()						{ return _getPreferenceValue(PREF.FEEDS_FILTER); }
	function getAggressiveDiscoveryLevel()			{ return _getPreferenceValue(PREF.AGGRESSIVE_DISCOVERY_LEVEL); }
	function getMsgShowCountHoverFilterTextBox()	{ return _getPreferenceValue(PREF.MSG_SHOW_COUNT_HOVER_FILTER_TEXT_BOX); }
	function getMsgShowCountReapplyFilter()			{ return _getPreferenceValue(PREF.MSG_SHOW_COUNT_REAPPLY_FILTER); }
	function getNotepadDarkColorScheme()			{ return _getPreferenceValue(PREF.NOTEPAD_DARK_COLOR_SCHEME); }
	function getPopupShowCountNotepadHelp()			{ return _getPreferenceValue(PREF.POPUP_SHOW_COUNT_NOTEPAD_HELP); }
	function getMsgShowCountUnauthorizedFeed()		{ return _getPreferenceValue(PREF.MSG_SHOW_COUNT_UNAUTHORIZED_FEED); }

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	function setOpenTreeFolders(value)					{ return _setPreferenceValue(PREF.OPEN_TREE_FOLDERS, value); }
	function setTreeFeedsData(value)					{ return _setPreferenceValue(PREF.TREE_FEEDS_DATA, value); }
	function setIsExtensionInstalled(value)				{ return _setPreferenceValue(PREF.IS_EXTENSION_INSTALLED, value); }
	function setTreeSelectedItemId(value)				{ return _setPreferenceValue(PREF.TREE_SELECTED_ITEM_ID, value); }
	function setTreeScrollTop(value)					{ return _setPreferenceValue(PREF.TREE_SCROLL_TOP, value); }
	function setSplitterTop(value)						{ return _setPreferenceValue(PREF.SPLITTER_TOP, value); }
	function setDropInsideFolderShowMsgCount(value)		{ return _setPreferenceValue(PREF.DROP_INSIDE_FOLDER_SHOW_MSG_COUNT, value); }
	function setFeedsFilter(value)						{ return _setPreferenceValue(PREF.FEEDS_FILTER, value); }
	function setAggressiveDiscoveryLevel(value)			{ return _setPreferenceValue(PREF.AGGRESSIVE_DISCOVERY_LEVEL, value); }
	function setMsgShowCountHoverFilterTextBox(value)	{ return _setPreferenceValue(PREF.MSG_SHOW_COUNT_HOVER_FILTER_TEXT_BOX, value); }
	function setMsgShowCountReapplyFilter(value)		{ return _setPreferenceValue(PREF.MSG_SHOW_COUNT_REAPPLY_FILTER, value); }
	function setNotepadDarkColorScheme(value)			{ return _setPreferenceValue(PREF.NOTEPAD_DARK_COLOR_SCHEME, value); }
	function setPopupShowCountNotepadHelp(value)		{ return _setPreferenceValue(PREF.POPUP_SHOW_COUNT_NOTEPAD_HELP, value); }
	function setMsgShowCountUnauthorizedFeed(value)		{ return _setPreferenceValue(PREF.MSG_SHOW_COUNT_UNAUTHORIZED_FEED, value); }

	//////////////////////////////////////////////////////////////////////
	function getTreeViewRestoreData() {
		return new Promise((resolve) => {
			m_localStorage.get([
				PREF.TREE_SCROLL_TOP.name,
				PREF.TREE_SELECTED_ITEM_ID.name,
				PREF.FEEDS_FILTER.name,
			]).then((result) => {
				resolve({
					treeScrollTop: result[PREF.TREE_SCROLL_TOP.name] === undefined ? PREF.TREE_SCROLL_TOP.default : result[PREF.TREE_SCROLL_TOP.name],
					treeSelectedItemId: result[PREF.TREE_SELECTED_ITEM_ID.name] === undefined ? PREF.TREE_SELECTED_ITEM_ID.default : result[PREF.TREE_SELECTED_ITEM_ID.name],
					feedsFilter: result[PREF.FEEDS_FILTER.name] === undefined ? PREF.FEEDS_FILTER.default : result[PREF.FEEDS_FILTER.name],
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		for(const p of Object.values(PREF)) {
			_setPreferenceValue(p, p.default);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _getPreferenceValue(pref) {
		return new Promise((resolve) => {
			m_localStorage.get(pref.name).then((result) => {
				resolve(result[pref.name] === undefined ? pref.default : result[pref.name]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function _setPreferenceValue(pref, value) {
		return m_localStorage.set({ [pref.name]: value });
	}

	return {
		getOpenTreeFolders: getOpenTreeFolders,
		getTreeFeedsData: getTreeFeedsData,
		getIsExtensionInstalled: getIsExtensionInstalled,
		getTreeSelectedItemId: getTreeSelectedItemId,
		getTreeScrollTop: getTreeScrollTop,
		getSplitterTop: getSplitterTop,
		getDropInsideFolderShowMsgCount: getDropInsideFolderShowMsgCount,
		getFeedsFilter: getFeedsFilter,
		getAggressiveDiscoveryLevel: getAggressiveDiscoveryLevel,
		getMsgShowCountHoverFilterTextBox: getMsgShowCountHoverFilterTextBox,
		getMsgShowCountReapplyFilter: getMsgShowCountReapplyFilter,
		getNotepadDarkColorScheme: getNotepadDarkColorScheme,
		getPopupShowCountNotepadHelp: getPopupShowCountNotepadHelp,
		getMsgShowCountUnauthorizedFeed: getMsgShowCountUnauthorizedFeed,

		setOpenTreeFolders: setOpenTreeFolders,
		setTreeFeedsData: setTreeFeedsData,
		setIsExtensionInstalled: setIsExtensionInstalled,
		setTreeSelectedItemId: setTreeSelectedItemId,
		setTreeScrollTop: setTreeScrollTop,
		setSplitterTop: setSplitterTop,
		setDropInsideFolderShowMsgCount: setDropInsideFolderShowMsgCount,
		setFeedsFilter: setFeedsFilter,
		setAggressiveDiscoveryLevel: setAggressiveDiscoveryLevel,
		setMsgShowCountHoverFilterTextBox: setMsgShowCountHoverFilterTextBox,
		setMsgShowCountReapplyFilter: setMsgShowCountReapplyFilter,
		setNotepadDarkColorScheme: setNotepadDarkColorScheme,
		setPopupShowCountNotepadHelp: setPopupShowCountNotepadHelp,
		setMsgShowCountUnauthorizedFeed: setMsgShowCountUnauthorizedFeed,

		getTreeViewRestoreData: getTreeViewRestoreData,

		restoreDefaults: restoreDefaults,
	};

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let prefs = (function() {

	// user preferences

	const FOLDER_CLICK_ACTION_VALUES = {
		singleClick: 0,
		doubleClick: 1,
	}

	const CLICK_OPENS_FEED_PREVIEW_VALUES = {
		openNo: 0,
		openTab: 1,
		openNewTab: 2,
	}

	const FEED_ITEM_OPEN_METHOD_VALUES = {
		openInTab: 0,
		openInNewTab: 1,
	}

	const MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES = {
		none: 0,
		all: 1,
		whenVisible: 2,
	}

	const PREF = Object.freeze({
		ROOT_FEEDS_FOLDER_ID:				{ name: "pref_rootFeedsFolderId",				default: Global.ROOT_FEEDS_FOLDER_ID_NOT_SET			},
		CHECK_FEEDS_INTERVAL:				{ name: "pref_checkFeedsInterval",				default: "3600000"										},
		CHECK_FEEDS_WHEN_SB_CLOSED:			{ name: "pref_checkFeedsWhenSbClosed",			default: true											},
		CHECK_FEEDS_METHOD:					{ name: "pref_checkFeedsMethod",				default: "3;2000"										},
		FETCH_TIMEOUT:						{ name: "pref_fetchTimeout",					default: "60"											},
		SORT_FEED_ITEMS:					{ name: "pref_sortFeedItems",					default: true											},
		FOLDER_CLICK_ACTION:				{ name: "pref_folderClickAction",				default: FOLDER_CLICK_ACTION_VALUES.doubleClick			},
		CLICK_OPENS_FEED_PREVIEW:			{ name: "pref_clickOpensFeedPreview",			default: CLICK_OPENS_FEED_PREVIEW_VALUES.openNo			},
		FEED_ITEM_OPEN_METHOD:				{ name: "pref_feedItemOpenMethod",				default: FEED_ITEM_OPEN_METHOD_VALUES.openInTab			},
		SHOW_FEED_STATS:					{ name: "pref_showFeedStats",					default: true											},
		SHOW_FEED_ITEM_DESC:				{ name: "pref_showFeedItemDesc",				default: true											},
		FEED_ITEM_DESC_DELAY:				{ name: "pref_feedItemDescDelay",				default: 800											},
		SHOW_FEED_ITEM_DESC_ATTACH:			{ name: "pref_showFeedItemDescAttach",			default: false											},
		COLOR_FEED_ITEM_DESC_BACKGROUND:	{ name: "pref_colorFeedItemDescBk",				default: "#FFFDAC"										},
		COLOR_FEED_ITEM_DESC_TEXT:			{ name: "pref_colorFeedItemDescText",			default: "#000000"										},
		DETECT_FEEDS_IN_WEB_PAGE:			{ name: "pref_detectFeedsInWebPage",			default: true											},
		UI_DENSITY:							{ name: "pref_UIDensity",						default: "19;18"										},
		FONT_NAME:							{ name: "perf_fontName",						default: "(Browser Default)"							},	// typo in the name
		FONT_SIZE_PERCENT:					{ name: "perf_fontSizePercent",					default: "100"											},	// typo in the name
		COLOR_BACKGROUND:					{ name: "pref_colorBk",							default: "#F3F3F3"										},
		COLOR_DIALOG_BACKGROUND:			{ name: "pref_colorDlgBk",						default: "#E3E3E3"										},
		COLOR_SELECT:						{ name: "pref_colorSelect",						default: "#F3C8BA"										},
		COLOR_TEXT:							{ name: "pref_colorText",						default: "#000000"										},
		IMAGE_SET:							{ name: "pref_imageSet",						default: 0												},
		USE_CUSTOM_CSS_FEED_PREVIEW:		{ name: "pref_useCustomCSSFeedPreview",			default: false											},
		ANIMATED_SLIDE_DOWN_PANEL:			{ name: "pref_animatedSlideDownPanel",			default: true											},
		STRICT_RSS_CONTENT_TYPES:			{ name: "pref_strictRssContentTypes",			default: true											},
		MARK_FEED_PREVIEW_URLS_AS_VISITED:	{ name: "pref_markFeedPreviewUrlsAsVisited",	default: MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES.none	},
		SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW:	{ name: "pref_showTryOpenLinkInFeedPreview",	default: false											},
		CUSTOM_CSS_SOURCE_HASH:				{ name: "pref_customCSSSourceHash",				default: ""												},
		CUSTOM_CSS_SOURCE:					{ name: "pref_customCSSSource",					default: ""												},
	});

	const PREFS_BANNED_FROM_EXPORT = [
		PREF.ANIMATED_SLIDE_DOWN_PANEL.name,
		PREF.STRICT_RSS_CONTENT_TYPES.name
	];

	let m_localStorage = browser.storage.local;

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	function getRootFeedsFolderId()				{ return _getPreferenceValue(PREF.ROOT_FEEDS_FOLDER_ID); }
	function getCheckFeedsInterval()			{ return _getPreferenceValue(PREF.CHECK_FEEDS_INTERVAL); }
	function getCheckFeedsWhenSbClosed()		{ return _getPreferenceValue(PREF.CHECK_FEEDS_WHEN_SB_CLOSED); }
	function getCheckFeedsMethod()				{ return _getPreferenceValue(PREF.CHECK_FEEDS_METHOD); }
	function getFetchTimeout()					{ return _getPreferenceValue(PREF.FETCH_TIMEOUT); }
	function getSortFeedItems()					{ return _getPreferenceValue(PREF.SORT_FEED_ITEMS); }
	function getFolderClickAction()				{ return _getPreferenceValue(PREF.FOLDER_CLICK_ACTION); }
	function getClickOpensFeedPreview()			{ return _getPreferenceValue(PREF.CLICK_OPENS_FEED_PREVIEW); }
	function getFeedItemOpenMethod()			{ return _getPreferenceValue(PREF.FEED_ITEM_OPEN_METHOD); }
	function getShowFeedStats()					{ return _getPreferenceValue(PREF.SHOW_FEED_STATS); }
	function getShowFeedItemDesc()				{ return _getPreferenceValue(PREF.SHOW_FEED_ITEM_DESC); }
	function getFeedItemDescDelay()				{ return _getPreferenceValue(PREF.FEED_ITEM_DESC_DELAY); }
	function getShowFeedItemDescAttach()		{ return _getPreferenceValue(PREF.SHOW_FEED_ITEM_DESC_ATTACH); }
	function getColorFeedItemDescBackground()	{ return _getPreferenceValue(PREF.COLOR_FEED_ITEM_DESC_BACKGROUND); }
	function getColorFeedItemDescText()			{ return _getPreferenceValue(PREF.COLOR_FEED_ITEM_DESC_TEXT); }
	function getDetectFeedsInWebPage()			{ return _getPreferenceValue(PREF.DETECT_FEEDS_IN_WEB_PAGE); }
	function getUIDensity()						{ return _getPreferenceValue(PREF.UI_DENSITY); }
	function getFontName()						{ return _getPreferenceValue(PREF.FONT_NAME); }
	function getFontSizePercent()				{ return _getPreferenceValue(PREF.FONT_SIZE_PERCENT); }
	function getColorBackground()				{ return _getPreferenceValue(PREF.COLOR_BACKGROUND); }
	function getColorDialogBackground()			{ return _getPreferenceValue(PREF.COLOR_DIALOG_BACKGROUND); }
	function getColorSelect()					{ return _getPreferenceValue(PREF.COLOR_SELECT); }
	function getColorText()						{ return _getPreferenceValue(PREF.COLOR_TEXT); }
	function getImageSet()						{ return _getPreferenceValue(PREF.IMAGE_SET); }
	function getUseCustomCSSFeedPreview()		{ return _getPreferenceValue(PREF.USE_CUSTOM_CSS_FEED_PREVIEW); }
	function getAnimatedSlideDownPanel()		{ return _getPreferenceValue(PREF.ANIMATED_SLIDE_DOWN_PANEL); }
	function getStrictRssContentTypes()			{ return _getPreferenceValue(PREF.STRICT_RSS_CONTENT_TYPES); }
	function getMarkFeedPreviewUrlsAsVisited()	{ return _getPreferenceValue(PREF.MARK_FEED_PREVIEW_URLS_AS_VISITED); }
	function getShowTryOpenLinkInFeedPreview()	{ return _getPreferenceValue(PREF.SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW); }
	function getCustomCSSSourceHash()			{ return _getPreferenceValue(PREF.CUSTOM_CSS_SOURCE_HASH); }
	function getCustomCSSSource()				{ return _getPreferenceValue(PREF.CUSTOM_CSS_SOURCE); }

	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	function setRootFeedsFolderId(value)			{ return _setPreferenceValue(PREF.ROOT_FEEDS_FOLDER_ID, value); }
	function setCheckFeedsInterval(value)			{ return _setPreferenceValue(PREF.CHECK_FEEDS_INTERVAL, value); }
	function setCheckFeedsWhenSbClosed(value)		{ return _setPreferenceValue(PREF.CHECK_FEEDS_WHEN_SB_CLOSED, value); }
	function setCheckFeedsMethod(value)				{ return _setPreferenceValue(PREF.CHECK_FEEDS_METHOD, value); }
	function setFetchTimeout(value)					{ return _setPreferenceValue(PREF.FETCH_TIMEOUT, value); }
	function setSortFeedItems(value)				{ return _setPreferenceValue(PREF.SORT_FEED_ITEMS, value); }
	function setFolderClickAction(value)			{ return _setPreferenceValue(PREF.FOLDER_CLICK_ACTION, value); }
	function setClickOpensFeedPreview(value)		{ return _setPreferenceValue(PREF.CLICK_OPENS_FEED_PREVIEW, value); }
	function setFeedItemOpenMethod(value)			{ return _setPreferenceValue(PREF.FEED_ITEM_OPEN_METHOD, value); }
	function setShowFeedStats(value)				{ return _setPreferenceValue(PREF.SHOW_FEED_STATS, value); }
	function setShowFeedItemDesc(value)				{ return _setPreferenceValue(PREF.SHOW_FEED_ITEM_DESC, value); }
	function setFeedItemDescDelay(value)			{ return _setPreferenceValue(PREF.FEED_ITEM_DESC_DELAY, value); }
	function setShowFeedItemDescAttach(value)		{ return _setPreferenceValue(PREF.SHOW_FEED_ITEM_DESC_ATTACH, value); }
	function setColorFeedItemDescBackground(value)	{ return _setPreferenceValue(PREF.COLOR_FEED_ITEM_DESC_BACKGROUND, value); }
	function setColorFeedItemDescText(value)		{ return _setPreferenceValue(PREF.COLOR_FEED_ITEM_DESC_TEXT, value); }
	function setDetectFeedsInWebPage(value)			{ return _setPreferenceValue(PREF.DETECT_FEEDS_IN_WEB_PAGE, value); }
	function setUIDensity(value)					{ return _setPreferenceValue(PREF.UI_DENSITY, value); }
	function setFontName(value)						{ return _setPreferenceValue(PREF.FONT_NAME, value); }
	function setFontSizePercent(value)				{ return _setPreferenceValue(PREF.FONT_SIZE_PERCENT, value); }
	function setColorBackground(value)				{ return _setPreferenceValue(PREF.COLOR_BACKGROUND, value); }
	function setColorDialogBackground(value)		{ return _setPreferenceValue(PREF.COLOR_DIALOG_BACKGROUND, value); }
	function setColorSelect(value)					{ return _setPreferenceValue(PREF.COLOR_SELECT, value); }
	function setColorText(value)					{ return _setPreferenceValue(PREF.COLOR_TEXT, value); }
	function setImageSet(value)						{ return _setPreferenceValue(PREF.IMAGE_SET, value); }
	function setUseCustomCSSFeedPreview(value)		{ return _setPreferenceValue(PREF.USE_CUSTOM_CSS_FEED_PREVIEW, value); }
	function setAnimatedSlideDownPanel(value)		{ return _setPreferenceValue(PREF.ANIMATED_SLIDE_DOWN_PANEL, value); }
	function setStrictRssContentTypes(value)		{ return _setPreferenceValue(PREF.STRICT_RSS_CONTENT_TYPES, value); }
	function setMarkFeedPreviewUrlsAsVisited(value)	{ return _setPreferenceValue(PREF.MARK_FEED_PREVIEW_URLS_AS_VISITED, value); }
	function setShowTryOpenLinkInFeedPreview(value)	{ return _setPreferenceValue(PREF.SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW, value); }
	function setCustomCSSSource(value) {
		return new Promise(async (resolve) => {

			await _setPreferenceValue(PREF.CUSTOM_CSS_SOURCE, value);

			// This value is set only here and only if PREF_CUSTOM_CSS_SOURCE has content.
			// This hash is also an indicator to the existence of a css source. Therefore when there is no source the hash will be empty.
			if(!!value && value.length > 0) {
				let hash = await slUtil.hashCode(value);
				await _setPreferenceValue(PREF.CUSTOM_CSS_SOURCE_HASH, hash);
			} else {
				await _setPreferenceValue(PREF.CUSTOM_CSS_SOURCE_HASH, PREF.CUSTOM_CSS_SOURCE_HASH.default);
			}
			resolve();
		});
	}

	//////////////////////////////////////////////////////////////////////
	function getAllPreferences() {
		return new Promise(async (resolve) => {
			let objPrefs = _getAllPreferencesForExport();
			for(const prefName of Object.keys(objPrefs)) {
				objPrefs[prefName] = await _getPreferenceValue({ name: prefName, default: objPrefs[prefName] });
			}
			resolve(objPrefs);
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setAllPreferences(objPrefs) {
		return new Promise(async (resolve) => {
			let existingPrefs = _getAllPreferencesForExport();
			for(const prefName of Object.keys(objPrefs)) {
				if(existingPrefs.hasOwnProperty(prefName)) {
					await _setPreferenceValue({ name: prefName }, objPrefs[prefName]);
				}
			}
			resolve();
		});
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		for(const p of Object.values(PREF)) {
			_setPreferenceValue(p, p.default);
		}
		return _getAllPreferencesObject(true);
	}

	//////////////////////////////////////////////////////////////////////
	function _getPreferenceValue(pref) {
		return new Promise((resolve) => {
			m_localStorage.get(pref.name).then((result) => {
				resolve(result[pref.name] === undefined ? pref.default : result[pref.name]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function _setPreferenceValue(pref, value) {
		return m_localStorage.set({ [pref.name]: value });
	}

	//////////////////////////////////////////////////////////////////////
	function _getAllPreferencesForExport() {
		let obj = _getAllPreferencesObject(false);
		for(let i=0, len=PREFS_BANNED_FROM_EXPORT.length; i<len; i++) {
			delete obj[PREFS_BANNED_FROM_EXPORT[i]];
		}
		return obj;
	}

	//////////////////////////////////////////////////////////////////////
	function _getAllPreferencesObject(trimKeyNamePrefix = false) {
		let obj = {};
		for(const p of Object.values(PREF)) {
			if(trimKeyNamePrefix) {
				obj[p.name.replace(/^p[re]{2}f_/, "")] = p.default;	// handle typo
			} else {
				obj[p.name] = p.default;
			}
		}
		return obj;
	}

	return {
		FOLDER_CLICK_ACTION_VALUES: FOLDER_CLICK_ACTION_VALUES,
		CLICK_OPENS_FEED_PREVIEW_VALUES: CLICK_OPENS_FEED_PREVIEW_VALUES,
		FEED_ITEM_OPEN_METHOD_VALUES: FEED_ITEM_OPEN_METHOD_VALUES,
		MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES: MARK_FEED_PREVIEW_URLS_AS_VISITED_VALUES,

		DEFAULTS: _getAllPreferencesObject(true),

		getRootFeedsFolderId: getRootFeedsFolderId,
		getCheckFeedsInterval: getCheckFeedsInterval,
		getCheckFeedsWhenSbClosed: getCheckFeedsWhenSbClosed,
		getCheckFeedsMethod: getCheckFeedsMethod,
		getFetchTimeout: getFetchTimeout,
		getSortFeedItems: getSortFeedItems,
		getFolderClickAction: getFolderClickAction,
		getClickOpensFeedPreview: getClickOpensFeedPreview,
		getFeedItemOpenMethod: getFeedItemOpenMethod,
		getShowFeedStats: getShowFeedStats,
		getShowFeedItemDesc: getShowFeedItemDesc,
		getFeedItemDescDelay: getFeedItemDescDelay,
		getShowFeedItemDescAttach: getShowFeedItemDescAttach,
		getColorFeedItemDescBackground: getColorFeedItemDescBackground,
		getColorFeedItemDescText: getColorFeedItemDescText,
		getDetectFeedsInWebPage: getDetectFeedsInWebPage,
		getUIDensity: getUIDensity,
		getFontName: getFontName,
		getFontSizePercent: getFontSizePercent,
		getColorBackground: getColorBackground,
		getColorDialogBackground: getColorDialogBackground,
		getColorSelect: getColorSelect,
		getColorText: getColorText,
		getImageSet: getImageSet,
		getUseCustomCSSFeedPreview: getUseCustomCSSFeedPreview,
		getAnimatedSlideDownPanel: getAnimatedSlideDownPanel,
		getStrictRssContentTypes: getStrictRssContentTypes,
		getMarkFeedPreviewUrlsAsVisited: getMarkFeedPreviewUrlsAsVisited,
		getShowTryOpenLinkInFeedPreview: getShowTryOpenLinkInFeedPreview,
		getCustomCSSSourceHash: getCustomCSSSourceHash,
		getCustomCSSSource: getCustomCSSSource,

		setRootFeedsFolderId: setRootFeedsFolderId,
		setCheckFeedsInterval: setCheckFeedsInterval,
		setCheckFeedsWhenSbClosed: setCheckFeedsWhenSbClosed,
		setCheckFeedsMethod: setCheckFeedsMethod,
		setFetchTimeout: setFetchTimeout,
		setSortFeedItems: setSortFeedItems,
		setFolderClickAction: setFolderClickAction,
		setClickOpensFeedPreview: setClickOpensFeedPreview,
		setFeedItemOpenMethod: setFeedItemOpenMethod,
		setShowFeedStats: setShowFeedStats,
		setShowFeedItemDesc: setShowFeedItemDesc,
		setFeedItemDescDelay: setFeedItemDescDelay,
		setShowFeedItemDescAttach: setShowFeedItemDescAttach,
		setColorFeedItemDescBackground: setColorFeedItemDescBackground,
		setColorFeedItemDescText: setColorFeedItemDescText,
		setDetectFeedsInWebPage: setDetectFeedsInWebPage,
		setUIDensity: setUIDensity,
		setFontName: setFontName,
		setFontSizePercent: setFontSizePercent,
		setColorBackground: setColorBackground,
		setColorDialogBackground: setColorDialogBackground,
		setColorSelect: setColorSelect,
		setColorText: setColorText,
		setImageSet: setImageSet,
		setUseCustomCSSFeedPreview: setUseCustomCSSFeedPreview,
		setAnimatedSlideDownPanel: setAnimatedSlideDownPanel,
		setStrictRssContentTypes: setStrictRssContentTypes,
		setMarkFeedPreviewUrlsAsVisited: setMarkFeedPreviewUrlsAsVisited,
		setShowTryOpenLinkInFeedPreview: setShowTryOpenLinkInFeedPreview,
		setCustomCSSSource: setCustomCSSSource,

		getAllPreferences: getAllPreferences,
		setAllPreferences: setAllPreferences,

		restoreDefaults: restoreDefaults,
	}

})();

/////////////////////////////////////////////////////////////////////////////////////////////
let slUtil = (function() {

	let m_savedScrollbarWidth = -1;
	let m_mozExtensionOrigin = "";
	let	m_mozExtensionExecutionPath = "";
	let m_mimeTypeIcons = null;

	////////////////////////////////////////////////////////////////////////////////////
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

	////////////////////////////////////////////////////////////////////////////////////
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
	function writeTextToClipboard(text) {

		getBrowserVersion().then(async (version) => {

			if(parseInt(version) >= 63) {

				try {
					await navigator.clipboard.writeText(text);
					return;
				} catch (error) {
					console.log("[Sage-Like]", "navigator.clipboard.writeText()", error);
				}
			}

			// fallback
			try {
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
			} catch (error) {
				console.log("[Sage-Like]", "document.execCommand('copy');", error);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function readTextFromClipboard() {

		return new Promise((resolve, reject) => {

			getBrowserVersion().then((version) => {

				if(parseInt(version) >= 63) {

					navigator.clipboard.readText().then((text) => {
						return resolve(text);
					}).catch((error) => {
						console.log("[Sage-Like]", "navigator.clipboard.readText()", error);
					});
				}

				// fallback
				try {
					let restoreFocus = document.activeElement;
					let input = document.createElement("textarea");
					let style = input.style;
					style.height = style.width = style.borderWidth = style.padding = style.margin = 0;
					input.contentEditable = true;
					document.body.appendChild(input);
					input.focus();
					document.execCommand("paste");
					restoreFocus.focus();
					resolve(input.value);
					document.body.removeChild(input);
				} catch (error) {
					console.log("[Sage-Like]", "document.execCommand('paste');", error);
					reject(new Error("Failed to read data from clipboard"));
				}
			});
		});
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

	////////////////////////////////////////////////////////////////////////////////////
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
	function isContentOverflowing(elm) {
		return ((elm.offsetWidth - 1) < elm.scrollWidth);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hashCode(str) {
		return new Promise((resolve) => {
			crypto.subtle.digest("SHA-256", (new TextEncoder()).encode(str)).then((hashBuffer) => {
				resolve((Array.from(new Uint8Array(hashBuffer))).map(b => b.toString(16).padStart(2, '0')).join(''));
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function asSafeNumericDate(dateValue) {

		// dateValue could be a string
		let safeDate = new Date(dateValue);

		// another try
		if(isNaN(safeDate) && typeof(dateValue) === "string") {
			// assume 'dd/mm/yyyy hh:MM:ss', modify to 'yyyy-mm-ddThh:MM:ss'
			let modDateValue = dateValue.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}:\d{1,2}:\d{1,2})$/, "$3-$2-$1T$4");
			safeDate = new Date(modDateValue);
		}

		// make sure date is valid and save as simple numeric
		return (!isNaN(safeDate) && (safeDate instanceof Date)) ? safeDate.getTime() : Date.now();
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
	function bookmarksFoldersAsCollection() {

		return new Promise((resolve, reject) => {

			let bmFolders = {};
			let collectFolders = function (bmFolders, bookmark) {
				if (bookmark.type === "folder") {
					bmFolders[bookmark.id] = { id: bookmark.id, title: bookmark.title };
					for(let i=0, len=bookmark.children.length; i<len; i++) {
						collectFolders(bmFolders, bookmark.children[i]);
					}
				}
			};

			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					return reject("Root feeds folder id not set (bookmarksFoldersAsCollection)");
				}

				browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
					collectFolders(bmFolders, bookmarks[0]);
					resolve(bmFolders);
				}).catch((error) => reject(error));
			}).catch((error) => reject(error));
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function bookmarksFeedsAsCollection(asArray) {

		return new Promise((resolve, reject) => {

			let bmFeeds = asArray ? [] : {};
			let collectFeeds = function (bmFeeds, bookmark) {
				if (bookmark.type === "folder") {
					for(let i=0, len=bookmark.children.length; i<len; i++) {
						collectFeeds(bmFeeds, bookmark.children[i]);
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

				if (folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					return reject("Root feeds folder id not set (bookmarksFeedsAsCollection)");
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

				if (folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					return reject("Root feeds folder id not set (isDescendantOfRoot)");
				}

				// if the feeds folder itself was modified
				if (bookmarkIds.includes(folderId)) {
					return resolve(true);
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
			m_mozExtensionOrigin = browser.runtime.getURL("");
			m_mozExtensionExecutionPath = (new URL((new URL(document.URL)).pathname, m_mozExtensionOrigin)).toString();
			m_mozExtensionExecutionPath = m_mozExtensionExecutionPath.substring(0, m_mozExtensionExecutionPath.lastIndexOf("/")+1);
		}

		try {
			if(url.startsWith(m_mozExtensionExecutionPath)) {
				return new URL(url.replace(m_mozExtensionExecutionPath, ""), base);
			} else if(url.startsWith(m_mozExtensionOrigin)) {
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
		return getURLQueryStringValue(window.location.href, field);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getURLQueryStringValue(url, field) {
		let reg = new RegExp("[?&]" + field + "=([^&#]*)", "i");
		let value = reg.exec(url);
		return value ? decodeURIComponent(value[1]) : null;
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
	function getParkedTabUrl(url, title) {
		return browser.runtime.getURL("/parkedTab/parked.html?prkTitle=" + encodeURIComponent(title) + "&prkUrl=" + encodeURIComponent(url));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedPreviewUrlPrefix() {
		return browser.runtime.getURL("/feedPreview/feedPreview.html?urlFeed=");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getFeedPreviewUrl(url, source = Global.FEED_PREVIEW_REQ_SOURCE.NONE) {
		return (getFeedPreviewUrlPrefix() + encodeURIComponent(url) + "&src=" + encodeURIComponent(source));
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
			let oUrl = new URL(url);
			if( !!(oUrl.protocol.match(/^(https?|ftp|file):$/i)) ) return oUrl;
			throw new Error("Unsupported URL protocol");
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
		return nativeError.toString().escapeMarkup();
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

		let notation = [" Bytes", " KB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"];

		if(byteSize === 0) return (0 + notation[0]);

		let idx = Math.floor(Math.log(byteSize) / Math.log(1024));

		return (byteSize / Math.pow(1024, idx)).toFixed(2) * 1 + notation[idx];
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getMimeTypeIconPath(mimeType) {

		let pathToIcons = "/icons/mimeType/";

		if(m_mimeTypeIcons === null) {
			m_mimeTypeIcons = [

				// default
				{ mimeType: "file", icon: "file.svg" },

				// archive
				{ mimeType: "application/zip", icon: "file-archive.svg" },
				{ mimeType: "application/gzip", icon: "file-archive.svg" },

				// doc
				{ mimeType: "text/plain", icon: "file-text.svg" },
				{ mimeType: "text/html", icon: "file-code.svg" },
				{ mimeType: "application/json", icon: "file-code.svg" },
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

				// media
				{ mimeType: "image", icon: "file-image.svg" },
				{ mimeType: "audio", icon: "file-audio.svg" },
				{ mimeType: "video", icon: "file-video.svg" },
			];
		}

		for(let i=0, len=m_mimeTypeIcons.length; i<len; i++) {
			if(mimeType.startsWith(m_mimeTypeIcons[i].mimeType)) {
				return (pathToIcons + m_mimeTypeIcons[i].icon);
			}
		}

		return pathToIcons + m_mimeTypeIcons[0].icon;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function nbAlert(msg) {
		// Non blocking alert()
		setTimeout(() => alert(msg));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getLanguageDir(text, firstWordRanking = true) {

		const RTLChars = "\\u0591-\\u07FF\\uFB1D-\\uFDFD\\uFE70-\\uFEFC";
		const LTRChars = "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02B8\\u0300-\\u0590\\u0800-\\u1FFF\\u2C00-\\uFB1C\\uFDFE-\\uFE6F\\uFEFD-\\uFFFF";

		const reRTLChars = new RegExp("[" + RTLChars + "]", "gm");
		const reLTRChars = new RegExp("[" + LTRChars + "]", "gm");

		const strTest = text.trimStart().substring(0, 256);

		// if not found then convert the null to empty array
		let countRTL = (strTest.match(reRTLChars) || []).length;
		let countLTR = (strTest.match(reLTRChars) || []).length;

		if(firstWordRanking) {

			let reFirstWord, firstWordLen, firstWordRankFactor = 2;

			reFirstWord = new RegExp("^[" + RTLChars + "]+");
			firstWordLen = (strTest.match(reFirstWord) || [""])[0].length;
			if(firstWordLen > 0) {
				countRTL += firstWordLen * firstWordRankFactor;
			} else {

				reFirstWord = new RegExp("^[" + LTRChars + "]+");
				firstWordLen = (strTest.match(reFirstWord) || [""])[0].length;
				if(firstWordLen > 0) {
					countLTR += firstWordLen * firstWordRankFactor;
				}
			}
		}

		return (countRTL > countLTR) ? "rtl" : "ltr";		// empty string for default 'ltr'
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getUniqId(prefix = "", length = 32) {

		let dec2hex = (d) => ( (d < 10) ? "0" + String(d) : d.toString(16) );
		let values = new Uint8Array(length / 2);

		window.crypto.getRandomValues(values);
		return prefix + Array.from(values, dec2hex).join("");
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function setSafeBrowserActionBadgeText(details) {

		// Fx v59 has no support for windowId
		if(parseInt(await getBrowserVersion()) <= 59) {
			delete details.windowId;
		}
		browser.browserAction.setBadgeText(details);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getStringExportFileName(dateVal, prefix, ext) {
		let dateValStr = dateVal.getFullYear() +
			(dateVal.getMonth()+1).toLocaleString('en', {minimumIntegerDigits:2}) +
			dateVal.getDate().toLocaleString('en', {minimumIntegerDigits:2}) + "-" +
			dateVal.getHours().toLocaleString('en', {minimumIntegerDigits:2}) +
			dateVal.getMinutes().toLocaleString('en', {minimumIntegerDigits:2}) +
			dateVal.getSeconds().toLocaleString('en', {minimumIntegerDigits:2});
		return `${prefix}${dateValStr}.${ext}`;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchWithTimeout(url, init, timeout) {
		return Promise.race([
			fetch(url, init),
			new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout) ),
		]);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function debug_storedKeys_list(n=3) {
		if(n & 1) internalPrefs.getOpenTreeFolders().then((obj) => console.log("[Sage-Like] -lsk-FLD", Object.keys(obj).length, obj));
		if(n & 2) internalPrefs.getTreeFeedsData().then((obj) => console.log("[Sage-Like] -lsk-FED", Object.keys(obj).length, obj));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function debug_storedKeys_purge(n=3, millisecOld=1) {
		if(n & 1) (new OpenTreeFolders()).purge(millisecOld);
		if(n & 2) (new TreeFeedsData()).purge(millisecOld);
	}

	return {
		random1to100: random1to100,
		disableElementTree: disableElementTree,
		writeTextToClipboard: writeTextToClipboard,
		readTextFromClipboard: readTextFromClipboard,
		addUrlToBrowserHistory: addUrlToBrowserHistory,
		deleteUrlFromBrowserHistory: deleteUrlFromBrowserHistory,
		getScrollbarWidth: getScrollbarWidth,
		hasHScroll: hasHScroll,
		hasVScroll: hasVScroll,
		isContentOverflowing: isContentOverflowing,
		hashCode: hashCode,
		asSafeNumericDate: asSafeNumericDate,
		sleep: sleep,
		formatTimeWithAbbreviations: formatTimeWithAbbreviations,
		calcMillisecondTillNextTime: calcMillisecondTillNextTime,
		isElementInViewport: isElementInViewport,
		scrollIntoViewIfNeeded: scrollIntoViewIfNeeded,
		numberOfVItemsInViewport: numberOfVItemsInViewport,
		bookmarksFoldersAsCollection: bookmarksFoldersAsCollection,
		bookmarksFeedsAsCollection: bookmarksFeedsAsCollection,
		isDescendantOfRoot: isDescendantOfRoot,
		reloadSageLikeWebExtensionAndTab: reloadSageLikeWebExtensionAndTab,
		replaceMozExtensionOriginURL: replaceMozExtensionOriginURL,
		invertColor: invertColor,
		contrastColor: contrastColor,
		getQueryStringValue: getQueryStringValue,
		getURLQueryStringValue: getURLQueryStringValue,
		getBrowserVersion: getBrowserVersion,
		getParkedTabUrl: getParkedTabUrl,
		getFeedPreviewUrlPrefix: getFeedPreviewUrlPrefix,
		getFeedPreviewUrl: getFeedPreviewUrl,
		getFeedPreviewUrlByBrowserVersion: getFeedPreviewUrlByBrowserVersion,
		isRegExpValid: isRegExpValid,
		setLimitedInterval: setLimitedInterval,
		validURL: validURL,
		incognitoErrorMessage: incognitoErrorMessage,
		getElementViewportRect: getElementViewportRect,
		getHScrollWidth: getHScrollWidth,
		getVScrollWidth: getVScrollWidth,
		asSafeTypeValue: asSafeTypeValue,
		asPrettyByteSize: asPrettyByteSize,
		getMimeTypeIconPath: getMimeTypeIconPath,
		nbAlert: nbAlert,
		getLanguageDir: getLanguageDir,
		getUniqId: getUniqId,
		setSafeBrowserActionBadgeText: setSafeBrowserActionBadgeText,
		getStringExportFileName: getStringExportFileName,
		fetchWithTimeout: fetchWithTimeout,
		debug_storedKeys_list: debug_storedKeys_list,
		debug_storedKeys_purge: debug_storedKeys_purge,
	};

})();
