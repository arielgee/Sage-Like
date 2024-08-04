"use strict";

class FeedFactory {

	//////////////////////////////////////////
	static createFromSource(feedText, feedUrl) {

		if(feedText.match(g_feed.regexpXMLFormat)) {

			return this.#_createXmlFeed(feedText, feedUrl);

		} else if(feedText.match(g_feed.regexpJSONFormat)) {

			return this.#_createJsonFeed(feedText, feedUrl);

		} else {
			//console.log("[Sage-Like]", "Parser error at " + feedUrl, "- Feed format is neither XML nor JSON.");
			throw new Error("Feed format is neither XML nor JSON.");
		}
	}

	//////////////////////////////////////////
	static createFromStandard(feedStd, feedUrl) {

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
	static #_createXmlFeed(feedXmlText, feedUrl) {

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

		let xmlDoc;
		let parserError = true;		// pessimistic

		// Maximum of 2 parsing attempts. If first attempt fails then try again after removing/fixing common XML issues.
		for(let attempt=2; attempt>0; --attempt) {

			//	1.	This line is the one that throw to the console the log line 'XML Parsing Error: not well-formed' at
			//		the location of: 'moz-extension://66135a72-02a1-4a68-a040-60511bfea6a2/sidebar/panel.html'.
			//	2.	Firefox v73 has no support for XML 1.1.
			xmlDoc = g_feed.domParser.parseFromString(feedXmlText, "text/xml");

			// returns 'parsererror' if XML is not well-formed
			if(xmlDoc.documentElement.nodeName !== "parsererror") {
				parserError = false;
				break;
			}

			if(attempt > 1) {
				feedXmlText = this.#_fixXMLParsingErrors(feedXmlText, xmlVersion);
			}
		}

		if(parserError === true) {

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
	static #_createJsonFeed(feedJsonText, feedUrl) {

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
	static #_fixXMLParsingErrors(xmlText, xmlVersion) {

		// if neither version then String.replace("", "") will do noting
		let reXMLInvalidChars = (xmlVersion === "1.0") ? g_feed.regexpXML10InvalidChars : ( (xmlVersion === "1.1") ? g_feed.regexpXML11InvalidChars : "" );

		// try to avoid stupid XML/RSS Parsing Errors
		return xmlText
			.replace(g_feed.regexpXMLWhiteSpaceStart, "")								// XML declaration (prolog) not at start of document
			.replace(g_feed.regexpJunkAfterXMLDocElement, "$1")							// junk after document element
			.replace(UnknownXMLNamedEntities.search, UnknownXMLNamedEntities.replacer)	// replace HTML5 named entities to HEX entities
			.replace(reXMLInvalidChars, "");											// remove invalid characters
	}
}
