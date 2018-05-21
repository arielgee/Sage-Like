"use strict";

let syndication = (function () {

	let SyndicationStandard = Object.freeze({
		invalid: 0,
		RSS: 1,
		RDF: 2,
		Atom: 3,
	});

    let domParser = new DOMParser();

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function fetchFeedItems (feedUrl, reload) {

        let init = {
            cache: reload ? "reload" : "default",
        };

        return new Promise((resolve, reject) => {

			fetch(feedUrl, init).then((result) => {

				if (result.ok) {
					result.text().then((xmlText) => {

                        let list = createFeedItemsList(xmlText);

                        if(list.length > 0) {
                            resolve(list);
                        } else {
                            reject("RSS feed not identified or document not valid at '" + feedUrl + "'.");
                        }

                    });
				} else {
                    reject("Fail to load feed items from '" + result.url + "', " + result.status + " " + result.statusText + ".");
				}

			}).catch((error) => {
				reject("Request failed to fetch feed from '" + feedUrl + "', " + error.message);
			});
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createFeedItemsList (xmlText) {

		lzUtil.log("\n", xmlText.substr(0, 5120000));

        let elm, FeedItem;
		let FeedItemList = new Array();

		let fd = getFeedData(xmlText);

		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if([SyndicationStandard.RSS, SyndicationStandard.RDF].indexOf(fd.standard) !== -1) {

			lzUtil.log("Feed: " + fd.feeder.localName.toUpperCase(), "v" + (fd.feeder.getAttribute("version") || "?"));

			fd.feeder = sortFeederByDate(fd.feeder.querySelectorAll("item"));

			fd.feeder.forEach((item) => {

                FeedItem = new Object();

				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				FeedItem["title"] = TextDecoding(item.querySelector("title").textContent, fd.xmlEncoding);
				FeedItem["desc"] = item.querySelector("description") ? item.querySelector("description").textContent : "";
				FeedItem["link"] = item.querySelector("link").textContent;				
                FeedItemList.push(FeedItem);
			});

		} else if(fd.standard === SyndicationStandard.Atom) {

			lzUtil.log("Feed: Atom", "v" + (fd.feeder.getAttribute("version") || "?"));

			fd.feeder = sortFeederByDate(fd.feeder.querySelectorAll("entry"));

			fd.feeder.forEach((item) => {

				FeedItem = new Object();

				FeedItem["title"] = TextDecoding(item.querySelector("title").textContent, fd.xmlEncoding);
				FeedItem["desc"] = item.querySelector("summary") ? item.querySelector("summary").textContent : "";
				if ((elm = item.querySelector("link:not([rel])")) ||
					(elm = item.querySelector("link[rel=alternate]")) ||
					(elm = item.querySelector("link"))) {
					FeedItem["link"] = elm.getAttribute("href");
				}
				FeedItemList.push(FeedItem);
			});
        }
        return FeedItemList;
    }

	////////////////////////////////////////////////////////////////////////////////////
	//
	function getFeedData (xmlText) {

		let feedData = {
			standard: SyndicationStandard.invalid,
			feeder: {},
			xmlEncoding: "",
		};

		// try to avoid a common XML/RSS Parsing Error: junk after document element
		xmlText = xmlText.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1")

		// try to get XML encoding from the XML prolog
		let test = xmlText.match(/<\?xml[^>]*encoding="([^"]*)"[^>]*>/);
		if(test && test[1]) {
			feedData.xmlEncoding =  test[1];
		}		

		let doc = domParser.parseFromString(xmlText, "text/xml");

        // return if XML not well-formed
        if(doc.documentElement.nodeName === "parsererror") {
			lzUtil.log(doc.documentElement.textContent);
            return feedData;
		}

		if(doc.documentElement.localName === "rss") {				// First lets try 'RSS'
			feedData.standard = SyndicationStandard.RSS;				// https://validator.w3.org/feed/docs/rss2.html
			feedData.feeder = doc.querySelector("rss");
		} else if(doc.documentElement.localName === "RDF") {		// Then let's try 'RDF (RSS) 1.0'
			feedData.standard = SyndicationStandard.RDF;				// https://validator.w3.org/feed/docs/rss1.html; Example: http://feeds.nature.com/nature/rss/current
			feedData.feeder = doc.querySelector("RDF");
		} else if(doc.documentElement.localName === "feed") {		// FInally let's try 'Atom'
			feedData.standard = SyndicationStandard.Atom;				// https://validator.w3.org/feed/docs/atom.html
			feedData.feeder = doc.querySelector("feed");
		}
		return feedData;
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function TextDecoding (text, encoding) {
		
		// no need to decode
		if(encoding === "" || encoding.toUpperCase() === "UTF-8") {
			return text;
		}
		/*
		let enc = new TextEncoder();
		let dec = new TextDecoder(encoding);

		let uint8Array = enc.encode(text);		
		
		lzUtil.log("++", dec.decode(uint8Array));
		return dec.decode(uint8Array);

		
		
		
		let ary = new Uint8Array(text.length);		
		for(let i=0; i<text.length; i++) {
			ary[i] = text.charCodeAt(i);
		}
		*/
		
		let ary = Uint8Array.from(text, (x) => x.codePointAt(0));
		 
		let dec = new TextDecoder("UTF-8");
		let newText = dec.decode(ary)
		lzUtil.log("++", encoding, ary, text, "%%",  newText);


		return newText;
		
		
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function sortFeederByDate (feeder) {

		const selectores = [ "pubDate", "modified", "updated", "published", "created", "issued" ];

		let ary = Array.prototype.slice.call(feeder, 0);

		for (let selector of selectores) {
			if(ary[0].querySelector(selector) !== null) {

				ary.sort((a, b) => {
					let d1 = Date.parse(a.querySelector(selector).textContent);
					let d2 = Date.parse(b.querySelector(selector).textContent);
					return d2 - d1;
				});

				break;
			}
		}
		return ary;
	}

    //////////////////////////////////////////
    return {
        fetchFeedItems: fetchFeedItems,
    };
})();
