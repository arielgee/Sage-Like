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
	_getFeedLastUpdate(doc, selectorPrefix, fallbackSelector) {

		// if date was not found in the standard XML tags (selectorSuffixes) get the date from the first
		// feed item (fallbackSelector) in the XML.
		// Example:
		//		If fallbackSelector = "item"
		// 		then selectorSuffixes[1] = " > modified"
		//		and fallbackSelectorSuffixes[1] = " > item > modified"
		const selectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];
		const fallbackSelectorSuffixes = selectorSuffixes.map(s => " > " + fallbackSelector + s);

		let elmLastUpdate, txtLastUpdateVal = "";
		let i, len, dateVal = NaN;

		for(i=0, len=selectorSuffixes.length; i<len; i++) {

			elmLastUpdate = doc.querySelector(selectorPrefix + selectorSuffixes[i]);

			if(elmLastUpdate) {
				txtLastUpdateVal = elmLastUpdate.textContent.replace(/\ Z$/, "");
				dateVal = (new Date(txtLastUpdateVal));
				break;
			}
		}

		if(isNaN(dateVal)) {
			for(i=0, len=fallbackSelectorSuffixes.length; i<len; i++) {

				elmLastUpdate = doc.querySelector(selectorPrefix + fallbackSelectorSuffixes[i]);

				if(elmLastUpdate) {
					dateVal = (new Date(elmLastUpdate.textContent.replace(/\ Z$/, "")));
					break;
				}
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

		let desc = item.querySelector("description,content,summary");

		// look for <content:encoded>
		if(!!!desc || desc.textContent.length === 0) {
			desc = (item.getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded"))[0];
		}
		return desc;
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
	_createSingleListItemFeed(elmTitle, elmDesc, strUrl, valLastUpdated) {

		try {
			new URL(strUrl);
		} catch (error) {
			console.log("[Sage-Like]", "URL validation", error);
			return null;
		}

		return this._createFeedItemObject(	elmTitle ? elmTitle.textContent.stripHtmlTags() : "",
											elmDesc ? elmDesc.textContent.stripUnsafeHtmlComponents() : "",
											strUrl.stripHtmlTags(),
											valLastUpdated);
	}
}
