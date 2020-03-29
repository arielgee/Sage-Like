"use strict";

let preferences = (function() {

	const ID_OPTION_USER_FONT_NAME = "optionUserFontName";
	const TXT_OPTION_USER_FONT_NAME = " (user)";

	const ID_OPTION_CHECK_FEEDS_TIME_OF_DAY = "optionCheckFeedsTimeOfDay";
	const TXT_OPTION_EVERY_DAY_AT = "Every day at ";

	const TXT_HELP_INFO_CHECK_FEED_METHOD = "How the RSS feeds are fetched:\u000d" +
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
	let m_elmPrimeClickOpenFeedPreview;
	let m_elmShowFeedStats;
	let m_elmShowFeedItemDesc;
	let m_elmFeedItemDescDelay;
	let m_elmShowFeedItemDescAttach;
	let m_elmColorFeedItemDescBackground;
	let m_elmColorFeedItemDescText;
	let m_elmDetectFeedsInWebPage;
	let m_elmUIDensity;
	let m_elmFontName;
	let m_elmUserFontBox;
	let m_elmUserFontName;
	let m_elmFontSizePercent;
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
	let m_elmUseCustomCSSFeedPreview;
	let m_elmImportCustomCSSSource;
	let m_elmBtnViewCSSSource;
	let m_elmBtnClearCSSSource;
	let m_elmCSSViewBox;
	let m_elmTextCSSViewer;
	let m_elmImportOpml;
	let m_elmExportOpml;

	let m_elmBtnReloadExtension;
	let m_elmBtnRestoreDefaults;

	let m_funcResolveGetTimeOfDay;
	let m_funcResolveGetUserFontName;

	let m_lockBookmarksEventHandler = new Locker();

	initilization();

	////////////////////////////////////////////////////////////////////////////////////
	function initilization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

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
		m_elmPrimeClickOpenFeedPreview = document.getElementById("primeClickOpenFeedPreview");
		m_elmShowFeedStats = document.getElementById("showFeedStats");
		m_elmShowFeedItemDesc = document.getElementById("showFeedItemDesc");
		m_elmFeedItemDescDelay = document.getElementById("feedItemDescDelay");
		m_elmShowFeedItemDescAttach = document.getElementById("showFeedItemDescAttach");
		m_elmColorFeedItemDescBackground = document.getElementById("colorFeedItemDescBk");
		m_elmColorFeedItemDescText = document.getElementById("colorFeedItemDescText");
		m_elmDetectFeedsInWebPage = document.getElementById("detectFeedsInWebPage");
		m_elmUIDensity = document.getElementById("UIDensity");
		m_elmFontName = document.getElementById("fontName");
		m_elmUserFontBox = document.getElementById("userFontBox");
		m_elmUserFontName = document.getElementById("userFontName");
		m_elmFontSizePercent = document.getElementById("fontSizePercent");
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
		m_elmUseCustomCSSFeedPreview = document.getElementById("useCustomCSSFeedPreview");
		m_elmImportCustomCSSSource = document.getElementById("importCustomCSSSource");
		m_elmBtnViewCSSSource = document.getElementById("btnViewCSSSource");
		m_elmBtnClearCSSSource = document.getElementById("btnClearCSSSource");
		m_elmCSSViewBox = document.getElementById("cssViewBox");
		m_elmTextCSSViewer = document.getElementById("textCSSViewer");
		m_elmImportOpml = document.getElementById("inputImportOPML");
		m_elmExportOpml = document.getElementById("btnExportOPML");

		m_elmBtnReloadExtension = document.getElementById("btnReloadExtension");
		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		slUtil.getBrowserVersion().then((version) => {
			if(version >= "68.0") {
				document.body.classList.add("noCaptionStyleV68");
			}
		});

		m_elmCheckFeedsMethodInfo.title = TXT_HELP_INFO_CHECK_FEED_METHOD.replace(/ /g, "\u00a0");

		addEventListeners();
		getSavedPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		document.documentElement.removeEventListener("click", onClickPreference);

		m_elmRootFeedsFolder.removeEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.removeEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.removeEventListener("change", onChangeCheckFeedsWhenSbClosed);
		m_elmTimeOfDayBox.removeEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.removeEventListener("blur", onBlurInputTime);
		m_elmCheckFeedsMethod.removeEventListener("change", onChangeCheckFeedsMethod);
		m_elmFetchTimeout.removeEventListener("change", onChangeFetchTimeout);
		m_elmPrimeClickOpenFeedPreview.removeEventListener("change", onChangePrimeClickOpenFeedPreview);
		m_elmShowFeedStats.removeEventListener("change", onChangeShowFeedStats);
		m_elmShowFeedItemDesc.removeEventListener("change", onChangeShowFeedItemDesc);
		m_elmFeedItemDescDelay.removeEventListener("change", onChangeFeedItemDescDelay);
		m_elmShowFeedItemDescAttach.removeEventListener("change", onChangeShowFeedItemDescAttach);
		m_elmColorFeedItemDescBackground.removeEventListener("change", onChangeColorFeedItemDescBackground);
		m_elmColorFeedItemDescText.removeEventListener("change", onChangeColorFeedItemDescText);
		m_elmDetectFeedsInWebPage.removeEventListener("change", onChangeDetectFeedsInWebPage);
		m_elmUIDensity.removeEventListener("change", onChangeUIDensity);
		m_elmFontName.removeEventListener("change", onChangeFontName);
		m_elmUserFontBox.removeEventListener("keydown", onKeyDownUserFontBox);
		m_elmUserFontName.removeEventListener("blur", onBlurUserFontName);
		m_elmFontSizePercent.removeEventListener("change", onChangeFontSizePercent);
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
		m_elmUseCustomCSSFeedPreview.removeEventListener("change", onChangeUseCustomCSSFeedPreview);
		m_elmImportCustomCSSSource.removeEventListener("change", onChangeImportCustomCSSSource);
		m_elmBtnViewCSSSource.removeEventListener("click", onClickBtnViewCSSSource);
		m_elmBtnClearCSSSource.removeEventListener("click", onClickBtnClearCSSSource);
		m_elmCSSViewBox.removeEventListener("keydown", onKeyDownCSSViewBox);
		m_elmTextCSSViewer.removeEventListener("blur", onBlurTextCSSViewer);
		m_elmImportOpml.removeEventListener("change", onChangeImportOpml);
		m_elmExportOpml.removeEventListener("click", onClickExportOpml);

		m_elmBtnReloadExtension.removeEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.removeEventListener("click", onClickBtnRestoreDefaults);

		removeBookmarksEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		// handle check boxs and text boxs
		document.documentElement.addEventListener("click", onClickPreference);

		// save preferences when changed
		m_elmRootFeedsFolder.addEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsInterval.addEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.addEventListener("change", onChangeCheckFeedsWhenSbClosed);
		m_elmTimeOfDayBox.addEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.addEventListener("blur", onBlurInputTime);
		m_elmCheckFeedsMethod.addEventListener("change", onChangeCheckFeedsMethod);
		m_elmFetchTimeout.addEventListener("change", onChangeFetchTimeout);
		m_elmPrimeClickOpenFeedPreview.addEventListener("change", onChangePrimeClickOpenFeedPreview);
		m_elmShowFeedStats.addEventListener("change", onChangeShowFeedStats);
		m_elmShowFeedItemDesc.addEventListener("change", onChangeShowFeedItemDesc);
		m_elmFeedItemDescDelay.addEventListener("change", onChangeFeedItemDescDelay);
		m_elmShowFeedItemDescAttach.addEventListener("change", onChangeShowFeedItemDescAttach);
		m_elmColorFeedItemDescBackground.addEventListener("change", onChangeColorFeedItemDescBackground);
		m_elmColorFeedItemDescText.addEventListener("change", onChangeColorFeedItemDescText);
		m_elmDetectFeedsInWebPage.addEventListener("change", onChangeDetectFeedsInWebPage);
		m_elmUIDensity.addEventListener("change", onChangeUIDensity);
		m_elmFontName.addEventListener("change", onChangeFontName);
		m_elmUserFontBox.addEventListener("keydown", onKeyDownUserFontBox);
		m_elmUserFontName.addEventListener("blur", onBlurUserFontName);
		m_elmFontSizePercent.addEventListener("change", onChangeFontSizePercent);
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
		m_elmUseCustomCSSFeedPreview.addEventListener("change", onChangeUseCustomCSSFeedPreview);
		m_elmImportCustomCSSSource.addEventListener("change", onChangeImportCustomCSSSource);
		m_elmBtnViewCSSSource.addEventListener("click", onClickBtnViewCSSSource);
		m_elmBtnClearCSSSource.addEventListener("click", onClickBtnClearCSSSource);
		m_elmCSSViewBox.addEventListener("keydown", onKeyDownCSSViewBox);
		m_elmTextCSSViewer.addEventListener("blur", onBlurTextCSSViewer);
		m_elmImportOpml.addEventListener("change", onChangeImportOpml);
		m_elmExportOpml.addEventListener("click", onClickExportOpml);

		m_elmBtnReloadExtension.addEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.addEventListener("click", onClickBtnRestoreDefaults);

		addBookmarksEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addBookmarksEventListeners() {
		browser.bookmarks.onCreated.addListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onChanged.addListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onMoved.addListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onRemoved.addListener(onBookmarksEventRemovedHandler);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeBookmarksEventListeners() {
		browser.bookmarks.onCreated.removeListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onChanged.removeListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onMoved.removeListener(onBookmarksEventModifiedHandler);
		browser.bookmarks.onRemoved.removeListener(onBookmarksEventRemovedHandler);
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

		prefs.getPrimeClickOpenFeedPreview().then((checked) => {
			m_elmPrimeClickOpenFeedPreview.checked = checked;
		});

		prefs.getShowFeedStats().then((checked) => {
			m_elmShowFeedStats.checked = checked;
		});

		prefs.getShowFeedItemDesc().then((checked) => {
			m_elmShowFeedItemDesc.checked = checked;
			slUtil.disableElementTree(m_elmFeedItemDescDelay.parentElement.parentElement, !checked);
			slUtil.disableElementTree(m_elmShowFeedItemDescAttach.parentElement.parentElement, !checked);
			slUtil.disableElementTree(m_elmColorFeedItemDescBackground.parentElement.parentElement, !checked);
		});

		prefs.getFeedItemDescDelay().then((delayMillisec) => {
			m_elmFeedItemDescDelay.value = delayMillisec;
		});

		prefs.getShowFeedItemDescAttach().then((checked) => {
			m_elmShowFeedItemDescAttach.checked = checked;
		});

		prefs.getColorFeedItemDescBackground().then((color) => {
			m_elmColorFeedItemDescBackground.value = color;
			m_elmColorFeedItemDescBackground.title = colorInputTitle(color);
		});

		prefs.getColorFeedItemDescText().then((color) => {
			m_elmColorFeedItemDescText.value = color;
			m_elmColorFeedItemDescText.title = colorInputTitle(color);
		});

		prefs.getDetectFeedsInWebPage().then((checked) => {
			m_elmDetectFeedsInWebPage.checked = checked;
		});

		prefs.getUIDensity().then((value) => {
			m_elmUIDensity.value = value;
		});

		prefs.getFontName().then((fontName) => {

			let inStock = false;

			Array.prototype.map.call(m_elmFontName.options, e => inStock |= (e.value === fontName) );

			if(!inStock) {
				let elmOption = createTagOption(fontName, fontName + TXT_OPTION_USER_FONT_NAME);
				elmOption.id = ID_OPTION_USER_FONT_NAME;
				m_elmFontName.insertBefore(elmOption, m_elmFontName.lastElementChild);
			}
			m_elmFontName.value = fontName;
		});

		prefs.getFontSizePercent().then((value) => {
			m_elmFontSizePercent.value = value;
		});

		prefs.getColorBackground().then((color) => {
			m_elmColorBackground.value = color;
			m_elmColorBackground.title = colorInputTitle(color);
		});

		prefs.getColorDialogBackground().then((color) => {
			m_elmColorDialogBackground.value = color;
			m_elmColorDialogBackground.title = colorInputTitle(color);
		});

		prefs.getColorSelect().then((color) => {
			m_elmColorSelect.value = color;
			m_elmColorSelect.title = colorInputTitle(color);
		});

		prefs.getColorText().then((color) => {
			m_elmColorText.value = color;
			m_elmColorText.title = colorInputTitle(color);
		});

		prefs.getImageSet().then((set) => {
			let radios = document.getElementsByName("imageSet");
			for(let radio of radios) {
				if(parseInt(radio.value) === set) {
					radio.checked = true;
					break;
				}
			}
		});

		prefs.getUseCustomCSSFeedPreview().then((checked) => {
			m_elmUseCustomCSSFeedPreview.checked = checked;
			if(checked) {
				prefs.getCustomCSSSource().then((source) => {
					let isEmpty = (source.length === 0);
					slUtil.disableElementTree(m_elmBtnViewCSSSource, isEmpty);
					slUtil.disableElementTree(m_elmBtnClearCSSSource, isEmpty);
					flashCustomCSSImportButton();
				});
			} else {
				slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, true);
			}
		});
	}

	//==================================================================================
	//=== Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPreference(event) {

		if( !!event.target && event.target.classList.contains("preference") ) {

			let elmInputs = event.target.querySelectorAll("input[type=checkbox],input[type=text]");

			if(elmInputs.length > 0) {
				event.stopPropagation();

				if(elmInputs[0].type === "checkbox") {
					elmInputs[0].click();
				} else if(elmInputs[0].type === "text") {
					elmInputs[0].focus();
					elmInputs[0].select();
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeRootFeedsFolder(event) {
		prefs.setRootFeedsFolderId(m_elmRootFeedsFolder.value);
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, m_elmRootFeedsFolder.value === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET);
		flashRootFeedsFolderElement();
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_ROOT_FOLDER);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeCheckFeedsInterval(event) {

		if(m_elmCheckFeedsInterval.value === "-1") {

			let initValue = "12:00";
			let elmOption = document.getElementById(ID_OPTION_CHECK_FEEDS_TIME_OF_DAY);

			if(elmOption !== null) {
				initValue = elmOption.value;
			}

			getTimeOfDay(initValue).then((timeValue) => {

				m_funcResolveGetTimeOfDay = null;

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
	function onChangePrimeClickOpenFeedPreview(event) {
		prefs.setPrimeClickOpenFeedPreview(m_elmPrimeClickOpenFeedPreview.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedStats(event) {
		prefs.setShowFeedStats(m_elmShowFeedStats.checked);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_STATS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedItemDesc(event) {
		prefs.setShowFeedItemDesc(m_elmShowFeedItemDesc.checked);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC);
		slUtil.disableElementTree(m_elmFeedItemDescDelay.parentElement.parentElement, !m_elmShowFeedItemDesc.checked);
		slUtil.disableElementTree(m_elmShowFeedItemDescAttach.parentElement.parentElement, !m_elmShowFeedItemDesc.checked);
		slUtil.disableElementTree(m_elmColorFeedItemDescBackground.parentElement.parentElement, !m_elmShowFeedItemDesc.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFeedItemDescDelay(event) {
		if(m_elmFeedItemDescDelay.value.match(m_elmFeedItemDescDelay.pattern) === null) {
			prefs.getFeedItemDescDelay().then((delayMillisec) => {
				m_elmFeedItemDescDelay.value = delayMillisec;
			});
		} else {
			prefs.setFeedItemDescDelay(m_elmFeedItemDescDelay.value);
		}
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedItemDescAttach(event) {
		prefs.setShowFeedItemDescAttach(m_elmShowFeedItemDescAttach.checked);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC_ATTACH);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorFeedItemDescBackground(event) {
		m_elmColorFeedItemDescBackground.title = colorInputTitle(m_elmColorFeedItemDescBackground.value);
		prefs.setColorFeedItemDescBackground(m_elmColorFeedItemDescBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorFeedItemDescText(event) {
		m_elmColorFeedItemDescText.title = colorInputTitle(m_elmColorFeedItemDescText.value);
		prefs.setColorFeedItemDescText(m_elmColorFeedItemDescText.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeDetectFeedsInWebPage(event) {
		prefs.setDetectFeedsInWebPage(m_elmDetectFeedsInWebPage.checked);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeUIDensity(event) {
		prefs.setUIDensity(m_elmUIDensity.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_UI_DENSITY);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFontName(event) {

		if(m_elmFontName.value === "-1") {

			let initValue = "";
			let elmOption = document.getElementById(ID_OPTION_USER_FONT_NAME);

			if(elmOption !== null) {
				initValue = elmOption.value;
			}

			getUserFontName(initValue).then((userFontName) => {

				m_funcResolveGetUserFontName = null;

				if(userFontName === "") {

					// user font box was dismissed
					prefs.getFontName().then((value) => {
						m_elmFontName.value = value;
					});

				} else {

					let stockName = "";

					// look if font name exists in stock
					Array.prototype.map.call(m_elmFontName.options, e => {
						if(e.value.toLowerCase() === userFontName.toLowerCase()) {
							stockName = e.value;
						}
					});

					// font name not in stock
					if(stockName === "") {

						if(elmOption === null) {
							elmOption = createTagOption(userFontName, userFontName + TXT_OPTION_USER_FONT_NAME);
							elmOption.id = ID_OPTION_USER_FONT_NAME;
							m_elmFontName.insertBefore(elmOption, m_elmFontName.lastElementChild);
						} else {
							elmOption.value = userFontName;
							elmOption.textContent = userFontName + TXT_OPTION_USER_FONT_NAME;
						}
					} else {
						userFontName = stockName;		// use the font as it is written in stock
					}
					m_elmFontName.value = userFontName;

					prefs.setFontName(m_elmFontName.value);
					broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FONT_NAME);
				}
			});

		} else {
			prefs.setFontName(m_elmFontName.value);
			broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FONT_NAME);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFontSizePercent(event) {
		prefs.setFontSizePercent(m_elmFontSizePercent.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_FONT_SIZE_PERCENT);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorBackground(event) {
		m_elmColorBackground.title = colorInputTitle(m_elmColorBackground.value);
		prefs.setColorBackground(m_elmColorBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorDialogBackground(event) {
		m_elmColorDialogBackground.title = colorInputTitle(m_elmColorDialogBackground.value);
		prefs.setColorDialogBackground(m_elmColorDialogBackground.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorSelect(event) {
		m_elmColorSelect.title = colorInputTitle(m_elmColorSelect.value);
		prefs.setColorSelect(m_elmColorSelect.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorText(event) {
		m_elmColorText.title = colorInputTitle(m_elmColorText.value);
		prefs.setColorText(m_elmColorText.value);
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_COLORS);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickRadioImageSet(event) {
		prefs.setImageSet(parseInt(event.target.value));
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_IMAGES);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeUseCustomCSSFeedPreview(event) {
		prefs.setUseCustomCSSFeedPreview(m_elmUseCustomCSSFeedPreview.checked);

		if(m_elmUseCustomCSSFeedPreview.checked) {
			prefs.getCustomCSSSource().then((source) => {
				slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, false);
				let isEmpty = (source.length === 0);
				slUtil.disableElementTree(m_elmBtnViewCSSSource, isEmpty);
				slUtil.disableElementTree(m_elmBtnClearCSSSource, isEmpty);
				flashCustomCSSImportButton();
			});
		} else {
			slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, true);
			flashCustomCSSImportButton();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeImportCustomCSSSource(event) {

		cssFileValidator(event.target.files[0]).then((result) => {

			prefs.setCustomCSSSource(result.source);

			slUtil.disableElementTree(m_elmBtnViewCSSSource, false);
			slUtil.disableElementTree(m_elmBtnClearCSSSource, false);

			flashCustomCSSImportButton();

			if(!!result.note) {
				setTimeout(() => alert("WARNING:\n\n" + result.note), 0);
			}

		}).catch((error) => {
			setTimeout(() => alert("ERROR: " + error.message), 0);
			console.log("[Sage-Like]", "CSS file validation error", error.message);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnViewCSSSource(event) {
		showCSSViewBox();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnClearCSSSource(event) {
		prefs.setCustomCSSSource(prefs.DEF_PREF_CUSTOM_CSS_SOURCE_VALUE);
		slUtil.disableElementTree(m_elmBtnViewCSSSource, true);
		slUtil.disableElementTree(m_elmBtnClearCSSSource, true);
		flashCustomCSSImportButton();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeImportOpml(event) {

		browser.runtime.sendMessage({ id: slGlobals.MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER });
		m_lockBookmarksEventHandler.lock();

		let elmPrefOverlayFeedTrans = document.getElementById("prefOverlayFeedTrans");

		elmPrefOverlayFeedTrans.classList.add("processing");
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, true);

		opml.importFeeds.run(event.target.files[0]).then((newFolderId) => {
			initializeSelectFeedsFolder();
			browser.runtime.sendMessage({ id: slGlobals.MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID, itemId: newFolderId });
			broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_ROOT_FOLDER);
		}).catch((error) => {
			setTimeout(() => alert(error), 0);	// so the alert() will not block the finally()
			console.log("[Sage-Like]", error);
		}).finally(() => {
			browser.runtime.sendMessage({ id: slGlobals.MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER });
			m_lockBookmarksEventHandler.unlock();

			elmPrefOverlayFeedTrans.classList.remove("processing");
			slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExportOpml(event) {

		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, true);

		opml.exportFeeds.run().catch((error) => {
			alert(error);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, false);
		});
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
		slUtil.disableElementTree(m_elmFeedItemDescDelay.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmShowFeedItemDescAttach.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmColorFeedItemDescBackground.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, !defPrefs.useCustomCSSFeedPreview);
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, defPrefs.rootFeedsFolderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET);

		m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
		m_elmCheckFeedsInterval.value = defPrefs.checkFeedsInterval;
		m_elmCheckFeedsWhenSbClosed.checked = defPrefs.checkFeedsWhenSbClosed;
		m_elmCheckFeedsMethod.value = defPrefs.checkFeedsMethod;
		m_elmFetchTimeout.value = defPrefs.fetchTimeout;
		m_elmPrimeClickOpenFeedPreview.checked = defPrefs.primeClickOpenFeedPreview;
		m_elmShowFeedStats.checked = defPrefs.showFeedStats;
		m_elmShowFeedItemDesc.checked = defPrefs.showFeedItemDesc;
		m_elmFeedItemDescDelay.value = defPrefs.feedItemDescDelay;
		m_elmShowFeedItemDescAttach.checked = defPrefs.showFeedItemDescAttach;
		m_elmColorFeedItemDescBackground.value = defPrefs.colorFeedItemDescBackground;
		m_elmColorFeedItemDescText.value = defPrefs.colorFeedItemDescText;
		m_elmDetectFeedsInWebPage.checked = defPrefs.detectFeedsInWebPage;
		m_elmUIDensity.value = defPrefs.UIDensity;
		m_elmFontName.value = defPrefs.fontName;
		m_elmFontSizePercent.value = defPrefs.fontSizePercent;
		m_elmColorBackground.value = defPrefs.colorBackground
		m_elmColorDialogBackground.value = defPrefs.colorDialogBackground
		m_elmColorSelect.value = defPrefs.colorSelect
		m_elmColorText.value = defPrefs.colorText
		let radios = document.getElementsByName("imageSet");
		for(let radio of radios) {
			if(parseInt(radio.value) === defPrefs.imageSet) {
				radio.checked = true;
				break;
			}
		}
		m_elmUseCustomCSSFeedPreview.checked = defPrefs.useCustomCSSFeedPreview;

		flashRootFeedsFolderElement();
		flashCustomCSSImportButton();
		broadcastPreferencesUpdated(slGlobals.MSGD_PREF_CHANGE_ALL);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventModifiedHandler(id, modifyInfo) {

		if(m_lockBookmarksEventHandler.isUnlocked) {

			/* Initialize the <select> element only if the modified
			   bookmark item is a folder
			*/

			// created/moved/changed
			browser.bookmarks.get(id).then((bmItems) => {
				if(bmItems[0].type === "folder") {
					initializeSelectFeedsFolder();
				}
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBookmarksEventRemovedHandler(id, removeInfo) {

		if(m_lockBookmarksEventHandler.isUnlocked) {

			/* Initialize the <select> element only if the deleted
			   bookmark item is a folder
			*/

			if(removeInfo.node.type === "folder") {
				initializeSelectFeedsFolder();
			}
		}
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

		gettingFolderId.then((folderId) => {
			creatingSelect.then(() => {

				m_elmRootFeedsFolder.value = folderId;

				// if folderId is no longer valid (deleted)
				if(m_elmRootFeedsFolder.options[m_elmRootFeedsFolder.selectedIndex] === undefined) {
					m_elmRootFeedsFolder.value = slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET
				}
				slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, m_elmRootFeedsFolder.value === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET);
				setTimeout(() => flashRootFeedsFolderElement(), 500);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderElements() {

		return new Promise((resolve) => {

			// hide element to reduce repaint/reflow
			m_elmRootFeedsFolder.style.display = "none";

			while(m_elmRootFeedsFolder.firstChild) {
				m_elmRootFeedsFolder.removeChild(m_elmRootFeedsFolder.firstChild);
			}

			browser.bookmarks.getSubTree(slGlobals.BOOKMARKS_ROOT_GUID).then((bookmarks) => {

				let elmOption = createTagOption(slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
				m_elmRootFeedsFolder.appendChild(elmOption);

				for(let child of bookmarks[0].children) {
					createSelectFeedsFolderElement(child, 0);
				}
				m_elmRootFeedsFolder.style.display = "block";
				resolve();
			});

		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderElement(bookmarkItem, indent) {

		if(bookmarkItem.type === "folder") {
			let elmOption = createTagOption(bookmarkItem.id, "&emsp;".repeat(indent) + "&#x276F;&ensp;" + bookmarkItem.title);	/* ❯ */
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
	//=== User font box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function getUserFontName(initValue) {

		return new Promise((resolve) => {

			m_funcResolveGetUserFontName = resolve;

			m_elmUserFontName.value = initValue;
			m_elmUserFontBox.style.display = "block";

			let x = m_elmFontName.offsetLeft - Math.abs(m_elmUserFontBox.offsetWidth - m_elmFontName.offsetWidth);
			let y = m_elmFontName.offsetTop;

			m_elmUserFontBox.style.left = (x - 18) + "px";
			m_elmUserFontBox.style.top = (y - 15) + "px";

			m_elmUserFontName.focus();
			m_elmUserFontName.select();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownUserFontBox(event) {

		if(typeof(m_funcResolveGetUserFontName) === "function") {

			switch(event.code) {
				case "Enter":
				case "NumpadEnter":
					m_funcResolveGetUserFontName(m_elmUserFontName.value.trim());
					break;

				case "Escape":
					m_funcResolveGetUserFontName("");
					break;

				default:
					return;
			}
			m_elmUserFontBox.style.display = "none";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurUserFontName(event) {

		if(typeof(m_funcResolveGetUserFontName) === "function") {
			m_funcResolveGetUserFontName("");
			setTimeout(() => m_elmUserFontBox.style.display = "none", 0);		// to avoid: "TypeError: Property 'handleEvent' is not callable."
		}
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
			m_elmTimeOfDayBox.style.top = (y - 15) + "px";

			m_elmInputTime.focus();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTimeOfDayBox(event) {

		if(typeof(m_funcResolveGetTimeOfDay) === "function") {

			switch(event.code) {
				case "Enter":
				case "NumpadEnter":
					m_funcResolveGetTimeOfDay(m_elmInputTime.value);
					break;

				case "Escape":
					m_funcResolveGetTimeOfDay("");
					break;

				default:
					return;
			}
			m_elmTimeOfDayBox.style.display = "none";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurInputTime(event) {

		if(typeof(m_funcResolveGetTimeOfDay) === "function") {
			m_funcResolveGetTimeOfDay("");
			setTimeout(() => m_elmTimeOfDayBox.style.display = "none", 0);		// to avoid: "TypeError: Property 'handleEvent' is not callable."
		}
	}

	//==================================================================================
	//=== CSS View Box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function showCSSViewBox() {

		prefs.getCustomCSSSource().then((source) => {

			m_elmTextCSSViewer.textContent = source;

			m_elmCSSViewBox.style.display = "block";

			let x = m_elmBtnViewCSSSource.parentElement.parentElement.offsetLeft;
			let y = m_elmBtnViewCSSSource.offsetTop - m_elmCSSViewBox.offsetHeight;

			m_elmCSSViewBox.style.left = x + "px";
			m_elmCSSViewBox.style.top = y + "px";

			m_elmTextCSSViewer.focus();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownCSSViewBox(event) {
		if(event.code === "Escape") {
			m_elmCSSViewBox.style.display = "none";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurTextCSSViewer(event) {
		setTimeout(() => m_elmCSSViewBox.style.display = "none", 0);		// to avoid: "TypeError: Property 'handleEvent' is not callable."
	}

	//==================================================================================
	//=== Misc. functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function colorInputTitle(colorValue) {
		return (colorValue && colorValue[0] === "#" ? "HTML notation: " + colorValue.toLowerCase() : "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function broadcastPreferencesUpdated(details) {
		browser.runtime.sendMessage({
			id: slGlobals.MSG_ID_PREFERENCES_CHANGED,
			details: details,
	 	});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function flashCustomCSSImportButton() {
		document.getElementById("labelForImportCustomCSSSource").classList.toggle("flash", (m_elmUseCustomCSSFeedPreview.checked && m_elmBtnViewCSSSource.disabled));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function cssFileValidator(cssFile) {

		const MIN_FILE_BYTE_SIZE = 0;
		const MAX_FILE_BYTE_SIZE = 65536;	// 64bk

		return new Promise((resolve, reject) => {

			if( !(cssFile instanceof File) ) {
				reject(new Error("Not a File object."));
			} else if(cssFile.size === MIN_FILE_BYTE_SIZE) {
				reject(new Error("File is empty."));
			} else if(cssFile.size > MAX_FILE_BYTE_SIZE) {
				reject(new Error("File too large. Maximum: " + slUtil.asPrettyByteSize(MAX_FILE_BYTE_SIZE)));
			} else {

				let reader = new FileReader();

				reader.onerror = (event) => {
					console.log("[Sage-Like]", "FileReader error", event);
					reject(new Error("FileReader error."));
				};

				reader.onload = (event) => {

					let source = event.target.result;

					if(source.length === 0) {
						reject(new Error("File has no text content."));
					} else {

						let resolveObj = { source: source };

						// check for URLs to remote resources
						let doc = document.implementation.createHTMLDocument();
						let head = document.createElement("head");
						let style = document.createElement("style");

						style.type = "text/css";
						style.innerHTML = source;

						head.appendChild(style);
						doc.body.appendChild(head);

						let hasStyleRule = false;
						let rules = style.sheet.cssRules;
						let lenRules = rules.length;
						let rxRemoteURI = /\b(https?|s?ftp|file):(\/\/)?[^\s]+/im;

						if(lenRules > 0) {

							for(let i=0; i<lenRules; i++) {
								if( !(rules[i] instanceof CSSNamespaceRule) ) {
									hasStyleRule = true;
									if(rules[i].cssText.match(rxRemoteURI)) {
										resolveObj["note"] = "URLs to remote resources were found in the file and that could potentially be a security risk.\n\n" +
															 "If you are not sure that those URLs are safe you should replace or clear this file.";
										break;
									}
								}
							}
							if(!hasStyleRule) resolveObj["note"] = "No style rules where found in file.";

						} else {
							resolveObj["note"] = "No rules where found in file.";
						}
						resolve(resolveObj);

						// Redundent: But I would like to help the GC to get the point as soon as possible
						head.removeChild(style);
						doc.body.removeChild(head);
						doc = head = style = rules = null;
					}
				};
				reader.readAsText(cssFile);
			}
		});
	}
})();
