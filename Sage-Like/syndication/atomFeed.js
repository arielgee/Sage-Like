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
			this._feedData.webPageUrl = this.#_getWebPageUrl(this._feedXmlDoc);
		} catch (error) {
			console.log("[Sage-Like]", "getFeedData error", error);
			this._feedData.errorMsg = error.message;
		}
		return this._feedData;
	}

	//////////////////////////////////////////
	getFeedItems(feedData, feedMaxItems = 0, withAttachments = false) {

		let feedItemList = [];

		if(feedData.standard !== SyndicationStandard.Atom) {
			console.log("[Sage-Like]", this.className + ": Syndication standard mismatch");
			return feedItemList;
		}

		//console.log("[Sage-Like]", "Feed: Atom", "v" + (feedData.feeder.getAttribute("version") || "?"));

		feedData.feeder = feedData.feeder.querySelectorAll("entry");

		let item, feedItemUrl, feedItem, elmLinks, feedItemAtt;
		let feederLen = ( feedMaxItems === 0 ? feedData.feeder.length : Math.min(feedMaxItems, feedData.feeder.length) );

		for(let i=0; i<feederLen; i++) {

			item = feedData.feeder[i];
			feedItemUrl = this.#_getFeedItemUrl(item, feedData.webPageUrl);

			if(!!feedItemUrl) {
				feedItem = this._createSingleListItemFeed(item.querySelector("title"),
															this._getFeedItemDescription(item),
															this._getFeedItemHtmlContent(item),
															feedItemUrl.stripHtmlTags(),
															this._getFeedItemLastUpdate(item),
															this._getFeedItemImageUrl(item));

				if (!!feedItem) {

					if(withAttachments) {

						elmLinks = item.querySelectorAll("link[href][rel=enclosure],link[href][rel=related]");	// selector duplicated in #_getFeedItemUrl()

						for(let j=0, jLen=elmLinks.length; j<jLen; j++) {
							if( !!(feedItemAtt = this.#_getFeedItemLinkAsAttObject(elmLinks[j])) ) {
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
	#_getWebPageUrl(doc) {

		let url = null;
		let node = doc.querySelector("feed > link[href][rel=alternate]") ||
					doc.querySelector("feed > link[href]:not([rel])") ||
					doc.querySelector("feed > id");

		if(!!node) {
			url = slUtil.validURL(node.hasAttribute("href") ? node.getAttribute("href") : node.textContent);
		}
		return !!url ? url.toString() : "";
	}

	//////////////////////////////////////////
	#_getFeedItemUrl(item, urlBase) {

		let elm = item.querySelector("link[href]:not([rel])") ||
					item.querySelector("link[href][rel=alternate]") ||
					item.querySelector("link[href]:not([rel=enclosure]):not([rel=related])") ||
					item.querySelector("id") ||				// one more WTF that use the <id> for the permalink to the page instead of <link>
					item.querySelector("link[href]");

		if(!!elm) {

			const funcValidURL = (u, b) => {
				if( !!slUtil.validURL(u) ) {
					return u;
				} else if( !!(u = slUtil.validRelativeURL(u, b)) ) {
					return u.toString();		// #_getFeedItemUrl returns a string
				}
				return null;
			};

			let url = elm.getAttribute("href");

			// if it's null it's most probably an <id>
			if(url !== null) {
				url = funcValidURL(url, urlBase);
				if( !!url ) {
					return url;
				}
			}

			url = funcValidURL(elm.textContent, urlBase);	// when link comes from <id>
			if( !!url ) {
				return url;
			}
		}

		// try to get first enclosure if any
		elm = item.querySelector("link[href][rel=enclosure],link[href][rel=related]");	// selector duplicated in getFeedItems()
		if(!!elm) {
			return elm.getAttribute("href");
		}

		return "";
	}

	//////////////////////////////////////////
	#_getFeedItemLinkAsAttObject(elm) {

		let url = slUtil.validURL(new URL(elm.getAttribute("href"), this._feedUrl));

		if(!!url) {

			let title = elm.getAttribute("title");
			if(!!!title) {
				title = url.pathname.replace(/(\/|%2F)+$/i, "").split(/\/|%2F/i).pop();
			}
			return this._createFeedItemAttachmentObject(title, url,
														slUtil.asSafeTypeValue(elm.getAttribute("type")),
														slUtil.asSafeTypeValue(elm.getAttribute("length"), true),
														elm.getAttribute("rel"));
		}
		return null;
	}
}
