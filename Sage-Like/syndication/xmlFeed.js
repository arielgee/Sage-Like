"use strict";

class XmlFeed extends Feed {
	constructor(feedUrl, feedXmlDoc, xmlVersion, xmlEncoding, fixableParseErrors) {
		if (new.target.name === "XmlFeed") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		super(feedUrl);
		this._feedData = null;
		this._feedXmlDoc = feedXmlDoc;
		this._xmlVersion = xmlVersion;
		this._xmlEncoding = xmlEncoding;
		this._fixableParseErrors = fixableParseErrors;
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
			return node.textContent.removeHTMLTags()
		} else if(!!fallbackSelector) {
			node = doc.querySelector(fallbackSelector);
			return (node ? node.textContent.removeHTMLTags() : "");
		} else {
			return "";
		}
	}

	//////////////////////////////////////////
	_getFeedLastUpdate(doc, selectorPrefix, fallbackSelectorPrefix) {

		const selectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];

		let numericDateVal = Global.DEFAULT_VALUE_OF_DATE;
		let elmLastUpdate, txtLastUpdateVal = "";

		let feedSelectorString = selectorSuffixes.map(s => selectorPrefix + s).join(",");
		elmLastUpdate = doc.querySelector(feedSelectorString);

		if(!!elmLastUpdate) {
			numericDateVal = slUtil.asSafeNumericDate( (txtLastUpdateVal = elmLastUpdate.textContent) );
		}

		if(numericDateVal > Global.DEFAULT_VALUE_OF_DATE) {
			return new Date(numericDateVal);
		}

		let feedItemSelectorString = selectorSuffixes.map(s => fallbackSelectorPrefix + s).join(",");
		numericDateVal = Array.from(doc.querySelectorAll(feedItemSelectorString))
							  .map(x => slUtil.asSafeNumericDate(x.textContent))
							  .reduce((prv, cur) => prv > cur ? prv : cur, Global.DEFAULT_VALUE_OF_DATE);

		if(numericDateVal > Global.DEFAULT_VALUE_OF_DATE) {
			return new Date(numericDateVal);
		} else {
			return txtLastUpdateVal.length > 0 ? txtLastUpdateVal : Global.DEFAULT_DATE();	// final fallback
		}
	}

	//////////////////////////////////////////
	_getFeedItemDescription(item) {

		let elmDesc;
		let funcGet = [
			this.#_xmlFeed_getFeedItemDescription,
			this.#_xmlFeed_getFeedItemContent,
			this.#_xmlFeed_getFeedItemSummary,
			this.#_xmlFeed_getFeedItemContentEncoded,		// look for <content:encoded>
			this.#_xmlFeed_getFeedItemContentTypeHtml,		// look for <content type=html>
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
			this.#_xmlFeed_getFeedItemContentTypeHtml,		// look for <content type=html>
			this.#_xmlFeed_getFeedItemContentEncoded,		// look for <content:encoded>
			this.#_xmlFeed_getFeedItemSummary,
			this.#_xmlFeed_getFeedItemContent,
			this.#_xmlFeed_getFeedItemDescription,
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

		let elmLastUpdated = item.querySelector("pubDate,modified,updated,published,created,issued,date");

		if(!!elmLastUpdated) {
			return new Date(slUtil.asSafeNumericDate(elmLastUpdated.textContent));
		} else {
			return Global.DEFAULT_DATE();	// fallback
		}
	}

	//////////////////////////////////////////
	_getFeedItemImageUrl(item) {

		let imageUrl;
		let funcGet = [
			this.#_xmlFeed_getFeedItemImageUrl,
			this.#_xmlFeed_getFeedItemMediaContentImageUrl,
		];

		for(let i=0, len=funcGet.length; i<len; i++) {

			imageUrl = (funcGet[i](item)).removeHTMLTags();

			if(imageUrl.length > 0) {
				return slUtil.validURL(imageUrl) ? imageUrl : "";
			}
		}
		return "";
	}

	//////////////////////////////////////////
	_createSingleListItemFeed(elmTitle, elmDesc, elmContent, strUrl, valLastUpdated, imageUrl) {

		let oErr = { error: null };
		if(!!!slUtil.validURL(strUrl, oErr)) {
			console.log("[Sage-Like]", "URL validation.", oErr.error.message);
			return null;
		}

		return this._createFeedItemObject(	!!elmTitle ? elmTitle.textContent.removeHTMLTags() : "",
											!!elmDesc ? elmDesc.textContent.removeUnsafeHTMLTags() : "",
											!!elmContent ? elmContent.textContent.removeUnsafeHTMLTags() : "",
											strUrl.removeHTMLTags(),
											valLastUpdated,
											imageUrl);
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemDescription(item) {
		return item.querySelector("description");
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemContent(item) {
		return item.querySelector("content:not([type=html]):not([type=xhtml])");
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemSummary(item) {
		return item.querySelector("summary");
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemContentEncoded(item) {
		return (item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded"))[0];	// look for <content:encoded>
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemContentTypeHtml(item) {
		return item.querySelector("content[type=html],content[type=xhtml]");
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemImageUrl(item) {
		const elmImage = item.querySelector("image");
		return !!elmImage ? elmImage.textContent : "";
	}

	//////////////////////////////////////////
	#_xmlFeed_getFeedItemMediaContentImageUrl(item) {
		const elmContent = (item.getElementsByTagNameNS("http://search.yahoo.com/mrss/", "content"))[0];	// look for <media:content>
		if(!!elmContent) {
			if(elmContent.getAttribute("medium") === "image") {
				const url = elmContent.getAttribute("url");
				return !!url ? url : "";
			}
		}
		return "";
	}
}
