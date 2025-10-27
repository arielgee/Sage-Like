"use strict";

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class PropertiesViewElements {

	static #_constructId = null;
	static #_instance = null;

	constructor(id) {
		if (PropertiesViewElements.#_constructId !== parseInt(id)) {
			throw new Error(`${new.target.name}.constructor: Don't do that, it's a singleton.`);
		}
		PropertiesViewElements.#_constructId = null;
		this.#_getViewElementIds();
	}

	///////////////////////////////////////////////////////////////
	static get i() {
		if (PropertiesViewElements.#_instance === null) {
			PropertiesViewElements.#_instance = new this(PropertiesViewElements.#_constructId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
		}
		return PropertiesViewElements.#_instance;
	}

	///////////////////////////////////////////////////////////////
	#_getViewElementIds() {
		this.elmPropertiesPanel = document.getElementById("propertiesPanel");
		this.elmCaption = document.getElementById("propertiesCaption");
		this.elmTextTitle = document.getElementById("txtFpTitle");
		this.elmTextLocation = document.getElementById("txtFpLocation");
		this.elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
		this.elmChkOpenInFeedPreview = document.getElementById("chkFpOpenInFeedPreview");
		this.elmChkIgnoreUpdates = document.getElementById("chkFpIgnoreUpdates");
		this.elmTextFeedMaxItems = document.getElementById("txtFpFeedMaxItems");
		this.elmInsertInsideFolderContainer = document.getElementById("insertInsideFolderContainer");
		this.elmChkInsertInsideFolder = document.getElementById("chkInsertInsideFolder");
		this.elmButtonSave = document.getElementById("btnPropertiesSave");
		this.elmButtonCancel = document.getElementById("btnPropertiesCancel");
		this.elmLabelErrorMsgs = document.getElementById("lblErrorMsgs");
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class PropertiesView {

	#_isOpen = false;
	#_onClickButtonSaveBound;
	#_onClickButtonCancelBound;
	#_onKeyDownPropertiesPanelBound;

	constructor() {
		if (new.target.name === "PropertiesView") {
			throw new Error(`${new.target.name}.constructor: Don't do that`);
		}
		this.#_initMembers();
	}

	///////////////////////////////////////////////////////////////
	static get i() {
		if (this.m_instance === undefined) {
			this.m_instance = new this();
		}
		return this.m_instance;
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, funcPromiseResolve) {

		if(this.m_slideDownPanel.isDown) return;

		// the element been clicked
		this.m_elmTreeItemLI = elmLI;

		// the promise resolve function
		this.m_funcPromiseResolve = funcPromiseResolve;

		this.#_showPanel();
		this.#_isOpen = true;
	}

	///////////////////////////////////////////////////////////////
	static close() {
		if (this.m_instance !== undefined) {
			this.m_instance._close();
		}
	}

	///////////////////////////////////////////////////////////////
	_close() {

		if (this.#_isOpen === false) {
			return;
		}

		this.m_slideDownPanel.pull(false);
		panel.disable(false);

		this.#_removeEventListeners();

		rssTreeView.setFocus();
		this.#_isOpen = false;
	}

	///////////////////////////////////////////////////////////////
	_initData(elmFocused) {
		this.m_elmCaption.textContent = this.m_initialProperties.caption;
		this.m_elmTextTitle.value = this.m_initialProperties.title;
		this.m_elmTextLocation.value = this.m_initialProperties.location;
		this.m_elmChkUpdateTitle.checked = this.m_initialProperties.updateTitle;
		this.m_elmChkOpenInFeedPreview.checked = this.m_initialProperties.openInFeedPreview;
		this.m_elmChkIgnoreUpdates.checked = this.m_initialProperties.ignoreUpdates;
		this.m_elmTextFeedMaxItems.value = this.m_initialProperties.feedMaxItems;
		this.m_elmChkInsertInsideFolder.checked = false;
		this.m_elmLabelErrorMsgs.textContent = "";

		elmFocused.focus();
		elmFocused.setSelectionRange(0, -1); // select all
	}

	///////////////////////////////////////////////////////////////
	_showNoneTitleProperties(show) {

		// all none title properties
		let propsContainer = this.m_elmPropertiesPanel.querySelector(".propertiesContainer");
		propsContainer.classList.toggle("showFirstOnly", !show)
	}

	///////////////////////////////////////////////////////////////
	async _checkAndShowFeedMaxItemsMessage(feedMaxItems) {

		if( feedMaxItems !== 0 && (await internalPrefs.getShowFeedMaxItemsMsg()) ) {

			let showMsg = true;
			messageView.open({
				text: `You have chosen to set the "Max feed-items" to ${feedMaxItems}.\n\n` +
						"When the maximum number of displayed feed items is limited and \"Order feed-items chronologically\" in the <a id='anchorOptions' href='#'>Options</a> " +
						"page is enabled, it may, but not necessarily, result in displaying feed items that are not the most recent.\n\n" +
						"This is relevant only to feeds where the items in the source are not ordered chronologically.\n\n" +
						"<input type='checkbox' id='chkDontShowAgain' style='margin-left:0'><label for='chkDontShowAgain'>Don't show this message again</label>",
				caption: "Limiting Maximum Feed-Items",
				clickableElements: [
					{
						elementId: "anchorOptions",
						onClickCallback: () => browser.runtime.openOptionsPage(),
					},
					{
						elementId: "chkDontShowAgain",
						onClickCallback: () => { showMsg = !document.getElementById("chkDontShowAgain").checked },
					},
				],
			}).then(() => {
				internalPrefs.setShowFeedMaxItemsMsg(showMsg);
			});
		}
	}

	///////////////////////////////////////////////////////////////
	_showOptionInsertInsideFolder(show) {
		this.m_elmInsertInsideFolderContainer.style.display = (show ? "" : "none");
	}

	///////////////////////////////////////////////////////////////
	#_initMembers() {
		this.m_elmPropertiesPanel = PropertiesViewElements.i.elmPropertiesPanel;
		this.m_elmCaption = PropertiesViewElements.i.elmCaption;
		this.m_elmTextTitle = PropertiesViewElements.i.elmTextTitle;
		this.m_elmTextLocation = PropertiesViewElements.i.elmTextLocation;
		this.m_elmChkUpdateTitle = PropertiesViewElements.i.elmChkUpdateTitle;
		this.m_elmChkOpenInFeedPreview = PropertiesViewElements.i.elmChkOpenInFeedPreview;
		this.m_elmChkIgnoreUpdates = PropertiesViewElements.i.elmChkIgnoreUpdates;
		this.m_elmTextFeedMaxItems = PropertiesViewElements.i.elmTextFeedMaxItems;
		this.m_elmInsertInsideFolderContainer = PropertiesViewElements.i.elmInsertInsideFolderContainer;
		this.m_elmChkInsertInsideFolder = PropertiesViewElements.i.elmChkInsertInsideFolder;
		this.m_elmButtonSave = PropertiesViewElements.i.elmButtonSave;
		this.m_elmButtonCancel = PropertiesViewElements.i.elmButtonCancel;
		this.m_elmLabelErrorMsgs = PropertiesViewElements.i.elmLabelErrorMsgs;

		this.m_slideDownPanel = new SlideDownPanel(this.m_elmPropertiesPanel);

		this.#_onClickButtonSaveBound = this.#_onClickButtonSave.bind(this);
		this.#_onClickButtonCancelBound = this.#_onClickButtonCancel.bind(this);
		this.#_onKeyDownPropertiesPanelBound = this.#_onKeyDownPropertiesPanel.bind(this);

		this.m_initialProperties = {
			caption: "",
			title: "",
			location: "",
			updateTitle: false,
			openInFeedPreview: false,
			ignoreUpdates: false,
			feedMaxItems: 0,
		};

		this.#_isOpen = false;
		this.m_funcPromiseResolve = null;
	}

	///////////////////////////////////////////////////////////////
	#_showPanel() {

		this.m_slideDownPanel.pull(true).then(() => {
			this.#_addEventListeners();
		});
		panel.disable(true);
	}

	///////////////////////////////////////////////////////////////
	#_addEventListeners() {
		this.m_elmButtonSave.addEventListener("click", this.#_onClickButtonSaveBound);
		this.m_elmButtonCancel.addEventListener("click", this.#_onClickButtonCancelBound);
		this.m_elmPropertiesPanel.addEventListener("keydown", this.#_onKeyDownPropertiesPanelBound);
	}

	///////////////////////////////////////////////////////////////
	#_removeEventListeners() {
		this.m_elmButtonSave.removeEventListener("click", this.#_onClickButtonSaveBound);
		this.m_elmButtonCancel.removeEventListener("click", this.#_onClickButtonCancelBound);
		this.m_elmPropertiesPanel.removeEventListener("keydown", this.#_onKeyDownPropertiesPanelBound);
	}

	///////////////////////////////////////////////////////////////
	#_onClickButtonSave() {
		this._saveAndClose();
	}

	///////////////////////////////////////////////////////////////
	#_onClickButtonCancel() {
		this._close();
	}

	///////////////////////////////////////////////////////////////
	#_onKeyDownPropertiesPanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(document.activeElement === PropertiesViewElements.i.elmButtonCancel) {
					this._close();
				} else {
					this._saveAndClose();
				}
				break;
				//////////////////////////////
			case "Escape":
				this._close();
				break;
				//////////////////////////////
		}
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class NewFeedPropertiesView extends PropertiesView {
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, title, location) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(true);
			this._showOptionInsertInsideFolder(this.m_elmTreeItemLI.classList.contains(Global.CLS_RTV_LI_TREE_FOLDER));

			this.m_initialProperties.caption = "Feed";
			this.m_initialProperties.title = title;
			this.m_initialProperties.location = location;
			this.m_initialProperties.updateTitle = true;
			this.m_initialProperties.openInFeedPreview = false;
			this.m_initialProperties.ignoreUpdates = false;
			this.m_initialProperties.feedMaxItems = 0;

			this._initData(this.m_elmTextLocation);
		});
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			url: this.m_elmTextLocation.value,
			updateTitle: this.m_elmChkUpdateTitle.checked,
			openInFeedPreview: this.m_elmChkOpenInFeedPreview.checked,
			ignoreUpdates: this.m_elmChkIgnoreUpdates.checked,
			feedMaxItems: Number(this.m_elmTextFeedMaxItems.value),
			inFolder: this.m_elmChkInsertInsideFolder.checked,
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty.";
			return;
		}

		// URL validation
		if(!!!slUtil.validURL(result.url)) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid.";
			return;
		}

		const min = parseInt(PropertiesViewElements.i.elmTextFeedMaxItems.getAttribute("data-min"));
		const max = parseInt(PropertiesViewElements.i.elmTextFeedMaxItems.getAttribute("data-max"));

		// Feed max items validation
		if ( isNaN(result.feedMaxItems) || (result.feedMaxItems < min) || (result.feedMaxItems > max) ) {
			this.m_elmLabelErrorMsgs.textContent = `Max feed-items value is not valid. Range: ${min} - ${max}`;
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
		this._checkAndShowFeedMaxItemsMessage(result.feedMaxItems);
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class NewFolderPropertiesView extends PropertiesView {
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, title) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(false);
			this._showOptionInsertInsideFolder(this.m_elmTreeItemLI.classList.contains(Global.CLS_RTV_LI_TREE_FOLDER));

			this.m_initialProperties.caption = "Folder";
			this.m_initialProperties.title = title;

			this._initData(this.m_elmTextTitle);
		});
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			inFolder: this.m_elmChkInsertInsideFolder.checked,
		};

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty.";
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class EditFeedPropertiesView extends PropertiesView {
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, details = {}) {

		const {
			updateTitle = true,
			openInFeedPreview = false,
			ignoreUpdates = false,
			feedMaxItems = 0,
		} = details;

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(true);
			this._showOptionInsertInsideFolder(false);

			this.m_initialProperties.caption = "Feed";
			this.m_initialProperties.title = rssTreeView.getTreeItemText(this.m_elmTreeItemLI);
			this.m_initialProperties.location = this.m_elmTreeItemLI.getAttribute("href");
			this.m_initialProperties.updateTitle = updateTitle;
			this.m_initialProperties.openInFeedPreview = openInFeedPreview;
			this.m_initialProperties.ignoreUpdates = ignoreUpdates;
			this.m_initialProperties.feedMaxItems = feedMaxItems;

			this._initData(this.m_elmTextTitle);
		});
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			url: this.m_elmTextLocation.value,
			updateTitle: this.m_elmChkUpdateTitle.checked,
			openInFeedPreview: this.m_elmChkOpenInFeedPreview.checked,
			ignoreUpdates: this.m_elmChkIgnoreUpdates.checked,
			feedMaxItems: Number(this.m_elmTextFeedMaxItems.value),
		}

		// Any value was modified
		if (this.m_initialProperties.title === result.title &&
			this.m_initialProperties.location === result.url &&
			this.m_initialProperties.updateTitle === result.updateTitle &&
			this.m_initialProperties.openInFeedPreview === result.openInFeedPreview &&
			this.m_initialProperties.ignoreUpdates === result.ignoreUpdates &&
			this.m_initialProperties.feedMaxItems === result.feedMaxItems) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify.";
			return;
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty.";
			return;
		}

		// URL validation
		if(!!!slUtil.validURL(result.url)) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid.";
			return;
		}

		const min = parseInt(PropertiesViewElements.i.elmTextFeedMaxItems.getAttribute("data-min"));
		const max = parseInt(PropertiesViewElements.i.elmTextFeedMaxItems.getAttribute("data-max"));

		// Feed max items validation
		if ( isNaN(result.feedMaxItems) || (result.feedMaxItems < min) || (result.feedMaxItems > max) ) {
			this.m_elmLabelErrorMsgs.textContent = `Max feed-items value is not valid. Range: ${min} - ${max}`;
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
		this._checkAndShowFeedMaxItemsMessage(result.feedMaxItems);
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class EditFolderPropertiesView extends PropertiesView {
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(false);
			this._showOptionInsertInsideFolder(false);

			this.m_initialProperties.caption = "Folder";
			this.m_initialProperties.title = rssTreeView.getTreeItemText(this.m_elmTreeItemLI);

			this._initData(this.m_elmTextTitle);
		});
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
		}

		// Any value was modified
		if (this.m_initialProperties.title === result.title) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify.";
			return;
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty.";
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}
