"use strict";

document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

function onDOMContentLoaded() {

	let now = Date.now().toString();
	document.getElementById("now").innerHTML = now;
	document.documentElement.style.backgroundColor = "#" + now.substring(10);
	document.documentElement.style.color = "#FFF" + now.substring(10);



	let test = "basic";
	//let test = "fetchFeedItems";
	//let test = "feedDiscovery";
	//let test = "webPageFeedsDiscovery";


	let output = "";
	let line = "=".repeat(36);
	let urlJson = "https://www.iosicongallery.com/feed.json";
	let urlRSS = "https://developer.mozilla.org/devnews/index.php/feed/atom/";
	let urlAtom = "https://f1-gate.com/atom.xml";
	let urlRDF = "https://f1-gate.com/index.rdf";
	let urlNotJsonXml = "https://www.rapidtables.com/web/color/html-color-codes.html";
	let urlJunk = "http://asas";
	let urlNoFeedXML = "http://producthelp.sdl.com/sdl%20trados%20studio/client_en/sample.xml";


	/*##############################################################################*/
	/*##############################################################################*/
	if(test === "basic") {

		output = ">".repeat(20) + " TEST: basic\n\n";

		let objFeed;
		let data, list;
		let urlDummy = "https://www.iosicongallery.com/feed.json";
		let txtRssNoProlog = '<rss xmlns:content = "http://purl.org/rss/1.0/modules/content/" xmlns:wfw = "http://wellformedweb.org/CommentAPI/" xmlns:dc = "http://purl.org/dc/elements/1.1/" xmlns:atom = "http://www.w3.org/2005/Atom" xmlns:sy = "http://purl.org/rss/1.0/modules/syndication/" xmlns:slash = "http://purl.org/rss/1.0/modules/slash/" xmlns:feedburner = "http://rssnamespace.org/feedburner/ext/1.0" version = "2.0"> <channel> <title>TechCrunch</title> <link>https://techcrunch.com</link> <description>TechCrunch is a group-edited blog that profiles the companies, products and events defining and transforming the new web.</description> <lastBuildDate>Wed, 11 Mar 2020 15:08:04 +0000</lastBuildDate> <language>en-US</language> <sy:updatePeriod>hourly</sy:updatePeriod> <sy:updateFrequency>1</sy:updateFrequency> <generator>https://wordpress.org/?v=5.3.2</generator> <image> <link>http://www.techcrunch.com</link> <url>http://www.techcrunch.com/wp-content/themes/techcrunchmu/images/techcrunch_logo.png</url> <title>TechCrunch</title> </image> <site xmlns = "com-wordpress:feed-additions:1">136296444</site> <atom10:link xmlns:atom10 = "http://www.w3.org/2005/Atom" rel = "self" type = "application/rss+xml" href = "http://feeds.feedburner.com/Techcrunch"/> <feedburner:info uri = "techcrunch"/> <atom10:link xmlns:atom10 = "http://www.w3.org/2005/Atom" rel = "hub" href = "http://pubsubhubbub.appspot.com/"/> <item> <title>Cloud’s growth cycle isn’t behind us yet</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/I7-tugfGClk/</link> <comments>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:02:25 +0000</pubDate> <dc:creator><![CDATA[Alex Wilhelm]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1957308</guid> <description><![CDATA[Our goal is to get a handle on how two large, public SaaS players think about the world as they compete for growth and market share.]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1957308</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/</feedburner:origLink> </item> <item> <title>PandaDoc introduces new template-driven editor to ease sales doc production</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/41jAdfbfKjs/</link> <comments>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:55 +0000</pubDate> <dc:creator><![CDATA[Ron Miller]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1957354</guid> <description><![CDATA[PandaDoc, a sales-focused document automation startup, announced a new web-based document production editor today that allows sales teams to quickly generate proposals and contracts from design templates. The templates give a consistent and professional look to these documents, which might otherwise be produced in a word processor like Word or Google Docs. While customers are [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1957354</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/</feedburner:origLink> </item> <item> <title>Applications for TC Pitch Night: Mobility 2020 are now open</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/HGi7e1f64JA/</link> <comments>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:36 +0000</pubDate> <dc:creator><![CDATA[Neesha A. Tambe]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1951131</guid> <description><![CDATA[Founders: it&#8217;s time to get moving. On May 13, the night before TC Sessions: Mobility 2020, TechCrunch is hosting a private Pitch Night for mobility-focused startups. We&#8217;re looking to feature 10 early stage mobility startups that are breaking barriers in the industry. TechCrunch is always on the hunt for the most disruptive tech in the [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1951131</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/</feedburner:origLink> </item><item> <title>Applications for TC Pitch Night: Mobility 2020 are now open</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/HGi7e1f64JA/</link> <comments>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:36 +0000</pubDate> <dc:creator><![CDATA[Neesha A. Tambe]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1951131</guid> <description><![CDATA[Founders: it&#8217;s time to get moving. On May 13, the night before TC Sessions: Mobility 2020, TechCrunch is hosting a private Pitch Night for mobility-focused startups. We&#8217;re looking to feature 10 early stage mobility startups that are breaking barriers in the industry. TechCrunch is always on the hunt for the most disruptive tech in the [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1951131</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/</feedburner:origLink> </item> </channel> </rss>';
		let txtJson = '{"version": "https://jsonfeed.org/version/1","title": "iOS Icon Gallery","description": "Showcasing beautiful icon designs from the iOS App Store","home_page_url": "https://www.iosicongallery.com","feed_url": "https://www.iosicongallery.com/feed.json","author": {"name": "Jim Nielsen","url": "http://jim-nielsen.com/"   },   "icon": "https://www.iosicongallery.com/assets/images/ios-icon.png",   "favicon": "https://www.iosicongallery.com/assets/images/ios-favicon.ico",   "items": [     {       "id": "snooze-hypnose-sommeil-2020-03-03",       "url": "https://www.iosicongallery.com/icons/snooze-hypnose-sommeil-2020-03-03/",       "title": "Snooze - Hypnose sommeil",       "date_published": "2020-03-03T00:00:00.000Z"},{"id": "scanner-2020-03-03","url": "https://www.iosicongallery.com/icons/scanner-2020-03-03/","title": "Scanner ·","date_published": "2020-03-03T00:00:00.000Z"}] }';
		let txtRss = '<?xml version="1.0" encoding="UTF-8"?> <?xml-stylesheet type="text/xsl" media="screen" href="/~d/styles/rss2full.xsl"?> <?xml-stylesheet type="text/css" media="screen" href="http://feeds.feedburner.com/~d/styles/itemcontent.css"?>' + txtRssNoProlog;
		let txtRdf = '<?xml version="1.0" encoding="UTF-8"?> <rdf:RDF xmlns:rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc = "http://purl.org/dc/elements/1.1/" xmlns:sy = "http://purl.org/rss/1.0/modules/syndication/" xmlns:admin = "http://webns.net/mvcb/" xmlns = "http://purl.org/rss/1.0/" xml:lang = "ja"> <channel rdf:about = "https://f1-gate.com/"> <title>F1-Gate.com</title> <link>https://f1-gate.com/</link> <description></description> <dc:language>ja</dc:language> <items> <rdf:Seq> <rdf:li rdf:resource = "https://f1-gate.com/alphatauri/f1_55212.html"/> <rdf:li rdf:resource = "https://f1-gate.com/redbull/f1_55209.html"/> <rdf:li rdf:resource = "https://f1-gate.com/driver/f1_55213.html"/> </rdf:Seq> </items> </channel> <item rdf:about = "https://f1-gate.com/alphatauri/f1_55212.html"> <title>WWWWWWWWWWWF1 WWWWWWWWWWWWWW1WWWWWW</title> <link>https://f1-gate.com/alphatauri/f1_55212.html</link> <description> WWWWWWWWWWWF1WWWWWWWWWWWWWWWWWWWWWWWWWW2W F1WWWWWWWW1WWWWWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW... <a href = "https://f1-gate.com/alphatauri/f1_55212.html">WWWWW</a> </description> <dc:subject>WWWWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T16:43:58+09:00</dc:date> </item> <item rdf:about = "https://f1-gate.com/redbull/f1_55209.html"> <title>WWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWW</title> <link>https://f1-gate.com/redbull/f1_55209.html</link> <description> WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW2WF1WWWWWWWW1WWWWWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW3W... <a href = "https://f1-gate.com/redbull/f1_55209.html">WWWWW</a> </description> <dc:subject>WWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T12:57:49+09:00</dc:date> </item> <item rdf:about = "https://f1-gate.com/driver/f1_55213.html"> <title>W2W F1WWWWWWWW1WW : WF1WWWWWWWWW</title> <link>https://f1-gate.com/driver/f1_55213.html</link> <description> 2020WWF1WWWWWWWWWWW2WWWWW2W26W(W)WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW W1WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW... <a href = "https://f1-gate.com/driver/f1_55213.html">WWWWW</a> </description> <dc:subject>F1WWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T12:03:25+09:00</dc:date> </item> </rdf:RDF> ';
		let txtAtom = '<?xml version="1.0" encoding="UTF-8"?> <feed xmlns = "http://www.w3.org/2005/Atom"> <category term = "worldnews" label = "r/worldnews"/> <updated>2020-03-10T15:05:39+00:00</updated> <icon>https://www.redditstatic.com/icon.png/</icon> <id>/r/worldnews/.rss?_SLWxoPenuRl=nOtinFEeDPREVIew</id> <link rel = "self" href = "https://www.reddit.com/r/worldnews/.rss?_SLWxoPenuRl=nOtinFEeDPREVIew" type = "application/atom+xml"/> <link rel = "alternate" href = "https://www.reddit.com/r/worldnews/?_SLWxoPenuRl=nOtinFEeDPREVIew" type = "text/html"/> <subtitle>A place for major news from around the world, excluding US-internal news.</subtitle> <title>World News</title> <entry> <author> <name>/u/valuingvulturefix</name> <uri>https://www.reddit.com/user/valuingvulturefix</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/valuingvulturefix&quot;&gt; /u/valuingvulturefix &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/live/14d816ty1ylvo/&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/ffpi7m/livethread_global_covid19_outbreak/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_ffpi7m</id> <link href = "https://www.reddit.com/r/worldnews/comments/ffpi7m/livethread_global_covid19_outbreak/"/> <updated>2020-03-09T04:53:08+00:00</updated> <title>Livethread: Global COVID-19 outbreak</title> </entry> <entry> <author> <name>/u/NoKidsItsCruel</name> <uri>https://www.reddit.com/user/NoKidsItsCruel</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/NoKidsItsCruel&quot;&gt; /u/NoKidsItsCruel &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.independent.co.uk/news/world/europe/coronavirus-italy-economy-mortgage-payments-symptoms-lockdown-latest-a9389486.html&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/fgbdzv/italy_suspends_mortgage_payments_amid_lockdown/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_fgbdzv</id> <link href = "https://www.reddit.com/r/worldnews/comments/fgbdzv/italy_suspends_mortgage_payments_amid_lockdown/"/> <updated>2020-03-10T09:54:24+00:00</updated> <title>Italy suspends mortgage payments amid lockdown</title> </entry> <entry> <author> <name>/u/Viking_Sail</name> <uri>https://www.reddit.com/user/Viking_Sail</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/Viking_Sail&quot;&gt; /u/Viking_Sail &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.newsweek.com/chinese-company-donates-tens-thousands-masks-coronavirus-striken-italy-says-we-are-waves-1491233&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/fg5z7w/chinese_electronics_company_xiaomi_donates_tens/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_fg5z7w</id> <link href = "https://www.reddit.com/r/worldnews/comments/fg5z7w/chinese_electronics_company_xiaomi_donates_tens/"/> <updated>2020-03-10T01:35:12+00:00</updated> <title>Chinese electronics company Xiaomi donates tens of thousands of face masks to Italy. Shipment crates feature quotes from Roman philosopher Seneca &quot;We are waves of the same sea&quot;.</title> </entry> </feed>';

		objFeed = Feed.factoryCreateBySrc(txtJson, urlDummy);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof JsonFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateBySrc(txtRss, urlDummy);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RssFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateBySrc(txtRdf, urlDummy);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RdfFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateBySrc(txtRssNoProlog, urlDummy);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RssFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateBySrc(txtAtom, urlDummy);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof AtomFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;


	/*##############################################################################*/
	/*##############################################################################*/
	} else if(test === "fetchFeedItems") {

		output = ">".repeat(20) + " TEST: fetchFeedItems\n\n";

		let testURL = urlRSS;

		syndication.fetchFeedItems(testURL, 5000, false).then((fetchResult) => {

			output += "FEED-DATA\n" + JSON.stringify(fetchResult.feedData, undefined, 2) + "\n\n~~~~~~~~\n\n";
			output += "LIST\n" + JSON.stringify(fetchResult.list, undefined, 2) + "\n\n~~~~~~~~\n\n";

		}).catch((error) => {
			output += error + "\n\n";
		}).finally(() => {
			document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;
		});


	/*##############################################################################*/
	/*##############################################################################*/
	} else if(test === "feedDiscovery") {

		output = ">".repeat(20) + " TEST: feedDiscovery\n\n";

		let testURL = urlRSS;

		syndication.feedDiscovery(testURL, 50000, 242).then((feedData) => {
			output += "FEED-DISCOVERY\n" + JSON.stringify(feedData, undefined, 2) + "\n\n~~~~~~~~\n\n";
		}).catch((error) => {
			output += error + "\n\n";
		}).finally(() => {
			document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;
		});


	/*##############################################################################*/
	/*##############################################################################*/
	} else if(test === "webPageFeedsDiscovery") {

		output = ">".repeat(20) + " TEST: webPageFeedsDiscovery\n\n";

		let outerHTML= '<!DOCTYPE html> <html lang="en" dir="ltr"> <head prefix="og: http://ogp.me/ns#"> <meta charset="utf-8"> <link rel="alternate" type="application/rdf+xml" title="RSS" href="https://f1-gate.com/index.rdf" /><link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="https://f1-gate.com/rss2.xml" /><link rel="alternate" type="application/atom+xml" title="Atom" href="https://f1-gate.com/atom.xml" /><meta http-equiv="X-UA-Compatible" content="IE=Edge"> <title>&lt;url&gt; - CSS: Cascading Style Sheets | MDN</title> </head> <body> <p>The <strong><code>&lt;url&gt;</code></strong> <a href="/en-US/docs/Web/CSS">CSS</a> <a href="/en-US/docs/Web/CSS/CSS_Types">data type</a> denotes a pointer to a resource, such as an image or a font. URLs can be used in numerous CSS properties, such as <a href="/en-US/docs/Web/CSS/background-image" title="The background-image CSS property sets one or more background images on an element."><code>background-image</code></a>, <a href="/en-US/docs/Web/CSS/cursor" title="The cursor CSS property sets the type of cursor, if any, to show when the mouse pointer is over an element."><code>cursor</code></a>, and <a href="/en-US/docs/Web/CSS/list-style" title="The list-style CSS property is a shorthand to set list style properties list-style-type, list-style-image, and list-style-position."><code>list-style</code></a>.</p> <div class="note"> </div> <h2 id="Syntax">Syntax</h2> <p>The <code>&lt;url&gt;</code> data type is specified using the <code id="The_url()_functional_notation">url()</code> functional notation. It may be written without quotes, or surrounded by single or double quotes. Relative URLs are allowed, and are relative to the URL of the stylesheet (not to the URL of the web page).</p> <div class="note"> <p><strong>Note:</strong> Control characters above 0x7e are not allowed in unquoted URLs, starting with Firefox 15. See <a class="external" href="https://bugzilla.mozilla.org/show_bug.cgi?id=752230" rel="noopener">bug 752230</a> for more details.</p> </div> <h2 id="Examples">Examples</h2> <pre class="brush: css">.topbanner { background: url("topbanner.png") #00D no-repeat fixed; } </pre> <pre class="brush: css">ul { list-style: square url(http://www.example.com/redball.png); } </pre> <h2 id="Specifications" name="Specifications">Specifications</h2> <table class="standard-table"> <thead> <tr> <th scope="col">Specification</th> <th scope="col">Status</th> <th scope="col">Comment</th> </tr> </thead> <tbody> <tr> <td><a class="external" href="https://drafts.csswg.org/css-values-4/#urls" hreflang="en" lang="en" rel="noopener">CSS Values and Units Module Level 4<br><small lang="en-US">The definition of in that specification.</small></a></td> <td><span class="spec-ED">Editor"s Draft</span></td> <td></td> </tr> <tr> <td><a class="external" href="https://drafts.csswg.org/css-values-3/#urls" hreflang="en" lang="en" rel="noopener">CSS Values and Units Module Level 3<br><small lang="en-US">The definition of "&lt;url&gt;" in that specification.</small></a></td> <td><span class="spec-CR">Candidate Recommendation</span></td> <td>No significant change from CSS Level 2 (Revision 1).</td> </tr> <tr> <td><a class="external" href="https://www.w3.org/TR/CSS2/syndata.html#uri" hreflang="en" lang="en" rel="noopener">CSS Level 2 (Revision 1)<br><small lang="en-US">The definition of "&lt;uri&gt;" in that specification.</small></a></td> <td><span class="spec-REC">Recommendation</span></td> <td>No significant change from CSS Level 1.</td> </tr> <tr> <td><a class="external" href="https://www.w3.org/TR/CSS1/#url" hreflang="en" lang="en" rel="noopener">CSS Level 1<br><small lang="en-US">The definition of "&lt;url&gt;" in that specification.</small></a></td> <td><span class="spec-REC">Recommendation</span></td> <td>Initial definition.</td> </tr> </tbody> </table> <h2 id="Browser_compatibility">Browser compatibility</h2> <div class="hidden">The compatibility table on this page is generated from structured data. If you"d like to contribute to the data, please check out <a class="external" href="https://github.com/mdn/browser-compat-data" rel="noopener">https://github.com/mdn/browser-compat-data</a> and send us a pull request.</div> <div><div class="bc-data" id="bcd:css.types.url"><a class="bc-github-link external" href="https://github.com/mdn/browser-compat-data" rel="noopener">Update compatibility data on GitHub</a><table class="bc-table bc-table-web"><thead><tr class="bc-platforms"><td></td><th class="bc-platform-desktop" colspan="6"><span>Desktop</span></th><th class="bc-platform-mobile" colspan="6"><span>Mobile</span></th></tr><tr class="bc-browsers"><td></td><th class="bc-browser-chrome"><span class="bc-head-txt-label bc-head-icon-chrome">Chrome</span></th><th class="bc-browser-edge"><span class="bc-head-txt-label bc-head-icon-edge">Edge</span></th><th class="bc-browser-firefox"><span class="bc-head-txt-label bc-head-icon-firefox">Firefox</span></th><th class="bc-browser-ie"><span class="bc-head-txt-label bc-head-icon-ie">Internet Explorer</span></th><th class="bc-browser-opera"><span class="bc-head-txt-label bc-head-icon-opera">Opera</span></th><th class="bc-browser-safari"><span class="bc-head-txt-label bc-head-icon-safari">Safari</span></th><th class="bc-browser-webview_android"><span class="bc-head-txt-label bc-head-icon-webview_android">Android webview</span></th><th class="bc-browser-chrome_android"><span class="bc-head-txt-label bc-head-icon-chrome_android">Chrome for Android</span></th><th class="bc-browser-firefox_android"><span class="bc-head-txt-label bc-head-icon-firefox_android">Firefox for Android</span></th><th class="bc-browser-opera_android"><span class="bc-head-txt-label bc-head-icon-opera_android">Opera for Android</span></th><th class="bc-browser-safari_ios"><span class="bc-head-txt-label bc-head-icon-safari_ios">Safari on iOS</span></th><th class="bc-browser-samsunginternet_android"><span class="bc-head-txt-label bc-head-icon-samsunginternet_android">Samsung Internet</span></th></tr></thead><tbody><tr><th scope="row"><code>&lt;url&gt;</code></th><td class="bc-supports-yes bc-browser-chrome"><span class="bc-browser-name">Chrome</span><abbr class="bc-level-yes only-icon" title="Full support"> <span>Full support</span> </abbr> <h2 id="See_also">See also</h2> <ul> <li><a href="/en-US/docs/Web/CSS/url()" title="The documentation about this has not yet been written; please consider contributing!"><code>url()</code></a></li> <li><a href="/en-US/docs/Web/CSS/gradient" title="The &lt;gradient> CSS data type is a special type of &lt;image> that consists of a progressive transition between two or more colors."><code>&lt;gradient&gt;</code></a></li> <li><a href="/en-US/docs/Web/CSS/element()" title="REDIRECT element [en-US]"><code>element()</code></a></li> <li><a href="/en-US/docs/Web/CSS/_image" title="The documentation about this has not yet been written; please consider contributing!"><code>image()</code></a></li> <li><a href="/en-US/docs/Web/CSS/image-set" title="The documentation about this has not yet been written; please consider contributing!"><code>image-set()</code></a></li> <li><a href="/en-US/docs/Web/CSS/cross-fade" title="The CSS cross-fade() function can be used to blend two or more images at a defined transparency."><code>cross-fade()</code></a></li> </ul> <div id="auth-modal" class="modal hidden"> <section class="auth-providers" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modal-main-heading"> <header> <h2 id="modal-main-heading">Sign In</h2> </header> <p> Sign in to enjoy the benefits of an MDN account. If you haven’t already created an account, you will be prompted to do so after signing in. </p> <div class="auth-button-container"> <a href="/users/github/login/" class="github-auth" data-first-focusable="true"> Sign in with Github </a> <a href="/users/google/login/" class="google-auth"> Sign in with Google </a> </div> <button id="close-modal" class="close-modal" data-last-focusable="true"> <span>Close modal</span> </button> </section> </div> </body> </html>';
		let fds = [];
		syndication.webPageFeedsDiscovery(outerHTML, 50000, "winLocation.origin", 0, (fd) => fds.push(fd)).then((result) => {
			output += "FEED-COUNT\n" + result.length + "\n\n~~~~~~~~\n\n";
		}).catch((error) => {
			output += error + "\n\n";
		}).finally(() => {
			slUtil.sleep(3000).then(() => {
				output += "FEED-DATAS\n" + JSON.stringify(fds, undefined, 2) + "\n\n~~~~~~~~\n\n";
				document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;
			});
		});
	}
}
