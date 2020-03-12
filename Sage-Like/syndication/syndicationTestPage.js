"use strict";

document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

function onDOMContentLoaded() {

	let now = Date.now().toString();
	document.getElementById("now").innerHTML = now;
	// document.getElementById("now").style.backgroundColor = "#" + now.substring(10);
	// document.getElementById("now").style.color = "#FFF" + now.substring(10);
	document.documentElement.style.backgroundColor = "#" + now.substring(10);
	document.documentElement.style.color = "#FFF" + now.substring(10);


	let output = "";
	let line = "=".repeat(36);

	let url = "https://www.iosicongallery.com/feed.json";
	let txtRssNoProlog = '<rss xmlns:content = "http://purl.org/rss/1.0/modules/content/" xmlns:wfw = "http://wellformedweb.org/CommentAPI/" xmlns:dc = "http://purl.org/dc/elements/1.1/" xmlns:atom = "http://www.w3.org/2005/Atom" xmlns:sy = "http://purl.org/rss/1.0/modules/syndication/" xmlns:slash = "http://purl.org/rss/1.0/modules/slash/" xmlns:feedburner = "http://rssnamespace.org/feedburner/ext/1.0" version = "2.0"> <channel> <title>TechCrunch</title> <link>https://techcrunch.com</link> <description>TechCrunch is a group-edited blog that profiles the companies, products and events defining and transforming the new web.</description> <lastBuildDate>Wed, 11 Mar 2020 15:08:04 +0000</lastBuildDate> <language>en-US</language> <sy:updatePeriod>hourly</sy:updatePeriod> <sy:updateFrequency>1</sy:updateFrequency> <generator>https://wordpress.org/?v=5.3.2</generator> <image> <link>http://www.techcrunch.com</link> <url>http://www.techcrunch.com/wp-content/themes/techcrunchmu/images/techcrunch_logo.png</url> <title>TechCrunch</title> </image> <site xmlns = "com-wordpress:feed-additions:1">136296444</site> <atom10:link xmlns:atom10 = "http://www.w3.org/2005/Atom" rel = "self" type = "application/rss+xml" href = "http://feeds.feedburner.com/Techcrunch"/> <feedburner:info uri = "techcrunch"/> <atom10:link xmlns:atom10 = "http://www.w3.org/2005/Atom" rel = "hub" href = "http://pubsubhubbub.appspot.com/"/> <item> <title>Cloud’s growth cycle isn’t behind us yet</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/I7-tugfGClk/</link> <comments>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:02:25 +0000</pubDate> <dc:creator><![CDATA[Alex Wilhelm]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1957308</guid> <description><![CDATA[Our goal is to get a handle on how two large, public SaaS players think about the world as they compete for growth and market share.]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1957308</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/clouds-growth-cycle-isnt-behind-us-yet/</feedburner:origLink> </item> <item> <title>PandaDoc introduces new template-driven editor to ease sales doc production</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/41jAdfbfKjs/</link> <comments>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:55 +0000</pubDate> <dc:creator><![CDATA[Ron Miller]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1957354</guid> <description><![CDATA[PandaDoc, a sales-focused document automation startup, announced a new web-based document production editor today that allows sales teams to quickly generate proposals and contracts from design templates. The templates give a consistent and professional look to these documents, which might otherwise be produced in a word processor like Word or Google Docs. While customers are [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1957354</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/pandadoc-introduces-new-template-driven-editor-to-ease-sales-doc-production/</feedburner:origLink> </item> <item> <title>Applications for TC Pitch Night: Mobility 2020 are now open</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/HGi7e1f64JA/</link> <comments>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:36 +0000</pubDate> <dc:creator><![CDATA[Neesha A. Tambe]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1951131</guid> <description><![CDATA[Founders: it&#8217;s time to get moving. On May 13, the night before TC Sessions: Mobility 2020, TechCrunch is hosting a private Pitch Night for mobility-focused startups. We&#8217;re looking to feature 10 early stage mobility startups that are breaking barriers in the industry. TechCrunch is always on the hunt for the most disruptive tech in the [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1951131</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/</feedburner:origLink> </item><item> <title>Applications for TC Pitch Night: Mobility 2020 are now open</title> <link>http://feedproxy.google.com/~r/Techcrunch/~3/HGi7e1f64JA/</link> <comments>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/#respond</comments> <pubDate>Wed, 11 Mar 2020 15:00:36 +0000</pubDate> <dc:creator><![CDATA[Neesha A. Tambe]]></dc:creator> <guid isPermaLink = "false">https://techcrunch.com/?p=1951131</guid> <description><![CDATA[Founders: it&#8217;s time to get moving. On May 13, the night before TC Sessions: Mobility 2020, TechCrunch is hosting a private Pitch Night for mobility-focused startups. We&#8217;re looking to feature 10 early stage mobility startups that are breaking barriers in the industry. TechCrunch is always on the hunt for the most disruptive tech in the [&#8230;]]]></description> <wfw:commentRss>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/feed/</wfw:commentRss> <slash:comments>0</slash:comments> <post-id xmlns = "com-wordpress:feed-additions:1">1951131</post-id> <feedburner:origLink>https://techcrunch.com/2020/03/11/applications-for-tc-pitch-night-mobility-2020-are-now-open/</feedburner:origLink> </item> </channel> </rss>';
	let txtJson = '{"version": "https://jsonfeed.org/version/1","title": "iOS Icon Gallery","description": "Showcasing beautiful icon designs from the iOS App Store","home_page_url": "https://www.iosicongallery.com","feed_url": "https://www.iosicongallery.com/feed.json","author": {"name": "Jim Nielsen","url": "http://jim-nielsen.com/"   },   "icon": "https://www.iosicongallery.com/assets/images/ios-icon.png",   "favicon": "https://www.iosicongallery.com/assets/images/ios-favicon.ico",   "items": [     {       "id": "snooze-hypnose-sommeil-2020-03-03",       "url": "https://www.iosicongallery.com/icons/snooze-hypnose-sommeil-2020-03-03/",       "title": "Snooze - Hypnose sommeil",       "date_published": "2020-03-03T00:00:00.000Z"},{"id": "scanner-2020-03-03","url": "https://www.iosicongallery.com/icons/scanner-2020-03-03/","title": "Scanner ·","date_published": "2020-03-03T00:00:00.000Z"}] }';
	let txtRss = '<?xml version="1.0" encoding="UTF-8"?> <?xml-stylesheet type="text/xsl" media="screen" href="/~d/styles/rss2full.xsl"?> <?xml-stylesheet type="text/css" media="screen" href="http://feeds.feedburner.com/~d/styles/itemcontent.css"?>' + txtRssNoProlog;
	let txtRdf = '<?xml version="1.0" encoding="UTF-8"?> <rdf:RDF xmlns:rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc = "http://purl.org/dc/elements/1.1/" xmlns:sy = "http://purl.org/rss/1.0/modules/syndication/" xmlns:admin = "http://webns.net/mvcb/" xmlns = "http://purl.org/rss/1.0/" xml:lang = "ja"> <channel rdf:about = "https://f1-gate.com/"> <title>F1-Gate.com</title> <link>https://f1-gate.com/</link> <description></description> <dc:language>ja</dc:language> <items> <rdf:Seq> <rdf:li rdf:resource = "https://f1-gate.com/alphatauri/f1_55212.html"/> <rdf:li rdf:resource = "https://f1-gate.com/redbull/f1_55209.html"/> <rdf:li rdf:resource = "https://f1-gate.com/driver/f1_55213.html"/> </rdf:Seq> </items> </channel> <item rdf:about = "https://f1-gate.com/alphatauri/f1_55212.html"> <title>WWWWWWWWWWWF1 WWWWWWWWWWWWWW1WWWWWW</title> <link>https://f1-gate.com/alphatauri/f1_55212.html</link> <description> WWWWWWWWWWWF1WWWWWWWWWWWWWWWWWWWWWWWWWW2W F1WWWWWWWW1WWWWWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW... <a href = "https://f1-gate.com/alphatauri/f1_55212.html">WWWWW</a> </description> <dc:subject>WWWWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T16:43:58+09:00</dc:date> </item> <item rdf:about = "https://f1-gate.com/redbull/f1_55209.html"> <title>WWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWW</title> <link>https://f1-gate.com/redbull/f1_55209.html</link> <description> WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW2WF1WWWWWWWW1WWWWWWWWWWWW WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW3W... <a href = "https://f1-gate.com/redbull/f1_55209.html">WWWWW</a> </description> <dc:subject>WWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T12:57:49+09:00</dc:date> </item> <item rdf:about = "https://f1-gate.com/driver/f1_55213.html"> <title>W2W F1WWWWWWWW1WW : WF1WWWWWWWWW</title> <link>https://f1-gate.com/driver/f1_55213.html</link> <description> 2020WWF1WWWWWWWWWWW2WWWWW2W26W(W)WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW W1WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW... <a href = "https://f1-gate.com/driver/f1_55213.html">WWWWW</a> </description> <dc:subject>F1WWWWW</dc:subject> <dc:creator>F1-Gate.com</dc:creator> <dc:date>2020-02-27T12:03:25+09:00</dc:date> </item> </rdf:RDF> ';
	let txtAtom = '<?xml version="1.0" encoding="UTF-8"?> <feed xmlns = "http://www.w3.org/2005/Atom"> <category term = "worldnews" label = "r/worldnews"/> <updated>2020-03-10T15:05:39+00:00</updated> <icon>https://www.redditstatic.com/icon.png/</icon> <id>/r/worldnews/.rss?_SLWxoPenuRl=nOtinFEeDPREVIew</id> <link rel = "self" href = "https://www.reddit.com/r/worldnews/.rss?_SLWxoPenuRl=nOtinFEeDPREVIew" type = "application/atom+xml"/> <link rel = "alternate" href = "https://www.reddit.com/r/worldnews/?_SLWxoPenuRl=nOtinFEeDPREVIew" type = "text/html"/> <subtitle>A place for major news from around the world, excluding US-internal news.</subtitle> <title>World News</title> <entry> <author> <name>/u/valuingvulturefix</name> <uri>https://www.reddit.com/user/valuingvulturefix</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/valuingvulturefix&quot;&gt; /u/valuingvulturefix &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/live/14d816ty1ylvo/&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/ffpi7m/livethread_global_covid19_outbreak/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_ffpi7m</id> <link href = "https://www.reddit.com/r/worldnews/comments/ffpi7m/livethread_global_covid19_outbreak/"/> <updated>2020-03-09T04:53:08+00:00</updated> <title>Livethread: Global COVID-19 outbreak</title> </entry> <entry> <author> <name>/u/NoKidsItsCruel</name> <uri>https://www.reddit.com/user/NoKidsItsCruel</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/NoKidsItsCruel&quot;&gt; /u/NoKidsItsCruel &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.independent.co.uk/news/world/europe/coronavirus-italy-economy-mortgage-payments-symptoms-lockdown-latest-a9389486.html&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/fgbdzv/italy_suspends_mortgage_payments_amid_lockdown/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_fgbdzv</id> <link href = "https://www.reddit.com/r/worldnews/comments/fgbdzv/italy_suspends_mortgage_payments_amid_lockdown/"/> <updated>2020-03-10T09:54:24+00:00</updated> <title>Italy suspends mortgage payments amid lockdown</title> </entry> <entry> <author> <name>/u/Viking_Sail</name> <uri>https://www.reddit.com/user/Viking_Sail</uri> </author> <category term = "worldnews" label = "r/worldnews"/> <content type = "html">&amp;#32; submitted by &amp;#32; &lt;a href=&quot;https://www.reddit.com/user/Viking_Sail&quot;&gt; /u/Viking_Sail &lt;/a&gt; &lt;br/&gt; &lt;span&gt;&lt;a href=&quot;https://www.newsweek.com/chinese-company-donates-tens-thousands-masks-coronavirus-striken-italy-says-we-are-waves-1491233&quot;&gt;[link]&lt;/a&gt;&lt;/span&gt; &amp;#32; &lt;span&gt;&lt;a href=&quot;https://www.reddit.com/r/worldnews/comments/fg5z7w/chinese_electronics_company_xiaomi_donates_tens/&quot;&gt;[comments]&lt;/a&gt;&lt;/span&gt;</content> <id>t3_fg5z7w</id> <link href = "https://www.reddit.com/r/worldnews/comments/fg5z7w/chinese_electronics_company_xiaomi_donates_tens/"/> <updated>2020-03-10T01:35:12+00:00</updated> <title>Chinese electronics company Xiaomi donates tens of thousands of face masks to Italy. Shipment crates feature quotes from Roman philosopher Seneca &quot;We are waves of the same sea&quot;.</title> </entry> </feed>';


	{
		let objFeed;
		let data;
		let list;

		objFeed = Feed.factoryCreateFeed(txtJson, url);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof JsonFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateFeed(txtRss, url);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RssFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateFeed(txtRdf, url);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RdfFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateFeed(txtRssNoProlog, url);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof RssFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		objFeed = Feed.factoryCreateFeed(txtAtom, url);
		data = objFeed.getFeedData();
		list = objFeed.getFeedItems(data);
		objFeed.dispose();
		console.log("[Sage-Like]", objFeed.className, objFeed instanceof AtomFeed, "\n", data, list);
		output += JSON.stringify(data, undefined, 2) + "\n\n-----------\n\n";
		output += JSON.stringify(list, undefined, 2) + "\n\n########################\n\n";

		document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;
	}


	// let urlJson = "https://www.iosicongallery.com/feed.json";
	// let urlRSS = "https://developer.mozilla.org/devnews/index.php/feed/atom/";
	// let urlAtom = "https://f1-gate.com/atom.xml";
	// let urlRDF = "https://f1-gate.com/index.rdf";
	// let urlNotJsonXml = "https://www.rapidtables.com/web/color/html-color-codes.html";
	// let urlJunk = "http://www.asas.com";
	// let urlNoFeedXML = "http://advs-crm3.dev.com:90/WS/WebsiteServices.svc?singleWsdl";


	// let testURL = urlJson;

	// syndicationOO.fetchFeedData(testURL, 5000).then((fetchResult) => {

	// 	output += JSON.stringify(fetchResult.feedData, undefined, 2) + "\n\n";

	// }).catch((error) => {
	// 	output += error + "\n\n";
	// }).finally(() => {
	// 	document.getElementById("testData").innerHTML = line + "START" + line + "\n\n" + output + line + "=END=" + line;
	// });




}