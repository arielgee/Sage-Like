"use strict";

//////////////////////////////////////////////////////////////////////
class WebsiteSpecificDiscoveryBase {
	constructor(source = {}) {
		({
			href: this._href = "",
			doc: this._document = undefined,
		} = source);
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
class DeviantArtDeepSpecificDiscovery extends DeviantArtSpecificDiscovery {

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
class WebsiteSpecificDiscovery {
	constructor(source) {
		this._specificDiscoveries = [
			YouTubeSpecificDiscovery.match(source),
			RedditSpecificDiscovery.match(source),
			DeviantArtSpecificDiscovery.match(source),
			DeviantArtDeepSpecificDiscovery.match(source),
		];
	}

	//////////////////////////////////////////////////////////////////////
	discover() {
		// console.log("[Sage-Like] instanceof YouTubeSpecificDiscovery", this._specificDiscoveries[0] instanceof YouTubeSpecificDiscovery, this._specificDiscoveries[0] !== null);
		// console.log("[Sage-Like] instanceof RedditSpecificDiscovery", this._specificDiscoveries[1] instanceof RedditSpecificDiscovery, this._specificDiscoveries[1] !== null);
		// console.log("[Sage-Like] instanceof DeviantArtSpecificDiscovery", this._specificDiscoveries[2] instanceof DeviantArtSpecificDiscovery, this._specificDiscoveries[2] !== null);
		// console.log("[Sage-Like] instanceof DeviantArtDeepSpecificDiscovery", this._specificDiscoveries[2] instanceof DeviantArtDeepSpecificDiscovery, this._specificDiscoveries[2] !== null);
		let urls = [];
		for(let i=0, len=this._specificDiscoveries.length; i<len; i++) {
			if( !!this._specificDiscoveries[i] ) {
				urls.push(...(this._specificDiscoveries[i].discover()));	// There Can Be Only/More-Then One
			}
		}
		return urls;
	}
}



==============================================================================================================================================================
LangMode: Diff - branch: master
==============================================================================================================================================================
@ -19,6 +19,7 @@
	let m_windowIds = [];
	let m_currentWindowId = null;
	let m_timeoutIdMonitorBookmarkFeeds = null;
+	let m_onTabsUpdatedDebouncersMap = null;
	let m_regExpRssContentTypes = new RegExp(REGEX_RSS_STRICT_CONTENT_TYPES, "i");	// MUST BE INITIALIZED!. onWebRequestHeadersReceived() was being executed with m_regExpRssContentTypes=undefined

	initialization();
@ -174,10 +175,13 @@

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsUpdated(tabId, changeInfo, tab) {
-		// When selecting an open tab that was not loaded (browser just opened) then changeInfo is {status: "complete", url: "https://*"}
-		// but the page is not realy 'complete'. Then the page is loading and when complete then there is not 'url' property. Hence !!!changeInfo.url
-		if (!!changeInfo.status && changeInfo.status === "complete" && !!!changeInfo.url && IsAllowedForFeedDetection(tab.url) ) {
-			handleTabChangedState(tabId);
+		//console.log("[Sage-Like] onTabsUpdated", { tabId: tabId, status: changeInfo.status, url: changeInfo.url });
+		if (changeInfo.status === "complete" && IsAllowedForFeedDetection(tab.url)) {
+			clearTimeout(m_onTabsUpdatedDebouncersMap.get(tabId));
+			m_onTabsUpdatedDebouncersMap.set(tabId, setTimeout(() => {
+				handleTabChangedState(tabId);
+				m_onTabsUpdatedDebouncersMap.delete(tabId);
+			}, 2000));
		}
	}

@ -450,17 +454,20 @@
	////////////////////////////////////////////////////////////////////////////////////
	async function handlePrefDetectFeedsInWebPage() {

		let detectFeedsInWebPage = await prefs.getDetectFeedsInWebPage();

		if(detectFeedsInWebPage) {

+			m_onTabsUpdatedDebouncersMap = new Map();
			browser.tabs.onUpdated.addListener(onTabsUpdated);		// Fx61 => extraParameters; {url:["*://*/*"], properties:["status"]}
			browser.tabs.onAttached.addListener(onTabsAttached);

		} else if(browser.tabs.onUpdated.hasListener(onTabsUpdated)) {

			// hasListener() will return false if handlePrefDetectFeedsInWebPage() was called from webExt loading.

+			m_onTabsUpdatedDebouncersMap.clear();
+			m_onTabsUpdatedDebouncersMap = null;
			browser.tabs.onUpdated.removeListener(onTabsUpdated);
			browser.tabs.onAttached.removeListener(onTabsAttached);

==============================================================================================================================================================
