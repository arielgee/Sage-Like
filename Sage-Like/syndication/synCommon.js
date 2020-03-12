"use strict";

let SyndicationStandard = Object.freeze({
	invalid: "n/a",
	RSS: "RSS",
	RDF: "RDF",
	Atom: "Atom",
	JSON: "JSON",
});

////////////////////////////////////////////////////////////////////////////////////
class FeedData {
	constructor() {
		this.standard = SyndicationStandard.invalid;
		this.feeder = null;
		this.title = "";
		this.imageUrl = "";
		this.description = "";
		this.lastUpdated = 0;
		this.itemCount = 0;
		this.errorMsg = "";
	}
}

////////////////////////////////////////////////////////////////////////////////////
class XmlFeedData extends FeedData {
	constructor() {
		super();
		this.xmlVersion = "1.0";
		this.xmlEncoding = "UTF-8";
		super.feeder = {};
	}
}

////////////////////////////////////////////////////////////////////////////////////
class JsonFeedData extends FeedData {
	constructor() {
		super();
		this.jsonVersion = "";
		super.feeder = [];
	}
}

////////////////////////////////////////////////////////////////////////////////////
class SyndicationError extends Error {
	constructor(message, errInfo = undefined) {
		if(errInfo) {
			if(errInfo instanceof Error) {
				message += " [ " + errInfo.message + " ]";
			} else if(typeof(errInfo) === "string") {
				message += " [ " + errInfo + " ]";
			}
		}
		super(message);
	}
}

////////////////////////////////////////////////////////////////////////////////////
class AbortDiscovery {
	constructor() {
		this._abort = false;
	}
	abort() {
		this._abort = true;
	}
	get isAborted() {
		return this._abort;
	}
}
