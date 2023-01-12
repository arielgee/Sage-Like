"use strict";

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscoveryBase {
	constructor(source = {}) {
		({
			href: this._href = "",
			doc: this._document = undefined,
		} = source);
        this.instanceOf = new.target.name;
	}

	//////////////////////////////////////////////////////////////////////
	static match(source, regExpMatch) {
		return ( ( !!source.href && regExpMatch.test(source.href) ) ? new this(source) : null );
	}

	//////////////////////////////////////////////////////////////////////
	discover() {}	// should return an array
}

//////////////////////////////////////////////////////////////////////
class YouTubeSpecificDiscovery extends WebsiteSpecificDiscoveryBase {

	//////////////////////////////////////////////////////////////////////
	static match(source) {
		return super.match(source, /^https?:\/\/(www\.)?(youtube\.[^\/]+|youtu\.be)\/.*$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {

		const URL_CHANNEL = "https://www.youtube.com/feeds/videos.xml?channel_id=";
		const URL_PLAYLIST = "https://www.youtube.com/feeds/videos.xml?playlist_id=";
		const RE_EXTERNAL_ID = new RegExp("\"externalId\"\s*:\s*\"([a-zA-Z0-9_-]{16,})\"");
		const RE_CHANNEL_IDS = new RegExp("\"channelId\"\s*:\s*\"([a-zA-Z0-9_-]{16,})\"", "g");
		const RE_PLAYLIST_IDS = new RegExp("\"playlistId\"\s*:\s*\"([a-zA-Z0-9_-]{16,})\"", "g");
		const RE_ID = new RegExp("\"([a-zA-Z0-9_-]+)\"$");

		let found, externalId, urls = [];
		let elmScripts = this._document.getElementsByTagName("script");

		for(let i=0, len=elmScripts.length; i<len; i++) {

			if( !!!externalId && (found = elmScripts[i].textContent.match(RE_EXTERNAL_ID)) ) {
				urls.push( URL_CHANNEL + (externalId = found[1]) );
			}

			if( (found = elmScripts[i].textContent.match(RE_CHANNEL_IDS)) ) {
				for(let j=0, len=found.length; j<len; j++) {
					urls.push(URL_CHANNEL + (found[j].match(RE_ID)[1]));
				}
			}

			if( (found = elmScripts[i].textContent.match(RE_PLAYLIST_IDS)) ) {
				for(let j=0, len=found.length; j<len; j++) {
					urls.push(URL_PLAYLIST + (found[j].match(RE_ID)[1]));
				}
			}
		}

		if( (found = this._href.match(/\/channel\/([a-zA-Z0-9_-]+)/)) ) {
			urls.push(URL_CHANNEL + found[1]);
		}

		if( (found = this._href.match(/[?&]list=([a-zA-Z0-9_-]+)/)) ) {
			urls.push(URL_PLAYLIST + found[1]);
		}

		return urls;	// duplicates are filtered out in syndication.webPageFeedsDiscovery()
	}
}

//////////////////////////////////////////////////////////////////////
class RedditSpecificDiscovery extends WebsiteSpecificDiscoveryBase {

	//////////////////////////////////////////////////////////////////////
	static match(source) {
		return super.match(source, /^https?:\/\/(www\.)?reddit\..*$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		return [ this._href.replace(/\/+$/, "") + "/.rss" ];
	}
}

//////////////////////////////////////////////////////////////////////
class DeviantArtSpecificDiscovery extends WebsiteSpecificDiscoveryBase {

	//////////////////////////////////////////////////////////////////////
	static match(source) {
		return super.match(source, /^https?:\/\/www\.deviantart\.com\/.+$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {

		let found;

		if( (found = this._href.match(/[^\/]\/([^/]+)\/?/)) ) {
			if( !!(this._document.querySelector(`a[data-hook="user_link" i][data-username="${found[1]}" i]`)) ) {
				return [ "https://backend.deviantart.com/rss.xml?q=gallery%3A" + found[1] ];
			}
		}
		return [];
	}
}

//////////////////////////////////////////////////////////////////////
class DeviantArtAggressiveSpecificDiscovery extends DeviantArtSpecificDiscovery {

	//////////////////////////////////////////////////////////////////////
	discover() {

		const URL_GALLERY = "https://backend.deviantart.com/rss.xml?q=gallery%3A";
		const RE_USER_NAME = new RegExp(`\\\\"username\\\\"\s*:\s*\\\\"([a-zA-Z0-9_-]+)\\\\"`, "gi");
		const RE_NAME = new RegExp(`\"([a-zA-Z0-9_-]+)\\\\"$`);

		let found, urls = [];
        let elmScripts = this._document.getElementsByTagName("script");

        for(let i=0, len=elmScripts.length; i<len; i++) {

			if( (found = elmScripts[i].textContent.match(RE_USER_NAME)) ) {
				for(let j=0, len=found.length; j<len; j++) {
					urls.push(URL_GALLERY + (found[j].match(RE_NAME)[1]));
				}
			}
		}

		return urls;	// duplicates are filtered out in syndication.webPageFeedsDiscovery()
	}
}

//////////////////////////////////////////////////////////////////////
class BehanceSpecificDiscovery extends WebsiteSpecificDiscoveryBase {

	//////////////////////////////////////////////////////////////////////
	static match(source) {
		return super.match(source, /^https?:\/\/www\.behance\.net\/.+$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {

		let found;

		if( (found = this._href.match(/[^\/]\/([^/]+)\/?/)) ) {

			const RE_USER_NAME = new RegExp(`"username"\s*:\s*"${found[1]}"`);

			let elmScripts = this._document.getElementsByTagName("script");

			for(let i=0, len=elmScripts.length; i<len; i++) {
				if(elmScripts[i].textContent.match(RE_USER_NAME) ) {
					return [ `https://www.behance.net/feeds/user?username=${found[1]}` ];
				}
			}
		}
		return [];
	}
}

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscovery {
	#_specificDiscoveries = null;
	constructor(source, aggressive = false) {
		this.#_specificDiscoveries = [
			YouTubeSpecificDiscovery.match(source),
			RedditSpecificDiscovery.match(source),
			DeviantArtSpecificDiscovery.match(source),
			(aggressive ? DeviantArtAggressiveSpecificDiscovery.match(source) : null),
			BehanceSpecificDiscovery.match(source),
		];
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		let urls = [];
		for(let i=0, len=this.#_specificDiscoveries.length; i<len; i++) {
			if( !!this.#_specificDiscoveries[i] ) {
				urls.push(...(this.#_specificDiscoveries[i].discover()));
			}
		}
		return urls;
	}
}
