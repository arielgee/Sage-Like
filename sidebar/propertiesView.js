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
			throw new Error("Don't do that");
		}
		PropertiesViewElements.m_instanceID = undefined;
		this._getViewElementIds();
	}

	///////////////////////////////////////////////////////////////
	_getViewElementIds() {
		this.elmSidebarBody = document.body;
		this.elmMainPanel = document.getElementById("mainPanel");
		this.elmPropertiesPanel = document.getElementById("propertiesPanel");
		this.elmTextTitle = document.getElementById("txtFpTitle");
		this.elmTextLocation = document.getElementById("txtFpLocation");
		this.elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
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
			throw new Error("Don't do that");
		}
		this._initMembers();
	}

	///////////////////////////////////////////////////////////////
	show(elmLI, funcPromiseResolve) {

		// the element been clicked
		this.m_elmTreeItemLI = elmLI;

		// the promise resolve function
		this.m_funcPromiseResolve = funcPromiseResolve;

		this.m_elmButtonSave.addEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.addEventListener("click", this._onClickButtonCancel);
		this.m_elmPropertiesPanel.addEventListener("keydown", this._onKeyDownPropertiesPanel);

		this._showPanel();
		this.m_isOpen = true;
	}

	///////////////////////////////////////////////////////////////
	close() {

		if (this.m_isOpen === false) {
			return;
		}

		slUtil.disableElementTree(this.m_elmMainPanel, false);
		this.m_elmPropertiesPanel.style.display = "none";

		this.m_elmButtonSave.removeEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.removeEventListener("click", this._onClickButtonCancel);
		this.m_elmPropertiesPanel.removeEventListener("keydown", this._onKeyDownPropertiesPanel);

		rssTreeView.setFocus();
		this.m_isOpen = false;
	}

	///////////////////////////////////////////////////////////////
	_initMembers() {
		this.m_elmSidebarBody = PropertiesViewElements.i.elmSidebarBody;
		this.m_elmMainPanel = PropertiesViewElements.i.elmMainPanel;
		this.m_elmPropertiesPanel = PropertiesViewElements.i.elmPropertiesPanel;
		this.m_elmTextTitle = PropertiesViewElements.i.elmTextTitle;
		this.m_elmTextLocation = PropertiesViewElements.i.elmTextLocation;
		this.m_elmChkUpdateTitle = PropertiesViewElements.i.elmChkUpdateTitle;
		this.m_elmInsertInsideFolderContainer = PropertiesViewElements.i.elmInsertInsideFolderContainer;
		this.m_elmChkInsertInsideFolder = PropertiesViewElements.i.elmChkInsertInsideFolder;
		this.m_elmButtonSave = PropertiesViewElements.i.elmButtonSave;
		this.m_elmButtonCancel = PropertiesViewElements.i.elmButtonCancel;
		this.m_elmLabelErrorMsgs = PropertiesViewElements.i.elmLabelErrorMsgs;

		this._onClickButtonSave = this._onClickButtonSave.bind(this);
		this._onClickButtonCancel = this._onClickButtonCancel.bind(this);
		this._onKeyDownPropertiesPanel = this._onKeyDownPropertiesPanel.bind(this);

		this.m_initialProperties = {
			title: "",
			location: "",
			updateTitle: false,
		};

		this.m_isOpen = false;
		this.m_funcPromiseResolve = null;
	}

	///////////////////////////////////////////////////////////////
	_hideNoneTitleProperties(hide) {

		// all none title properties
		let selector = ".propContainer:not(:first-child)";

		this.m_elmPropertiesPanel.querySelectorAll(selector).forEach((element) => {
			element.style.display = (hide ? "none" : "");
		});
	}

	///////////////////////////////////////////////////////////////
	_hideOptionInsertInsideFolder(hide) {
		this.m_elmInsertInsideFolderContainer.style.display = (hide ? "none" : "");
	}

	///////////////////////////////////////////////////////////////
	_initData() {
		this.m_elmTextTitle.value = this.m_initialProperties.title;
		this.m_elmTextLocation.value = this.m_initialProperties.location;
		this.m_elmChkUpdateTitle.checked = this.m_initialProperties.updateTitle;
		this.m_elmChkInsertInsideFolder.checked = false;
		this.m_elmLabelErrorMsgs.textContent = "";

		this.m_elmTextTitle.focus();
		this.m_elmTextTitle.setSelectionRange(0, -1); // select all
	}

	///////////////////////////////////////////////////////////////
	_showPanel() {

		let r = this.m_elmTreeItemLI.getBoundingClientRect();
		let y = r.top;

		// do it first so element will have dimentions (offsetWidth > 0)
		this.m_elmPropertiesPanel.style.display = "block";
		slUtil.disableElementTree(this.m_elmMainPanel, true);

		if ((y + this.m_elmPropertiesPanel.offsetHeight) > this.m_elmSidebarBody.offsetHeight) {
			y = this.m_elmSidebarBody.offsetHeight - this.m_elmPropertiesPanel.offsetHeight;
		}

		this.m_elmPropertiesPanel.style.top = y + "px";
	}

	///////////////////////////////////////////////////////////////
	_onClickButtonSave(event) {
		this._saveAndClose();
	}

	///////////////////////////////////////////////////////////////
	_onClickButtonCancel(event) {
		this.close();
	}

	///////////////////////////////////////////////////////////////
	_onKeyDownPropertiesPanel(event) {
		switch (event.key.toLowerCase()) {
			case "enter":
				this._saveAndClose();
				break;
				//////////////////////////////
			case "escape":
				this.close();
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
	show(elmLI, title, location) {

		return new Promise((resolve) => {

			super.show(elmLI, resolve);

			this._hideOptionInsertInsideFolder(!this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE));

			this.m_initialProperties.title = title;
			this.m_initialProperties.location = location;
			this.m_initialProperties.updateTitle = true;

			this._initData();
		});
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideOptionInsertInsideFolder(false);
		super.close();
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			url: this.m_elmTextLocation.value,
			updateTitle: this.m_elmChkUpdateTitle.checked,
			inSubTree: this.m_elmChkInsertInsideFolder.checked,
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		try {
			new URL(result.url);
		} catch (error) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		this.m_funcPromiseResolve(result);
		this.close();
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
	show(elmLI, title) {

		return new Promise((resolve) => {

			super.show(elmLI, resolve);

			this._hideNoneTitleProperties(true);
			this._hideOptionInsertInsideFolder(!this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE));

			this.m_initialProperties.title = title;

			this._initData();
		});
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideNoneTitleProperties(false);
		this._hideOptionInsertInsideFolder(false);
		super.close();
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			inSubTree: this.m_elmChkInsertInsideFolder.checked,
		};

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		this.m_funcPromiseResolve(result);
		this.close();
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
	show(elmLI, updateTitleValue) {

		return new Promise((resolve) => {

			super.show(elmLI, resolve);

			this._hideOptionInsertInsideFolder(true);

			this.m_initialProperties.title = this.m_elmTreeItemLI.firstElementChild.textContent;
			this.m_initialProperties.location = this.m_elmTreeItemLI.getAttribute("href");
			this.m_initialProperties.updateTitle = updateTitleValue;

			this._initData();
		});
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideOptionInsertInsideFolder(false);
		super.close();
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let result = {
			elmLI: this.m_elmTreeItemLI,
			title: this.m_elmTextTitle.value,
			url: this.m_elmTextLocation.value,
			updateTitle: this.m_elmChkUpdateTitle.checked,
		}

		// Any value was modified
		if (this.m_initialProperties.title === result.title &&
			this.m_initialProperties.location === result.url &&
			this.m_initialProperties.updateTitle === result.updateTitle) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if (result.title.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		try {
			new URL(result.url);
		} catch (error) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		this.m_funcPromiseResolve(result);
		this.close();
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
	show(elmLI) {

		return new Promise((resolve) => {

			super.show(elmLI, resolve);

			this._hideNoneTitleProperties(true);
			this._hideOptionInsertInsideFolder(true);

			this.m_initialProperties.title = this.m_elmTreeItemLI.firstElementChild.textContent;

			this._initData();
		});
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideNoneTitleProperties(false);
		this._hideOptionInsertInsideFolder(false);
		super.close();
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
		this.close();
	}
}
