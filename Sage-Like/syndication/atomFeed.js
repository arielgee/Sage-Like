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
			this._feedData.lastUpdated = this._getFeedLastUpdate(this._feedXmlDoc, "feed", "feed > entry");
			this._feedData.itemCount = this._feedData.feeder.querySelectorAll("entry").length;
		} catch (error) {
			this._feedData.errorMsg = error.message;
		}
		return this._feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData, withAttachments = false) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.Atom) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

		feedData.feeder = this._sortFeederByDate(feedData.feeder.querySelectorAll("entry"));

		let i, j, iLen, jLen;
		let item, elmLink, feedItem, elmLinks, feedItemAtt;
		for(i=0, iLen=feedData.feeder.length; i<iLen; i++) {

			item = feedData.feeder[i];
			elmLink = item.querySelector("link[href]:not([rel])") || item.querySelector("link[href][rel=alternate]") || item.querySelector("link[href]");

			if(!!elmLink) {
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															this._getFeedItemHtmlContent(item),
															elmLink.getAttribute("href"),
															this._getFeedItemLastUpdate(item));
				if (!!feedItem) {

					if(withAttachments) {

						elmLinks = item.querySelectorAll("link[href][rel=enclosure],link[href][rel=related]");

						for(j=0, jLen=elmLinks.length; j<jLen; j++) {
							if( !!(feedItemAtt = this._getFeedItemLinkAsAttObject(elmLinks[j])) ) {
								feedItem.attachments.push(feedItemAtt);
							}
						}
					}
					//console.log("[Sage-Like ATOM attachments]", feedItem.attachments);
					feedItemList.push(feedItem);
				}
			}
		}
		return feedItemList;
	}

	//////////////////////////////////////////
	_getFeedItemLinkAsAttObject(elm) {

		let url = slUtil.validURL(elm.getAttribute("href"));

		if(!!url) {

			let title = elm.getAttribute("title");
			if(!!!title) {
				title = url.pathname.replace(/(^.*)\/$/, "$1").split("/").pop();
			}
			return this._createFeedItemAttachmentObject(title, url,
														slUtil.asSafeTypeValue(elm.getAttribute("type")),
														slUtil.asSafeTypeValue(elm.getAttribute("length"), true),
														elm.getAttribute("rel"));
		}
		return null;
	}
}
