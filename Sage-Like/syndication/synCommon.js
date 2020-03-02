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
		this._standard = SyndicationStandard.invalid;
		this._feeder = null;
		this._title = "";
		this._imageUrl = "";
		this._description = "";
		this._lastUpdated = 0;
		this._itemCount = 0;
		this._errorMsg = "";
	}
}

////////////////////////////////////////////////////////////////////////////////////
class XmlFeedData extends FeedData {
	constructor() {
		this._xmlVersion = "1.0";
		this._xmlEncoding = "UTF-8";
		super._feeder = {};
	}
}

////////////////////////////////////////////////////////////////////////////////////
class JsonFeedData extends FeedData {
	constructor() {
		this.jsonVersion = "";
		super._feeder = [];
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
