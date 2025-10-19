"use strict";

let preferences = (function() {

	const ID_OPTION_USER_FONT_NAME = "optionUserFontName";
	const TXT_OPTION_USER_FONT_NAME = " (user)";

	const ID_OPTION_CHECK_FEEDS_TIME_OF_DAY = "optionCheckFeedsTimeOfDay";
	const TXT_OPTION_EVERY_DAY_AT = "Every day at ";

	const TXT_HELP_INFO_CHECK_FEED_METHOD = "Feed Fetching Methods:\n" +
											" \u25cf Strenuous\u2002–\u2002Fetches all feeds simultaneously in a single batch.\n" +
											" \u25cf Moderate\u2002–\u2002Fetches feeds in 3 batches, with 2-second pauses between batches.\n" +
											" \u25cf Relaxed\u2002–\u2002Fetches feeds in 5 batches, with 3-second pauses between batches.\n" +
											" \u25cf Easy\u2002–\u2002Fetches feeds in 10 batches, with 4-second pauses between batches.\n" +
											" \u25cf Lazy\u2002–\u2002Fetches feeds one at a time, with a 1.5-second pause between each feed.\n";

	let m_elmNavigationItems;
	let m_elmNavigationFooterItems;
	let m_elmRootFeedsFolder;
	let m_elmCheckFeedsOnSbOpen;
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
	let m_elmUIDensity;
	let m_elmFontName;
	let m_elmUserFontBox;
	let m_elmUserFontName;
	let m_elmFontSizePercent;
	let m_elmColorBackground;
	let m_elmColorDialogBackground;
	let m_elmColorSelect;
	let m_elmColorText;
	let m_elmColorIcons;
	let m_elmRadioIconsColors;
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

	let m_elmHelpInfoTooltipBox;
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
	let m_statusbarUpdateDebouncer;

	let m_elmBtnReloadExtension;
	let m_elmBtnRestoreDefaults;

	let m_funcResolveGetTimeOfDay;
	let m_funcResolveGetUserFontName;

	let m_winIdNotepad = [0];

	let m_lockBookmarksEventHandler = new Locker();

	let m_singleBlockMode = false;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmNavigationItems = document.getElementById("navigationItems");
		m_elmNavigationFooterItems = document.getElementById("navigationFooter");
		m_elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
		m_elmCheckFeedsOnSbOpen = document.getElementById("checkFeedsOnSbOpen");
		m_elmCheckFeedsInterval = document.getElementById("checkFeedsInterval");
		m_elmCheckFeedsWhenSbClosed = document.getElementById("checkFeedsWhenSbClosed");
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
		m_elmUIDensity = document.getElementById("UIDensity");
		m_elmFontName = document.getElementById("fontName");
		m_elmFontSizePercent = document.getElementById("fontSizePercent");
		m_elmColorBackground = document.getElementById("colorBk");
		m_elmColorDialogBackground = document.getElementById("colorDlgBk");
		m_elmColorSelect = document.getElementById("colorSelect");
		m_elmColorText = document.getElementById("colorText");
		m_elmColorIcons = document.getElementById("colorIcons");
		m_elmRadioIconsColors = document.getElementsByName("iconsColor");
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

		m_elmHelpInfoTooltipBox = document.getElementById("helpInfoTooltipBox");
		m_elmPageOverlay = document.getElementById("pageOverlay");

		m_elmBtnReloadExtension = document.getElementById("btnReloadExtension");
		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		setVariousElementsTitles();

		addEventListeners();
		getSavedPreferences();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		m_elmNavigationItems.removeEventListener("click", onClickNavigationItem);
		m_elmNavigationFooterItems.removeEventListener("click", onClickNavigationFooterItem);

		document.documentElement.removeEventListener("click", onClickPreference);

		m_elmRootFeedsFolder.removeEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsOnSbOpen.removeEventListener("change", onChangeCheckFeedsOnSbOpen);
		m_elmCheckFeedsInterval.removeEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.removeEventListener("change", onChangeCheckFeedsWhenSbClosed);
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
		m_elmUIDensity.removeEventListener("change", onChangeUIDensity);
		m_elmFontName.removeEventListener("change", onChangeFontName);
		m_elmFontSizePercent.removeEventListener("change", onChangeFontSizePercent);
		m_elmColorBackground.removeEventListener("change", onChangeColorBackground);
		m_elmColorDialogBackground.removeEventListener("change", onChangeColorDialogBackground);
		m_elmColorSelect.removeEventListener("change", onChangeColorSelect);
		m_elmColorText.removeEventListener("change", onChangeColorText);
		m_elmColorIcons.removeEventListener("change", onChangeColorIcons);
		m_elmRadioIconsColors.forEach(r => r.removeEventListener("click", onClickRadioIconsColor));
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

		document.querySelectorAll(".helpInfo").forEach(e => {
			e.removeEventListener("mouseover", onMouseOverHelpInfo);
			e.removeEventListener("mouseout", onMouseOutHelpInfo);
		});

		removeBookmarksEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		m_elmNavigationItems.addEventListener("click", onClickNavigationItem);
		m_elmNavigationFooterItems.addEventListener("click", onClickNavigationFooterItem);

		// handle check boxs and text boxs
		document.documentElement.addEventListener("click", onClickPreference);

		m_elmRootFeedsFolder.addEventListener("change", onChangeRootFeedsFolder);
		m_elmCheckFeedsOnSbOpen.addEventListener("change", onChangeCheckFeedsOnSbOpen);
		m_elmCheckFeedsInterval.addEventListener("change", onChangeCheckFeedsInterval);
		m_elmCheckFeedsWhenSbClosed.addEventListener("change", onChangeCheckFeedsWhenSbClosed);
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
		m_elmUIDensity.addEventListener("change", onChangeUIDensity);
		m_elmFontName.addEventListener("change", onChangeFontName);
		m_elmFontSizePercent.addEventListener("change", onChangeFontSizePercent);
		m_elmColorBackground.addEventListener("change", onChangeColorBackground);
		m_elmColorDialogBackground.addEventListener("change", onChangeColorDialogBackground);
		m_elmColorSelect.addEventListener("change", onChangeColorSelect);
		m_elmColorText.addEventListener("change", onChangeColorText);
		m_elmColorIcons.addEventListener("change", onChangeColorIcons);
		m_elmRadioIconsColors.forEach(r => r.addEventListener("click", onClickRadioIconsColor));
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

		document.querySelectorAll(".helpInfo").forEach(e => {
			e.addEventListener("mouseover", onMouseOverHelpInfo);
			e.addEventListener("mouseout", onMouseOutHelpInfo);
		});

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

		placePageOverlay(true, true);

		prefs.getSingleBlockModeInPrefsPage().then((singleBlockMode) => {
			if( (m_singleBlockMode = singleBlockMode) ) {
				document.body.style.marginBottom = "0";	// Remove margin-bottom. Its size is to enable scrolling the Miscellaneous block to the top.
				setSingleBlockMode("prefBlockFeeds");
			}
		});

		initializeSelectFeedsFolder();

		prefs.getCheckFeedsOnSbOpen().then((checked) => {
			m_elmCheckFeedsOnSbOpen.checked = checked;
		});

		prefs.getCheckFeedsInterval().then((value) => {
			if(value.includes(":")) {
				let elmOption = createTagOption(value, TXT_OPTION_EVERY_DAY_AT + formatTimeToLocalShortString(value));
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
			m_elmCheckFeedsMethod.title = m_elmCheckFeedsMethod.options[m_elmCheckFeedsMethod.selectedIndex].title;
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

		prefs.getIconsColor().then((color) => {
			const pair = Global.SIDEBAR_ICONS_COLOR_PAIR(color);
			m_elmColorIcons.value = pair.color;
			m_elmColorIcons.title = colorInputTitle(pair.color);

			if(pair.hasOwnProperty("id")) {
				m_elmRadioIconsColors[pair.id].checked = true;
			}
			if(pair.hasOwnProperty("invalid")) {
				prefs.setIconsColor(pair.id);
			}
		});

		prefs.getIncreaseUnvisitedFontSize().then((checked) => {
			m_elmIncreaseUnvisitedFontSize.checked = checked;
		});

		prefs.getShowTryOpenLinkInFeedPreview().then((checked) => {
			m_elmShowTryOpenLinkInFeedPreview.checked = checked;
		});

		prefs.getUseCustomCSSFeedPreview().then(async (checked) => {
			m_elmUseCustomCSSFeedPreview.checked = checked;
			if(checked) {
				const hash = await prefs.getCustomCSSSourceHash();
				slUtil.disableElementTree(m_elmBtnEditCSSSource, (hash.length === 0));
				slUtil.disableElementTree(m_elmBtnClearCSSSource, (hash.length === 0));
				flashCustomCSSImportButton();
			} else {
				slUtil.disableElementTree(m_elmImportCustomCSSSource.parentElement.parentElement, true);
			}
		}).finally(() => {
			placePageOverlay(false);	// This will most likely (and hopefully) be executed after all Promises in getSavedPreferences() were settled
		});
	}

	//==================================================================================
	//=== Event Listeners
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickNavigationItem(event) {
		let jumpTargetId = event.target.getAttribute("data-jumpTargetId");
		if(!!jumpTargetId) {
			if(m_singleBlockMode) {
				setSingleBlockMode(jumpTargetId);
			} else {
				document.getElementById(jumpTargetId).scrollIntoView(true);
				window.scrollTo({ left: 0 });
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickNavigationFooterItem(event) {
		let url = event.target.title;
		if(slUtil.validURL(url)) {
			browser.tabs.create({ url: url });
		}
	}

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
	function onChangeCheckFeedsOnSbOpen(event) {
		prefs.setCheckFeedsOnSbOpen(m_elmCheckFeedsOnSbOpen.checked).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_CHECK_FEEDS_ON_SB_OPEN);
		});
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
						elmOption = createTagOption(timeValue, TXT_OPTION_EVERY_DAY_AT + formatTimeToLocalShortString(timeValue));
						elmOption.id = ID_OPTION_CHECK_FEEDS_TIME_OF_DAY;
						m_elmCheckFeedsInterval.insertBefore(elmOption, m_elmCheckFeedsInterval.lastElementChild);
					} else {
						elmOption.value = timeValue;
						elmOption.textContent = TXT_OPTION_EVERY_DAY_AT + formatTimeToLocalShortString(timeValue);
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
		m_elmCheckFeedsMethod.title = m_elmCheckFeedsMethod.options[m_elmCheckFeedsMethod.selectedIndex].title;
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
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_DETECT_FEEDS_IN_WEB_PAGE);
		});
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
	function onChangeColorIcons(event) {
		const value = m_elmColorIcons.value
		m_elmColorIcons.title = colorInputTitle(value);

		const pair = Global.SIDEBAR_ICONS_COLOR_PAIR(value);
		if(pair.hasOwnProperty("id")) {
			m_elmRadioIconsColors[pair.id].checked = true;
		} else {
			m_elmRadioIconsColors.forEach(r => r.checked = false );	// uncheck all if color not in list
		}

		prefs.setIconsColor(value).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickRadioIconsColor(event) {
		const pair = Global.SIDEBAR_ICONS_COLOR_PAIR(event.target.value);
		m_elmColorIcons.value = pair.color;
		m_elmColorIcons.title = colorInputTitle(pair.color);
		prefs.setIconsColor(pair.id).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_COLORS);
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
					showMessageBox("Warning", result.warning);
				}

			}).catch((error) => {
				showMessageBox("Error", error.message);
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
			showMessageBox("Import", msg);

		}).catch((error) => {
			showMessageBox("Error", error);
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
				showMessageBox("Export", msg);
			}

		}).catch((error) => {
			showMessageBox("Error", error);
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
			showMessageBox("Import", msg, () => browser.tabs.reload({ bypassCache: true }) );

		}).catch((error) => {
			showMessageBox("Error", error);
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
				showMessageBox("Export", `Options were successfully exported.\n\nFile: ${result.fileName}`);
			}

		}).catch((error) => {
			showMessageBox("Error", error);
			console.log("[Sage-Like]", error);
		}).finally(() => {
			slUtil.disableElementTree(elmPref, false);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnReloadExtension(event) {
		browser.runtime.reload();
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
		slUtil.disableElementTree(m_elmImportOpml.parentElement.parentElement, defPrefs.rootFeedsFolderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET);

		m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
		m_elmCheckFeedsOnSbOpen.checked = defPrefs.checkFeedsOnSbOpen;
		m_elmCheckFeedsInterval.value = defPrefs.checkFeedsInterval;
		m_elmCheckFeedsWhenSbClosed.checked = defPrefs.checkFeedsWhenSbClosed;
		m_elmCheckFeedsMethod.value = defPrefs.checkFeedsMethod;
		m_elmCheckFeedsMethod.title = m_elmCheckFeedsMethod.options[m_elmCheckFeedsMethod.selectedIndex].title;
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
		m_elmColorFeedItemDescBackground.title = colorInputTitle(m_elmColorFeedItemDescBackground.value);
		m_elmColorFeedItemDescText.title = colorInputTitle(m_elmColorFeedItemDescText.value);
		m_elmDetectFeedsInWebPage.checked = defPrefs.detectFeedsInWebPage;
		m_elmUIDensity.value = defPrefs.UIDensity;
		m_elmFontName.value = defPrefs.fontName;
		m_elmFontSizePercent.value = defPrefs.fontSizePercent;
		m_elmColorBackground.value = defPrefs.colorBk;
		m_elmColorDialogBackground.value = defPrefs.colorDlgBk;
		m_elmColorSelect.value = defPrefs.colorSelect;
		m_elmColorText.value = defPrefs.colorText;
		m_elmColorIcons.value = Global.SIDEBAR_ICONS_COLOR_PAIR(defPrefs.iconsColor).color;
		m_elmColorBackground.title = colorInputTitle(m_elmColorBackground.value);
		m_elmColorDialogBackground.title = colorInputTitle(m_elmColorDialogBackground.value);
		m_elmColorSelect.title = colorInputTitle(m_elmColorSelect.value);
		m_elmColorText.title = colorInputTitle(m_elmColorText.value);
		m_elmColorIcons.title = colorInputTitle(m_elmColorIcons.value);
		m_elmRadioIconsColors[defPrefs.iconsColor].checked = true;		// default is the index value 0, so its safe to use it as an index
		m_elmIncreaseUnvisitedFontSize.checked = defPrefs.increaseUnvisitedFontSize;
		m_elmShowTryOpenLinkInFeedPreview.checked = defPrefs.showTryOpenLinkInFeedPreview;
		m_elmUseCustomCSSFeedPreview.checked = defPrefs.useCustomCSSFeedPreview;

		flashRootFeedsFolderElement();
		flashCustomCSSImportButton();
		broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_ALL);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOverHelpInfo(event) {

		const target = event.target;

		m_elmHelpInfoTooltipBox.querySelector(".tooltipBoxText").textContent = target.getAttribute("data-title");

		m_elmHelpInfoTooltipBox.style.maxWidth = (target.hasAttribute("data-extra-width") ? "650px" : "");
		m_elmHelpInfoTooltipBox.style.display = "block";

		let x = (!!(target.offsetParent) ? target.offsetParent.offsetLeft : 0) + target.offsetLeft + 4;	// 4px left of the helpInfo span
		let y = (!!(target.offsetParent) ? target.offsetParent.offsetTop : 0) + target.offsetTop + 28;	// 28px below the helpInfo span

		// if going out of right edge
		if( (x + m_elmHelpInfoTooltipBox.offsetWidth) > document.documentElement.offsetWidth ) {
			x = document.documentElement.offsetWidth - m_elmHelpInfoTooltipBox.offsetWidth-1;
		}
		// if going out of bottom edge
		if( (y + m_elmHelpInfoTooltipBox.offsetHeight) > document.documentElement.offsetHeight ) {
			y = document.documentElement.clientHeight - m_elmHelpInfoTooltipBox.offsetHeight-1;
		}

		m_elmHelpInfoTooltipBox.style.left = x + "px";
		m_elmHelpInfoTooltipBox.style.top = y + "px";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseOutHelpInfo(event) {
		m_elmHelpInfoTooltipBox.style.display = "none";
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

	//==================================================================================
	//=== User font box functions
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function getUserFontName(initValue) {

		return new Promise((resolve) => {

			m_funcResolveGetUserFontName = resolve;

			if(!!!m_elmUserFontBox) {
				m_elmUserFontBox = document.getElementById("userFontBox");
				m_elmUserFontName = document.getElementById("userFontName");
			}

			m_elmUserFontBox.addEventListener("keydown", onKeyDownUserFontBox);
			m_elmUserFontName.addEventListener("blur", onBlurUserFontName);

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

		m_elmUserFontBox.removeEventListener("keydown", onKeyDownUserFontBox);
		m_elmUserFontName.removeEventListener("blur", onBlurUserFontName);

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

			if(!!!m_elmTimeOfDayBox) {
				m_elmTimeOfDayBox = document.getElementById("timeOfDayBox");
				m_elmInputTime = document.getElementById("inputTime");
			}

			m_elmTimeOfDayBox.addEventListener("keydown", onKeyDownTimeOfDayBox);
			m_elmInputTime.addEventListener("blur", onBlurInputTime);

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
	function closeTimeOfDayBox(bApply = false) {

		setTimeout(() => m_elmTimeOfDayBox.style.display = "none");		// to avoid: "TypeError: Property 'handleEvent' is not callable."

		m_elmTimeOfDayBox.removeEventListener("keydown", onKeyDownTimeOfDayBox);
		m_elmInputTime.removeEventListener("blur", onBlurInputTime);

		m_elmInputTime.blur();	// remove focus from input box to set the final value to the 'value' property

		if(typeof(m_funcResolveGetTimeOfDay) === "function") {
			m_funcResolveGetTimeOfDay(bApply ? m_elmInputTime.value : "");
		}
		m_funcResolveGetTimeOfDay = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTimeOfDayBox(event) {
		if( ["Enter","NumpadEnter"].includes(event.code) ) {
			closeTimeOfDayBox(true);
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
	function showMessageBox(msgCaption, msgText, callbackOnCloseBox = null) {

		m_funcOnCloseMessageBox = callbackOnCloseBox;

		if(!!!m_elmMessageBox) {
			m_elmMessageBox = document.getElementById("messageBox");
			m_elmBtnMessageBoxOK = document.getElementById("btnMessageBoxOK");
		}

		document.getElementById("messageBoxCaption").textContent = msgCaption;
		document.getElementById("messageBoxText").textContent = msgText;

		m_elmMessageBox.addEventListener("keydown", onKeyDownMessageBox);
		m_elmBtnMessageBoxOK.addEventListener("click", onClickBtnMessageBoxOK);

		placePageOverlay(true);
		m_elmMessageBox.style.display = "block";
		document.documentElement.style.overflow = "hidden";
		m_elmMessageBox.style.color = (["Error", "Warning"].includes(msgCaption) ? "#db0000" : "");

		m_elmBtnMessageBoxOK.focus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeMessageBox() {

		placePageOverlay(false);
		m_elmMessageBox.style.display = "none";
		document.documentElement.style.overflow = "";

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
	function getUrlList(caption, desc, value = "") {

		if("FFU") {
			console.log("[Sage-Like]", "FFU", "Preparation for air-conditioner");
			return null;
		}

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

			placePageOverlay(true);
			m_elmUrlListBox.style.display = "block";
			document.documentElement.style.overflow = "hidden";

			m_elmUrlListBoxTextArea.setSelectionRange(0, 0); // move cursor to start
			m_elmUrlListBoxTextArea.focus();

			urlListValidator();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function closeUrlListBox(saveChanges = false) {

		placePageOverlay(false);
		m_elmUrlListBox.style.display = "none";
		document.documentElement.style.overflow = "";

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
		clearTimeout(m_statusbarUpdateDebouncer);
		m_statusbarUpdateDebouncer = setTimeout(() => {
			urlListValidator();
			m_statusbarUpdateDebouncer = null;
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
	function setVariousElementsTitles() {

		document.getElementById("webExtVersion").textContent = `Sage-Like v${browser.runtime.getManifest().version}`;
		document.getElementById("checkFeedsMethodInfo").setAttribute("data-title", TXT_HELP_INFO_CHECK_FEED_METHOD);

		let re, found, items = m_elmCheckFeedsMethod.children;

		for(let i=0, len=items.length; i<len; i++) {

			re = new RegExp("\\b" + items[i].textContent + "\\b[^A-Z]*([A-Z].+\\.)\\s?$", "m");
			found = TXT_HELP_INFO_CHECK_FEED_METHOD.match(re);

			if( !!found && !!found[1] ) {
				items[i].title = found[1];
			}
		}

		let label, color;
		for(let i=0, len=m_elmRadioIconsColors.length; i<len; ++i) {
			label = m_elmRadioIconsColors[i].nextElementSibling;
			color = Global.SIDEBAR_ICONS_COLOR_PAIR(m_elmRadioIconsColors[i].value).color;
			label.firstElementChild.style.fill = color;
			label.title = colorInputTitle(color);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function colorInputTitle(colorValue) {
		if(/^#[a-fA-F0-9]{6}$/.test(colorValue)) {
			return "RGB notation: rgb(" + colorValue.replace("#", "").match(/.{2}/g).map(x => parseInt(x, 16)).join(", ") + ")\n" +
					"HTML notation: " + colorValue.toLowerCase();
		}
		return "";
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

						slUtil.replaceInnerContextualFragment(style, source);

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
				showMessageBox("Error", msg, funcOnCloseBox);
				reject();
			}).catch(() => {
				resolve();
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setSingleBlockMode(idPrefBlock) {
		let blocks = document.getElementsByClassName("prefBlock");
		for(let i=0, len=blocks.length; i<len; i++) {
			blocks[i].style.display = (blocks[i].id === idPrefBlock) ? "block" : "none";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function formatTimeToLocalShortString(value = "00:00") {
		const [hours, minutes] = value.split(":").map(x => parseInt(x));
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	////////////////////////////////////////////////////////////////////////////////////
	function placePageOverlay(bSetOverlay, bShowBusyText = false) {

		if(bSetOverlay) {

			m_elmPageOverlay.textContent = "";
			m_elmPageOverlay.style.display = "block";
			document.querySelectorAll(".navigationBar, .mainContent").forEach((e) => e.style.filter = "blur(4px)");
			document.documentElement.style.overflow = "hidden";

			// delay the display of text to avoid flickering when the wait is short
			if(bShowBusyText) {
				setTimeout(() => m_elmPageOverlay.textContent = "I'm Busy, Please Wait.", 120);
			}

		} else {

			m_elmPageOverlay.style.display = "none";
			document.querySelectorAll(".navigationBar, .mainContent").forEach((e) => e.style.filter = "");
			document.documentElement.style.overflow = "";
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hiddenPref_animatedSlideDownPanel(animate = true) {
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
	function hiddenPref_strictRSSContentTypes(strict = true) {
		console.log("[Sage-Like]", "WARNING: The result of setting this preference to 'False' is that Sage-Like will treat nearly any XML file as an RSS feed and attempt to display it with Feed Preview.");
		prefs.setStrictRssContentTypes(!!strict).then(() => {
			broadcastPreferencesUpdated(Global.MSGD_PREF_CHANGE_STRICT_RSS_CONTENT_TYPES);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function hiddenPref_singleBlockModeInPrefsPage(singleBlockMode = false) {
		prefs.setSingleBlockModeInPrefsPage(!!singleBlockMode).then(() => browser.tabs.reload() );
	}

	return {
		set animated_slide_down_panel(val) { hiddenPref_animatedSlideDownPanel(val); },
		get animated_slide_down_panel() { prefs.getAnimatedSlideDownPanel().then(val => console.log("animated_slide_down_panel =", val)); },

		set strict_rss_content_types(val) { hiddenPref_strictRSSContentTypes(val); },
		get strict_rss_content_types() { prefs.getStrictRssContentTypes().then(val => console.log("strict_rss_content_types =", val)); },

		set single_block_mode_in_prefs_page(val) { hiddenPref_singleBlockModeInPrefsPage(val); },
		get single_block_mode_in_prefs_page() { prefs.getSingleBlockModeInPrefsPage().then(val => console.log("single_block_mode_in_prefs_page =", val)); },
	}
})();
