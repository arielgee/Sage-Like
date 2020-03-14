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

		// if date was not found in the standed XML tags (baseSelectorSuffixes) get the date from the first
		// feed item (fallbackSelector) in the XML.
		// Example:
		//		If fallbackSelector = "item"
		// 		then selectorSuffixes[1] = " > modified"
		//		and fallbackSelectorSuffixes[1] = " > item > modified"
		const selectorSuffixes = [ " > lastBuildDate", " > modified", " > updated", " > date", " > pubDate" ];
		const fallbackSelectorSuffixes = selectorSuffixes.map(s => " > " + fallbackSelector + s);

		let elmLastUpdate, txtLastUpdateVal = "", dateVal = NaN;

		for (let selector of selectorSuffixes) {

			elmLastUpdate = doc.querySelector(selectorPrefix + selector);

			if(elmLastUpdate) {
				txtLastUpdateVal = elmLastUpdate.textContent.replace(/\ Z$/, "");
				dateVal = (new Date(txtLastUpdateVal));
				break;
			}
		}

		if(isNaN(dateVal)) {
			for (let selector of fallbackSelectorSuffixes) {

				elmLastUpdate = doc.querySelector(selectorPrefix + selector);

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
	_getFeedItemLastUpdate(item) {

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let elmLastUpdated, txtLastUpdatedVal = "",  dateVal = NaN;

		for (let selector of selectores) {

			elmLastUpdated = item.querySelector(selector);
			if(elmLastUpdated) {
				txtLastUpdatedVal = elmLastUpdated.textContent.replace(/\ Z$/, "");
				dateVal = (new Date(txtLastUpdatedVal));
				break;
			}
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

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let ary = Array.prototype.slice.call(feeder, 0);

		if(ary[0] !== undefined) {

			for (let selector of selectores) {
				if(ary[0].querySelector(selector) !== null) {

					ary.sort((a, b) => {
						let aNode = a.querySelector(selector);
						let bNode = b.querySelector(selector);
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
