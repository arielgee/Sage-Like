//////////////////////////////////////////////////////////////////////
class TestSpecificDiscovery extends WebsiteSpecificDiscoveryBase {
	constructor(source) {
		super(source, /\/localhost\/.*?\/?discovery-test\.html$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {

		let found, urls = [];
		let scriptElements = this._document.getElementsByTagName("script");

		for(let i=0, len=scriptElements.length; i<len; i++) {
			if( (found = scriptElements[i].textContent.match( /"?(patchUrl1?|testUrl)"?\s*:\s*"([^"]+)"/g)) ) {
				for(let j=0, len=found.length; j<len; j++) {
					urls.push(found[j].match(/"([^"]+)"$/)[1]);
				}
			}
		}
		return urls;
	}
}

