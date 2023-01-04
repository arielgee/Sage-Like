//////////////////////////////////////////////////////////////////////
DeviantArtSpecificDiscovery.discover() {

	const URL_GALLERY = "https://backend.deviantart.com/rss.xml?q=gallery%3A";

	let found, urls = [];
	let funcSearchScripts = (name, reMatch) => {
		let elmScripts = this._document.getElementsByTagName("script");
		for(let i=0, len=elmScripts.length; i<len; i++) {
			if( (found = elmScripts[i].textContent.match(reMatch)) ) {
				urls.push( URL_GALLERY + name );
				return;
			}
		}
	};
	let funcSearchAnchors = (name) => {
		if( !!(this._document.querySelector(`a[data-hook="user_link" i][data-username="${name}" i]`)) ) {
			urls.push( URL_GALLERY + name );
			return;
		}
	};

	if( (found = this._href.match(/[^\/]\/([a-zA-Z0-9_+-.]+)\/?/)) ) {

		//funcSearchScripts(found[1], new RegExp(`\\\\"username\\\\"\s*:\s*\\\\"(${found[1]})\\\\"`, "i"));
		funcSearchAnchors(found[1]);
	}

	return urls;
}


//////////////////////////////////////////////////////////////////////
DeviantArtSpecificDiscovery.discover() {

    const URL_GALLERY = "https://backend.deviantart.com/rss.xml?q=gallery%3A";

    let found, urls = [];
    let funcSearchScripts = (name, reMatch) => {

        let elmScripts = this._document.getElementsByTagName("script");

        for(let i=0, len=elmScripts.length; i<len; i++) {

            console.log("[Sage-Like] found", elmScripts[i].textContent.match(reMatch));
            if( (found = elmScripts[i].textContent.match(reMatch)) ) {
                urls.push( URL_GALLERY + name );
                return;
            }
        }
    };

    if( (found = this._href.match(/\/topic\/([a-zA-Z0-9_+-.]+)/)) ) {

        console.log("[Sage-Like] topic", found[1]);
        funcSearchScripts(found[1], new RegExp(`\\\\"topic\\\\"\s*:\s*\\\\"(${found[1]})\\\\"`, "i"));

    } else if( (found = this._href.match(/[^\/]\/([a-zA-Z0-9_+-.]+)\/?/)) ) {

        console.log("[Sage-Like] user", found[1]);
        funcSearchScripts(found[1], new RegExp(`\\\\"username\\\\"\s*:\s*\\\\"(${found[1]})\\\\"`, "i"));

    }

    return urls;
}
