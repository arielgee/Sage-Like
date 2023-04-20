"use strict";

class Feed {
	// publicClassField = 1;		// support starts at Firefox v69
	constructor(feedUrl) {
		if (new.target.name === "Feed") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		this._className = new.target.name;
		this._feedUrl = feedUrl;
	}

	//////////////////////////////////////////
	get className() { return this._className; }

	//////////////////////////////////////////
	dispose() {
		this._feedUrl = null;
	}

	//////////////////////////////////////////
	_createFeedItemObject(title, desc, content, url, lastUpdated, imageUrl) {
		return {
			title: title,
			description: desc,
			htmlContent: content,
			url: url,
			lastUpdated: lastUpdated,
			image: imageUrl,
			attachments: [],
		};
	}

	//////////////////////////////////////////
	_createFeedItemAttachmentObject(title, url, mimeType, byteSize, rel) {
		return {
			title: title,
			url: url,
			mimeType: !!mimeType ? mimeType : "",
			byteSize: (!!byteSize && !isNaN(byteSize)) ? Number(byteSize) : 0,
			rel: !!rel ? rel : "",
		};
	}
}
