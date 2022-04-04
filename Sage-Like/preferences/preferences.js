"use strict";

let preferences = (function() {

	const ID_OPTION_USER_FONT_NAME = "optionUserFontName";
	const TXT_OPTION_USER_FONT_NAME = " (user)";

	const ID_OPTION_CHECK_FEEDS_TIME_OF_DAY = "optionCheckFeedsTimeOfDay";
	const TXT_OPTION_EVERY_DAY_AT = "Every day at ";

	const TXT_HELP_INFO_CHECK_FEED_METHOD = "How the RSS feeds are fetched:\n" +
											" \u25cf Strenuous – All feeds are fetched at once in one batch. \n" +
											" \u25cf Moderate – Feeds are fetched in 3 batches with a 2 seconds pause between each one. \n" +
											" \u25cf Relaxed – Feeds are fetched in 5 batches with a 3 seconds pause between each one. \n" +
											" \u25cf Easy – Feeds are fetched in 10 batches with a 4 seconds pause between each one. \n" +
											" \u25cf Lazy – Feeds are fetched one by one with a 1.5 seconds pause between each one. \n";

	const TXT_HELP_INFO_DETECT_FEEDS_EXCEPTIONS = "The option 'Detect feeds in web pages...' may interfere with some websites.\n\n" +
													"When trying to detect feeds in web pages, in certain conditions this setting " +
													"may perform an additional page request. This extra request sometimes looks " +
													"suspicious to websites (\"rate limiting\") and may result in unexpected behavior. " +
													"For instance, when trying to log in to an account.\n\n" +
													"To avoid this without unchecking the option, select the 'Manage...' button and " +
													"add the web page address to the list.";

	let m_elmRootFeedsFolder;
	let m_elmCheckFeedsInterval;
	let m_elmCheckFeedsWhenSbClosed;
	let m_elmTimeOfDayBox;
	let m_elmInputTime;
	let m_elmCheckFeedsMethod;
	let m_elmFetchTimeout;
	let m_elmSortFeedItems;
	let m_elmFolderClickAction;
	let m_elmClickOpensFeedPreview;
	let m_elmMarkFeedPreviewUrlsAsVisited;
	let m_elmFeedItemOpenMethod;
	let m_elmShowFeedStats;
	let m_elmShowFeedItemDesc;
	let m_elmFeedItemDescDelay;
	let m_elmShowFeedItemDescAttach;
	let m_elmColorFeedItemDescBackground;
	let m_elmColorFeedItemDescText;
	let m_elmDetectFeedsInWebPage;
	let m_elmBtnDetectFeedsExceptions;
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
	let m_elmIncreaseUnvisitedFontSize;
	let m_elmShowTryOpenLinkInFeedPreview;
	let m_elmUseCustomCSSFeedPreview;
	let m_elmImportCustomCSSSource;
	let m_elmBtnEditCSSSource;
	let m_elmBtnClearCSSSource;
	let m_elmImportOpml;
	let m_elmExportOpml;
	let m_elmImportPreferences;
	let m_elmExportPreferences;

	let m_elmPageOverlay;

	let m_elmMessageBox;
	let m_elmBtnMessageBoxOK;
	let m_funcOnCloseMessageBox;

	let m_elmUrlListBox;
	let m_elmUrlListBoxTextArea;
	let m_elmBtnUrlListBoxSave;
	let m_elmBtnUrlListBoxCancel;
	let m_elmUrlListBoxStatusbar;
	let m_funcResolveGetUrlList;
	let m_statusbarupdateDebouncer;

	let m_elmBtnReloadExtension;
	let m_elmBtnRestoreDefaults;

	let m_funcResolveGetTimeOfDay;
	let m_funcResolveGetUserFontName;

	let m_winIdNotepad = [0];

	let m_lockBookmarksEventHandler = new Locker();

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
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
		m_elmFetchTimeout = document.getElementById("fetchTimeout");
		m_elmSortFeedItems = document.getElementById("sortFeedItems");
		m_elmFolderClickAction = document.getElementById("folderClickAction");
		m_elmClickOpensFeedPreview = document.getElementById("clickOpensFeedPreview");
		m_elmMarkFeedPreviewUrlsAsVisited = document.getElementById("markFeedPreviewUrlsAsVisited");
		m_elmFeedItemOpenMethod = document.getElementById("feedItemOpenMethod");
		m_elmShowFeedStats = document.getElementById("showFeedStats");
		m_elmShowFeedItemDesc = document.getElementById("showFeedItemDesc");
		m_elmFeedItemDescDelay = document.getElementById("feedItemDescDelay");
		m_elmShowFeedItemDescAttach = document.getElementById("showFeedItemDescAttach");
		m_elmColorFeedItemDescBackground = document.getElementById("colorFeedItemDescBk");
		m_elmColorFeedItemDescText = document.getElementById("colorFeedItemDescText");
		m_elmDetectFeedsInWebPage = document.getElementById("detectFeedsInWebPage");
		m_elmBtnDetectFeedsExceptions = document.getElementById("btnDetectFeedsExceptions");
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
		m_elmIncreaseUnvisitedFontSize = document.getElementById("increaseUnvisitedFontSize");
		m_elmShowTryOpenLinkInFeedPreview = document.getElementById("showTryOpenLinkInFeedPreview");
		m_elmUseCustomCSSFeedPreview = document.getElementById("useCustomCSSFeedPreview");
		m_elmImportCustomCSSSource = document.getElementById("importCustomCSSSource");
		m_elmBtnEditCSSSource = document.getElementById("btnEditCSSSource");
		m_elmBtnClearCSSSource = document.getElementById("btnClearCSSSource");
		m_elmImportOpml = document.getElementById("inputImportOPML");
		m_elmExportOpml = document.getElementById("btnExportOPML");
		m_elmImportPreferences = document.getElementById("inputImportPreferences");
		m_elmExportPreferences = document.getElementById("btnExportPreferences");

		m_elmPageOverlay = document.getElementById("pageOverlay");

		m_elmBtnReloadExtension = document.getElementById("btnReloadExtension");
		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		slUtil.getBrowserVersion().then((version) => {
			if(parseInt(version) >= 68) {
				document.body.classList.add("noCaptionStyleV68");
			}
		});

		document.getElementById("checkFeedsMethodInfo").title = TXT_HELP_INFO_CHECK_FEED_METHOD.replace(/ /g, "\u00a0");
		document.getElementById("detectFeedsExceptionsInfo").title = TXT_HELP_INFO_DETECT_FEEDS_EXCEPTIONS;

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
		m_elmSortFeedItems.removeEventListener("change", onChangeSortFeedItems);
		m_elmFolderClickAction.removeEventListener("change", onChangeFolderClickAction);
		m_elmClickOpensFeedPreview.removeEventListener("change", onChangeClickOpensFeedPreview);
		m_elmMarkFeedPreviewUrlsAsVisited.removeEventListener("change", onChangeMarkFeedPreviewUrlsAsVisited);
		m_elmFeedItemOpenMethod.removeEventListener("change", onChangeFeedItemOpenMethod);
		m_elmShowFeedStats.removeEventListener("change", onChangeShowFeedStats);
		m_elmShowFeedItemDesc.removeEventListener("change", onChangeShowFeedItemDesc);
		m_elmFeedItemDescDelay.removeEventListener("change", onChangeFeedItemDescDelay);
		m_elmShowFeedItemDescAttach.removeEventListener("change", onChangeShowFeedItemDescAttach);
		m_elmColorFeedItemDescBackground.removeEventListener("change", onChangeColorFeedItemDescBackground);
		m_elmColorFeedItemDescText.removeEventListener("change", onChangeColorFeedItemDescText);
		m_elmDetectFeedsInWebPage.removeEventListener("change", onChangeDetectFeedsInWebPage);
		m_elmBtnDetectFeedsExceptions.removeEventListener("click", onClickBtnDetectFeedsExceptions);
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
		m_elmIncreaseUnvisitedFontSize.removeEventListener("change", onChangeIncreaseUnvisitedFontSize);
		m_elmShowTryOpenLinkInFeedPreview.removeEventListener("change", onChangeShowTryOpenLinkInFeedPreview);
		m_elmUseCustomCSSFeedPreview.removeEventListener("change", onChangeUseCustomCSSFeedPreview);
		m_elmImportCustomCSSSource.removeEventListener("change", onChangeImportCustomCSSSource);
		m_elmBtnEditCSSSource.removeEventListener("click", onClickBtnEditCSSSource);
		m_elmBtnClearCSSSource.removeEventListener("click", onClickBtnClearCSSSource);
		m_elmImportOpml.removeEventListener("change", onChangeImportOpml);
		m_elmExportOpml.removeEventListener("click", onClickExportOpml);
		m_elmImportPreferences.removeEventListener("change", onChangeImportPreferences);
		m_elmExportPreferences.removeEventListener("click", onClickExportPreferences);

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
		m_elmSortFeedItems.addEventListener("change", onChangeSortFeedItems);
		m_elmFolderClickAction.addEventListener("change", onChangeFolderClickAction);
		m_elmClickOpensFeedPreview.addEventListener("change", onChangeClickOpensFeedPreview);
		m_elmMarkFeedPreviewUrlsAsVisited.addEventListener("change", onChangeMarkFeedPreviewUrlsAsVisited);
		m_elmFeedItemOpenMethod.addEventListener("change", onChangeFeedItemOpenMethod);
		m_elmShowFeedStats.addEventListener("change", onChangeShowFeedStats);
		m_elmShowFeedItemDesc.addEventListener("change", onChangeShowFeedItemDesc);
		m_elmFeedItemDescDelay.addEventListener("change", onChangeFeedItemDescDelay);
		m_elmShowFeedItemDescAttach.addEventListener("change", onChangeShowFeedItemDescAttach);
		m_elmColorFeedItemDescBackground.addEventListener("change", onChangeColorFeedItemDescBackground);
		m_elmColorFeedItemDescText.addEventListener("change", onChangeColorFeedItemDescText);
		m_elmDetectFeedsInWebPage.addEventListener("change", onChangeDetectFeedsInWebPage);
		m_elmBtnDetectFeedsExceptions.addEventListener("click", onClickBtnDetectFeedsExceptions);
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
		m_elmIncreaseUnvisitedFontSize.addEventListener("change", onChangeIncreaseUnvisitedFontSize);
		m_elmShowTryOpenLinkInFeedPreview.addEventListener("change", onChangeShowTryOpenLinkInFeedPreview);
		m_elmUseCustomCSSFeedPreview.addEventListener("change", onChangeUseCustomCSSFeedPreview);
		m_elmImportCustomCSSSource.addEventListener("change", onChangeImportCustomCSSSource);
		m_elmBtnEditCSSSource.addEventListener("click", onClickBtnEditCSSSource);
		m_elmBtnClearCSSSource.addEventListener("click", onClickBtnClearCSSSource);
		m_elmImportOpml.addEventListener("change", onChangeImportOpml);
		m_elmExportOpml.addEventListener("click", onClickExportOpml);
		m_elmImportPreferences.addEventListener("change", onChangeImportPreferences);
		m_elmExportPreferences.addEventListener("click", onClickExportPreferences);

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
		initializeCheckFeedsMethodTitles();

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

		prefs.getSortFeedItems().then((checked) => {
			m_elmSortFeedItems.checked = checked;
		});

		prefs.getFolderClickAction().then((value) => {
			m_elmFolderClickAction.value = value;
		});

		prefs.getClickOpensFeedPreview().then((value) => {
			m_elmClickOpensFeedPreview.value = value;
		});

		prefs.getMarkFeedPreviewUrlsAsVisited().then((value) => {
			m_elmMarkFeedPreviewUrlsAsVisited.value = value;
		});

		prefs.getFeedItemOpenMethod().then((value) => {
			m_elmFeedItemOpenMethod.value = value;
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
			slUtil.disableElementTree(m_elmBtnDetectFeedsExceptions.parentElement.parentElement, !checked);
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

		prefs.getIncreaseUnvisitedFontSize().then((checked) => {
			m_elmIncreaseUnvisitedFontSize.checked = checked;
		});

		prefs.getShowTryOpenLinkInFeedPreview().then((checked) => {
			m_elmShowTryOpenLinkInFeedPreview.checked = checked;
		});

		prefs.getUseCustomCSSFeedPreview().then((checked) => {
			m_elmUseCustomCSSFeedPreview.checked = checked;
			if(checked) {
				prefs.getCustomCSSSourceHash().then((hash) => {
					slUtil.disableElementTree(m_elmBtnEditCSSSource, (hash.length === 0));
					slUtil.disableElementTree(m_elmBtnClearCSSSource, (hash.length === 0));
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

			let elmInput = event.target.querySelector("input[type=checkbox],input[type=text]");

			if(!!elmInput) {
				event.stopPropagation();

				if(elmInput.type === "checkbox") {
					elmInput.click();
				} else if(elmInput.type === "text") {
					elmInput.focus();
					elmInput.select();
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeRootFeedsFolder(event) {
		prefs.setRootFeedsFolderId(m_elmRootFeedsFolder.value).then(()=> {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ROOT_FOLDER);
		});
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, m_elmRootFeedsFolder.value === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET);
		flashRootFeedsFolderElement();
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

					prefs.setCheckFeedsInterval(timeValue).then(() => {
						broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL);
					});
				}
			});

		} else {
			prefs.setCheckFeedsInterval(m_elmCheckFeedsInterval.value).then(() => {
				broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CHECK_FEEDS_INTERVAL);
			});
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
	function onChangeSortFeedItems(event) {
		prefs.setSortFeedItems(m_elmSortFeedItems.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_SORT_FEED_ITEMS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFolderClickAction(event) {
		prefs.setFolderClickAction(parseInt(m_elmFolderClickAction.value));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeClickOpensFeedPreview(event) {
		prefs.setClickOpensFeedPreview(parseInt(m_elmClickOpensFeedPreview.value));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeMarkFeedPreviewUrlsAsVisited(event) {
		prefs.setMarkFeedPreviewUrlsAsVisited(parseInt(m_elmMarkFeedPreviewUrlsAsVisited.value));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFeedItemOpenMethod(event) {
		prefs.setFeedItemOpenMethod(parseInt(m_elmFeedItemOpenMethod.value));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedStats(event) {
		prefs.setShowFeedStats(m_elmShowFeedStats.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_SHOW_FEED_STATS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedItemDesc(event) {
		prefs.setShowFeedItemDesc(m_elmShowFeedItemDesc.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC);
		});
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
			prefs.setFeedItemDescDelay(m_elmFeedItemDescDelay.value).then(() => {
				broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FEED_ITEM_DESC_DELAY);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowFeedItemDescAttach(event) {
		prefs.setShowFeedItemDescAttach(m_elmShowFeedItemDescAttach.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_SHOW_FEED_ITEM_DESC_ATTACH);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorFeedItemDescBackground(event) {
		m_elmColorFeedItemDescBackground.title = colorInputTitle(m_elmColorFeedItemDescBackground.value);
		prefs.setColorFeedItemDescBackground(m_elmColorFeedItemDescBackground.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorFeedItemDescText(event) {
		m_elmColorFeedItemDescText.title = colorInputTitle(m_elmColorFeedItemDescText.value);
		prefs.setColorFeedItemDescText(m_elmColorFeedItemDescText.value).then(() =>{
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FEED_ITEM_DESC_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeDetectFeedsInWebPage(event) {
		prefs.setDetectFeedsInWebPage(m_elmDetectFeedsInWebPage.checked).then(() => {
			slUtil.disableElementTree(m_elmBtnDetectFeedsExceptions.parentElement.parentElement, !m_elmDetectFeedsInWebPage.checked);
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickBtnDetectFeedsExceptions(event) {

		const caption = "Feed Detection Exceptions";
		const desc = "You can specify which web pages are never allowed to be scanned for feeds. Type the exact address. Letter capitalization matter." +
						"\u000a\u000aOne URL address per line. Lines prefixed with '#' will be ignored."
		const value = await prefs.getDetectFeedsExceptions();

		let result = await getUrlList(m_elmBtnDetectFeedsExceptions.parentElement.parentElement, caption, desc, value);

		if(result.saveChanges) {
			await prefs.setDetectFeedsExceptions(result.value);
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_DETECT_FEEDS_EXCEPTIONS);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeUIDensity(event) {
		prefs.setUIDensity(m_elmUIDensity.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_UI_DENSITY);
		});
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

					prefs.setFontName(m_elmFontName.value).then(() => {
						broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FONT_NAME);
					});
				}
			});

		} else {
			prefs.setFontName(m_elmFontName.value).then(() => {
				broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FONT_NAME);
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeFontSizePercent(event) {
		prefs.setFontSizePercent(m_elmFontSizePercent.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_FONT_SIZE_PERCENT);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorBackground(event) {
		m_elmColorBackground.title = colorInputTitle(m_elmColorBackground.value);
		prefs.setColorBackground(m_elmColorBackground.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorDialogBackground(event) {
		m_elmColorDialogBackground.title = colorInputTitle(m_elmColorDialogBackground.value);
		prefs.setColorDialogBackground(m_elmColorDialogBackground.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorSelect(event) {
		m_elmColorSelect.title = colorInputTitle(m_elmColorSelect.value);
		prefs.setColorSelect(m_elmColorSelect.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorText(event) {
		m_elmColorText.title = colorInputTitle(m_elmColorText.value);
		prefs.setColorText(m_elmColorText.value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickRadioImageSet(event) {
		prefs.setImageSet(parseInt(event.target.value)).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_IMAGES);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeIncreaseUnvisitedFontSize(event) {
		prefs.setIncreaseUnvisitedFontSize(m_elmIncreaseUnvisitedFontSize.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_INCREASE_UNVISITED_FONT_SIZE);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeShowTryOpenLinkInFeedPreview(event) {
		prefs.setShowTryOpenLinkInFeedPreview(m_elmShowTryOpenLinkInFeedPreview.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_SHOW_TRY_OPEN_LINK_IN_FEED_PREVIEW);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeUseCustomCSSFeedPreview(event) {
		prefs.setUseCustomCSSFeedPreview(m_elmUseCustomCSSFeedPreview.checked).then(() => {
			prefs.getCustomCSSSourceHash().then((hash) => {

				if(m_elmUseCustomCSSFeedPreview.checked) {
					slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, false);
					slUtil.disableElementTree(m_elmBtnEditCSSSource, (hash.length === 0));
					slUtil.disableElementTree(m_elmBtnClearCSSSource, (hash.length === 0));
				} else {
					slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, true);
				}

				flashCustomCSSImportButton();
				if(hash.length > 0) {
					prefs.getCustomCSSSource().then((currentSource) => {
						broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE, currentSource);
					});
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeImportCustomCSSSource(event) {

		ifNotepadWindowIsClosed().then(() => {
			cssFileValidator(event.target.files[0]).then((result) => {

				prefs.getCustomCSSSource().then((prevSource) => {
					prefs.setCustomCSSSource(result.source).then(() => {
						broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE, prevSource);
					});
				});

				slUtil.disableElementTree(m_elmBtnEditCSSSource, false);
				slUtil.disableElementTree(m_elmBtnClearCSSSource, false);

				flashCustomCSSImportButton();

				if(!!result.warning) {
					showMessageBox("Warning", result.warning, m_elmImportCustomCSSSource.parentElement.parentElement);
				}

			}).catch((error) => {
				showMessageBox("Error", error.message, m_elmImportCustomCSSSource.parentElement.parentElement);
				console.log("[Sage-Like]", "CSS file validation error", error.message);
			});
		}).catch(() => { /* if open do nothing */ });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnEditCSSSource(event) {
		// if notepad windows is not found (or id is zero) the catch() will create a new notepad window
		browser.windows.update(m_winIdNotepad[0], { focused: true }).catch(() => {
			let createData = {
				url: browser.runtime.getURL("notepad/notepad.html"),
				type: "popup",
				allowScriptsToClose: true,
			};
			browser.windows.create(createData).then(win => {
				m_winIdNotepad.push(win.id);
				while(m_winIdNotepad.length > 1) {	// there must be only one
					browser.windows.remove(m_winIdNotepad.shift()).catch(() => { /* if not found do nothing */ });
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnClearCSSSource(event) {
		ifNotepadWindowIsClosed().then(() => {
			prefs.getCustomCSSSource().then((prevSource) => {
				prefs.setCustomCSSSource(prefs.DEFAULTS.customCSSSource).then(() => {
					broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE, prevSource);
				});
			});
			slUtil.disableElementTree(m_elmBtnEditCSSSource, true);
			slUtil.disableElementTree(m_elmBtnClearCSSSource, true);
			flashCustomCSSImportButton();
		}).catch(() => { /* if open do nothing */ });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeImportOpml(event) {

		browser.runtime.sendMessage({ id: Global.MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER });
		m_lockBookmarksEventHandler.lock();

		let elmPrefOverlayFeedTrans = document.getElementById("prefOverlayFeedTrans");
		let elmPref = m_elmImportOpml.parentElement.parentElement;

		elmPrefOverlayFeedTrans.classList.add("processing");
		slUtil.disableElementTree(elmPref, true);

		opml.importFeeds.run(event.target.files[0]).then((result) => {

			initializeSelectFeedsFolder();
			browser.runtime.sendMessage({ id: Global.MSG_ID_SET_PRIORITY_SELECTED_ITEM_ID, itemId: result.newFolderId });
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ROOT_FOLDER);

			let skipped = result.stats.outlineCount - (result.stats.feedCount + result.stats.folderCount);
			let msg = result.stats.feedCount + " feed(s) and " + result.stats.folderCount + " folder(s) were successfully imported.";
			if(skipped > 0) {
				msg += "\n\n" + skipped +" file " + (skipped>1 ? "entries were" : "entry was") + " skipped.";
			}
			showMessageBox("Import", msg, elmPref);

		}).catch((error) => {
			showMessageBox("Error", error, elmPref);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			browser.runtime.sendMessage({ id: Global.MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER });
			m_lockBookmarksEventHandler.unlock();

			elmPrefOverlayFeedTrans.classList.remove("processing");
			slUtil.disableElementTree(elmPref, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExportOpml(event) {

		let elmPref = m_elmImportOpml.parentElement.parentElement;
		slUtil.disableElementTree(elmPref, true);

		opml.exportFeeds.run().then((result) => {

			// fileName is missing when download was canceled by user
			if(!!result.fileName) {
				let msg = result.stats.feedCount + " feed(s) and " + result.stats.folderCount + " folder(s) were successfully exported.\n\nFile: " + result.fileName;
				showMessageBox("Export", msg, elmPref);
			}

		}).catch((error) => {
			showMessageBox("Error", error, elmPref);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			slUtil.disableElementTree(elmPref, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeImportPreferences(event) {

		let elmPrefOverlay = document.getElementById("prefOverlayManage");
		let elmPref = m_elmImportPreferences.parentElement.parentElement;

		elmPrefOverlay.classList.add("processing");
		slUtil.disableElementTree(elmPref, true);

		preferencesData.import.run(event.target.files[0]).then(() => {

			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ALL);
			let msg = "File was successfully imported.\n\nThis page will now be reloaded to reflect imported options.";
			showMessageBox("Import", msg, elmPref, () => browser.tabs.reload({ bypassCache: true }) );

		}).catch((error) => {
			showMessageBox("Error", error, elmPref);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			elmPrefOverlay.classList.remove("processing");
			slUtil.disableElementTree(elmPref, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickExportPreferences(event) {

		let elmPref = m_elmImportPreferences.parentElement.parentElement;
		slUtil.disableElementTree(elmPref, true);

		preferencesData.export.run().then((result) => {

			// fileName is missing when download was canceled by user
			if(!!result.fileName) {
				showMessageBox("Export", `Options were successfully exported.\n\nFile: ${result.fileName}`, elmPref);
			}

		}).catch((error) => {
			showMessageBox("Error", error, elmPref);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			slUtil.disableElementTree(elmPref, false);
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
		slUtil.disableElementTree(m_elmBtnDetectFeedsExceptions.parentElement.parentElement, !defPrefs.detectFeedsInWebPage);
		slUtil.disableElementTree(m_elmFeedItemDescDelay.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmShowFeedItemDescAttach.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmColorFeedItemDescBackground.parentElement.parentElement, !defPrefs.showFeedItemDesc);
		slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, !defPrefs.useCustomCSSFeedPreview);
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, defPrefs.rootFeedsFolderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET);

		m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
		m_elmCheckFeedsInterval.value = defPrefs.checkFeedsInterval;
		m_elmCheckFeedsWhenSbClosed.checked = defPrefs.checkFeedsWhenSbClosed;
		m_elmCheckFeedsMethod.value = defPrefs.checkFeedsMethod;
		m_elmFetchTimeout.value = defPrefs.fetchTimeout;
		m_elmSortFeedItems.checked = defPrefs.sortFeedItems;
		m_elmFolderClickAction.value = defPrefs.folderClickAction;
		m_elmClickOpensFeedPreview.value = defPrefs.clickOpensFeedPreview;
		m_elmMarkFeedPreviewUrlsAsVisited.value = defPrefs.markFeedPreviewUrlsAsVisited;
		m_elmFeedItemOpenMethod.value = defPrefs.feedItemOpenMethod;
		m_elmShowFeedStats.checked = defPrefs.showFeedStats;
		m_elmShowFeedItemDesc.checked = defPrefs.showFeedItemDesc;
		m_elmFeedItemDescDelay.value = defPrefs.feedItemDescDelay;
		m_elmShowFeedItemDescAttach.checked = defPrefs.showFeedItemDescAttach;
		m_elmColorFeedItemDescBackground.value = defPrefs.colorFeedItemDescBk;
		m_elmColorFeedItemDescText.value = defPrefs.colorFeedItemDescText;
		m_elmDetectFeedsInWebPage.checked = defPrefs.detectFeedsInWebPage;
		m_elmUIDensity.value = defPrefs.UIDensity;
		m_elmFontName.value = defPrefs.fontName;
		m_elmFontSizePercent.value = defPrefs.fontSizePercent;
		m_elmColorBackground.value = defPrefs.colorBk;
		m_elmColorDialogBackground.value = defPrefs.colorDlgBk;
		m_elmColorSelect.value = defPrefs.colorSelect;
		m_elmColorText.value = defPrefs.colorText;
		let radios = document.getElementsByName("imageSet");
		for(let radio of radios) {
			if(parseInt(radio.value) === defPrefs.imageSet) {
				radio.checked = true;
				break;
			}
		}
		m_elmIncreaseUnvisitedFontSize.checked = defPrefs.increaseUnvisitedFontSize;
		m_elmShowTryOpenLinkInFeedPreview.checked = defPrefs.showTryOpenLinkInFeedPreview;
		m_elmUseCustomCSSFeedPreview.checked = defPrefs.useCustomCSSFeedPreview;

		flashRootFeedsFolderElement();
		flashCustomCSSImportButton();
		broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ALL);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onBookmarksEventModifiedHandler(id, modifyInfo) {

		if(m_lockBookmarksEventHandler.isUnlocked) {

			// Initialize the <select> element only if needed
			if(	((await browser.bookmarks.get(id))[0].type === "folder") ||															// created/moved/changed a folder
				(!!modifyInfo.parentId && ((await browser.bookmarks.getChildren(modifyInfo.parentId)).length === 1)) ||				// created-in/moved-to an empty folder
				(!!modifyInfo.oldParentId && ((await browser.bookmarks.getChildren(modifyInfo.oldParentId)).length === 0)) ) {		// moved last item from folder

				initializeSelectFeedsFolder();
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onBookmarksEventRemovedHandler(id, removeInfo) {

		if(m_lockBookmarksEventHandler.isUnlocked) {

			// Initialize the <select> element only if needed
			if( (removeInfo.node.type === "folder") ||																			// deleted a folder
				(!!removeInfo.parentId && ((await browser.bookmarks.getChildren(removeInfo.parentId)).length === 0)) ) {		// deleted last item from folder

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

		if(selected === undefined || selected.value === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
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
					m_elmRootFeedsFolder.value = Global.ROOT_FEEDS_FOLDER_ID_NOT_SET
				}
				slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, m_elmRootFeedsFolder.value === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET);
				setTimeout(() => flashRootFeedsFolderElement(), 500);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderElements() {

		return new Promise((resolve) => {

			let frag = document.createDocumentFragment();
			frag.append(...m_elmRootFeedsFolder.children);

			while(frag.firstElementChild) {
				frag.removeChild(frag.firstElementChild);
			}

			browser.bookmarks.getSubTree(Global.BOOKMARKS_ROOT_GUID).then((bookmarks) => {

				let elmOption = createTagOption(Global.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
				frag.appendChild(elmOption);

				let folderChildren = bookmarks[0].children;
				for(let i=0, len=folderChildren.length; i<len; i++) {
					createSelectFeedsFolderSingleElement(frag, folderChildren[i], 0);
				}
				m_elmRootFeedsFolder.appendChild(frag);
				resolve();
			});

		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createSelectFeedsFolderSingleElement(frag, bookmarkItem, indent) {

		if(bookmarkItem.type === "folder") {
			let elmOption = createTagOption(bookmarkItem.id, "\u2003".repeat(indent) + "\u276F\u2002" + bookmarkItem.title);	/* &emsp; ❯ &ensp; */

			if(bookmarkItem.children.length === 0) {
				let elmNoItem = document.createElement("span");
				elmNoItem.textContent = "\u2003\u2205";		/* &emsp; ∅ */
				elmOption.appendChild(elmNoItem);
			}
			frag.appendChild(elmOption);
			indent++;
			for(let i=0, len=bookmarkItem.children.length; i<len; i++) {
				createSelectFeedsFolderSingleElement(frag, bookmarkItem.children[i], indent);
			}
			indent--;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createTagOption(value, text) {
		let elm = document.createElement("option");
		elm.value = value;
		elm.textContent = text;
		return elm;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initializeCheckFeedsMethodTitles() {

		/*	The titles (tooltips) are not displayed in Fx v76 unless the
			"options_ui" in manifest.json has the "open_in_tab" set to true. */

		let re, found, items = m_elmCheckFeedsMethod.children;

		for(let i=0, len=items.length; i<len; i++) {

			re = new RegExp("\\b" + items[i].textContent + "\\b[^A-Z]*([A-Z].+\\.)\\s?$", "m");
			found = TXT_HELP_INFO_CHECK_FEED_METHOD.match(re);

			if( !!found && !!found[1] ) {
				items[i].title = found[1];
			}
		}
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
	function closeUserFontNameBox(value = "") {

		m_elmUserFontBox.style.display = "none";

		if(typeof(m_funcResolveGetUserFontName) === "function") {
			m_funcResolveGetUserFontName(value);
		}
		m_funcResolveGetUserFontName = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownUserFontBox(event) {
		if( ["Enter","NumpadEnter"].includes(event.code) ) {
			closeUserFontNameBox(m_elmUserFontName.value.trim());
		} else if("Escape" === event.code) {
			closeUserFontNameBox();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurUserFontName(event) {
		closeUserFontNameBox();
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
	function closeTimeOfDayBox(value = "") {

		setTimeout(() => m_elmTimeOfDayBox.style.display = "none");		// to avoid: "TypeError: Property 'handleEvent' is not callable."

		if(typeof(m_funcResolveGetTimeOfDay) === "function") {
			m_funcResolveGetTimeOfDay(value);
		}
		m_funcResolveGetTimeOfDay = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTimeOfDayBox(event) {
		if( ["Enter","NumpadEnter"].includes(event.code) ) {
			closeTimeOfDayBox(m_elmInputTime.value);
		} else if("Escape" === event.code) {
			closeTimeOfDayBox();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurInputTime(event) {
		closeTimeOfDayBox();
	}

	//==================================================================================
	//=== Message Box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function showMessageBox(msgCaption, msgText, elmPreferenceReference, callbackOnCloseBox = null) {

		m_funcOnCloseMessageBox = callbackOnCloseBox;

		if(!!!m_elmMessageBox) {
			m_elmMessageBox = document.getElementById("messageBox");
			m_elmBtnMessageBoxOK = document.getElementById("btnMessageBoxOK");
		}

		document.getElementById("messageBoxCaption").textContent = msgCaption;
		document.getElementById("messageBoxText").textContent = msgText;

		m_elmMessageBox.addEventListener("keydown", onKeyDownMessageBox);
		m_elmBtnMessageBoxOK.addEventListener("click", onClickBtnMessageBoxOK);

		m_elmPageOverlay.style.display = "block";
		m_elmMessageBox.style.display = "block";
		m_elmMessageBox.style.color = (["Error", "Warning"].includes(msgCaption) ? "#db0000" : "");

		let rect = slUtil.getElementViewportRect(elmPreferenceReference, window.innerWidth, window.innerHeight);

		const OFFSET = 8;
		let x = (rect.width - m_elmMessageBox.offsetWidth) / 2;
		let y = rect.top - m_elmMessageBox.offsetHeight - 80;

		m_elmMessageBox.style.left = (x<1 ? OFFSET : x) + "px";
		m_elmMessageBox.style.top = (y<OFFSET ? OFFSET : y) + "px";

		m_elmBtnMessageBoxOK.focus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeMessageBox() {

		m_elmPageOverlay.style.display = "none";
		m_elmMessageBox.style.display = "none";

		m_elmMessageBox.removeEventListener("keydown", onKeyDownMessageBox);
		m_elmBtnMessageBoxOK.removeEventListener("click", onClickBtnMessageBoxOK);

		if(typeof(m_funcOnCloseMessageBox) === "function") {
			m_funcOnCloseMessageBox();
		}
		m_funcOnCloseMessageBox = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownMessageBox(event) {
		if(["Escape","Enter","NumpadEnter","Space"].includes(event.code)) {
			closeMessageBox();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnMessageBoxOK(event) {
		closeMessageBox();
	}

	//==================================================================================
	//=== URL List Box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function getUrlList(elmPreferenceReference, caption, desc, value = "") {

		return new Promise((resolve) => {

			m_funcResolveGetUrlList = resolve;

			// if never initialized
			if(!!!m_elmUrlListBox) {
				m_elmUrlListBox = document.getElementById("urlListBox");
				m_elmUrlListBoxTextArea = document.getElementById("urlListBoxTextArea");
				m_elmBtnUrlListBoxSave = document.getElementById("btnUrlListBoxSave");
				m_elmBtnUrlListBoxCancel = document.getElementById("btnUrlListBoxCancel");
				m_elmUrlListBoxStatusbar = document.getElementById("urlListBoxStatusbar");
			}

			document.getElementById("urlListBoxCaption").textContent = caption;
			document.getElementById("urlListBoxDescription").textContent = desc;
			m_elmUrlListBoxTextArea.value = value;

			m_elmUrlListBox.addEventListener("keydown", onKeyDownUrlListBox);
			m_elmUrlListBoxTextArea.addEventListener("input", onInputUrlListBoxTextArea);
			m_elmBtnUrlListBoxSave.addEventListener("click", onClickBtnUrlListBoxSave);
			m_elmBtnUrlListBoxCancel.addEventListener("click", onClickBtnUrlListBoxCancel);
			m_elmUrlListBoxStatusbar.addEventListener("click", onClickUrlListBoxStatusbar);

			m_elmPageOverlay.style.display = "block";
			m_elmUrlListBox.style.display = "block";

			let rect = slUtil.getElementViewportRect(elmPreferenceReference, window.innerWidth, window.innerHeight);

			const BOX_HEIGHT = m_elmUrlListBox.clientHeight;
			const BOX_WIDTH_MARGIN = 3;

			m_elmUrlListBox.style.left = BOX_WIDTH_MARGIN + "px";
			m_elmUrlListBox.style.top = (rect.top - (BOX_HEIGHT - rect.height) / 2) + "px";
			m_elmUrlListBox.style.width = (rect.width - BOX_WIDTH_MARGIN * 2) + "px";

			m_elmUrlListBoxTextArea.setSelectionRange(0, 0); // move cursor to start
			m_elmUrlListBoxTextArea.focus();

			urlListValidator();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeUrlListBox(saveChanges = false) {

		m_elmPageOverlay.style.display = "none";
		m_elmUrlListBox.style.display = "none";

		m_elmUrlListBox.removeEventListener("keydown", onKeyDownUrlListBox);
		m_elmUrlListBoxTextArea.removeEventListener("input", onInputUrlListBoxTextArea);
		m_elmBtnUrlListBoxSave.removeEventListener("click", onClickBtnUrlListBoxSave);
		m_elmBtnUrlListBoxCancel.removeEventListener("click", onClickBtnUrlListBoxCancel);
		m_elmUrlListBoxStatusbar.removeEventListener("click", onClickUrlListBoxStatusbar);

		if(typeof(m_funcResolveGetUrlList) === "function") {
			m_funcResolveGetUrlList({
				saveChanges: saveChanges,
				value: saveChanges ? m_elmUrlListBoxTextArea.value : null,
			});
		}
		m_funcResolveGetUrlList = null;
		m_elmUrlListBoxTextArea.value = "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function urlListValidator() {

		const PFX = "⚠ ";
		const PFX_CLK = `${PFX}Click Me! – `;

		let urls = m_elmUrlListBoxTextArea.value.split("\n");
		let totalValidURLs = 0;


		///////////////////////////////////////////////////////////////////////////////////////////
		// look for invalid URLs

		let lineNumbers = [];
		for(let i=0, len=urls.length; i<len; i++) {

			let url = urls[i].trim();

			if(url.length > 0 && url[0] !== "#") {		// valid lines
				if( !!!slUtil.validURL(url) ) {
					lineNumbers.push(i+1);
				} else {
					totalValidURLs++;
				}
			}
		}
		if(lineNumbers.length > 0) {
			m_elmUrlListBoxStatusbar.lineNumbers = lineNumbers;
			m_elmUrlListBoxStatusbar.lineNumbersIdx = -1;
			m_elmUrlListBoxStatusbar.textContent = `${PFX_CLK}Invalid URL address(es) at line(s): ${lineNumbers}`;
			return;
		}


		///////////////////////////////////////////////////////////////////////////////////////////
		// look for duplicates only if all URLs are valid

		lineNumbers = [];
		for(let i=0, len=urls.length-1; i<len; i++) {

			let src = urls[i].trim();

			if(src.length > 0 && src[0] !== "#") {

				let curLineNum = i+1;

				// if current line number is not already in array (case where there are more then 2 occurrences)
				if(!!!lineNumbers.find(g => g.includes(curLineNum))) {

					let group = [curLineNum];

					for(let j=i+1, len=urls.length; j<len; j++) {

						let trg = urls[j].trim();

						if(trg.length > 0 && trg[0] !== "#") {		// valid lines
							if(src === trg) {
								group.push(j+1);
							}
						}
					}
					if(group.length > 1) {
						lineNumbers.push(group);
					}
				}
			}
		}
		if(lineNumbers.length > 0) {
			m_elmUrlListBoxStatusbar.lineNumbers = lineNumbers.reduce((p, c) => p.concat(c));
			m_elmUrlListBoxStatusbar.lineNumbersIdx = -1;
			m_elmUrlListBoxStatusbar.textContent = `${PFX_CLK}Duplicates URL address(es) at lines: (${lineNumbers.join("), (")})`;
			return;
		}


		///////////////////////////////////////////////////////////////////////////////////////////
		// look for too many URLs

		if(totalValidURLs > Global.MAXIMUM_DETECT_FEEDS_EXCEPTION_URLS) {
			m_elmUrlListBoxStatusbar.lineNumbers = [];
			m_elmUrlListBoxStatusbar.lineNumbersIdx = undefined;
			m_elmUrlListBoxStatusbar.textContent = `${PFX}Only the first ${Global.MAXIMUM_DETECT_FEEDS_EXCEPTION_URLS} URL addresses will be used (total: ${totalValidURLs})`;
			return;
		}

		m_elmUrlListBoxStatusbar.lineNumbers = [];
		m_elmUrlListBoxStatusbar.lineNumbersIdx = undefined;
		m_elmUrlListBoxStatusbar.textContent = `Total: ${totalValidURLs}`;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownUrlListBox(event) {
		if( ["Enter","NumpadEnter"].includes(event.code) && !!event.target && event.target.id !== m_elmUrlListBoxTextArea.id ) {
			closeUrlListBox(true);
		} else if("Escape" === event.code) {
			closeUrlListBox();
		} else if(event.ctrlKey && event.code === "KeyS") {
			closeUrlListBox(true);
			event.preventDefault();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onInputUrlListBoxTextArea(event) {
		clearTimeout(m_statusbarupdateDebouncer);
		m_statusbarupdateDebouncer = setTimeout(() => {
			urlListValidator();
			m_statusbarupdateDebouncer = null;
		}, 550);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickUrlListBoxStatusbar(event) {

		let lineNumbers = m_elmUrlListBoxStatusbar.lineNumbers;

		if(lineNumbers.length > 0) {

			let reverse = event.shiftKey;
			let idx = m_elmUrlListBoxStatusbar.lineNumbersIdx;

			if(reverse) {
				idx = idx > 0 ? idx - 1 : lineNumbers.length-1;
			} else {
				idx = idx < (lineNumbers.length-1) ? idx + 1 : 0;
			}

			let lines = m_elmUrlListBoxTextArea.value.split("\n");
			let start = 0;

			for(let i=0, len=lines.length; i<len; i++) {
				if(i === (lineNumbers[idx]-1)) break;
				start += (lines[i].length + 1);
			}

			m_elmUrlListBoxTextArea.setSelectionRange(start, start + lines[lineNumbers[idx]-1].length);
			m_elmUrlListBoxStatusbar.lineNumbersIdx = idx;
			m_elmUrlListBoxTextArea.focus();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnUrlListBoxSave(event) {
		closeUrlListBox(true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnUrlListBoxCancel(event) {
		closeUrlListBox();
	}

	//==================================================================================
	//=== Misc. functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function colorInputTitle(colorValue) {
		return (colorValue && colorValue[0] === "#" ? "HTML notation: " + colorValue.toLowerCase() : "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function broadcastPreferencesUpdated(details, payload = undefined) {
		browser.runtime.sendMessage({
			id: Global.MSG_ID_PREFERENCES_CHANGED,
			details: details,
			payload: payload,
	 	});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function flashCustomCSSImportButton() {
		document.getElementById("labelForImportCustomCSSSource").classList.toggle("flash", (m_elmUseCustomCSSFeedPreview.checked && m_elmBtnEditCSSSource.disabled));
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

					let source = event.target.result.replace(/\r\n?/g, "\n");	// css source will be saved in prefs w/o CR, replaced by \n

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
						let rxRemoteURI = /\b(https?|ftp|file):\/*[^\s]+/im;

						if(lenRules > 0) {

							for(let i=0; i<lenRules; i++) {
								if( !(rules[i] instanceof CSSNamespaceRule) ) {
									hasStyleRule = true;
									if(rules[i].cssText.match(rxRemoteURI)) {
										resolveObj["warning"] = "URLs to remote resources were found in the file which could potentially be a security risk.\n\n" +
															"If you are not sure that those URLs are safe you should replace or clear this file.";
										break;
									}
								}
							}
							if(!hasStyleRule) resolveObj["warning"] = "No style rules where found in file.";

						} else {
							resolveObj["warning"] = "No rules where found in file.";
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

	////////////////////////////////////////////////////////////////////////////////////
	function ifNotepadWindowIsClosed() {
		return new Promise((resolve, reject) => {
			browser.windows.get(m_winIdNotepad[0]).then(() => {
				let msg = "The Operation cannot be completed while the notepad CSS source code editor is open.\n\nClose the editor.";
				let funcOnCloseBox = () => browser.windows.update(m_winIdNotepad[0], { focused: true }).catch(() => {});
				showMessageBox("Error", msg, m_elmImportCustomCSSSource.parentElement.parentElement, funcOnCloseBox);
				reject();
			}).catch(() => {
				resolve();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hidden_pref_animated_slide_down_panel(animate = true) {
		// do not change this preference while any slide-down panel is visible (down)
		browser.runtime.sendMessage({ id: Global.MSG_ID_CLOSE_ALL_SIDEBAR_PANELS }).then(() => {
			// wait a little to make sure all transitions were completed
			slUtil.sleep(450).then(() => {
				prefs.setAnimatedSlideDownPanel(!!animate).then(() => {
					broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ANIMATED_SLIDE_DOWN_PANEL);
				});
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hidden_pref_strict_rss_content_types(strict = true) {
		console.log("[Sage-Like]", "WARNING: The result of setting this preference to 'False' is that Sage-Like will treat nearly any XML file as an RSS feed and attempt to display it with Feed Preview.");
		prefs.setStrictRssContentTypes(!!strict).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES);
		});
	}

	return {
		hidden_pref_animated_slide_down_panel: hidden_pref_animated_slide_down_panel,
		hidden_pref_strict_rss_content_types: hidden_pref_strict_rss_content_types,
	}
})();
