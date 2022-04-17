"use strict";

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscoveryBase {
	constructor(source = {}, regExpMatch) {
		if (new.target.name === "WebsiteSpecificDiscoveryBase") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}

		({
			href: this._href = window.location.href,
			doc: this._document = window.document,
		} = source);
		this._hrefMatch = regExpMatch.test(this._href);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {}	// should return an array
}

//////////////////////////////////////////////////////////////////////
class YouTubeSpecificDiscovery extends WebsiteSpecificDiscoveryBase {
	constructor(source) {
		super(source, /^https?:\/\/(www\.)?(youtube\.[^\/]+|youtu\.be)\/.*$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {

		const URL_CHANNEL = "https://www.youtube.com/feeds/videos.xml?channel_id=";
		const URL_PLAYLIST = "https://www.youtube.com/feeds/videos.xml?playlist_id=";
		const RE_CHANNEL_ID = new RegExp("\"externalId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"");
		const RE_CHANNEL_ID_FB = new RegExp("\"channelId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"");
		const RE_PLAYLIST_ID = new RegExp("\"playlistId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"");

		let found, channelId, channelIdFallback, playlistId;
		let scriptElements = this._document.getElementsByTagName("script");

		for(let i=0, len=scriptElements.length; i<len; i++) {

			if( !!!channelId && (found = scriptElements[i].textContent.match(RE_CHANNEL_ID)) ) {
				channelId = URL_CHANNEL + found[1];
			} else if( !!!channelId && !!!channelIdFallback && (found = scriptElements[i].textContent.match(RE_CHANNEL_ID_FB)) ) {
				channelIdFallback = URL_CHANNEL + found[1];
			} else if( !!!playlistId && (found = scriptElements[i].textContent.match(RE_PLAYLIST_ID)) ) {
				playlistId = URL_PLAYLIST + found[1];
			}

			if( !!channelId && !!playlistId ) break;
		}

		let urls = [];

		if(!!channelId) {
			urls.push(channelId);
		} else if(!!channelIdFallback) {
			urls.push(channelIdFallback);
		} else if( (found = this._href.match(/\/channel\/([a-zA-Z0-9_-]+)/)) ) {
			urls.push(URL_CHANNEL + found[1]);
		}

		if(!!playlistId) {
			urls.push(playlistId);
		} else if( (found = this._href.match(/[?&]list=([a-zA-Z0-9_-]+)/)) ) {
			urls.push(URL_PLAYLIST + found[1]);
		}

		return urls;
	}
}

//////////////////////////////////////////////////////////////////////
class TestSpecificDiscovery extends WebsiteSpecificDiscoveryBase {
	constructor(source) {
		super(source, /\/localhost\/.*?\/discovery-test\.html$/);
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

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscovery {
	constructor(source) {
		this._specificDiscoveries = [
			new YouTubeSpecificDiscovery(source),
			new TestSpecificDiscovery(source),
		];
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		let urls = [];
		for(let i=0, len=this._specificDiscoveries.length; i<len; i++) {
			if(this._specificDiscoveries[i]._hrefMatch) {
				urls.push(...(this._specificDiscoveries[i].discover()))
			}
		}
		return urls;
	}
}
