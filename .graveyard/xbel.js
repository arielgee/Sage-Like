"use strict"

let xbel = (function() {

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
			processXbelDocument(m_xhr.responseXML);
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
		function processXbelDocument(xmlDoc) {

			if(!xmlDoc) {
				return m_funcImportReject("This file may not be a valid XBEL file.");
			}

			let nodeTitle = xmlDoc.querySelector("xbel > metadata > title");
			let nodeCreated = xmlDoc.querySelector("xbel > metadata > dateCreated");
			let nodeBody = xmlDoc.querySelector("xbel");

			if(!nodeTitle || !nodeBody) {
				return m_funcImportReject("This file may not be a valid XBEL file. Missing elements.");
			}
			prefs.getRootFeedsFolderId().then((folderId) => {

				if (folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
					return m_funcImportReject("Root feeds folder id not set (processXbelDocument)");
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

			if(node.nodeName !== "bookmark" && node.nodeName !== "folder") return;

			m_outlineCount++;

			let title = node.getAttribute("title") || node.getAttribute("text");
			let isFeed = (node.nodeName === "bookmark" && node.querySelector("metadata > xmlUrl"));

			let bmCreated;
			let newBmItem = {
				parentId: parentId,
				title: title.stripHtmlTags(),
			};

			if(node.nodeName === "folder" || !isFeed) {

				newBmItem.type = "folder";
				bmCreated = await browser.bookmarks.create(newBmItem);

				m_folderCount++;

				if(node.getAttribute("folded") === "no") {
					m_objOpenTreeFolders.set(bmCreated.id);
				}

				for (let i=0, len=node.children.length; i<len; i++) {
					await processOutlines(node.children[i], bmCreated.id);
				}

			} else {

				newBmItem.url = node.querySelector("metadata > xmlUrl").textContent.stripHtmlTags();
				if( !!slUtil.validURL(newBmItem.url) ) {

					newBmItem.type = "bookmark";
					bmCreated = await browser.bookmarks.create(newBmItem);

					m_feedCount++;

					let updateTitle = (node.querySelector("metadata > updateTitle") ? node.querySelector("metadata > updateTitle").textContent === "1" : true);
					let openInPreview = (node.querySelector("metadata > openPreview") ? node.querySelector("metadata > openPreview").textContent === "1" : false);
					let ignoreUpdates = (node.querySelector("metadata > ignoreUpdates") ? node.querySelector("metadata > ignoreUpdates").textContent === "1" : false);
					let feedMaxItems = (node.querySelector("metadata > feedMaxItems") ? Number(node.querySelector("metadata > feedMaxItems").textContent) : 0);

					m_objTreeFeedsData.set(bmCreated.id, {
						updateTitle: updateTitle,
						openInFeedPreview: openInPreview,
						ignoreUpdates: ignoreUpdates,
						feedMaxItems: feedMaxItems,
					});
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
				m_fileName = slUtil.getStringExportFileName(dateExport, "sage-like-feeds-", "xbel");

				m_objOpenTreeFolders = new OpenTreeFolders();
				m_objTreeFeedsData = new TreeFeedsData();

				getFeedsAsXbelLines(dateExport).then((xbelLines) => {

					let blob = new Blob([xbelLines.join("\n")], { type: "text/xml", endings: "native" });

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
		function getFeedsAsXbelLines(dateExport) {

			return new Promise((resolve, reject) => {

				let lines = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
					"<xbel version=\"1.0\">",
					"\t<metadata>",
					"\t\t<title>Sage-Like Feeds Export</title>",
					"\t\t<dateCreated>" + dateExport.toUTCString() + "</dateCreated>",
					"\t</metadata>",
				];

				let createXbelData = function (lines, bookmark, indent, openFolder = false) {

					if (bookmark.type === "folder") {

						lines.push("\t".repeat(indent++) +
							"<folder title=\"" + bookmark.title.escapeMarkup() + "\" " +
							"folded=\"" + (m_objOpenTreeFolders.exist(bookmark.id) || openFolder ? "no" : "yes") + "\">");

						m_folderCount++;

						for (let child of bookmark.children) {
							createXbelData(lines, child, indent);
						}

						lines.push("\t".repeat(--indent) + "</folder>");

					} else if (bookmark.type === "bookmark") {

						const title = bookmark.title.escapeMarkup();
						const feedData = m_objTreeFeedsData.value(bookmark.id);	// if bookmark.id not found return undefined

						lines.push("\t".repeat(indent) +
							"<bookmark href=\"" + bookmark.url.escapeMarkup() + "\">",
							"\t".repeat(indent + 1) + "<title>" + title + "</title>",
							"\t".repeat(indent + 1) + "<metadata>",
							"\t".repeat(indent + 2) + "<updateTitle>" + Number(!!feedData ? feedData.updateTitle : true) + "</updateTitle>",
							"\t".repeat(indent + 2) + "<openPreview>" + Number(!!feedData ? feedData.openInFeedPreview : false) + "</openPreview>",
							"\t".repeat(indent + 2) + "<ignoreUpdates>" + Number(!!feedData ? feedData.ignoreUpdates : false) + "</ignoreUpdates>",
							"\t".repeat(indent + 2) + "<feedMaxItems>" + ((!!feedData && !!feedData.feedMaxItems) ? feedData.feedMaxItems : 0) + "</feedMaxItems>",
							"\t".repeat(indent + 1) + "</metadata>",
							"\t".repeat(indent) + "</bookmark>"
						);
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

							if (folderId === Global.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
								return reject("Root feeds folder id not set (getFeedsAsXbelText)");
							}

							browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
								lines.push("\t<body>");
								createXbelData(lines, bookmarks[0], 2, true);
								lines.push("\t</body>", "</xbel>");
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
