"use strict";

/////////////////////////////////////////////////////////////////////////////////////////////
class TreeItemType {
	static #_isElm(e)			{ return !!e && e.nodeType === Node.ELEMENT_NODE; }

	static isTree(elm)			{ return this.#_isElm(elm) && elm.id === Global.ID_UL_RSS_TREE_VIEW; }
	static isTreeItem(elm)		{ return this.#_isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_ITEM); }
	static isFeed(elm)			{ return this.#_isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_FEED); }
	static isFolder(elm)		{ return this.#_isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_FOLDER); }
	static isFolderOpen(elm)	{ return this.isFolder(elm) && elm.classList.contains("open"); }
	static isFolderClosed(elm)	{ return this.isFolder(elm) && elm.classList.contains("closed"); }
	static isOpen(elm)			{ return this.#_isElm(elm) && elm.classList.contains("open"); }		// Use after checking that TreeItemType.isFolder() return true
	static isClosed(elm)		{ return this.#_isElm(elm) && elm.classList.contains("closed"); }	// Use after checking that TreeItemType.isFolder() return true
	static isError(elm)			{ return this.#_isElm(elm) && elm.classList.contains("errormsg"); }
	static isUnauthorized(elm)	{ return this.isFeed(elm) && elm.classList.contains("unauthorized"); }
}

/////////////////////////////////////////////////////////////////////////////////////////////
class OpenTreeFolders extends StoredKeyedItems {

	// ATTENTION: If you add any new member (like lastChecked) to this object, update onRuntimeInstalled() in background.js

	//////////////////////////////////////////
	getStorage() {
		return new Promise((resolve) => {
			internalPrefs.getOpenTreeFolders().then((items) => {
				this._items = items;
				resolve(this.length);
			});
		});
	}

	//////////////////////////////////////////
	setStorage() {
		return internalPrefs.setOpenTreeFolders(this._items);
	}

	//////////////////////////////////////////
	set(key, _, saveToStorage = true) {
		super.set(key, { lastChecked: Date.now() }, saveToStorage);
	}

	//////////////////////////////////////////
	purge(millisecOlderThen = 86400000) {	// 24 hours in milliseconds
		return new Promise((resolve) => {

			let collecting = slUtil.bookmarksFoldersAsCollection();
			let getting = this.getStorage();
			let msThresholdTime = Date.now() - millisecOlderThen;

			collecting.then((bmFolders) => {
				getting.then(() => {

					for(let key in this._items) {

						// remove from object if its not in the folders collection and is older then millisecOlderThen
						if( !!!bmFolders[key] && (this._items[key].lastChecked < msThresholdTime) ) {
							this.remove(key, false);
						}
					}
					this.setStorage();
					resolve();
				}).catch(() => {});
			}).catch(() => {});
		});
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class TreeFeedsData extends StoredKeyedItems {

	// ATTENTION: If you add any new member to this object, update onRuntimeInstalled() in background.js
	#_defaultObject = {
		lastChecked: 0,
		lastVisited: 0,
		updateTitle: true,
		openInFeedPreview: false,
		ignoreUpdates: false,
		feedMaxItems: 0,
		// for restoring feeds last status after sidebar is reopened when pref 'checkFeedsOnSbOpen' is false.
		lastStatusIsVisited: false,
		lastStatusUnreadCount: 0,
		lastStatusErrorState: false,
	};

	constructor() {
		super();
	}

	//////////////////////////////////////////
	getStorage() {
		return new Promise((resolve) => {
			internalPrefs.getTreeFeedsData().then((items) => {
				this._items = items;
				resolve(this.length);
			});
		});
	}

	//////////////////////////////////////////
	setStorage() {
		return internalPrefs.setTreeFeedsData(this._items);
	}

	//////////////////////////////////////////
	set(key, properties = {}, saveToStorage = true) {
		// this._items[key] may not exist (undefined) and it's OK
		// lastChecked is protected, modifiable only by set() or update()
		let obj = Object.assign({}, this.#_defaultObject, this._items[key], properties, { lastChecked: Date.now() });
		super.set(key, obj, saveToStorage);
	}

	//////////////////////////////////////////
	update(key) {
		// only update() and set() can change lastChecked.
		if(this.exist(key)) {
			this._items[key].lastChecked = Date.now();
			this.setStorage();
		} else {
			this.set(key);
		}
	}

	//////////////////////////////////////////
	setIfNotExist(key) {
		if(!this.exist(key)) {
			this.set(key);
		}
	}

	//////////////////////////////////////////
	purge(millisecOlderThen = 86400000) {	// 24 hours in milliseconds
		// test case: Moved/Reused bookmark id value; bookmark moved or deleted and a new one created with same id value.

		return new Promise((resolve) => {

			let collecting = slUtil.bookmarksFeedsAsCollection(false);
			let getting = this.getStorage();
			let msThresholdTime = Date.now() - millisecOlderThen;

			collecting.then((bmFeeds) => {
				getting.then(() => {

					for(let key in this._items) {

						// remove from object if its not in the feeds collection and is older then millisecOlderThen
						if( !!!bmFeeds[key] && (this._items[key].lastChecked < msThresholdTime) ) {
							this.remove(key, false);
						}
					}
					this.setStorage();
					resolve();
				}).catch(() => {});
			}).catch(() => {});
		});
	}
}
