"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {
	constructor() {
		this.m_requiredPermissions = { origins: ["<all_urls>"] };
		this.m_granted = null;
		this._addEventListeners();
	}

	//////////////////////////////////////////
	static get i() {
		if (this.m_instance === undefined) {
			this.m_instance = new this();
		}
		return this.m_instance;
	}

	//////////////////////////////////////////
	async init() {
		await this._checkPermissions();
	}

	//////////////////////////////////////////
	get granted() {
		return this.m_granted;
	}

	//////////////////////////////////////////
	request() {
		return browser.permissions.request(this.m_requiredPermissions);
	}

	//////////////////////////////////////////
	async _checkPermissions() {
		this.m_granted = await browser.permissions.contains(this.m_requiredPermissions);
	}

	//////////////////////////////////////////
	_onPermissionsChanged() {
		this._checkPermissions();
	}

	//////////////////////////////////////////
	_addEventListeners() {
		this._onPermissionsChanged = this._onPermissionsChanged.bind(this);
		browser.permissions.onAdded.addListener(this._onPermissionsChanged);
		browser.permissions.onRemoved.addListener(this._onPermissionsChanged);
	}
}
