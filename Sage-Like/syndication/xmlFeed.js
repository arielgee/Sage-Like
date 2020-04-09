"use strict";

class XmlFeed extends Feed {
	constructor(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding) {
		if (new.target.name === "XmlFeed") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		super(feedUrl);
		this._feedData = null;
		this._feedXmlDoc = feedXmlDoc;
		this._xmlVersion = xmlVersion;
		this._xmlEncoding = xmlEncoding;
	}

	//////////////////////////////////////////
	dispose() {
		super.dispose();
		this._feedData = null;
		this._feedXmlDoc = null;
		this._xmlVersion = null;
		this._xmlEncoding = null;
	}

	//////////////////////////////////////////
	_initFeedData() {
		this._feedData = new XmlFeedData();
		if(!!this._xmlVersion) this._feedData.xmlVersion = this._xmlVersion;
		if(!!this._xmlEncoding) this._feedData.xmlEncoding = this._xmlEncoding;
	}

	//////////////////////////////////////////
	_getNodeTextContent(doc, selector, fallbackSelector) {
		let node = doc.querySelector(selector);

		if(!!node) {
			return node.textContent.stripHtmlTags()
		} else if(!!fallbackSelector) {
			node = doc.querySelector(fallbackSelector);
			return (node ? node.textContent.stripHtmlTags() : "");
		} else {
			return "";
		}
	}

	//////////////////////////////////////////
	_getFeedLastUpdate(doc, selectorPrefix, fallbackSelectorPrefix) {

		const selectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];

		let dateVal = NaN;
		let elmLastUpdate, txtLastUpdateVal = "";

		let feedSelectorString = selectorSuffixes.map(s => selectorPrefix + s).join(",");
		elmLastUpdate = doc.querySelector(feedSelectorString);

		if(!!elmLastUpdate) {
			txtLastUpdateVal = elmLastUpdate.textContent.replace(/\ Z$/, "");
			dateVal = (new Date(txtLastUpdateVal));
		}

		if(isNaN(dateVal)) {

			let feedItemSelectorString = selectorSuffixes.map(s => fallbackSelectorPrefix + s).join(",");
			let dates = Array.from(doc.querySelectorAll(feedItemSelectorString)).map(x => new Date(x.textContent.replace(/\ Z$/, "")));

			if(dates.length > 0) {
				dateVal = dates.reduce((prv, cur) => prv > cur ? prv : cur);
			}
		}

		if(isNaN(dateVal)) {
			return txtLastUpdateVal.length > 0 ? txtLastUpdateVal : slUtil.getCurrentLocaleDate();	// final fallback
		} else {
			return dateVal;
		}
	}

	//////////////////////////////////////////
	_getFeedItemDescription(item) {

		let elmDesc;
		let funcGet = [
			this._xmlFeed_getFeedItemDescription,
			this._xmlFeed_getFeedItemContentEncoded,		// look for <content:encoded>
			this._xmlFeed_getFeedItemContentTypeHtml,		// look for <content type=html>
		];

		for(let i=0, len=funcGet.length; i<len; i++) {

			elmDesc = funcGet[i](item);

			if( !!elmDesc && elmDesc.textContent.length > 0) {
				return elmDesc;
			}
		}
		return null;
	}

	//////////////////////////////////////////
	_getFeedItemHtmlContent(item) {

		let funcGet = [
			this._xmlFeed_getFeedItemContentTypeHtml,		// look for <content type=html>
			this._xmlFeed_getFeedItemContentEncoded,		// look for <content:encoded>
			this._xmlFeed_getFeedItemDescription,
		];

		let elmContent;
		let elmAcquired = null;
		let foundedElmCount = 0;

		// scan ALL the alternatives in reverse order, in contrast to _getFeedItemDescription().
		// If the acquired element is the only one existing then assume _getFeedItemDescription() got it and return empty null
		for(let i=0, len=funcGet.length; i<len; i++) {

			elmContent = funcGet[i](item);

			if(!!elmContent && elmContent.textContent.length > 0) {
				if(!!!elmAcquired) {
					elmAcquired = elmContent;
				}
				foundedElmCount++;
			}
		}
		return (foundedElmCount > 1) ? elmAcquired : null;
	}

	//////////////////////////////////////////
	_getFeedItemLastUpdate(item) {

		let dateVal = NaN;
		let txtLastUpdatedVal = "";
		let elmLastUpdated = item.querySelector("pubDate,modified,updated,published,created,issued,date");

		if(!!elmLastUpdated) {
			txtLastUpdatedVal = elmLastUpdated.textContent.replace(/\ Z$/, "");
			dateVal = (new Date(txtLastUpdatedVal));
		}

		if(isNaN(dateVal)) {
			txtLastUpdatedVal = txtLastUpdatedVal.stripHtmlTags();
			return txtLastUpdatedVal.length > 0 ? txtLastUpdatedVal : slUtil.getCurrentLocaleDate();	// fallback
		} else {
			return dateVal;
		}
	}

	//////////////////////////////////////////
	_sortFeederByDate(feeder) {

		const selectors = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let ary = Array.prototype.slice.call(feeder, 0);

		if(ary[0] !== undefined) {

			for(let i=0, len=selectors.length; i<len; i++) {
				if(ary[0].querySelector(selectors[i]) !== null) {

					ary.sort((a, b) => {
						let aNode = a.querySelector(selectors[i]);
						let bNode = b.querySelector(selectors[i]);
						let d1 = aNode ? Date.parse(aNode.textContent) : 0;
						let d2 = bNode ? Date.parse(bNode.textContent) : 0;
						return d2 - d1;
					});

					break;
				}
			}
		}
		return ary;
	}

	//////////////////////////////////////////
	_createSingleListItemFeed(elmTitle, elmDesc, elmContent, strUrl, valLastUpdated) {

		let oErr = {};
		if(!!!slUtil.validURL(strUrl, oErr)) {
			console.log("[Sage-Like]", "URL validation", oErr.error);
			return null;
		}

		return this._createFeedItemObject(	!!elmTitle ? elmTitle.textContent.stripHtmlTags() : "",
											!!elmDesc ? elmDesc.textContent.stripUnsafeHtmlComponents() : "",
											!!elmContent ? elmContent.textContent.stripUnsafeHtmlComponents() : "",
											strUrl.stripHtmlTags(),
											valLastUpdated);
	}

	//////////////////////////////////////////
	_xmlFeed_getFeedItemDescription(item) {
		return item.querySelector("description,content:not([type=html]):not([type=xhtml]),summary");
	}

	//////////////////////////////////////////
	_xmlFeed_getFeedItemContentEncoded(item) {
		return (item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded"))[0];
	}

	//////////////////////////////////////////
	_xmlFeed_getFeedItemContentTypeHtml(item) {
		return item.querySelector("content[type=html],content[type=xhtml]");
	}
}
