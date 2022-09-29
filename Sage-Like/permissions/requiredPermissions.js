"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {

	static #m_construct = false;
	static #m_instance = null;

	#m_permissions = { origins: ["<all_urls>"] };
	#m_granted = null;
	#onPermissionsChangedBound;

	constructor() {
		if(RequiredPermissions.#m_construct === false) {
			throw new Error("constructor: Don't do that, it's a singleton.");
		}
		this.#addEventListeners();
	}

	//////////////////////////////////////////
	static get i() {
		if (RequiredPermissions.#m_instance === null) {
			RequiredPermissions.#m_construct = true;
			RequiredPermissions.#m_instance = new this();
			RequiredPermissions.#m_construct = false;
		}
		return RequiredPermissions.#m_instance;
	}

	//////////////////////////////////////////
	get permissions() {
		return this.#m_permissions;
	}

	//////////////////////////////////////////
	get granted() {
		return this.#m_granted;
	}

	//////////////////////////////////////////
	async init() {
		await this.#checkPermissions();
	}

	//////////////////////////////////////////
	request() {
		return browser.permissions.request(this.#m_permissions);
	}

	//////////////////////////////////////////
	#onPermissionsChanged() {
		this.#checkPermissions();
	}

	//////////////////////////////////////////
	#addEventListeners() {
		this.#onPermissionsChangedBound = this.#onPermissionsChanged.bind(this);
		browser.permissions.onAdded.addListener(this.#onPermissionsChangedBound);
		browser.permissions.onRemoved.addListener(this.#onPermissionsChangedBound);
	}

	//////////////////////////////////////////
	async #checkPermissions() {
		this.#m_granted = await browser.permissions.contains(this.#m_permissions);
	}
}
