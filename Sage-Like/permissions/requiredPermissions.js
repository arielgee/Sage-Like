"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {

	static #_constructId = null;
	static #_instance = null;

	#_granted = null;
	_permissions = { origins: ["<all_urls>"] };

	constructor(id) {
		if(RequiredPermissions.#_constructId !== parseInt(id)) {
			throw new Error(`${new.target.name}.constructor: Don't do that, it's a singleton.`);
		}
		RequiredPermissions.#_constructId = null;
		this.#_addEventListeners();
	}

	//////////////////////////////////////////
	static get i() {
		if (RequiredPermissions.#_instance === null) {
			RequiredPermissions.#_instance = new this(RequiredPermissions.#_constructId = Math.floor(Math.random() *  Number.MAX_SAFE_INTEGER));
		}
		return RequiredPermissions.#_instance;
	}

	//////////////////////////////////////////
	get granted() {
		return this.#_granted;
	}

	//////////////////////////////////////////
	async init() {
		await this.#_checkPermissions();
	}

	//////////////////////////////////////////
	request() {
		return browser.permissions.request(this._permissions);
	}

	//////////////////////////////////////////
	#_onPermissionsChanged() {
		this.#_checkPermissions();
	}

	//////////////////////////////////////////
	#_addEventListeners() {
		let onPermissionsChangedBound = this.#_onPermissionsChanged.bind(this);
		browser.permissions.onAdded.addListener(onPermissionsChangedBound);
		browser.permissions.onRemoved.addListener(onPermissionsChangedBound);
	}

	//////////////////////////////////////////
	async #_checkPermissions() {
		this.#_granted = await browser.permissions.contains(this._permissions);
	}
}
