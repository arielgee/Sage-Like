
//############################################################################
// To test 'request({origins: ["file:///*"]})' place this in rssTreeView.onClickToolbarButton()

		browser.permissions.contains({origins: ["<all_urls>"]}).then((result) => {
			if(result) {
				console.log("[Sage-Like]", "Already have <all_urls> permission");
			} else {
				console.log("[Sage-Like]", "Don't have <all_urls> permission");
			}
		});

		browser.permissions.request({origins: ["file:///*"]}).then((granted) => {
			if(granted) {
				console.log("[Sage-Like]", "Granted file:///* permission");
			} else {
				console.log("[Sage-Like]", "file:///* permission request was denied");
			}
		});

		browser.permissions.request({origins: ["<all_urls>"]}).then((granted) => {
			if(granted) {
				console.log("[Sage-Like]", "Granted <all_urls> permission");
			} else {
				console.log("[Sage-Like]", "<all_urls> permission request was denied");
			}
		});


//############################################################################
// modified RequiredPermissions to support file:///* permission

"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissions {

	static #_constructId = null;
	static #_instance = null;

	static #_permission = {
		ALL_URLS: { origins: ["<all_urls>"] },
		FILE_URLS: { origins: ["file:///*"] }
	};

	#_grantedAllUrls = null;
	#_grantedFileUrls = null;

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
		return this.#_grantedAllUrls;
	}

	//////////////////////////////////////////
	get grantedFileUrls() {
		return this.#_grantedFileUrls;
	}

	//////////////////////////////////////////
	async init() {
		await this.#_checkPermissions();
	}

	//////////////////////////////////////////
	getInfoText(useHTML = true) {

		let strongOpen, strongClose, lineBreak2;

		if(useHTML) {
			strongOpen = "<b>";
			strongClose = "</b>";
			lineBreak2 = "<br><br>";
		} else {
			strongOpen = "\"";
			strongClose = "\"";
			lineBreak2 = "\n\n";
		}

		return `In Firefox Manifest V3, the optional permission ` +
				`${strongOpen}Access your data for all websites${strongClose} is ` +
				`currently not allowed by the browser.${lineBreak2}` +
				`Without this permission, most feeds will probably fail to load properly.${lineBreak2}` +
				`Some websites expose their feeds in a way that does not require this permission, but many ` +
				`do not. In those cases, the browser's restrictions (CORS) cause a network error.`;
	}

	//////////////////////////////////////////
	request() {
		return browser.permissions.request(RequiredPermissions.#_permission.ALL_URLS);
	}

	//////////////////////////////////////////
	requestFileUrls() {
		return browser.permissions.request(RequiredPermissions.#_permission.FILE_URLS);
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
		this.#_grantedAllUrls = await browser.permissions.contains(RequiredPermissions.#_permission.ALL_URLS);
		this.#_grantedFileUrls = await browser.permissions.contains(RequiredPermissions.#_permission.FILE_URLS);
	}
}
