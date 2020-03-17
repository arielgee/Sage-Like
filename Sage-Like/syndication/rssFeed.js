"use strict";

class RssFeed extends XmlFeed {
	constructor(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding) {
		super(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding);
	}

	//////////////////////////////////////////
	getFeedData() {

		super._initFeedData();

		try {
			this._feedData.standard = SyndicationStandard.RSS;							// https://validator.w3.org/feed/docs/rss2.html
			this._feedData.feeder = this._feedXmlDoc.querySelector("rss");
			this._feedData.title = this._getNodeTextContent(this._feedXmlDoc, "rss > channel > title").consolidateWhiteSpaces();
			this._feedData.imageUrl = this._getNodeTextContent(this._feedXmlDoc, "rss > channel > image > url");
			this._feedData.description = this._getNodeTextContent(this._feedXmlDoc, "rss > channel > description");
			this._feedData.lastUpdated = this._getFeedLastUpdate(this._feedXmlDoc, "rss > channel", "rss > channel > item");
			this._feedData.itemCount = this._feedData.feeder.querySelectorAll("item").length;
		} catch (error) {
			this._feedData.errorMsg = error.message;
		}
		return this._feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData, withAttachments = false) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.RSS) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: " + feedData.feeder.localName.toUpperCase(), "v" + (feedData.feeder.getAttribute("version") || "?"));

		feedData.feeder = this._sortFeederByDate(feedData.feeder.querySelectorAll("item"));

		let i, len;
		let item, elmLink, feedItem, elmEnclosure, feedItemAtt;
		for(i=0, len=feedData.feeder.length; i<len; i++) {

			item = feedData.feeder[i];
			elmLink = item.querySelector("link");

			if(elmLink) {
				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															elmLink.textContent,
															this._getFeedItemLastUpdate(item));

				if (!!feedItem) {

					if(true/*withAttachments*/) {

						if( !!(elmEnclosure = item.querySelector("enclosure")) ) {

							if( !!(feedItemAtt = this._getFeedItemEnclosureAsAttObject(elmEnclosure)) ) {
								feedItem.attachments.push(feedItemAtt);
							}
						}
					}
					console.log("[Sage-Like feedItem ]", feedItem);
					feedItemList.push(feedItem);
				}
			}
		}
		return feedItemList;
	}

	//////////////////////////////////////////
	_getFeedItemEnclosureAsAttObject(elm) {

		let url = slUtil.validURL(elm.getAttribute("url"));

		if(!!url) {

			let title = elm.getAttribute("title");
			if(!!!title) {
				title = url.pathname.split("/").pop();
			}
			return this._createFeedItemAttachmentObject(title, url, elm.getAttribute("type"), elm.getAttribute("length"));
		}
		return null;
	}
}
