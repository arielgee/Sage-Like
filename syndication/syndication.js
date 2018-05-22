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

		prob1(feedUrl, reload);



        let init = {
            cache: reload ? "reload" : "default",
		};
		
        return new Promise((resolve, reject) => {

			fetch(feedUrl, init).then((response) => {

				if (response.ok) {

					response.text().then((xmlText) => {

						lzUtil.log(feedUrl + "\n", xmlText.substr(0, 256000));

                        let list = createFeedItemsList(xmlText);

                        if(list.length > 0) {
                            resolve(list);
                        } else {
                            reject("RSS feed not identified or document not valid at '" + feedUrl + "'.");
                        }

                    });
				} else {
                    reject("Fail to load feed items from '" + response.url + "', " + response.status + " " + response.statusText + ".");
				}

			}).catch((error) => {
				reject("Request failed to fetch feed from '" + feedUrl + "', " + error.message);
			});
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createFeedItemsList (xmlText) {

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
				FeedItem["title"] = item.querySelector("title").textContent;
				FeedItem["desc"] = item.querySelector("description") ? item.querySelector("description").textContent : "";
				FeedItem["link"] = item.querySelector("link").textContent;				
                FeedItemList.push(FeedItem);
			});

		} else if(fd.standard === SyndicationStandard.Atom) {

			lzUtil.log("Feed: Atom", "v" + (fd.feeder.getAttribute("version") || "?"));

			fd.feeder = sortFeederByDate(fd.feeder.querySelectorAll("entry"));

			fd.feeder.forEach((item) => {

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

		let strLen = text.length;
		let buf = new ArrayBuffer(strLen*2); // 2 bytes for each char
		var bufView = new Uint16Array(buf);
		for (var i=0; i<strLen; i++) {
		  bufView[i] = text.charCodeAt(i);
		}		
	
		let line = ""
		for(let n of bufView) {
			line += n + ", ";
		}
		lzUtil.log("[arl]", line);
		return text;
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
		
		
		let ary = Uint8Array.from(text, (x) => x.codePointAt(0));
		 
		let dec = new TextDecoder("UTF-8");
		let newText = dec.decode(ary)
		lzUtil.log("++", encoding, ary, text, "%%",  newText);


		return newText;
		*/
		
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

	////////////////////////////////////////////////////////////////////////////////////
	//
	function prob1 (feedUrl, reload) {

        let init = {
            cache: reload ? "reload" : "default",
		};
		
		fetch(feedUrl, init).then((response) => {

			if (response.ok) {				
				response.blob().then((blob) => {
					let x = URL.createObjectURL(blob)
					console.log("PROB1-", blob);
					console.log("PROB1-", x);

					xmlDoc.load(blob);
					xmlDoc.load(x);
					console.log("PROB1-", xmlDoc);
					
				});
			}
			
/*
			if (response.ok) {				

				response.text().then((xmlText) => {
					console.log("PROB1-",  feedUrl + "\n", xmlText.substr(0, 256000));
				});
			} else {
				console.log("PROB1-",  "Fuck1");	//reject("Fail to load feed items from '" + response.url + "', " + response.status + " " + response.statusText + ".");
			}
			*/

		}).catch((error) => {
			console.log("PROB1-",  "Fuck2", error.message);		//reject("Request failed to fetch feed from '" + feedUrl + "', " + error.message);
		});
	
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function prob (feedUrl) {


		let xmlDoc, fdr;
		let xhr = new XMLHttpRequest();
		xhr.open('GET', feedUrl, true);
		
		// If specified, responseType must be empty string or "document"
		xhr.responseType = 'document';
		
		// overrideMimeType() can be used to force the response to be parsed as XML
		xhr.overrideMimeType('text/xml');
		
		xhr.onload = function () {
		  if (xhr.readyState === xhr.DONE) {
			if (xhr.status === 200) {
			  console.log("[===]", xhr.response);
			  console.log("[===]", xhr.responseXML);
			  console.log("[===]", xhr.responseXML.documentElement.outerHTML);

			  xmlDoc = xhr.responseXML;

			  fdr = xmlDoc.querySelectorAll("item");

			  fdr.forEach((item) => {
				
				// all versions have <title> & <link>. <description> is optional or missing (v0.90)
				console.log("[===+]", item.querySelector("title").textContent);
			});


			}
		  }
		};
		
		xhr.send(null);				

	
		/*
		cResult.blob().then((blob) => {
			lzUtil.log("[cResult]", blob);

			let reader = new FileReader();
			reader.addEventListener("loadend", () => {

				lzUtil.log("[cResult]", reader.result);

				let s = String.fromCharCode.apply(null, new Uint16Array(reader.result));
				lzUtil.log("[cResult]", s);
			});
			reader.readAsArrayBuffer(blob);
		});
		*/
		

	}
	

    //////////////////////////////////////////
    return {
        fetchFeedItems: fetchFeedItems,
    };
})();
