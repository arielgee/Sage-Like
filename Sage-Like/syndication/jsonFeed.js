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
			feedData.standard = SyndicationStandard.JSON;					// https://daringfireball.net/feeds/json
			feedData.jsonVersion = this._feedJson.version.match(/[\d.]+$/)[0];
			feedData.feeder = this._feedJson.items;
			feedData.title = (!!this._feedJson.title ? this._feedJson.title.stripHtmlTags() : "").consolidateWhiteSpaces();
			feedData.imageUrl = (!!this._feedJson.icon ? this._feedJson.icon : (!!this._feedJson.favicon ? this._feedJson.favicon : "")).stripHtmlTags();
			feedData.description = (!!this._feedJson.description ? this._feedJson.description.stripHtmlTags() : "");
			feedData.lastUpdated = this._getFeedLastUpdate(this._feedJson.items);
			feedData.itemCount = this._feedJson.items.length;
		} catch (error) {
			feedData.errorMsg = error.message;
		}
		return feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.JSON) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: JSON", "v" + (feedData.jsonVersion.match(/[\d.]+$/) || "?"));

		feedData.feeder = this._sortFeederByDate(feedData.feeder);

		let i, len;
		let item, itemUrl;
		for(i=0, len=feedData.feeder.length; i<len; i++) {

			item = feedData.feeder[i];

			// first option.
			// Ideally, the id is the full URL of the resource described by the item
			itemUrl = item.id;

			if(!!!slUtil.validURL(itemUrl)) {

				// second options.
				// ++ some feeds put the url in the external_url (WTF?) 			// https://matthiasott.com/links/feed.json
				// ++ some feeds are for audio/video files as attachments (WTF?) 	// https://www.npr.org/feeds/510317/feed.json
				itemUrl = (!!item.url ? item.url : (!!item.external_url ? item.external_url : item.attachments[0].url));

				let oErr = {};
				if(!!!slUtil.validURL(itemUrl, oErr)) {
					console.log("[Sage-Like]", "URL validation", oErr.error);
					continue;		// skip and try next feed-item
				}
			}

			feedItemList.push( this._createFeedItemObject(	this._getFeedItemTitle(item).stripHtmlTags(),
															this._getFeedItemDesc(item).stripHtmlTags(),
															itemUrl.stripHtmlTags(),
															this._getFeedItemLastUpdate(item)) );
		}
		return feedItemList;
	}

	//////////////////////////////////////////
	dispose() {
		super.dispose();
		this._feedJson = null;
	}

	//////////////////////////////////////////
	_getFeedLastUpdate(items) {

		let dateVal = new Date(items.reduce((prv, cur) => prv.date_modified > cur.date_modified ? prv : cur ).date_modified);

		if(isNaN(dateVal)) {
			dateVal = new Date(items.reduce((prv, cur) => prv.date_published > cur.date_published ? prv : cur ).date_published);
			return isNaN(dateVal) ? slUtil.getCurrentLocaleDate() : dateVal;
		} else {
			return dateVal;
		}
	}

	//////////////////////////////////////////
	_sortFeederByDate(feeder) {

		let ary = Array.prototype.slice.call(feeder, 0);

		if(!!(ary[0])) {

			ary.sort((a, b) => {
				let v1 = Date.parse(a.date_modified || a.date_published);
				let v2 = Date.parse(b.date_modified || b.date_published);
				let d1 = isNaN(v1) ? 0 : v1;
				let d2 = isNaN(v2) ? 0 : v2;
				return d2 - d1;
			});
		}
		return ary;
	}

	//////////////////////////////////////////
	_getFeedItemTitle(item) {

		let retVal;

		if(!!item.title) {
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
	_getFeedItemDesc(item) {

		let retVal;

		if(!!item.summary) {
			retVal = item.summary;
		} else if(!!item.content_text) {
			retVal = item.content_text;
		} else if(!!item.content_html) {
			retVal = item.content_html;
		} else {
			return "";
		}

		// some feed put an empty object in the summery (WTF?)			// https://matthiasott.com/articles/feed.json
		return (typeof(retVal) === "string" ? retVal : "");
	}

	//////////////////////////////////////////
	_getFeedItemLastUpdate(item) {

		let dateVal = new Date(item.date_modified);

		if(isNaN(dateVal)) {
			dateVal = new Date(item.date_published);
			return isNaN(dateVal) ? slUtil.getCurrentLocaleDate() : dateVal;
		} else {
			return dateVal;
		}
	}
}