"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {

	static #m_constructId = null;
	static #m_instance = null;

	#m_permissions = { origins: ["<all_urls>"] };
	#m_granted = null;
	#onPermissionsChangedBound;

	constructor(id) {
		if(RequiredPermissions.#m_constructId !== parseInt(id)) {
			throw new Error(`${new.target.name}.constructor: Don't do that, it's a singleton.`);
		}
		RequiredPermissions.#m_constructId = null;
		this.#addEventListeners();
	}

	//////////////////////////////////////////
	static get i() {
		if (RequiredPermissions.#m_instance === null) {
			RequiredPermissions.#m_instance = new this(RequiredPermissions.#m_constructId = Math.floor(Math.random() *  Number.MAX_SAFE_INTEGER));
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
