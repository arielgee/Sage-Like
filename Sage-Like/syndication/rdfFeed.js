"use strict";

class RdfFeed extends XmlFeed {
	constructor(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding) {
		super(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding);
	}

	//////////////////////////////////////////
	getFeedData() {

		super._initFeedData();

		try {
			this._feedData.standard = SyndicationStandard.RDF;							// https://validator.w3.org/feed/docs/rss1.html; Examples: http://feeds.nature.com/nature/rss/current, https://f1-gate.com/
			this._feedData.feeder = this._feedXmlDoc.querySelector("RDF");
			this._feedData.title = this._getNodeTextContent(this._feedXmlDoc, "RDF > channel > title").consolidateWhiteSpaces();
			this._feedData.imageUrl = this._getNodeTextContent(this._feedXmlDoc, "RDF > image > url");
			this._feedData.description = this._getNodeTextContent(this._feedXmlDoc, "RDF > channel > description");
			this._feedData.lastUpdated = this._getFeedLastUpdate(this._feedXmlDoc, "RDF > channel", "RDF > item");
			this._feedData.itemCount = this._feedData.feeder.querySelectorAll("item").length;
		} catch (error) {
			console.log("[Sage-Like]", "getFeedData error", error);
			this._feedData.errorMsg = error.message;
		}
		return this._feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData, withAttachments = false) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.RDF) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

		feedData.feeder = this._sortFeederByDate(feedData.feeder.querySelectorAll("item"));

		let i, len;
		let item, elmLink, feedItem;
		for(i=0, len=feedData.feeder.length; i<len; i++) {

			item = feedData.feeder[i];
			elmLink = item.querySelector("link");

			if(elmLink) {
				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															this._getFeedItemHtmlContent(item),
															elmLink.textContent,
															this._getFeedItemLastUpdate(item));
				if (!!feedItem) feedItemList.push(feedItem);
			}
		}
		return feedItemList;
	}
}
