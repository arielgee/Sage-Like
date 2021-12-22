"use strict";

/////////////////////////////////////////////////////////////////////////////////////////////
class TreeItemType {
	static _isElm(e)			{ return !!e && e.nodeType === Node.ELEMENT_NODE; }

	static isTree(elm)			{ return this._isElm(elm) && elm.id === Global.ID_UL_RSS_TREE_VIEW; }
	static isTreeItem(elm)		{ return this._isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_ITEM); }
	static isFeed(elm)			{ return this._isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_FEED); }
	static isFolder(elm)		{ return this._isElm(elm) && elm.classList.contains(Global.CLS_RTV_LI_TREE_FOLDER); }
	static isFolderOpen(elm)	{ return this.isFolder(elm) && elm.classList.contains("open"); }
	static isFolderClosed(elm)	{ return this.isFolder(elm) && elm.classList.contains("closed"); }
	static isOpen(elm)			{ return this._isElm(elm) && elm.classList.contains("open"); }		// Use after checking that TreeItemType.isFolder() return true
	static isClosed(elm)		{ return this._isElm(elm) && elm.classList.contains("closed"); }	// Use after checking that TreeItemType.isFolder() return true
	static isError(elm)			{ return this._isElm(elm) && elm.classList.contains("errormsg"); }
	static isUnauthorized(elm)	{ return this.isFeed(elm) && elm.classList.contains("unauthorized"); }
}

/////////////////////////////////////////////////////////////////////////////////////////////
class StoredKeyedItems {
	//////////////////////////////////////////
	constructor() {
		if (new.target.name === "StoredKeyedItems") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		this._items = {};
	}

	//////////////////////////////////////////
	set(key, value, saveToStorage = true) {
		this._items[key] = !!value ? value : {};
		if(saveToStorage) this.setStorage();
	}

	//////////////////////////////////////////
	remove(key, saveToStorage = true) {
		delete this._items[key];
		if(saveToStorage) this.setStorage();
	}

	//////////////////////////////////////////
	get length() {
		return Object.keys(this._items).length;
	}

	//////////////////////////////////////////
	exist(key) {
		return this._items.hasOwnProperty(key);
	}

	//////////////////////////////////////////
	value(key) {
		// return a cloned item to prevent modifications to items in _items w/o using set()
		return this._items.hasOwnProperty(key) ? Object.assign({}, this._items[key]) : undefined;
	}

	//////////////////////////////////////////
	clear(saveToStorage = true) {
		this._items = {};
		if(saveToStorage) this.setStorage();
	}

	//////////////////////////////////////////
	maintenance() {
		return new Promise((resolve) => {
			this.getStorage().then(() => {

				// for version upgrade need to update values; add/remove modified properties
				for(let key in this._items) {
					this.set(key, {}, false);
				}
				this.setStorage();
				resolve();
			})
		});
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class OpenTreeFolders extends StoredKeyedItems {
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

			collecting.then((bmFolders) => {
				getting.then(() => {

					for(let key in this._items) {

						// remove from object if its not in the folders collection and is older then millisecOlderThen
						if( !!!bmFolders[key] && (this._items[key].lastChecked < (Date.now() - millisecOlderThen)) ) {
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
	//////////////////////////////////////////
	constructor() {
		super();
		this._defaultObject = Object.freeze({
			lastChecked: 0,
			lastVisited: 0,
			updateTitle: true,
			openInFeedPreview: false,
		});
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
		let obj = Object.assign({}, this._defaultObject, this._items[key], properties, { lastChecked: Date.now() });
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

			collecting.then((bmFeeds) => {
				getting.then(() => {

					for(let key in this._items) {

						// remove from object if its not in the feeds collection and is older then millisecOlderThen
						if( !!!bmFeeds[key] && (this._items[key].lastChecked < (Date.now() - millisecOlderThen)) ) {
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
