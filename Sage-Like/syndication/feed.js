"use strict";

const g_domParser = new DOMParser();

const g_regexpXMLFormat = /^\s*<(\?xml|rss|rdf|feed)\b/i;		// XML prolog for RSS/RDF/Atom or xml without prolog
const g_regexpJSONFormat = /^\s*{/i;							// JSON bracket for jsonfeed

const g_regexpXMLVersion = /^\s*<\?xml\b[^>]*\bversion\s*=\s*["']([^"']*)["'][^>]*?>/i;
const g_regexpXMLEncoding = /^\s*<\?xml\b[^>]*\bencoding\s*=\s*["']([^"']*)["'][^>]*?>/i;

const g_regexpXMLWhiteSpaceStart = /^\s+/;														// XML declaration (prolog) not at start of document
const g_regexpJunkAfterXMLDocElement = /(<\/(rss|feed|(([a-zA-Z0-9-_.]+:)?RDF))>)[\S\s]+/;		// junk after document element

const g_regexpXMLParseError = /^(.*)[\s\S]*(line number \d+, column \d+):.*/i;			// the first line and the error location


class Feed {
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
	static factoryCreateFeed(feedText, logUrl) {

		if(feedText.match(g_regexpXMLFormat)) {

			return this._factoryCreateXmlFeed(feedText, logUrl);

		} else if(feedText.match(g_regexpJSONFormat)) {

			return this._factoryCreateJsonFeed(feedText, logUrl);

		} else {

			let errMsg = "Feed format is neither XML nor JSON.";
			console.log("[Sage-Like]", "Parser Error at " + logUrl, "- " + errMsg);
			throw new Error(errMsg);
		}
	}

	//////////////////////////////////////////
	static _factoryCreateXmlFeed(feedXmlText, logUrl) {

		let xmlVersion = "";
		let xmlEncoding = "";

		// try to get XML version from the XML prolog
		let test = feedXmlText.match(g_regexpXMLVersion);
		if(test && test[1]) {
			xmlVersion = test[1];
		}

		// try to get XML encoding from the XML prolog
		test = feedXmlText.match(g_regexpXMLEncoding);
		if(test && test[1]) {
			xmlEncoding = test[1];
		}

		feedXmlText = this._removeXMLParsingErrors(feedXmlText, xmlVersion);

		//	1.	This line is the one that throw to the console the log line 'XML Parsing Error: not well-formed' at
		//		the location of: 'moz-extension://66135a72-02a1-4a68-a040-60511bfea6a2/sidebar/panel.html'.
		//	2.	Firefox v73 has no support for XML 1.1.
		let xmlDoc = g_domParser.parseFromString(feedXmlText, "text/xml");

		// return if XML not well-formed
		if(xmlDoc.documentElement.nodeName === "parsererror") {

			console.log("[Sage-Like]", "Parser Error at " + logUrl, "\n" + xmlDoc.documentElement.textContent);

			// the first line and the error location
			let found = xmlDoc.documentElement.textContent.match(g_regexpXMLParseError);
			throw new Error((found[1] ? found[1] + ". " : "") + (found[2] ? found[2] : ""));
		}


		if(xmlDoc.documentElement.localName === "rss") {					// First lets try 'RSS'

			return new RssFeed(logUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else if(xmlDoc.documentElement.localName === "RDF") {				// Then let's try 'RDF (RSS) 1.0'

			return new RdfFeed(logUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else if(xmlDoc.documentElement.localName === "feed") {			// FInally let's try 'Atom'

			return new AtomFeed(logUrl, xmlDoc, xmlVersion, xmlEncoding);

		} else {

			throw new Error("RSS feed not identified in document");
		}
	}

	//////////////////////////////////////////
	static _factoryCreateJsonFeed(feedJsonText, logUrl) {

		try {
			let oJson = JSON.parse(feedJsonText);

			if(!!!oJson.version) throw new Error("Invalid jsonfeed, top-level string 'version:' is undefined.");
			if(!oJson.version.startsWith("https://jsonfeed.org/version/")) throw new Error("invalid jsonfeed, unexpected version value. '" + oJson.version + "'");

			return new JsonFeed(logUrl, oJson);

		} catch (error) {
			console.log("[Sage-Like]", "Parser Error at " + logUrl, "\n" + error.message);
			throw new Error(error.message);
		}
	}

	//////////////////////////////////////////
	static _removeXMLParsingErrors(xmlText, xmlVersion) {

		// try to avoid stupid XML/RSS Parsing Errors
		xmlText = xmlText.replace(g_regexpXMLWhiteSpaceStart, "");				// XML declaration (prolog) not at start of document
		xmlText = xmlText.replace(g_regexpJunkAfterXMLDocElement, "$1");		// junk after document element

		// remove invalid characters
		if(xmlVersion === "1.0") {
			// xml 1.0	-	https://www.w3.org/TR/REC-xml/#charsets
			xmlText = xmlText.replace(/[^\u0009\r\n\u0020-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug, "");
		} else if(xmlVersion === "1.1") {
			// xml 1.1	-	https://www.w3.org/TR/2006/REC-xml11-20060816/#charsets
			xmlText = xmlText.replace(/[^\u0001-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug, "");
		}
		return xmlText;
	}

	//////////////////////////////////////////
	_createFeedItemObject(title, desc, url, lastUpdated) {
		return {
			title: title,
			desc: desc,
			url: url,
			lastUpdated: lastUpdated,
		};
	}
}