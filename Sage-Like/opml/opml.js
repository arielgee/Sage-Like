"use strict"

let opml = (function() {

	//////////////////////////////////////////
	//////////////////////////////////////////
	let importFeeds = (function() {

		let m_xhr;
		let m_objUrl = null;
		let m_funcImportResolve;
		let m_funcImportReject;
		let m_objOpenTreeFolders = null;
		let m_objTreeFeedsData = null;
		let m_feedCount;
		let m_folderCount;
		let m_outlineCount;

		////////////////////////////////////////////////////////////////////////////////////
		function run(file) {

			return new Promise((resolve, reject) => {

				m_funcImportResolve = resolve;
				m_funcImportReject = reject;

				m_objUrl = URL.createObjectURL(file);

				m_xhr = new XMLHttpRequest();
				m_xhr.open("GET", m_objUrl);
				m_xhr.overrideMimeType("text/xml");
				m_xhr.addEventListener("load", onLoad);
				m_xhr.addEventListener("error", onError);
				m_xhr.addEventListener("loadend", onLoadEnd);
				m_xhr.send();
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onLoad() {
			processOpmlDocument(m_xhr.responseXML);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onError(event) {
			console.log("[Sage-Like]", event);
			m_funcImportReject(event);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onLoadEnd() {
			m_xhr.removeEventListener("load", onLoad);
			m_xhr.removeEventListener("error", onError);
			m_xhr.removeEventListener("error", onLoadEnd);

			if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
			m_objUrl = null;
			m_xhr = null;
		}

		////////////////////////////////////////////////////////////////////////////////////
		function processOpmlDocument(xmlDoc) {

			if(!xmlDoc) {
				return m_funcImportReject("This file may not be a valid OPML file.");
			}

			let nodeTitle = xmlDoc.querySelector("opml > head > title");
			let nodeCreated = xmlDoc.querySelector("opml > head > dateCreated");
			let nodeBody = xmlDoc.querySelector("opml > body");

			if(!nodeTitle || !nodeBody) {
				return m_funcImportReject("This file may not be a valid OPML file. Missing elements.");
			}
			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					return m_funcImportReject("Root feeds folder id not set (processOpmlDocument)");
				}

				let title = "Import - " + nodeTitle.textContent + (nodeCreated ? " (created: " + (new Date(nodeCreated.textContent)).toWebExtensionLocaleShortString() + ")": "");

				browser.bookmarks.create({parentId: folderId, title: title, type: "folder"}).then(async (created) => {

					m_objOpenTreeFolders = new OpenTreeFolders();
					m_objTreeFeedsData = new TreeFeedsData();

					await m_objOpenTreeFolders.getStorage();
					await m_objTreeFeedsData.getStorage();

					m_feedCount = m_folderCount = m_outlineCount = 0;

					for (let i=0, len=nodeBody.children.length; i<len; i++) {
						await processOutlines(nodeBody.children[i], created.id);
					}

					m_funcImportResolve({
						newFolderId: created.id,
						stats: {
							feedCount: m_feedCount,
							folderCount: m_folderCount,
							outlineCount: m_outlineCount,
						}
					});

				}).catch((error) => {
					m_funcImportReject(error);
				}).finally(() => {
					m_objOpenTreeFolders = null;
					m_objTreeFeedsData = null;
				});

			}).catch((error) => m_funcImportReject(error));
		}

		////////////////////////////////////////////////////////////////////////////////////
		async function processOutlines(node, parentId) {

			if(node.nodeName !== "outline") return;

			m_outlineCount++;

			let title = node.getAttribute("title") || node.getAttribute("text");
			let isFeed = node.hasAttribute("type") && node.getAttribute("type") === "rss" && node.hasAttribute("xmlUrl");

			let bmCreated;
			let newBmItem = {
				parentId: parentId,
				title: title.stripHtmlTags(),
			};

			if(node.children.length > 0 || !isFeed) {

				newBmItem.type = "folder";
				bmCreated = await browser.bookmarks.create(newBmItem);

				m_folderCount++;

				if(node.hasAttribute("data-wxsl-open") && node.getAttribute("data-wxsl-open") === "1") {
					m_objOpenTreeFolders.set(bmCreated.id);
				}

				for (let i=0, len=node.children.length; i<len; i++) {
					await processOutlines(node.children[i], bmCreated.id);
				}

			} else {

				newBmItem.url = node.getAttribute("xmlUrl").stripHtmlTags();
				if( !!slUtil.validURL(newBmItem.url) ) {

					newBmItem.type = "bookmark";
					bmCreated = await browser.bookmarks.create(newBmItem);

					m_feedCount++;

					let updateTitle = (node.hasAttribute("data-wxsl-updateTitle") && node.getAttribute("data-wxsl-updateTitle") === "1");
					let openInPreview = (node.hasAttribute("data-wxsl-openPreview") && node.getAttribute("data-wxsl-openPreview") === "1");
					m_objTreeFeedsData.set(bmCreated.id, { updateTitle: updateTitle, openInFeedPreview: openInPreview });
				} else {
					console.log("[Sage-Like]", "Failed to import invalid URL: ", newBmItem.title, ",", newBmItem.url);
				}
			}
		}

		return {
			run: run,
		};
	})();

	//////////////////////////////////////////
	//////////////////////////////////////////
	let exportFeeds = (function() {

		let m_objUrl = null;
		let m_funcExportResolve;
		let m_objOpenTreeFolders = null;
		let m_objTreeFeedsData = null;
		let m_feedCount;
		let m_folderCount;
		let m_fileName;

		////////////////////////////////////////////////////////////////////////////////////
		function run() {

			return new Promise((resolve, reject) => {

				m_funcExportResolve = resolve;

				let dateExport = new Date();
				let dateExportStr = dateExport.getFullYear() +
					(dateExport.getMonth()+1).toLocaleString('en', {minimumIntegerDigits:2}) +
					dateExport.getDate().toLocaleString('en', {minimumIntegerDigits:2}) + "-" +
					dateExport.getHours().toLocaleString('en', {minimumIntegerDigits:2}) +
					dateExport.getMinutes().toLocaleString('en', {minimumIntegerDigits:2}) +
					dateExport.getSeconds().toLocaleString('en', {minimumIntegerDigits:2});

				m_fileName = "sage-like-feeds-" + dateExportStr + ".opml"

				m_objOpenTreeFolders = new OpenTreeFolders();
				m_objTreeFeedsData = new TreeFeedsData();

				getFeedsAsOpmlLines(dateExport).then((opmlLines) => {

					let blob = new Blob([opmlLines.join("\n")], { type: "text/xml", endings: "native" });

					m_objUrl = URL.createObjectURL(blob);
					browser.downloads.onCreated.addListener(onCreatedDownload);
					browser.downloads.onChanged.addListener(onChangedDownload);
					browser.downloads.download({
						url: m_objUrl,
						filename: m_fileName,
						saveAs: true,
					}).catch((error) => {

						if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
						m_objUrl = null;

						if(error.message === "Download canceled by the user") {
							m_funcExportResolve({
								stats: {
									feedCount: 0,
									folderCount: 0,
								}
							});
						} else {
							reject(error);
						}
					});

				}).catch((error) => {
					reject(error);
				}).finally(() => {
					m_objOpenTreeFolders = null;
					m_objTreeFeedsData = null;
				});
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onCreatedDownload(downloadItem) {
			m_fileName = downloadItem.filename;
			browser.downloads.onCreated.removeListener(onCreatedDownload);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onChangedDownload(delta) {
			if (delta.state && delta.state.current === "complete") {

				if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
				m_objUrl = null;

				browser.downloads.onChanged.removeListener(onChangedDownload);
				m_funcExportResolve({
					fileName: m_fileName,
					stats: {
						feedCount: m_feedCount,
						folderCount: m_folderCount,
					}
				});
			}
		}

		////////////////////////////////////////////////////////////////////////////////////
		function getFeedsAsOpmlLines(dateExport) {

			return new Promise((resolve, reject) => {

				let lines = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
					"<opml version=\"1.0\">",
					"\t<head>",
					"\t\t<title>Sage-Like Feeds Export</title>",
					"\t\t<dateCreated>" + dateExport.toUTCString() + "</dateCreated>",
					"\t</head>",
				];

				let createOpmlData = function (lines, bookmark, indent, openFolder = false) {

					if (bookmark.type === "folder") {

						lines.push("\t".repeat(indent++) +
							"<outline text=\"" + bookmark.title.escapeMarkup() + "\" " +
							"data-wxsl-open=\"" + Number(m_objOpenTreeFolders.exist(bookmark.id) || openFolder) + "\">");	// Number() converts true/false to 1/0

						m_folderCount++;

						for (let child of bookmark.children) {
							createOpmlData(lines, child, indent);
						}

						lines.push("\t".repeat(--indent) + "</outline>");

					} else if (bookmark.type === "bookmark") {

						let title = bookmark.title.escapeMarkup();

						lines.push("\t".repeat(indent) +
							"<outline type=\"rss\" " +
							"text=\"" + title + "\" " +
							"title=\"" + title + "\" " +
							"xmlUrl=\"" + bookmark.url.escapeMarkup() + "\" " +
							"data-wxsl-updateTitle=\"" + Number(m_objTreeFeedsData.value(bookmark.id).updateTitle) + "\" " +
							"data-wxsl-openPreview=\"" + Number(m_objTreeFeedsData.value(bookmark.id).openInFeedPreview) + "\"/>");

						m_feedCount++;
					}
				};

				m_feedCount = m_folderCount = 0;

				let gettingOSF = m_objOpenTreeFolders.getStorage();		// get folder's open/closed state from local storage
				let gettingTFD = m_objTreeFeedsData.getStorage();		// get feed data from local storage
				let gettingRFFI = prefs.getRootFeedsFolderId();

				gettingOSF.then(() => {
					gettingTFD.then(() => {
						gettingRFFI.then((folderId) => {

							if (folderId === slGlobals.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
								return reject("Root feeds folder id not set (getFeedsAsOpmlText)");
							}

							browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
								lines.push("\t<body>");
								createOpmlData(lines, bookmarks[0], 2, true);
								lines.push("\t</body>", "</opml>");
								resolve(lines);
							}).catch((error) => reject(error));

						}).catch((error) => reject(error));
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
