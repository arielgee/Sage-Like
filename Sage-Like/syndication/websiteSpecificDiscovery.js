"use strict";

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscoveryBase {
	constructor(source = {}, regExpMatch) {
		if (new.target.name === "WebsiteSpecificDiscoveryBase") {
			throw new Error(new.target.name + ".constructor: Don't do that");
		}

		({
			href: this._href = "",
			doc: this._document = undefined,
		} = source);
		this.isHRefMatch = (this._href !== "") && regExpMatch.test(this._href);
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
		const RE_EXTERNAL_ID = new RegExp("\"externalId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"");
		const RE_CHANNEL_IDS = new RegExp("\"channelId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"", "g");
		const RE_PLAYLIST_IDS = new RegExp("\"playlistId\"\s*:\s*\"([a-zA-Z0-9_-]+)\"", "g");
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
	constructor(source) {
		super(source, /^https?:\/\/(www\.)?reddit\..*$/);
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		return [ this._href.replace(/\/+$/, "") + "/.rss" ];
	}
}

//////////////////////////////////////////////////////////////////////
class DeviantArtSpecificDiscovery extends WebsiteSpecificDiscoveryBase {
	constructor(source) {
		super(source, /^https?:\/\/www\.deviantart\.com\/.+$/);
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
class WebsiteSpecificDiscovery {
	#_specificDiscoveries = null;
	constructor(source) {
		this.#_specificDiscoveries = [
			new YouTubeSpecificDiscovery(source),
			new RedditSpecificDiscovery(source),
			new DeviantArtSpecificDiscovery(source),
		];
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		let urls = [];
		for(let i=0, len=this.#_specificDiscoveries.length; i<len; i++) {
			if(this.#_specificDiscoveries[i].isHRefMatch) {
				urls.push(...(this.#_specificDiscoveries[i].discover()))
			}
		}
		return urls;
	}
}
