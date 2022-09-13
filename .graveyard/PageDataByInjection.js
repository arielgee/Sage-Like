//==================================================================================
//=== Class Declerations
//==================================================================================

class PageDataByInjection {
	constructor() {
		this._CODE_INJECTION = "( {" +
									"docElmId: document.documentElement.id," +
									"title: document.title," +
									"domainName: document.domain," +
									"origin: window.location.origin," +
									"isPlainText: document.body.children.length === 1 && " +
													"document.body.firstElementChild.tagName === \"PRE\" && " +
													"document.body.firstElementChild.children.length === 0," +
									"txtHTML: document.documentElement.outerHTML } );";
	}
	get(tabId) {
		return new Promise((resolve, reject) => this._injectCode(tabId, resolve, reject) );
	}
	_injectCode(tabId, resolve, reject) {
		browser.tabs.executeScript(tabId, { code: this._CODE_INJECTION, runAt: "document_end" }).then((result) => {
			if( !!result && result.length > 0 && result[0].hasOwnProperty("docElmId") ) { // ensure code was executed. Fx76 don't reject executeScript() on built-in pages. Bugzilla bug 1639529 was filed
				resolve(result[0]);
			} else {
				reject({ errorMsg: "Code injection failed." });
			}
		}).catch((error) => reject({ errorMsg: "Code injection rejected.", nativeError: error }) );
	}
}

