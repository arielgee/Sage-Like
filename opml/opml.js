"use strict"

let opml = (function() {

	let m_funcExportResolve;
	let m_funcImportResolve;


	////////////////////////////////////////////////////////////////////////////////////
	function exportFeeds() {

		return new Promise((resolve) => {

			m_funcExportResolve = resolve;

			getFeedsAsOpmlBody().then((opmlLines) => {

				let opmlHeadLines = ["<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
					"<opml version=\"1.0\">",
					"\t<head>",
					"\t\t<title>Sage-Like Feeds - OPML Export</title>",
					"\t\t<dateCreated>" + slUtil.getCurrentLocaleDate() + "</dateCreated>",
					"\t</head>",
				];

				opmlLines.splice(0, 0, opmlHeadLines.join("\n"));
				opmlLines.push("</opml>");

				let blob = new Blob([opmlLines.join("\n")], { type: "text/xml", endings: "native" });

				let objUrl = URL.createObjectURL(blob);
				browser.downloads.onChanged.addListener(onChangedDownload);
				let downloading = browser.downloads.download({
					url : objUrl,
					filename : "sage-like.opml",
					saveAs: true,
				});

				downloading.catch(() => m_funcExportResolve() );

			}).catch((error) => {
				m_funcExportResolve();
				console.log("[Sage-Like]", error);
			});
		});
    }

	////////////////////////////////////////////////////////////////////////////////////
	function importFeeds() {

		return new Promise((resolve) => {
			m_funcImportResolve = resolve;
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
	function getFeedsAsOpmlBody() {

		return new Promise((resolve, reject) => {

			let lines = [];
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
				}

				browser.bookmarks.getSubTree(folderId).then((bookmarks) => {
					lines.push("\t<body>");
					createOpmlData(lines, bookmarks[0], 2);
					lines.push("\t</body>");
					resolve(lines);
				}).catch((error) => reject(error));
			}).catch((error) => reject(error));
		});
	}

	return {
        exportFeeds: exportFeeds,
        importFeeds: importFeeds,
	};

})();


