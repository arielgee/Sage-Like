"use strict";

let discoverView = (function () {

    const MSGID_GET_DOC_TEXT_HTML = "msgGetDocumentTextHTML";


    let elmDiscoverPanel = null;
    let elmDiscoverFeedsList;

    let elmButtonAdd;
    let elmButtonCancel;


    /**************************************************/
    browser.runtime.onMessage.addListener((message) => {
        if(message.id === MSGID_GET_DOC_TEXT_HTML) {
            loadDiscoverFeedsList(message.txtHTML);
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let open = function () {

        elmDiscoverPanel = document.getElementById("discoverPanel");
        elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
        elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
        elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");

		elmDiscoverPanel.addEventListener("blur", onBlurDiscoverPanel);
        elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonAdd.addEventListener("click", onClickButtonAdd);
        elmButtonCancel.addEventListener("click", onClickButtonCancel);


        emptyDescoverFeedsList();

        let code = "browser.runtime.sendMessage( { id: \"" + MSGID_GET_DOC_TEXT_HTML + "\"," +
                                                  "txtHTML: document.documentElement.outerHTML } );";

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			browser.tabs.executeScript(tab.id, { code: code, runAt: "document_start" }).then((results) => {
                elmDiscoverPanel.style.display = "block";
                elmDiscoverPanel.focus();
            }).catch((error) => {
                console.log("[Sage-Like]", error);
            });
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let close = function () {

        elmDiscoverPanel.style.display = "none";
        emptyDescoverFeedsList();

        elmDiscoverPanel.removeEventListener("blur", onBlurDiscoverPanel);
        elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonAdd.removeEventListener("click", onClickButtonAdd);
        elmButtonCancel.removeEventListener("click", onClickButtonCancel);
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let isOpen = function () {
        return (elmDiscoverPanel !== null && elmDiscoverPanel.style.display === "block");
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let loadDiscoverFeedsList = function (txtHTML) {

        setDiscoverLoadingState(true);
        syndication.discoverWebSiteFeeds(txtHTML).then((discoveredFeedsList) => {

            emptyDescoverFeedsList();

            let feed, index = 1
            for(let key in discoveredFeedsList) {

                feed = discoveredFeedsList[key];

                if(feed.status === "OK") {
                    elmDiscoverFeedsList.appendChild(createTagLI(index++, feed.title, feed.url, feed.lastUpdated, feed.format, feed.items));
                } else if(feed.status === "error") {
                    console.log("[sage-like]", feed.message);
                }
            }
            if(elmDiscoverFeedsList.children.length === 0) {
                setNoValidFeedsFoundMsg();
            }
            setDiscoverLoadingState(false);
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let emptyDescoverFeedsList = function () {
        while(elmDiscoverFeedsList.firstChild) {
            elmDiscoverFeedsList.removeChild(elmDiscoverFeedsList.firstChild);
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let createTagLI = function (index, text, url, lastUpdated, format, items) {

        let elmCheckBox = document.createElement("input");
        let elmLabel = document.createElement("label");
        let elmListItem = document.createElement("li");

        // create unique id from timestamp
        elmCheckBox.id = "chkBox" + index;
        elmCheckBox.className = "dfChkBox";
        elmCheckBox.type = "checkbox";

        elmLabel.className = "dfLabel";
        elmLabel.htmlFor = elmCheckBox.id;
        elmLabel.textContent = text;

        elmListItem.className = "dfItem";
        elmListItem.setAttribute("href", url);
        elmListItem.title += format      ? "Format:\u0009\u0009" + format + "\u000d" : "";
        elmListItem.title += lastUpdated ? "Updated:\u0009\u0009" + (lastUpdated.toLocaleString() || lastUpdated) + "\u000d" : "";
        elmListItem.title += items       ? "Items:\u0009\u0009" + items + "\u000d" : "";
        elmListItem.title += "URL:  \u0009\u0009" + url;

        elmListItem.appendChild(elmCheckBox);
        elmListItem.appendChild(elmLabel);

        return elmListItem;
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let setNoValidFeedsFoundMsg = function () {
        let elm = document.createElement("li");
        elm.className = "dfItem novalidfeeds";
        elm.textContent = "No valid feeds were discovered.";
        elmDiscoverFeedsList.appendChild(elm);
    };

	////////////////////////////////////////////////////////////////////////////////////
	//
	function setDiscoverLoadingState(isLoading) {

		if (isLoading === true) {
			lzUtil.concatClassName(elmDiscoverPanel, "loading");
		} else {
			lzUtil.removeClassName(elmDiscoverPanel, "loading");
		}
	}

    ////////////////////////////////////////////////////////////////////////////////////
    //
    //      Events
    //
    ////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onBlurDiscoverPanel (event) {

        console.log("[sage-like-blur]", event);
        if((event.relatedTarget === null || !(elmDiscoverPanel.contains(event.relatedTarget))) /*&& event.explicitOriginalTarget !== elmDiscoverPanel*/) {
            close();
        } else {
            setTimeout(() => { elmDiscoverPanel.focus(); }, 100);
            setTimeout(() => { elmDiscoverPanel.focus(); }, 200);
            setTimeout(() => { elmDiscoverPanel.focus(); }, 300);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onKeyDownDiscoverPanel (event) {
		switch (event.key.toLowerCase()) {
			case "escape":
				close()
				break;
		}
        close();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onClickButtonAdd (event) {
        close();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onClickButtonCancel (event) {
        close();
    }

    return {
        open: open,
        close: close,
        isOpen: isOpen,
    };

})();
