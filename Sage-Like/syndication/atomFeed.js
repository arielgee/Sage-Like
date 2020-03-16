"use strict";

class AtomFeed extends XmlFeed {
	constructor(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding) {
		super(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding);
	}

	//////////////////////////////////////////
	getFeedData() {

		super._initFeedData();

		try {
			this._feedData.standard = SyndicationStandard.Atom;							// https://validator.w3.org/feed/docs/atom.html
			this._feedData.feeder = this._feedXmlDoc.querySelector("feed");
			this._feedData.title = this._getNodeTextContent(this._feedXmlDoc, "feed > title").consolidateWhiteSpaces();
			this._feedData.imageUrl = this._getNodeTextContent(this._feedXmlDoc, "feed > logo", "feed > icon");
			this._feedData.description = this._getNodeTextContent(this._feedXmlDoc, "feed > subtitle");
			this._feedData.lastUpdated = this._getFeedLastUpdate(this._feedXmlDoc, "feed", "entry");
			this._feedData.itemCount = this._feedData.feeder.querySelectorAll("entry").length;
		} catch (error) {
			this._feedData.errorMsg = error.message;
		}
		return this._feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.Atom) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

		feedData.feeder = this._sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

		let i, len;
		let item, elmLink, feedItem;
		for(i=0, len=feedData.feeder.length; i<len; i++) {

			item = feedData.feeder[i];
			elmLink = item.querySelector("link:not([rel])") || item.querySelector("link[rel=alternate]") || item.querySelector("link");

			if(elmLink) {
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															elmLink.getAttribute("href"),
															this._getFeedItemLastUpdate(item));
				if (!!feedItem) feedItemList.push(feedItem);
			}
		}
		return feedItemList;
	}
}
