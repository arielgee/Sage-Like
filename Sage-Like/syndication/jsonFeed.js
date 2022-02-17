"use strict";

class JsonFeed extends Feed {
	constructor(feedUrl, feedJson) {
		super(feedUrl);
		this._feedJson = feedJson;
	}

	//////////////////////////////////////////
	getFeedData() {

		let feedData = new JsonFeedData();

		try {
			feedData.standard = SyndicationStandard.JSON;					// https://jsonfeed.org/version/1
			feedData.jsonVersion = this._feedJson.version.match(/[\d.]+$/)[0];
			feedData.feeder = this._feedJson.items;
			feedData.title = (!!this._feedJson.title ? this._feedJson.title.stripHtmlTags() : "").consolidateWhiteSpaces();
			feedData.imageUrl = (!!this._feedJson.icon ? this._feedJson.icon : (!!this._feedJson.favicon ? this._feedJson.favicon : "")).stripHtmlTags();
			feedData.description = (!!this._feedJson.description ? this._feedJson.description.stripHtmlTags() : "");
			feedData.lastUpdated = this._getFeedLastUpdate(this._feedJson.items);
			feedData.itemCount = this._feedJson.items.length;
			feedData.webPageUrl = (!!this._feedJson.home_page_url ? this._feedJson.home_page_url.stripHtmlTags() : "");
		} catch (error) {
			console.log("[Sage-Like]", "getFeedData error", error);
			feedData.errorMsg = error.message;
		}
		return feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData, withAttachments = false) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.JSON) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: JSON", "v" + (feedData.jsonVersion.match(/[\d.]+$/) || "?"));

		let i, j, iLen, jLen;
		let item, feedItem, itemAtts, feedItemAtt;
		for(i=0, iLen=feedData.feeder.length; i<iLen; i++) {

			item = feedData.feeder[i];
			feedItem = this._createSingleListItemFeed(item);

			if(!!feedItem) {

				if(withAttachments) {

					itemAtts = item.attachments || [];		// if attachments is missing then atts is empty array

					for(j=0, jLen=itemAtts.length; j<jLen; j++) {
						if( !!(feedItemAtt = this._getFeedItemAttachmentAsAttObject(itemAtts[j])) ) {
							feedItem.attachments.push(feedItemAtt);
						}
					}
				}
				//console.log("[Sage-Like JSON attachments]", feedItem.attachments);
				feedItemList.push(feedItem);
			}
		}
		return feedItemList;
	}

	//////////////////////////////////////////
	dispose() {
		super.dispose();
		this._feedJson = null;
	}

	//////////////////////////////////////////
	_createSingleListItemFeed(item) {

		// first attempt.
		// Ideally, the id is the full URL of the resource described by the item
		let itemUrl = item.id;

		if(!!!slUtil.validURL(itemUrl)) {

			// second attempts.
			// ++ some feeds put the url in the external_url (WTF?) 			// https://matthiasott.com/links/feed.json
			// ++ some feeds are for audio/video files as attachments (WTF?) 	// https://www.npr.org/feeds/510317/feed.json
			itemUrl = (!!item.url ? item.url : (!!item.external_url ? item.external_url : item.attachments[0].url));

			let oErr = { error: null };
			if(!!!slUtil.validURL(itemUrl, oErr)) {
				console.log("[Sage-Like]", "URL validation.", oErr.error.message);
				return null;
			}
		}

		return this._createFeedItemObject(	this._getFeedItemTitle(item).stripHtmlTags(),
											this._getFeedItemDescription(item).stripUnsafeHtmlComponents(),
											this._getFeedItemHtmlContent(item).stripUnsafeHtmlComponents(),
											itemUrl.stripHtmlTags(),
											this._getFeedItemLastUpdate(item),
											(!!item.image && slUtil.validURL(item.image)) ? item.image : "");
	}

	//////////////////////////////////////////
	_getFeedLastUpdate(items) {

		let dateVal = new Date(items.reduce((prv, cur) => prv.date_modified > cur.date_modified ? prv : cur ).date_modified);

		if(isNaN(dateVal)) {
			dateVal = new Date(items.reduce((prv, cur) => prv.date_published > cur.date_published ? prv : cur ).date_published);
			return isNaN(dateVal) ? Global.DEFAULT_DATE() : dateVal;
		} else {
			return dateVal;
		}
	}

	//////////////////////////////////////////
	_getFeedItemTitle(item) {

		let retVal;

		if(!!item.title && item.title.length > 0) {
			retVal = item.title;
		} else if(!!item.id) {
			retVal = item.id;
		} else {
			return "";
		}

		// some feed put an empty object in the summery (WTF?)			// https://matthiasott.com/articles/feed.json
		return (typeof(retVal) === "string" ? retVal : "");
	}

	//////////////////////////////////////////
	_getFeedItemDescription(item) {

		let prop;
		let itemAllDescProperties = [item.summary, item.content_text, item.content_html];

		for(let i=0, len=itemAllDescProperties.length; i<len; i++) {

			prop = itemAllDescProperties[i];

			// some feed put an empty object in the summery (WTF?)			// https://matthiasott.com/articles/feed.json
			if( !!prop && (typeof(prop) === "string") && (prop.length > 0) ) {
				return prop;
			}
		}
		return "";
	}

	//////////////////////////////////////////
	_getFeedItemHtmlContent(item) {

		let prop;
		let acquired = null;
		let propCount = 0;
		let itemDescProperties = [item.content_html, item.content_text, item.summary];

		// scan ALL the alternatives in reverse order, in contrast to _getFeedItemDescription().
		// If the acquired property is the only one existing then assume _getFeedItemDescription() got it and return empty string
		for(let i=0, len=itemDescProperties.length; i<len; i++) {

			prop = itemDescProperties[i];

			if( !!prop && (typeof(prop) === "string") && (prop.length > 0) ) {
				if(!!!acquired) {
					acquired = prop;
				}
				propCount++;
			}
		}
		return (propCount > 1) ? acquired : "";
	}

	//////////////////////////////////////////
	_getFeedItemLastUpdate(item) {

		let numericDateVal = slUtil.asSafeNumericDate(item.date_modified);

		if(numericDateVal > Global.DEFAULT_VALUE_OF_DATE) {
			return new Date(numericDateVal);
		} else {
			return new Date(slUtil.asSafeNumericDate(item.date_published));
		}
	}

	//////////////////////////////////////////
	_getFeedItemAttachmentAsAttObject(att) {

		let url = slUtil.validURL(new URL(att.url, this._feedUrl));

		if(!!url) {

			let title = att.title;
			if(!!!title) {
				title = url.pathname.replace(/(\/|%2F)+$/i, "").split(/\/|%2F/i).pop();
			}
			return this._createFeedItemAttachmentObject(title, url,
														slUtil.asSafeTypeValue(att.mime_type),
														slUtil.asSafeTypeValue(att.size_in_bytes, true),
														"attachment");
		}
		return null;
	}
}
