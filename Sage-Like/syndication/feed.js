"use strict";

let g_feed = (function() {

	const domParser = new DOMParser();

	// Regular Expression Constants
	const regexpXMLFormat = /^\s*<(\?xml|rss|rdf|feed)\b/i;		// XML prolog for RSS/RDF/Atom or xml without prolog
	const regexpJSONFormat = /^\s*{/i;							// JSON bracket for jsonfeed

	const regexpXMLVersion = /^\s*<\?xml\b[^>]*\bversion\s*=\s*["']([^"']*)["'][^>]*?>/i;
	const regexpXMLEncoding = /^\s*<\?xml\b[^>]*\bencoding\s*=\s*["']([^"']*)["'][^>]*?>/i;

	const regexpXMLWhiteSpaceStart = /^\s+/;														// XML declaration (prolog) not at start of document
	const regexpJunkAfterXMLDocElement = /(<\/(rss|feed|(([a-zA-Z0-9-_.]+:)?RDF))>)[\S\s]+/;		// junk after document element

	const regexpXMLParseError = /^(.*)[\s\S]*(line number \d+, column \d+):.*/i;			// the first line and the error location

	const regexpXML10InvalidChars = /[^\u0009\r\n\u0020-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug;	// xml 1.0	-	https://www.w3.org/TR/REC-xml/#charsets
	const regexpXML11InvalidChars = /[^\u0001-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug;	// xml 1.1	-	https://www.w3.org/TR/2006/REC-xml11-20060816/#charsets

	return {
		domParser: domParser,
		regexpXMLFormat: regexpXMLFormat,
		regexpJSONFormat: regexpJSONFormat,
		regexpXMLVersion: regexpXMLVersion,
		regexpXMLEncoding: regexpXMLEncoding,
		regexpXMLWhiteSpaceStart: regexpXMLWhiteSpaceStart,
		regexpJunkAfterXMLDocElement: regexpJunkAfterXMLDocElement,
		regexpXMLParseError: regexpXMLParseError,
		regexpXML10InvalidChars: regexpXML10InvalidChars,
		regexpXML11InvalidChars: regexpXML11InvalidChars,
	}
})();

class Feed {
	// publicClassField = 1;		// support starts at Firefox v69
	constructor(feedUrl) {
		if (new.target.name === "Feed") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}
		this._className = new.target.name;
		this._feedUrl = feedUrl;
	}

	//////////////////////////////////////////
	get className() { return this._className; }

	//////////////////////////////////////////
	dispose() {
		this._feedUrl = null;
	}

	//////////////////////////////////////////
	static factoryCreateBySrc(feedText, feedUrl) {

		if(feedText.match(g_feed.regexpXMLFormat)) {

			return this._factoryCreateXmlFeed(feedText, feedUrl);

		} else if(feedText.match(g_feed.regexpJSONFormat)) {

			return this._factoryCreateJsonFeed(feedText, feedUrl);

		} else {
			//console.log("[Sage-Like]", "Parser error at " + feedUrl, "- Feed format is neither XML nor JSON.");
			throw new Error("Feed format is neither XML nor JSON.");
		}
	}

	//////////////////////////////////////////
	static factoryCreateByStd(feedStd, feedUrl) {

		if(feedStd === SyndicationStandard.RSS) {
			return new RssFeed(feedUrl);
		} else if(feedStd === SyndicationStandard.RDF) {
			return new RdfFeed(feedUrl);
		} else if(feedStd === SyndicationStandard.Atom) {
			return new AtomFeed(feedUrl);
		} else if(feedStd === SyndicationStandard.JSON) {
			return new JsonFeed(feedUrl);
		} else {
			return null;
		}
	}

	//////////////////////////////////////////
	static _factoryCreateXmlFeed(feedXmlText, feedUrl) {

		let xmlVersion = "";
		let xmlEncoding = "";

		// try to get XML version from the XML prolog
		let test = feedXmlText.match(g_feed.regexpXMLVersion);
		if(test && test[1]) {
			xmlVersion = test[1];
		}

		// try to get XML encoding from the XML prolog
		test = feedXmlText.match(g_feed.regexpXMLEncoding);
		if(test && test[1]) {
			xmlEncoding = test[1];
		}

		feedXmlText = this._removeXMLParsingErrors(feedXmlText, xmlVersion);

		//	1.	This line is the one that throw to the console the log line 'XML Parsing Error: not well-formed' at
		//		the location of: 'moz-extension://66135a72-02a1-4a68-a040-60511bfea6a2/sidebar/panel.html'.
		//	2.	Firefox v73 has no support for XML 1.1.
		let xmlDoc = g_feed.domParser.parseFromString(feedXmlText, "text/xml");

		// return if XML not well-formed
		if(xmlDoc.documentElement.nodeName === "parsererror") {

			console.log("[Sage-Like]", "Parser error at " + feedUrl, "\n" + xmlDoc.documentElement.textContent);

			// the first line and the error location
			let found = xmlDoc.documentElement.textContent.match(g_feed.regexpXMLParseError);
			throw new Error((found[1] ? found[1] + ". " : "") + (found[2] ? found[2] : ""));
		}


		if(xmlDoc.documentElement.localName === "rss") {					// First lets try 'RSS'

			return new RssFeed(feedUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else if(xmlDoc.documentElement.localName === "RDF") {				// Then let's try 'RDF (RSS) 1.0'

			return new RdfFeed(feedUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else if(xmlDoc.documentElement.localName === "feed") {			// FInally let's try 'Atom'

			return new AtomFeed(feedUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else {

			throw new Error("RSS feed not identified in document");
		}
	}

	//////////////////////////////////////////
	static _factoryCreateJsonFeed(feedJsonText, feedUrl) {

		try {
			let oJson = JSON.parse(feedJsonText);

			if(!!!oJson.version) throw new Error("Invalid jsonfeed, top-level string 'version:' is undefined.");
			if(!oJson.version.startsWith("https://jsonfeed.org/version/")) throw new Error("invalid jsonfeed, unexpected version value. '" + oJson.version + "'");

			return new JsonFeed(feedUrl, oJson);

		} catch (error) {
			console.log("[Sage-Like]", "Parser error at " + feedUrl, "\n" + error.message);
			throw new Error(error.message);
		}
	}

	//////////////////////////////////////////
	static _removeXMLParsingErrors(xmlText, xmlVersion) {

		// if neither version then String.replace("", "") will do noting
		let reXMLInvalidChars = (xmlVersion === "1.0") ? g_feed.regexpXML10InvalidChars : ( (xmlVersion === "1.1") ? g_feed.regexpXML11InvalidChars : "" );

		// try to avoid stupid XML/RSS Parsing Errors
		return xmlText
			.replace(g_feed.regexpXMLWhiteSpaceStart, "")			// XML declaration (prolog) not at start of document
			.replace(g_feed.regexpJunkAfterXMLDocElement, "$1")		// junk after document element
			.unknownNamedEntityInXMLToDecimal()
			.replace(reXMLInvalidChars, "");						// remove invalid characters
	}

	//////////////////////////////////////////
	_createFeedItemObject(title, desc, content, url, lastUpdated, imageUrl) {
		return {
			title: title,
			description: desc,
			htmlContent: content,
			url: url,
			lastUpdated: lastUpdated,
			image: imageUrl,
			attachments: [],
		};
	}

	//////////////////////////////////////////
	_createFeedItemAttachmentObject(title, url, mimeType, byteSize, rel) {
		return {
			title: title,
			url: url,
			mimeType: !!mimeType ? mimeType : "",
			byteSize: (!!byteSize && !isNaN(byteSize)) ? Number(byteSize) : 0,
			rel: !!rel ? rel : "",
		};
	}
}
