"use strict";

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class PropertiesView {

    ///////////////////////////////////////////////////////////////
    //
	static get i() {
		if(this.m_instance === undefined) {
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
        this.m_elmFeedItemLI = elmLI;

        this.m_elmButtonSave.addEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.addEventListener("click", this._onClickButtonCancel);
		this.m_elmFeedPropertiesPanel.addEventListener("keydown", this._onKeyDownFeedPropertiesPanel);

        this._showPanel();
        this.m_isOpen = true;
    }

	///////////////////////////////////////////////////////////////
	close() {

		if(this.m_isOpen === false) {
			return;
		}

		slUtil.disableElementTree(this.m_elmMainPanel, false);
        this.m_elmFeedPropertiesPanel.style.display = "none";

		this.m_elmButtonSave.removeEventListener("click", this._onClickButtonSave);
		this.m_elmButtonCancel.removeEventListener("click", this._onClickButtonCancel);
		this.m_elmFeedPropertiesPanel.removeEventListener("keydown", this._onKeyDownFeedPropertiesPanel);

        rssTreeView.setFocus();
        this.m_isOpen = false;
	}

	///////////////////////////////////////////////////////////////
    _initMembers() {
		this.m_elmSidebarBody = document.body;
		this.m_elmMainPanel = document.getElementById("mainPanel");
		this.m_elmFeedPropertiesPanel = document.getElementById("feedPropertiesPanel");
		this.m_elmTextTitle = document.getElementById("txtFpTitle");
		this.m_elmTextLocation = document.getElementById("txtFpLocation");
		this.m_elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
		this.m_elmButtonSave = document.getElementById("btnFeedPropertiesSave");
		this.m_elmButtonCancel = document.getElementById("btnFeedPropertiesCancel");
        this.m_elmLabelErrorMsgs = document.getElementById("lblErrorMsgs");

        this._onClickButtonSave = this._onClickButtonSave.bind(this);
        this._onClickButtonCancel = this._onClickButtonCancel.bind(this);
        this._onKeyDownFeedPropertiesPanel = this._onKeyDownFeedPropertiesPanel.bind(this);

        this.m_initialProperties = {
            title: "",
            location: "",
            updateTitle: false,
        };

        this.m_isOpen = false;
    }

	///////////////////////////////////////////////////////////////
    _initData() {
		this.m_elmTextTitle.value = this.m_initialProperties.title;
        this.m_elmTextLocation.value = this.m_initialProperties.location;
        this.m_elmChkUpdateTitle.checked = this.m_initialProperties.updateTitle;
		this.m_elmLabelErrorMsgs.textContent = "";

		this.m_elmTextTitle.focus();
		this.m_elmTextTitle.setSelectionRange(0, -1);	// select all
    }

	///////////////////////////////////////////////////////////////
    _showPanel() {

		let r = this.m_elmFeedItemLI.getBoundingClientRect();
		let y = r.top;

		// do it first so element will have dimentions (offsetWidth > 0)
		this.m_elmFeedPropertiesPanel.style.display = "block";
		slUtil.disableElementTree(this.m_elmMainPanel, true);

		if ((y + this.m_elmFeedPropertiesPanel.offsetHeight) > this.m_elmSidebarBody.offsetHeight) {
			y = this.m_elmSidebarBody.offsetHeight - this.m_elmFeedPropertiesPanel.offsetHeight;
		}

		this.m_elmFeedPropertiesPanel.style.top = y + "px";
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
	_onKeyDownFeedPropertiesPanel(event) {
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
class editFeedProperties extends PropertiesView {

	///////////////////////////////////////////////////////////////
    constructor() {
        super();
    }

	///////////////////////////////////////////////////////////////
    open(elmLI, updateTitleValue) {
        super.open(elmLI);

		this.m_initialProperties.title = elmLI.firstElementChild.textContent;
        this.m_initialProperties.location = elmLI.getAttribute("href");
        this.m_initialProperties.updateTitle = updateTitleValue;

        this._initData();
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
		if(valTitle.length === 0) {
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

		rssTreeView.updateFeedProperties(this.m_elmFeedItemLI, valTitle, valLocation, valUpdateTitle);
		this.close();
    }
}

/*****************************************************************************************************************/
/*****************************************************************************************************************/
class editNewFeedProperties extends PropertiesView {

	///////////////////////////////////////////////////////////////
    constructor() {
        super();
    }

	///////////////////////////////////////////////////////////////
    open(elmLI) {
        super.open(elmLI);

		this.m_initialProperties.title = "New Feed";
        this.m_initialProperties.location = "";
        this.m_initialProperties.updateTitle = true;

        this._initData();
    }

	///////////////////////////////////////////////////////////////
    _saveAndClose() {

		let valTitle = this.m_elmTextTitle.value;
		let valLocation = this.m_elmTextLocation.value;
		let valUpdateTitle = this.m_elmChkUpdateTitle.checked;

		// Title validation
		if(valTitle.length === 0) {
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

		//rssTreeView.updateFeedProperties(this.m_elmFeedItemLI, valTitle, valLocation, valUpdateTitle);
		this.close();
    }
}