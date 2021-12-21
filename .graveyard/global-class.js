/////////////////////////////////////////////////////////////////////////////////////////////
class Global {

	static get ID_UL_RSS_TREE_VIEW() { return "rssTreeView"; }
	static get ID_UL_RSS_LIST_VIEW() { return "rssListView"; }

	// RSS Tree View classes
	static get CLS_RTV_LI_TREE_ITEM() { return "rtvTreeItem"; }
	static get CLS_RTV_LI_TREE_FOLDER() { return "rtvTreeFolder"; }
	static get CLS_RTV_LI_TREE_FEED() { return "rtvTreeFeed"; }
	static get CLS_RTV_DIV_TREE_ITEM_CAPTION() { return "rtvCaption"; }
	static get CLS_RTV_SPAN_TREE_ITEM_CAPTION_TITLE() { return "rtvCaptionTitle"; }
	static get CLS_RTV_SPAN_TREE_ITEM_CAPTION_STATS() { return "rtvCaptionStats"; }

	// RSS List View classes
	static get CLS_RLV_LI_LIST_ITEM() { return "rlvListItem"; }

	// Message IDs
	static get MSG_ID_PREFERENCES_CHANGED()						{ return 101; }
	static get MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID()			{ return 102; }
	static get MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER()		{ return 103; }
	static get MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER()		{ return 104; }
	static get MSG_ID_GET_PAGE_FEED_COUNT()						{ return 105; }
	static get MSG_ID_GET_PAGE_DATA()							{ return 106; }
	static get MSG_ID_WAIT_AND_HIDE_POPUP()						{ return 107; }
	static get MSG_ID_ADD_NEW_DISCOVERED_FEEDS()				{ return 108; }
	static get MSG_ID_QUERY_SIDEBAR_OPEN_FOR_WINDOW()			{ return 109; }
	static get MSG_ID_RSS_TREE_CREATED_OK()						{ return 110; }
	static get MSG_ID_CLOSE_ALL_SIDEBAR_PANELS()				{ return 111; }
	static get MSG_ID_UPDATE_RLV_FEED_ITEMS_STATE_TO_VISITED()	{ return 112; }

	// Message Details IDs
	static get MSGD_PREF_CHANGE_ALL()									{ return 1001; }
	static get MSGD_PREF_CHANGE_ROOT_FOLDER()							{ return 1002; }
	static get MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL()					{ return 1003; }
	static get MSGD_PREF_CHANGE_CHECK_FEEDS_WHEN_SB_CLOSED()			{ return 1004; }
	static get MSGD_PREF_CHANGE_CHECK_FEEDS_METHOD()					{ return 1005; }
	static get MSGD_PREF_CHANGE_SHOW_FEED_STATS()						{ return 1006; }
	static get MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC()					{ return 1007; }
	static get MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY()					{ return 1008; }
	static get MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC_ATTACH()			{ return 1009; }
	static get MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS()					{ return 1010; }
	static get MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE()				{ return 1011; }
	static get MSGD_PREF_CHANGE_UI_DENSITY()							{ return 1012; }
	static get MSGD_PREF_CHANGE_FONT_NAME()								{ return 1013; }
	static get MSGD_PREF_CHANGE_FONT_SIZE_PERCENT()						{ return 1014; }
	static get MSGD_PREF_CHANGE_COLORS()								{ return 1015; }
	static get MSGD_PREF_CHANGE_IMAGES()								{ return 1016; }
	static get MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE()						{ return 1017; }
	static get MSGD_PREF_CHANGE_ANIMATED_SLIDE_DOWN_PANEL()				{ return 1018; }
	static get MSGD_PREF_CHANGE_SORT_FEED_ITEMS()						{ return 1019; }
	static get MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES()				{ return 1020; }
	static get MSGD_PREF_CHANGE_SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW()	{ return 1021; }

	static get ROOT_FEEDS_FOLDER_ID_NOT_SET() { return "_rootFeedsFolderIdNotSet_"; }
	static get BOOKMARKS_ROOT_GUID() { return "root________"; }
	static get BOOKMARKS_ROOT_MENU_GUID() { return "menu________"; }
	static get DEFAULT_FEEDS_BOOKMARKS_FOLDER_NAME() { return "Sage-Like Feeds"; }
	static get STR_TITLE_EMPTY() { return "<no title>"; }
	static get EXTRA_URL_PARAM_NO_REDIRECT_SPLIT() { return ["_SLWxoPenuRl", "nOtinFEeDPREVIew"]; }
	static get EXTRA_URL_PARAM_NO_REDIRECT() { return EXTRA_URL_PARAM_NO_REDIRECT_SPLIT.join("="); }

	static get VIEW_CONTENT_LOAD_FLAG() {
		if(!!!this._VIEW_CONTENT_LOAD_FLAG) {
			this._VIEW_CONTENT_LOAD_FLAG = Object.freeze({
				NO_VIEW_LOADED:		parseInt("00", 2),
				TREE_VIEW_LOADED:	parseInt("01", 2),
				LIST_VIEW_LOADED:	parseInt("10", 2),
				ALL_VIEWS_LOADED:	parseInt("11", 2),
			});
		}
		return this._VIEW_CONTENT_LOAD_FLAG;
	}

	static get FEED_PREVIEW_REQ_SOURCE() {
		if(!!!this._FEED_PREVIEW_REQ_SOURCE) {
			this._FEED_PREVIEW_REQ_SOURCE = Object.freeze({
				NONE: "",
				BK_WEB_REQUEST: "bwr",
				PAGE_POPUP: "ppu",
				CONTEXTMENU_TREE_HANDLER: "cth",
				DISCOVERY_VIEW: "dsv",
				RSS_TREE_VIEW: "rtv",
				CONTEXTMENU_PAGE_LINK: "cpl",
			});
		}
		return this._FEED_PREVIEW_REQ_SOURCE;
	}

	static IMAGE_SET(numOfSet) {

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
};
