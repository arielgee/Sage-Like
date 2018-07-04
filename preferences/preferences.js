"use strict";

let preferences = (function() {

	const MENU_GUID = "menu________";

	const ID_OPTION_CHECK_FEEDS_TIME_OF_DAY = "optionCheckFeedsTimeOfDay";
	const TXT_OPTION_EVERY_DAY_AT = "Every day at ";

	let m_elmRootFeedsFolder;
	let m_elmCheckFeedsInterval;
	let m_elmTimeOfDayBox;
	let m_elmInputTime;
	let m_elmColorBackground;
	let m_elmColorDialogBackground;
	let m_elmColorSelect;
	let m_elmColorText;
	let m_elmRadioImageSet0;
	let m_elmRadioImageSet1;
	let m_elmRadioImageSet2;
	let m_elmRadioImageSet3;
	let m_elmRadioImageSet4;
	let m_elmRadioImageSet5;
	let m_elmRadioImageSet6;

	let m_elmBtnRestoreDefaults;

	let m_funcResolveGetTimeOfDay;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
		m_elmCheckFeedsInterval = document.getElementById("checkFeedsInterval");
		m_elmTimeOfDayBox = document.getElementById("timeOfDayBox");
		m_elmInputTime = document.getElementById("inputTime");
		m_elmColorBackground = document.getElementById("colorBk");
		m_elmColorDialogBackground = document.getElementById("colorDlgBk");
		m_elmColorSelect = document.getElementById("colorSelect");
		m_elmColorText = document.getElementById("colorText");
		m_elmRadioImageSet0 = document.getElementById("imageSet0");
		m_elmRadioImageSet1 = document.getElementById("imageSet1");
		m_elmRadioImageSet2 = document.getElementById("imageSet2");
		m_elmRadioImageSet3 = document.getElementById("imageSet3");
		m_elmRadioImageSet4 = document.getElementById("imageSet4");
		m_elmRadioImageSet5 = document.getElementById("imageSet5");
		m_elmRadioImageSet6 = document.getElementById("imageSet6");

		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		addEventListeners();
		getSavedPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		m_elmRootFeedsFolder.removeEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.removeEventListener("change", onChangeCheckFeedsInterval);
		m_elmTimeOfDayBox.removeEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.removeEventListener("blur", onBlurInputTime);
		m_elmColorBackground.removeEventListener("change", onChangeColorBackground);
		m_elmColorDialogBackground.removeEventListener("change", onChangeColorDialogBackground);
		m_elmColorSelect.removeEventListener("change", onChangeColorSelect);
		m_elmColorText.removeEventListener("change", onChangeColorText);
		m_elmRadioImageSet0.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet1.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet2.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet3.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet4.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet5.removeEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet6.removeEventListener("click", onClickRadioImageSet);

		m_elmBtnRestoreDefaults.removeEventListener("click", onClickBtnRestoreDefaults);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		// save preferences when changed
		m_elmRootFeedsFolder.addEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.addEventListener("change", onChangeCheckFeedsInterval);
		m_elmTimeOfDayBox.addEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.addEventListener("blur", onBlurInputTime);
		m_elmColorBackground.addEventListener("change", onChangeColorBackground);
		m_elmColorDialogBackground.addEventListener("change", onChangeColorDialogBackground);
		m_elmColorSelect.addEventListener("change", onChangeColorSelect);
		m_elmColorText.addEventListener("change", onChangeColorText);
		m_elmRadioImageSet0.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet1.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet2.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet3.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet4.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet5.addEventListener("click", onClickRadioImageSet);
		m_elmRadioImageSet6.addEventListener("click", onClickRadioImageSet);

		// restore defaults when requestes
		m_elmBtnRestoreDefaults.addEventListener("click", onClickBtnRestoreDefaults);
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

		prefs.getCheckFeedsInterval().then((value) => {
			if(value.includes(":")) {
				let elmOption = createTagOption(value, TXT_OPTION_EVERY_DAY_AT + slUtil.formatTimeWithAbbreviations(value));
				elmOption.id = ID_OPTION_CHECK_FEEDS_TIME_OF_DAY;
				m_elmCheckFeedsInterval.insertBefore(elmOption, m_elmCheckFeedsInterval.lastElementChild);
			}
			m_elmCheckFeedsInterval.value = value;
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

		prefs.getImageSet().then((set) => {
			let radios = document.getElementsByName("imageSet");
			for(let radio of radios) {
				if(Number(radio.value) === set) {
					radio.checked = true;
					break;
				}
			}
		});
	}

	//==================================================================================
	//=== Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeRootFeedsFolder(event) {
		prefs.setRootFeedsFolderId(m_elmRootFeedsFolder.value);
		flashRootFeedsFolderElement();
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_ROOT_FOLDER);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeCheckFeedsInterval(event) {

		if(m_elmCheckFeedsInterval.value === "-1") {

			let initValue = "";
			let elmOption = document.getElementById(ID_OPTION_CHECK_FEEDS_TIME_OF_DAY);

			if(elmOption !== null) {
				initValue = elmOption.value;
			}

			getTimeOfDay(initValue).then((timeValue) => {

				m_funcResolveGetTimeOfDay = undefined;

				if(timeValue === "") {

					// time of day box was dismissed
					prefs.getCheckFeedsInterval().then((value) => {
						m_elmCheckFeedsInterval.value = value;
					});

				} else {

					if(elmOption === null) {
						elmOption = createTagOption(timeValue, TXT_OPTION_EVERY_DAY_AT + slUtil.formatTimeWithAbbreviations(timeValue));
						elmOption.id = ID_OPTION_CHECK_FEEDS_TIME_OF_DAY;
						m_elmCheckFeedsInterval.insertBefore(elmOption, m_elmCheckFeedsInterval.lastElementChild);
					} else {
						elmOption.value = timeValue;
						elmOption.textContent = TXT_OPTION_EVERY_DAY_AT + slUtil.formatTimeWithAbbreviations(timeValue);
					}
					m_elmCheckFeedsInterval.value = timeValue;

					prefs.setCheckFeedsInterval(timeValue);
					broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHECK_FEEDS_INTERVAL);
				}
			});

		} else {
			prefs.setCheckFeedsInterval(m_elmCheckFeedsInterval.value);
			broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHECK_FEEDS_INTERVAL);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorBackground(event) {
		prefs.setColorBackground(m_elmColorBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorDialogBackground(event) {
		prefs.setColorDialogBackground(m_elmColorDialogBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorSelect(event) {
		prefs.setColorSelect(m_elmColorSelect.value);
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorText(event) {
		prefs.setColorText(m_elmColorText.value);
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickRadioImageSet(event) {
		prefs.setImageSet(Number(event.target.value));
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_IMAGES);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRestoreDefaults(event) {
		internalPrefs.restoreDefaults();
		let defPrefs = prefs.restoreDefaults();

		m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
		m_elmCheckFeedsInterval.value = defPrefs.checkFeedsInterval;
		m_elmColorBackground.value = defPrefs.colorBackground
		m_elmColorDialogBackground.value = defPrefs.colorDialogBackground
		m_elmColorSelect.value = defPrefs.colorSelect
		m_elmColorText.value = defPrefs.colorText

		let radios = document.getElementsByName("imageSet");
		for(let radio of radios) {
			if(Number(radio.value) === defPrefs.imageSet) {
				radio.checked = true;
				break;
			}
		}
		flashRootFeedsFolderElement();
		broadcastPreferencesUpdated(slGlobals.MSG_DETAILS_PREF_CHANGE_ALL);
	}

	//==================================================================================
	//=== Feeds folder <select> functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function flashRootFeedsFolderElement() {

		let selected = m_elmRootFeedsFolder.options[m_elmRootFeedsFolder.selectedIndex];

		if(selected === undefined || selected.value === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
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

				let elmOption = createTagOption(slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
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

	//==================================================================================
	//=== Time of day box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function getTimeOfDay(initValue) {

		return new Promise((resolve) => {

			m_funcResolveGetTimeOfDay = resolve;

			m_elmInputTime.value = initValue;
			m_elmTimeOfDayBox.style.display = "block";

			let x = m_elmCheckFeedsInterval.offsetLeft - Math.abs(m_elmTimeOfDayBox.offsetWidth - m_elmCheckFeedsInterval.offsetWidth);
			let y = m_elmCheckFeedsInterval.offsetTop;

			m_elmTimeOfDayBox.style.left = (x - 18) + "px";
			m_elmTimeOfDayBox.style.top = (y - 10) + "px";

			m_elmInputTime.focus();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTimeOfDayBox(event) {

		if(m_funcResolveGetTimeOfDay === undefined) {
			return;
		}

		switch(event.key.toLowerCase()) {
			case "enter":
				m_funcResolveGetTimeOfDay(m_elmInputTime.value);
				break;

			case "escape":
				m_funcResolveGetTimeOfDay("");
				break;

			default:
				return;
		}
		m_elmTimeOfDayBox.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurInputTime(event) {

		if(m_funcResolveGetTimeOfDay === undefined) {
			return;
		}

		m_funcResolveGetTimeOfDay("");
		m_elmTimeOfDayBox.style.display = "none";
	}

	//==================================================================================
	//=== Misc. functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function broadcastPreferencesUpdated(details) {
		browser.runtime.sendMessage({
			id: slGlobals.MSG_ID_PREFERENCES_CHANGED,
			details: details,
	 	});
	}

})();
