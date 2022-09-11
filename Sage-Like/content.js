"use strict";

class Content {

	//////////////////////////////////////////////////////////////////////
	constructor() {
		this._feeds = [];
		this._isFeedsArraySet = false;
		this._pageData = this._getPageData();
		this._onRuntimeMessage = this._onRuntimeMessage.bind(this);
		browser.runtime.onMessage.addListener(this._onRuntimeMessage);
	}

	//////////////////////////////////////////////////////////////////////
	_getPageData() {

		let docType = document.doctype;
		let sDocType = "";
		let docBody = document.body;

		if(!!docType) {
			sDocType = `<!DOCTYPE ${docType.name}`;
			if(docType.publicId) {
				sDocType += ` PUBLIC "${docType.publicId}"`;
			} else if(docType.systemId) {
				sDocType += ` SYSTEM "${docType.systemId}"`;
			}
			sDocType += ">\n";
		}

		return {
			docElmId: document.documentElement.id,
			title: document.title,
			contentType: document.contentType,
			domainName: document.domain,
			location: window.location.toString(),
			origin: window.location.origin,
			isPlainText: !!docBody && docBody.children.length === 1 && docBody.firstElementChild.tagName === "PRE" && docBody.firstElementChild.children.length === 0,
			txtHTML: sDocType + document.documentElement.outerHTML,
		};
	}

	//////////////////////////////////////////////////////////////////////
	_onRuntimeMessage(message) {

		return new Promise((resolve) => {

			switch (message.id) {

				case Global.MSG_ID_QUERY_INJECTED_CONTENT:
					resolve({ reply: "YES" });
					break;
					//////////////////////////////////////////////////////////////

				case Global.MSG_ID_SET_CONFIRMED_PAGE_FEEDS:
					if(message.confirmedFeeds instanceof Array) {
						this._feeds.push(...(message.confirmedFeeds));
					}
					this._isFeedsArraySet = true;
					resolve({ feedCount: this._feeds.length });
					break;
					//////////////////////////////////////////////////////////////

				case Global.MSG_ID_GET_CONFIRMED_PAGE_FEEDS:
					resolve({ isFeedsArraySet: this._isFeedsArraySet, title: document.title, feeds: this._feeds });
					break;
					//////////////////////////////////////////////////////////////

				case Global.MSG_ID_GET_PAGE_DATA:
					resolve({ pageData: this._pageData });
					break;
					//////////////////////////////////////////////////////////////
			}
		});
	}
}

const obj = new Content();
