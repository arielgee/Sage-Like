// delete this file
class DisBase {
	constructor(source = {}) {
		if (new.target.name === "DisBase") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}

		({
			href: this._href = "",
			doc: this._document = undefined,
		} = source);
	}

	static match(source) {}
}

class XxxDis extends DisBase {
	constructor(source) {
		super(source);
	}

	static match(source) {
		let regExpMatch = /A+/;
		return ( ((source.href !== "") && regExpMatch.test(source.href)) ? new this(source) : null );
	}
}

class YyyDis extends DisBase {
	constructor(source) {
		super(source);
	}

	static match(source) {
		let regExpMatch = /C+/;
		return ( ((source.href !== "") && regExpMatch.test(source.href)) ? new this(source) : null );
	}
}

class Dis {
	constructor() {
		let xxx = "---CCC-AAA--";
		this._specificDiscoveries = [
			XxxDis.match({ href: xxx}),
			YyyDis.match({ href: xxx}),
		];
	}

	discover() {
		for(let i=0, len=this._specificDiscoveries.length; i<len; i++) {
			if( !!this._specificDiscoveries[i] ) {
				console.log("[Sage-Like]", this._specificDiscoveries[i]._href);
			}
		}
	}
}

(new Dis).discover();

