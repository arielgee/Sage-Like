"use strict";

/////////////////////////////////////////////////////////////////////////////////////////////
const SyndicationStandard = Object.freeze({
	invalid: "n/a",
	RSS: "RSS",
	RDF: "RDF",
	Atom: "Atom",
	JSON: "JSON",
});

/////////////////////////////////////////////////////////////////////////////////////////////
const g_feed = (function() {
	return Object.freeze({
		// Regular Expression Constants
		regexpXMLFormat:				/^\s*(<!--.*?-->)?\s*<(\?xml|rss|rdf|feed)\b/i,							// Possible comment, XML prolog for RSS/RDF/Atom or xml without prolog
		regexpJSONFormat: 				/^\s*\{/i,																// JSON bracket for jsonfeed
		regexpXMLVersion: 				/^\s*<\?xml\b[^>]*\bversion\s*=\s*["']([^"']*)["'][^>]*?>/i,
		regexpXMLEncoding:				/^\s*<\?xml\b[^>]*\bencoding\s*=\s*["']([^"']*)["'][^>]*?>/i,
		regexpXMLWhiteSpaceStart:		/^\s+/,																	// XML declaration (prolog) not at start of document
		regexpJunkAfterXMLDocElement:	/(<\/(rss|feed|(([a-zA-Z0-9-_.]+:)?RDF))>)[\S\s]+/,						// junk after document element
		regexpXMLParseError:			/^(.*)[\s\S]*(line number \d+, column \d+):.*/i,						// the first line and the error location
		regexpXML10InvalidChars:		/[^\u0009\r\n\u0020-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug,	// xml 1.0	-	https://www.w3.org/TR/REC-xml/#charsets
		regexpXML11InvalidChars:		/[^\u0001-\uD7FF\uE000-\uFFFD\ud800\udc00-\udbff\udfff]+/ug,			// xml 1.1	-	https://www.w3.org/TR/2006/REC-xml11-20060816/#charsets

		domParser: new DOMParser(),
	});
})();

/////////////////////////////////////////////////////////////////////////////////////////////
class FeedData {
	constructor() {
		this.standard = SyndicationStandard.invalid;
		this.feeder = null;
		this.title = "";
		this.imageUrl = "";
		this.description = "";
		this.lastUpdated = 0;
		this.itemCount = 0;
		this.webPageUrl = "";
		this.errorMsg = "";
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class XmlFeedData extends FeedData {
	constructor() {
		super();
		this.xmlVersion = "1.0";
		this.xmlEncoding = "UTF-8";
		super.feeder = {};
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class JsonFeedData extends FeedData {
	constructor() {
		super();
		this.jsonVersion = "";
		this.expired = false;
		super.feeder = [];
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class SyndicationError extends Error {
	#_httpResponseStatus = 0;
	constructor(message, errInfo = undefined) {
		let status = 0;
		if(!!errInfo) {
			if(errInfo instanceof Error) {
				message += " [ " + errInfo.message + " ]";
			} else if(typeof(errInfo) === "string") {
				message += " [ " + errInfo + " ]";
			} else if(typeof(errInfo) === "object" && errInfo.hasOwnProperty("status") && errInfo.hasOwnProperty("statusText")) {
				status = errInfo.status;
				message += ` [ ${status}: ${errInfo.statusText} ]`;
			}
		}
		super(message);
		this.#_httpResponseStatus = status;
	}
	httpResponseStatus() {
		return this.#_httpResponseStatus;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class AbortDiscovery {
	#_abort = false;
	fetchControllers = [];
	abort() {
		this.#_abort = true;
		for(let i=0, len=this.fetchControllers.length; i<len; i++) {
			this.fetchControllers[i].abort();
		}
	}
	get isAborted() {
		return this.#_abort;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////
class SigninCredential {
	constructor(...args) {
		if(args.length === 0) {
			this.initialized = false;		// The fetch's `options` object will NOT have an `Authorization` header.
		} else {

			let singleObj = (args.length === 1) && (typeof(args[0]) === "object");

			if(singleObj && Object.keys(args[0]).length === 0) {
				this.username = "";
				this.password = "";
			} else if(singleObj && args[0].hasOwnProperty("username") && args[0].hasOwnProperty("password")) {
				this.username = args[0].username;
				this.password = args[0].password;
			} else if((args.length === 2) && (typeof(args[0]) === "string") && (typeof(args[1]) === "string")) {
				this.username = args[0];
				this.password = args[1];
			} else {
				throw Error("Invalid constructor parameter(s).");
			}
			this.initialized = true;		// The fetch's `options` object will have an `Authorization` header with provided username/password values.
		}
	}
	setDefault() {
		this.username = "";
		this.password = "";
		this.initialized = true;
	}
}
