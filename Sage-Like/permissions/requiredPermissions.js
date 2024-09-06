"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {

	static #_constructId = null;
	static #_instance = null;

	#_granted = null;
	#_permissions = { origins: ["<all_urls>"] };

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
			RequiredPermissions.#_instance = new this(RequiredPermissions.#_constructId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
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
	getInfoText() {
		return "Due to changes in the add-ons environment (Manifest V3) the now optional permission " +
				"<b>Access your data for all websites</b> is currently not allowed by the browser.<br><br>" +
				"Without this permission, most feeds will probably not load as expected.<br><br>" +
				"A website can set up its feeds in a way that does not require this permission. But many " +
				"feeds are not, and the result is a network error caused by browser's restrictions (CORS).";
	}

	//////////////////////////////////////////
	request() {
		return browser.permissions.request(this.#_permissions);
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
		this.#_granted = await browser.permissions.contains(this.#_permissions);
	}
}
