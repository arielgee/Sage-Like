"use strict"

let opml = (function() {

	//////////////////////////////////////////
	//////////////////////////////////////////
	let importFeeds = (function() {

		let m_xhr;
		let m_funcImportResolve;
		let m_funcImportReject;

		////////////////////////////////////////////////////////////////////////////////////
		function run(file) {

			return new Promise((resolve, reject) => {

				m_funcImportResolve = resolve;
				m_funcImportReject = reject;

				let objUrl = URL.createObjectURL(file);

				m_xhr = new XMLHttpRequest();
				m_xhr.open("GET", objUrl);
				m_xhr.overrideMimeType("text/xml");
				m_xhr.addEventListener("load", onLoad);
				m_xhr.addEventListener("error", onError);
				m_xhr.send();
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onLoad() {
			m_xhr.removeEventListener("load", onLoad);
			processOpmlDocument(m_xhr.responseXML);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onError(event) {
			console.log("[Sage-Like]", event);
			m_xhr.removeEventListener("error", onError);
			m_funcImportReject(event);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function processOpmlDocument(xmlDoc) {

			if(!xmlDoc) {
				m_funcImportReject("This file may not be a valid OPML file.");
				return;
			}

			let nodeTitle = xmlDoc.querySelector("opml > head > title");
			let nodeCreated = xmlDoc.querySelector("opml > head > dateCreated");
			let nodeBody = xmlDoc.querySelector("opml > body");

			if(!nodeTitle || !nodeBody) {
				m_funcImportReject("This file may not be a valid OPML file. Missing elements.");
				return;
			}
			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					m_funcImportReject("Root feeds folder id not set (processOpmlDocument)");
					return;
				}

				let title = "Import - " + nodeTitle.textContent + (nodeCreated ? " (created: " + (new Date(nodeCreated.textContent)).toWebExtensionLocaleShortString() + ")": "");

				browser.bookmarks.create({parentId: folderId, title: title, type: "folder"}).then(async (created) => {
					for (let i=0, len=nodeBody.children.length; i<len; i++) {
						await processOutlines(nodeBody.children[i], created.id);
					}
					m_funcImportResolve(created.id);
				});

			}).catch((error) => m_funcImportReject(error));
		}

		////////////////////////////////////////////////////////////////////////////////////
		async function processOutlines(node, parentId) {

			if(node.nodeName !== "outline") return;

			let title = node.getAttribute("title") || node.getAttribute("text");
			let isFeed = node.hasAttribute("type") && node.getAttribute("type") === "rss" && node.hasAttribute("xmlUrl");

			let newBmItem = {
				parentId: parentId,
				title: title.stripHtmlTags(),
			};

			if(node.children.length > 0 || !isFeed) {

				newBmItem.type = "folder";
				let fld = await browser.bookmarks.create(newBmItem);
				for (let i=0, len=node.children.length; i<len; i++) {
					await processOutlines(node.children[i], fld.id);
				}

			} else {

				newBmItem.type = "bookmark";
				newBmItem.url = node.getAttribute("xmlUrl").stripHtmlTags();
				await browser.bookmarks.create(newBmItem);
			}
		}

		return {
			run: run,
		};
	})();

	//////////////////////////////////////////
	//////////////////////////////////////////
	let exportFeeds = (function() {

		let m_funcExportResolve;

		////////////////////////////////////////////////////////////////////////////////////
		function run() {

			return new Promise((resolve, reject) => {

				m_funcExportResolve = resolve;

				getFeedsAsOpmlLines().then((opmlLines) => {

					let blob = new Blob([opmlLines.join("\n")], { type: "text/xml", endings: "native" });

					let objUrl = URL.createObjectURL(blob);
					browser.downloads.onChanged.addListener(onChangedDownload);
					browser.downloads.download({
						url: objUrl,
						filename: "sage-like.opml",
						saveAs: true,
					}).catch((error) => {
						if(error.message === "Download canceled by the user") {
							m_funcExportResolve();
						} else {
							reject(error);
						}
					});

				}).catch((error) => {
					reject(error);
					console.log("[Sage-Like]", error);
				});
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onChangedDownload(delta) {
			if (delta.state && delta.state.current === "complete") {
				browser.downloads.onChanged.removeListener(onChangedDownload);
				m_funcExportResolve();
			}
		}

		////////////////////////////////////////////////////////////////////////////////////
		function getFeedsAsOpmlLines() {

			return new Promise((resolve, reject) => {

				let lines = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
					"<opml version=\"1.0\">",
					"\t<head>",
					"\t\t<title>Sage-Like Feeds Export</title>",
					"\t\t<dateCreated>" + (new Date()).toUTCString() + "</dateCreated>",
					"\t</head>",
				];

				let createOpmlData = function (lines, bookmark, indent) {

					if (bookmark.type === "folder") {

						lines.push("\t".repeat(indent++) + "<outline text=\"" + bookmark.title + "\">");

						for (let child of bookmark.children) {
							createOpmlData(lines, child, indent);
						}

						lines.push("\t".repeat(--indent) + "</outline>");

					} else if (bookmark.type === "bookmark") {
						let title = bookmark.title.escapeHtml();
						lines.push("\t".repeat(indent) + "<outline type=\"rss\" text=\"" + title + "\" title=\"" + title + "\" xmlUrl=\"" + bookmark.url.escapeHtml() + "\"/>");
					}
				};

				prefs.getRootFeedsFolderId().then((folderId) => {

					if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
						reject("Root feeds folder id not set (getFeedsAsOpmlText)");
						return;
					}

					browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
						lines.push("\t<body>");
						createOpmlData(lines, bookmarks[0], 2);
						lines.push("\t</body>", "</opml>");
						resolve(lines);
					}).catch((error) => reject(error));
				}).catch((error) => reject(error));
			});
		}

		return {
			run: run,
		};
	})();

	return {
        importFeeds: importFeeds,
        exportFeeds: exportFeeds,
	};
})();


