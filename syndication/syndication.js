"use strict";

let syndication = (function () {

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

		lzUtil.log("\n", xmlText.substr(0, 512));

		// try to avoid a common XML/RSS Parsing Error: junk after document element
		xmlText = xmlText.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1")

        let doc = domParser.parseFromString(xmlText, "text/xml");

        // return an empty array if XML not well-formed
        if(doc.documentElement.nodeName === "parsererror") {
            return [];
        }

		// First lets try 'RSS'
		// https://validator.w3.org/feed/docs/rss2.html
		let feeder = doc.querySelector("rss");		// There Can Be Only One


		// If 'RSS' fail let's try 'RDF Site Summary (RSS) 1.0'
		// https://validator.w3.org/feed/docs/rss1.html
		// Example: http://feeds.nature.com/nature/rss/current
		if (feeder === null) {
			feeder = doc.querySelector("RDF");		// There Can Be Only One
		}


        let elm;
        let FeedItem;
        let FeedItemList = new Array();


		// for 'RSS' or 'RDF Site Summary (RSS) 1.0'
		if (feeder !== null) {

			lzUtil.log("Feed: " + feeder.localName.toUpperCase(), "v" + (feeder.getAttribute("version") || "?"));

			feeder = sortFeederByDate(feeder.querySelectorAll("item"));

			feeder.forEach((item) => {

                FeedItem = new Object();

				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("description") ? item.querySelector("description").textContent : "";
                FeedItem["link"] = item.querySelector("link").textContent;
                FeedItemList.push(FeedItem);
			});

		} else {

			// If both 'RSS' and 'RDF Site Summary (RSS) 1.0' failed let's try 'Atom'
			// https://validator.w3.org/feed/docs/atom.html
			feeder = doc.querySelector("feed");		// There Can Be Only One

			if (feeder !== null) {

				lzUtil.log("Feed: Atom", "v" + (feeder.getAttribute("version") || "?"));

				feeder = sortFeederByDate(feeder.querySelectorAll("entry"));

				feeder.forEach((item) => {

                    FeedItem = new Object();

					FeedItem["title"] = item.querySelector("title").textContent;
					FeedItem["desc"] = item.querySelector("summary") ? item.querySelector("summary").textContent : "";
					if ((elm = item.querySelector("link:not([rel])")) ||
						(elm = item.querySelector("link[rel=alternate]")) ||
						(elm = item.querySelector("link"))) {
                        FeedItem["link"] = elm.getAttribute("href");
					}
					FeedItemList.push(FeedItem);
				});
			}
        }
        return FeedItemList;
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
