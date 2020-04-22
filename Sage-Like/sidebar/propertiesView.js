"use strict";

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class PropertiesViewElements {

	///////////////////////////////////////////////////////////////
	//
	static get i() {
		if (this.m_instance === undefined) {

			// PropertiesViewElements.m_instanceID is a static value, refers to the class, not to the instance of the class
			PropertiesViewElements.m_instanceID = Date.now() * Math.random();
			this.m_instance = new this(PropertiesViewElements.m_instanceID);
		}
		return this.m_instance;
	}

	///////////////////////////////////////////////////////////////
	constructor(instanceID) {
		if (PropertiesViewElements.m_instanceID === undefined || PropertiesViewElements.m_instanceID !== instanceID){
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		PropertiesViewElements.m_instanceID = undefined;
		this._getViewElementIds();
	}

	///////////////////////////////////////////////////////////////
	_getViewElementIds() {
		this.elmPropertiesPanel = document.getElementById("propertiesPanel");
		this.elmTextTitle = document.getElementById("txtFpTitle");
		this.elmTextLocation = document.getElementById("txtFpLocation");
		this.elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
		this.elmChkOpenInFeedPreview = document.getElementById("chkFpOpenInFeedPreview");
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

	///////////////////////////////////////////////////////////////
	//
	static get i() {
		if (this.m_instance === undefined) {
			this.m_instance = new this();
		}
		return this.m_instance;
	}

	///////////////////////////////////////////////////////////////
	constructor() {
		if (new.target.name === "PropertiesView") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		this._initMembers();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, funcPromiseResolve) {

		// the element been clicked
		this.m_elmTreeItemLI = elmLI;

		// the promise resolve function
		this.m_funcPromiseResolve = funcPromiseResolve;

		this._addEventListeners();

		this._showPanel();
		this.m_isOpen = true;
	}

	///////////////////////////////////////////////////////////////
	static close() {
		if (this.m_instance !== undefined) {
			this.m_instance._close();
		}
	}

	///////////////////////////////////////////////////////////////
	_initMembers() {
		this.m_elmPropertiesPanel = PropertiesViewElements.i.elmPropertiesPanel;
		this.m_elmTextTitle = PropertiesViewElements.i.elmTextTitle;
		this.m_elmTextLocation = PropertiesViewElements.i.elmTextLocation;
		this.m_elmChkUpdateTitle = PropertiesViewElements.i.elmChkUpdateTitle;
		this.m_elmChkOpenInFeedPreview = PropertiesViewElements.i.elmChkOpenInFeedPreview;
		this.m_elmInsertInsideFolderContainer = PropertiesViewElements.i.elmInsertInsideFolderContainer;
		this.m_elmChkInsertInsideFolder = PropertiesViewElements.i.elmChkInsertInsideFolder;
		this.m_elmButtonSave = PropertiesViewElements.i.elmButtonSave;
		this.m_elmButtonCancel = PropertiesViewElements.i.elmButtonCancel;
		this.m_elmLabelErrorMsgs = PropertiesViewElements.i.elmLabelErrorMsgs;

		this.m_slideDownPanel = new SlideDownPanel(this.m_elmPropertiesPanel);

		this._onClickButtonSave = this._onClickButtonSave.bind(this);
		this._onClickButtonCancel = this._onClickButtonCancel.bind(this);
		this._onKeyDownPropertiesPanel = this._onKeyDownPropertiesPanel.bind(this);

		this.m_initialProperties = {
			title: "",
			location: "",
			updateTitle: false,
			openInFeedPreview: false,
		};

		this.m_isOpen = false;
		this.m_funcPromiseResolve = null;
	}

	///////////////////////////////////////////////////////////////
	_showNoneTitleProperties(show) {

		// all none title properties
		let propsContainer = this.m_elmPropertiesPanel.querySelector(".propertiesContainer");
		propsContainer.classList.toggle("showFirstOnly", !show)
	}

	///////////////////////////////////////////////////////////////
	_showOptionInsertInsideFolder(show) {
		this.m_elmInsertInsideFolderContainer.style.display = (show ? "" : "none");
	}

	///////////////////////////////////////////////////////////////
	_initData(elmFocused) {
		this.m_elmTextTitle.value = this.m_initialProperties.title;
		this.m_elmTextLocation.value = this.m_initialProperties.location;
		this.m_elmChkUpdateTitle.checked = this.m_initialProperties.updateTitle;
		this.m_elmChkOpenInFeedPreview.checked = this.m_initialProperties.openInFeedPreview;
		this.m_elmChkInsertInsideFolder.checked = false;
		this.m_elmLabelErrorMsgs.textContent = "";

		elmFocused.focus();
		elmFocused.setSelectionRange(0, -1); // select all
	}

	///////////////////////////////////////////////////////////////
	_showPanel() {

		this.m_slideDownPanel.pull(true);
		panel.disable(true);
	}

	///////////////////////////////////////////////////////////////
	_close() {

		if (this.m_isOpen === false) {
			return;
		}

		this.m_slideDownPanel.pull(false);
		panel.disable(false);

		this._removeEventListeners();

		rssTreeView.setFocus();
		this.m_isOpen = false;
	}

	///////////////////////////////////////////////////////////////
	_addEventListeners() {
		this.m_elmButtonSave.addEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.addEventListener("click", this._onClickButtonCancel);
		this.m_elmPropertiesPanel.addEventListener("keydown", this._onKeyDownPropertiesPanel);
	}

	///////////////////////////////////////////////////////////////
	_removeEventListeners() {
		this.m_elmButtonSave.removeEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.removeEventListener("click", this._onClickButtonCancel);
		this.m_elmPropertiesPanel.removeEventListener("keydown", this._onKeyDownPropertiesPanel);
	}

	///////////////////////////////////////////////////////////////
	_onClickButtonSave(event) {
		this._saveAndClose();
	}

	///////////////////////////////////////////////////////////////
	_onClickButtonCancel(event) {
		this._close();
	}

	///////////////////////////////////////////////////////////////
	_onKeyDownPropertiesPanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(document.activeElement === this._onClickButtonCancel) {
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
			default:
				break;
				//////////////////////////////
		}
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class NewFeedPropertiesView extends PropertiesView {

	///////////////////////////////////////////////////////////////
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, title, location) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(true);
			this._showOptionInsertInsideFolder(this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER));

			this.m_initialProperties.title = title;
			this.m_initialProperties.location = location;
			this.m_initialProperties.updateTitle = true;
			this.m_initialProperties.openInFeedPreview = false;

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
			inFolder: this.m_elmChkInsertInsideFolder.checked,
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		if(!!!slUtil.validURL(result.url)) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class NewFolderPropertiesView extends PropertiesView {

	///////////////////////////////////////////////////////////////
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, title) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(false);
			this._showOptionInsertInsideFolder(this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_TREE_FOLDER));

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
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class EditFeedPropertiesView extends PropertiesView {

	///////////////////////////////////////////////////////////////
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI, updateTitleValue, openInFeedPreviewValue) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(true);
			this._showOptionInsertInsideFolder(false);

			this.m_initialProperties.title = rssTreeView.getTreeItemText(this.m_elmTreeItemLI);
			this.m_initialProperties.location = this.m_elmTreeItemLI.getAttribute("href");
			this.m_initialProperties.updateTitle = updateTitleValue;
			this.m_initialProperties.openInFeedPreview = openInFeedPreviewValue;

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
		}

		// Any value was modified
		if (this.m_initialProperties.title === result.title &&
			this.m_initialProperties.location === result.url &&
			this.m_initialProperties.updateTitle === result.updateTitle &&
			this.m_initialProperties.openInFeedPreview === result.openInFeedPreview) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		if(!!!slUtil.validURL(result.url)) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class EditFolderPropertiesView extends PropertiesView {

	///////////////////////////////////////////////////////////////
	constructor() {
		super();
	}

	///////////////////////////////////////////////////////////////
	open(elmLI) {

		return new Promise((resolve) => {

			super.open(elmLI, resolve);

			this._showNoneTitleProperties(false);
			this._showOptionInsertInsideFolder(false);

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
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		this.m_funcPromiseResolve(result);
		this._close();
	}
}
