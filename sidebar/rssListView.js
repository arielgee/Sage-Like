"use strict";

let rssListView = (function () {

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setListFromUrl = function (feedUrl) {

		let elmList = document.getElementById("rssListView");

		// empty list
		while (elmList.firstChild) {
			elmList.removeChild(elmList.firstChild);
		}

		fetch(feedUrl).then((res) => {

			if (res.ok) {
				res.text().then((xmlTxt) => {

					console.log("[setListFromUrl]", xmlTxt);

					let domParser = new DOMParser();
					let doc = domParser.parseFromString(xmlTxt, 'text/xml');

					doc.querySelectorAll('item').forEach((item) => {
						appendNewTagIL(elmList, item.querySelector('title').textContent);
					});
				});
			} else {
				appendNewTagIL(elmList, res.status);
			}
		}).catch((reason) => {
			appendNewTagIL(elmList, reason);
		});
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	let appendNewTagIL = function (elmUL, textContent) {

		let elm = document.createElement("li");
		//elm.className = "listitem";
		elm.textContent = textContent;
		elmUL.appendChild(elm);
	};

	return {
		setListFromUrl: setListFromUrl,
	};

})();