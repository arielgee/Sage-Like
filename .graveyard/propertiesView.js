"use strict";

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
	open(elmLI) {

		// the element been clicked
		this.m_elmTreeItemLI = elmLI;

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
		this.m_elmSidebarBody = document.body;
		this.m_elmMainPanel = document.getElementById("mainPanel");
		this.m_elmPropertiesPanel = document.getElementById("propertiesPanel");
		this.m_elmTextTitle = document.getElementById("txtFpTitle");
		this.m_elmTextLocation = document.getElementById("txtFpLocation");
		this.m_elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
		this.m_elmInsertInsideFolderContainer = document.getElementById("insertInsideFolderContainer");
		this.m_elmChkInsertInsideFolder = document.getElementById("chkInsertInsideFolder");
		this.m_elmButtonSave = document.getElementById("btnPropertiesSave");
		this.m_elmButtonCancel = document.getElementById("btnPropertiesCancel");
		this.m_elmLabelErrorMsgs = document.getElementById("lblErrorMsgs");

		this._onClickButtonSave = this._onClickButtonSave.bind(this);
		this._onClickButtonCancel = this._onClickButtonCancel.bind(this);
		this._onKeyDownPropertiesPanel = this._onKeyDownPropertiesPanel.bind(this);

		this.m_initialProperties = {
			title: "",
			location: "",
			updateTitle: false,
		};

		this.m_isOpen = false;
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
	open(elmLI, title, location) {
		super.open(elmLI);

		this._hideOptionInsertInsideFolder(!this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE));

		this.m_initialProperties.title = title;
		this.m_initialProperties.location = location;
		this.m_initialProperties.updateTitle = true;

		this._initData();
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideOptionInsertInsideFolder(false);
		super.close();
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let valTitle = this.m_elmTextTitle.value;
		let valLocation = this.m_elmTextLocation.value;
		let valUpdateTitle = this.m_elmChkUpdateTitle.checked;

		// Title validation
		if (valTitle.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		try {
			new URL(valLocation);
		} catch (error) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		rssTreeView.createNewFeed(this.m_elmTreeItemLI, valTitle, valLocation, valUpdateTitle, this.m_elmChkInsertInsideFolder.checked);
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
	open(elmLI, title) {
		super.open(elmLI);

		this._hideNoneTitleProperties(true);
		this._hideOptionInsertInsideFolder(!this.m_elmTreeItemLI.classList.contains(slGlobals.CLS_RTV_LI_SUB_TREE));

		this.m_initialProperties.title = title;

		this._initData();
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

		let valTitle = this.m_elmTextTitle.value;

		// Title validation
		if (valTitle.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		rssTreeView.createNewFolder(this.m_elmTreeItemLI, valTitle, this.m_elmChkInsertInsideFolder.checked);
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
	open(elmLI, updateTitleValue) {
		super.open(elmLI);

		this._hideOptionInsertInsideFolder(true);

		this.m_initialProperties.title = this.m_elmTreeItemLI.firstElementChild.textContent;
		this.m_initialProperties.location = this.m_elmTreeItemLI.getAttribute("href");
		this.m_initialProperties.updateTitle = updateTitleValue;

		this._initData();
	}

	///////////////////////////////////////////////////////////////
	close() {

		// restore back to visible before close for other views
		this._hideOptionInsertInsideFolder(false);
		super.close();
	}

	///////////////////////////////////////////////////////////////
	_saveAndClose() {

		let valTitle = this.m_elmTextTitle.value;
		let valLocation = this.m_elmTextLocation.value;
		let valUpdateTitle = this.m_elmChkUpdateTitle.checked;

		// Any value was modified
		if (this.m_initialProperties.title === valTitle &&
			this.m_initialProperties.location === valLocation &&
			this.m_initialProperties.updateTitle === valUpdateTitle) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if (valTitle.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		try {
			new URL(valLocation);
		} catch (error) {
			this.m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		rssTreeView.updateFeedProperties(this.m_elmTreeItemLI, valTitle, valLocation, valUpdateTitle);
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
	open(elmLI) {
		super.open(elmLI);

		this._hideNoneTitleProperties(true);
		this._hideOptionInsertInsideFolder(true);

		this.m_initialProperties.title = this.m_elmTreeItemLI.firstElementChild.textContent;

		this._initData();
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

		let valTitle = this.m_elmTextTitle.value;

		// Any value was modified
		if (this.m_initialProperties.title === valTitle) {
			this.m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if (valTitle.length === 0) {
			this.m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		rssTreeView.updateFolderProperties(this.m_elmTreeItemLI, valTitle);
		this.close();
	}
}
