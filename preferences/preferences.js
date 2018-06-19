"use strict";

let preferences = (function() {

	const MENU_GUID = "menu________";

	let m_elmRootFeedsFolder;
	let m_elmColorBackground;
	let m_elmColorDialogBackground;
	let m_elmColorSelect;
	let m_elmColorText;

	let m_elmBtnRestoreDefaults;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

    	m_elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
    	m_elmColorBackground = document.getElementById("colorBk");
    	m_elmColorDialogBackground = document.getElementById("colorDlgBk");
    	m_elmColorSelect = document.getElementById("colorSelect");
    	m_elmColorText = document.getElementById("colorText");

    	m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

    	getSavedPreferences();
    	addEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
    	window.removeEventListener("unload", onUnload);

    	m_elmRootFeedsFolder.removeEventListener("change", onChangeRootFeedsFolder);
    	m_elmColorBackground.removeEventListener("change", onChangeColorBackground);
    	m_elmColorDialogBackground.removeEventListener("change", onChangeColorDialogBackground);
    	m_elmColorSelect.removeEventListener("change", onChangeColorSelect);
    	m_elmColorText.removeEventListener("change", onChangeColorText);

    	m_elmBtnRestoreDefaults.removeEventListener("click", onClickBtnRestoreDefaults);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getSavedPreferences() {

    	prefs.getRootFeedsFolderId().then((value) => {
        	createSelectFeedFolderElements().then(() => {
            	m_elmRootFeedsFolder.value = value;
            	setTimeout(() => {
                	flashRootFeedsFolderElement();
            	}, 500);
        	});
    	});

    	prefs.getColorBackground().then((color) => {
        	m_elmColorBackground.value = color;
    	});

    	prefs.getColorDialogBackground().then((color) => {
        	m_elmColorDialogBackground.value = color;
    	});

    	prefs.getColorSelect().then((color) => {
        	m_elmColorSelect.value = color;
    	});

    	prefs.getColorText().then((color) => {
        	m_elmColorText.value = color;
    	});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

    	// save preferences when changed
    	m_elmRootFeedsFolder.addEventListener("change", onChangeRootFeedsFolder);
    	m_elmColorBackground.addEventListener("change", onChangeColorBackground);
    	m_elmColorDialogBackground.addEventListener("change", onChangeColorDialogBackground);
    	m_elmColorSelect.addEventListener("change", onChangeColorSelect);
    	m_elmColorText.addEventListener("change", onChangeColorText);

    	// restore defaults when requestes
    	m_elmBtnRestoreDefaults.addEventListener("click", onClickBtnRestoreDefaults);
	}

	//==================================================================================
	//=== Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeRootFeedsFolder(event) {
    	prefs.setRootFeedsFolderId(m_elmRootFeedsFolder.value);
    	flashRootFeedsFolderElement();
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_ROOT_FOLDER);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorBackground(event) {
    	prefs.setColorBackground(m_elmColorBackground.value);
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_COLORS);
	};

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorDialogBackground(event) {
    	prefs.setColorDialogBackground(m_elmColorDialogBackground.value);
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorSelect(event) {
    	prefs.setColorSelect(m_elmColorSelect.value);
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorText(event) {
    	prefs.setColorText(m_elmColorText.value);
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRestoreDefaults(event) {
    	internalPrefs.restoreDefaults();
    	let defPrefs = prefs.restoreDefaults();

    	m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
    	m_elmColorBackground.value = defPrefs.colorBackground
    	m_elmColorDialogBackground.value = defPrefs.colorDialogBackground
    	m_elmColorSelect.value = defPrefs.colorSelect
    	m_elmColorText.value = defPrefs.colorText
    	flashRootFeedsFolderElement();
    	broadcastPreferencesUpdated(slGlobalConsts.MSG_DETAILS_PREFERENCE_ALL);
	}

	//==================================================================================
	//=== <select> functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function flashRootFeedsFolderElement() {

    	let selected = m_elmRootFeedsFolder.options[m_elmRootFeedsFolder.selectedIndex];

    	if(selected === undefined || selected.value === slGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
        	m_elmRootFeedsFolder.classList.add("flash");
    	} else {
        	m_elmRootFeedsFolder.classList.remove("flash");
    	}
	}
	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedFolderElements() {

    	return new Promise((resolve) => {

        	while(m_elmRootFeedsFolder.firstChild) {
            	m_elmRootFeedsFolder.removeChild(m_elmRootFeedsFolder.firstChild);
        	}

        	browser.bookmarks.getSubTree(MENU_GUID).then((bookmarkItems) => {

            	let elmOption = createTagOption(slGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
            	m_elmRootFeedsFolder.appendChild(elmOption);

            	for(let child of bookmarkItems[0].children) {
                	createSelectFeedFolderElement(child, 0);
            	}
            	resolve();
        	});

    	});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedFolderElement(bookmarkItem, indent) {

    	// it's a folder
    	if(bookmarkItem.url === undefined) {
        	let elmOption = createTagOption(bookmarkItem.id, "&emsp;".repeat(indent) + bookmarkItem.title);
        	m_elmRootFeedsFolder.appendChild(elmOption);
        	indent++;
        	for(let child of bookmarkItem.children) {
            	createSelectFeedFolderElement(child, indent);
        	}
        	indent--;
    	}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagOption(value, text) {
    	let elm = document.createElement("option");
    	elm.value = value;
    	elm.innerHTML = text;
    	return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function broadcastPreferencesUpdated(details) {
    	browser.runtime.sendMessage({
        	id: slGlobalConsts.MSG_ID_PREFERENCE_UPDATED,
        	details: details,
     	});
	}

})();