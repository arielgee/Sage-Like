"use strict";

let preferences = (function() {

	const ID_OPTION_CHECK_FEEDS_TIME_OF_DAY = "optionCheckFeedsTimeOfDay";
	const TXT_OPTION_EVERY_DAY_AT = "Every day at ";

	const TXT_HELP_INFO_CHECK_FEED_METHOD = "How the RSS feeds are fetched.\u000d" +
											"  \u25cf Strenuous – All feeds are fetched at once in one batch. \u000d" +
											"  \u25cf Moderate – Feeds are fetched in 3 batches with a 2 seconds pause between each one. \u000d" +
											"  \u25cf Relaxed – Feeds are fetched in 5 batches with a 3 seconds pause between each one. \u000d" +
											"  \u25cf Lazy – Feeds are fetched one by one with a 1.5 seconds pause between each one. \u000d";

	let m_elmRootFeedsFolder;
	let m_elmCheckFeedsInterval;
	let m_elmCheckFeedsWhenSbClosed;
	let m_elmTimeOfDayBox;
	let m_elmInputTime;
	let m_elmCheckFeedsMethod;
	let m_elmCheckFeedsMethodInfo;
	let m_elmFetchTimeout;
	let m_elmShowFeedItemDesc;
	let m_elmUIDensity;
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

	let m_elmBtnReloadExtension;
	let m_elmBtnRestoreDefaults;

	let m_funcResolveGetTimeOfDay;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
		m_elmCheckFeedsInterval = document.getElementById("checkFeedsInterval");
		m_elmCheckFeedsWhenSbClosed = document.getElementById("checkFeedsWhenSbClosed");
		m_elmTimeOfDayBox = document.getElementById("timeOfDayBox");
		m_elmInputTime = document.getElementById("inputTime");
		m_elmCheckFeedsMethod = document.getElementById("checkFeedsMethod");
		m_elmCheckFeedsMethodInfo = document.getElementById("checkFeedsMethodInfo");
		m_elmFetchTimeout = document.getElementById("fetchTimeout");
		m_elmShowFeedItemDesc = document.getElementById("showFeedItemDesc");
		m_elmUIDensity = document.getElementById("UIDensity");
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

		m_elmBtnReloadExtension = document.getElementById("btnReloadExtension");
		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		m_elmCheckFeedsMethodInfo.title = TXT_HELP_INFO_CHECK_FEED_METHOD.replace(/ /g, "\u00a0");

		addEventListeners();
		getSavedPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		m_elmRootFeedsFolder.removeEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.removeEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.removeEventListener("change", onChangeCheckFeedsWhenSbClosed);
		m_elmTimeOfDayBox.removeEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.removeEventListener("blur", onBlurInputTime);
		m_elmCheckFeedsMethod.removeEventListener("change", onChangeCheckFeedsMethod);
		m_elmFetchTimeout.removeEventListener("change", onChangeFetchTimeout);
		m_elmShowFeedItemDesc.removeEventListener("change", onChangeShowFeedItemDesc);
		m_elmUIDensity.removeEventListener("change", onChangeUIDensity);
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

		m_elmBtnReloadExtension.removeEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.removeEventListener("click", onClickBtnRestoreDefaults);

		browser.bookmarks.onCreated.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.removeListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.removeListener(onBookmarksEventHandler);

	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		// save preferences when changed
		m_elmRootFeedsFolder.addEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.addEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.addEventListener("change", onChangeCheckFeedsWhenSbClosed);
		m_elmTimeOfDayBox.addEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.addEventListener("blur", onBlurInputTime);
		m_elmCheckFeedsMethod.addEventListener("change", onChangeCheckFeedsMethod);
		m_elmFetchTimeout.addEventListener("change", onChangeFetchTimeout);
		m_elmShowFeedItemDesc.addEventListener("change", onChangeShowFeedItemDesc);
		m_elmUIDensity.addEventListener("change", onChangeUIDensity);
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

		m_elmBtnReloadExtension.addEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.addEventListener("click", onClickBtnRestoreDefaults);

		browser.bookmarks.onCreated.addListener(onBookmarksEventHandler);
		browser.bookmarks.onRemoved.addListener(onBookmarksEventHandler);
		browser.bookmarks.onChanged.addListener(onBookmarksEventHandler);
		browser.bookmarks.onMoved.addListener(onBookmarksEventHandler);

	}

	////////////////////////////////////////////////////////////////////////////////////
	function getSavedPreferences() {

		initializeSelectFeedsFolder();

		prefs.getCheckFeedsInterval().then((value) => {
			if(value.includes(":")) {
				let elmOption = createTagOption(value, TXT_OPTION_EVERY_DAY_AT + slUtil.formatTimeWithAbbreviations(value));
				elmOption.id = ID_OPTION_CHECK_FEEDS_TIME_OF_DAY;
				m_elmCheckFeedsInterval.insertBefore(elmOption, m_elmCheckFeedsInterval.lastElementChild);
			}
			m_elmCheckFeedsInterval.value = value;
			slUtil.disableElementTree(m_elmCheckFeedsWhenSbClosed.parentElement.parentElement, value === "0");
		});

		prefs.getCheckFeedsWhenSbClosed().then((checked) => {
			m_elmCheckFeedsWhenSbClosed.checked = checked;
		});

		prefs.getCheckFeedsMethod().then((value) => {
			m_elmCheckFeedsMethod.value = value;
		});

		prefs.getFetchTimeout().then((timeoutSec) => {
			m_elmFetchTimeout.value = timeoutSec;
		});

		prefs.getShowFeedItemDesc().then((checked) => {
			m_elmShowFeedItemDesc.checked = checked;
		});

		prefs.getUIDensity().then((value) => {
			m_elmUIDensity.value = value;
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
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_ROOT_FOLDER);
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
					broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL);
				}
			});

		} else {
			prefs.setCheckFeedsInterval(m_elmCheckFeedsInterval.value);
			broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL);
		}
		slUtil.disableElementTree(m_elmCheckFeedsWhenSbClosed.parentElement.parentElement, m_elmCheckFeedsInterval.value === "0");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeCheckFeedsWhenSbClosed(event) {
		prefs.setCheckFeedsWhenSbClosed(m_elmCheckFeedsWhenSbClosed.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeCheckFeedsMethod(event) {
		prefs.setCheckFeedsMethod(m_elmCheckFeedsMethod.value);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFetchTimeout(event) {
		if(m_elmFetchTimeout.value.match(m_elmFetchTimeout.pattern) === null) {
			prefs.getFetchTimeout().then((timeoutSec) => {
				m_elmFetchTimeout.value = timeoutSec;
			});
		} else {
			prefs.setFetchTimeout(m_elmFetchTimeout.value);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedItemDesc(event) {
		prefs.setShowFeedItemDesc(m_elmShowFeedItemDesc.checked);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeUIDensity(event) {
		prefs.setUIDensity(m_elmUIDensity.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_UI_DENSITY);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorBackground(event) {
		prefs.setColorBackground(m_elmColorBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorDialogBackground(event) {
		prefs.setColorDialogBackground(m_elmColorDialogBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorSelect(event) {
		prefs.setColorSelect(m_elmColorSelect.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorText(event) {
		prefs.setColorText(m_elmColorText.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickRadioImageSet(event) {
		prefs.setImageSet(Number(event.target.value));
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_IMAGES);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnReloadExtension(event) {
		slUtil.reloadSageLikeWebExtensionAndTab();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRestoreDefaults(event) {
		internalPrefs.restoreDefaults();
		let defPrefs = prefs.restoreDefaults();

		slUtil.disableElementTree(m_elmCheckFeedsWhenSbClosed.parentElement.parentElement, defPrefs.checkFeedsInterval === "0");

		m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
		m_elmCheckFeedsInterval.value = defPrefs.checkFeedsInterval;
		m_elmCheckFeedsWhenSbClosed.value = defPrefs.checkFeedsWhenSbClosed;
		m_elmCheckFeedsMethod.value = defPrefs.checkFeedsMethod;
		m_elmFetchTimeout.value = defPrefs.fetchTimeout;
		m_elmShowFeedItemDesc.checked = defPrefs.showFeedItemDesc;
		m_elmUIDensity.value = defPrefs.UIDensity;
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
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_ALL);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventHandler() {
		initializeSelectFeedsFolder();
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
	function initializeSelectFeedsFolder() {

		let gettingFolderId = prefs.getRootFeedsFolderId();
		let creatingSelect = createSelectFeedsFolderElements();

		gettingFolderId.then((value) => {
			creatingSelect.then(() => {
				m_elmRootFeedsFolder.value = value;
				setTimeout(() => {
					flashRootFeedsFolderElement();
				}, 500);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderElements() {

		return new Promise((resolve) => {

			while(m_elmRootFeedsFolder.firstChild) {
				m_elmRootFeedsFolder.removeChild(m_elmRootFeedsFolder.firstChild);
			}

			browser.bookmarks.getSubTree(slGlobals.BOOKMARKS_ROOT_MENU_GUID).then((bookmarks) => {

				let elmOption = createTagOption(slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
				m_elmRootFeedsFolder.appendChild(elmOption);

				for(let child of bookmarks[0].children) {
					createSelectFeedsFolderElement(child, 0);
				}
				resolve();
			});

		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderElement(bookmarkItem, indent) {

		if(bookmarkItem.type === "folder") {
			let elmOption = createTagOption(bookmarkItem.id, "&emsp;".repeat(indent) + "◆ " + bookmarkItem.title);
			m_elmRootFeedsFolder.appendChild(elmOption);
			indent++;
			for(let child of bookmarkItem.children) {
				createSelectFeedsFolderElement(child, indent);
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
