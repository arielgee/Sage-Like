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
			this._feedData.webPageUrl = this._getNodeTextContent(this._feedXmlDoc, "rss > channel > link:not([rel]):not([href])");
		} catch (error) {
			console.log("[Sage-Like]", "getFeedData error", error);
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

		let i, j, iLen, jLen;
		let item, elmLink, feedItem, elmEnclosures, feedItemAtt;
		for(i=0, iLen=feedData.feeder.length; i<iLen; i++) {

			item = feedData.feeder[i];
			elmLink = item.querySelector("link");

			if(elmLink) {
				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															this._getFeedItemHtmlContent(item),
															elmLink.textContent,
															this._getFeedItemLastUpdate(item),
															this._getFeedItemImageUrl(item));

				if (!!feedItem) {

					if(withAttachments) {

						elmEnclosures = item.querySelectorAll("enclosure");

						for(j=0, jLen=elmEnclosures.length; j<jLen; j++) {
							if( !!(feedItemAtt = this._getFeedItemEnclosureAsAttObject(elmEnclosures[j])) ) {
								feedItem.attachments.push(feedItemAtt);
							}
						}
					}
					//console.log("[Sage-Like RSS attachments]", feedItem.attachments);
					feedItemList.push(feedItem);
				}
			}
		}
		return feedItemList;
	}

	//////////////////////////////////////////
	_getFeedItemEnclosureAsAttObject(elm) {

		let url = slUtil.validURL(new URL(elm.getAttribute("url"), this._feedUrl));

		if(!!url) {

			let title = elm.getAttribute("title");
			if(!!!title) {
				title = url.pathname.replace(/(^.*)\/$/, "$1").split("/").pop();
			}
			return this._createFeedItemAttachmentObject(title, url,
														slUtil.asSafeTypeValue(elm.getAttribute("type")),
														slUtil.asSafeTypeValue(elm.getAttribute("length"), true),
														"enclosure");
		}
		return null;
	}
}
