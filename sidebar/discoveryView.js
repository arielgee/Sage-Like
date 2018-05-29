"use strict";

let discoverView = (function () {

    const MSGID_GET_DOC_TEXT_HTML = "msgGetDocumentTextHTML";

    let elmMainPanel = null;
    let elmDiscoverPanel = null;
    let elmLabelDomainName;
    let elmDiscoverFeedsList;

    let elmButtonRediscover;
    let elmButtonAdd;
    let elmButtonCancel;


    /**************************************************/
    browser.runtime.onMessage.addListener((message) => {
        if(message.id === MSGID_GET_DOC_TEXT_HTML) {
            loadDiscoverFeedsList(message.txtHTML, message.domainName);            
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let open = function () {

        elmMainPanel = document.getElementById("mainPanel");
        elmDiscoverPanel = document.getElementById("discoverPanel");
        elmLabelDomainName = document.getElementById("lblDomainName");
        elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
        elmButtonRediscover = document.getElementById("btnRediscover");
        elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
        elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");

        elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonRediscover.addEventListener("click", onClickButtonRediscover);
        elmButtonAdd.addEventListener("click", onClickButtonAdd);
        elmButtonCancel.addEventListener("click", onClickButtonCancel);

        runDiscoverFeeds();
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let close = function () {

        slUtil.disableElementTree(elmMainPanel, false);
        elmDiscoverPanel.style.display = "none";
        emptyDescoverFeedsList();

        elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonRediscover.removeEventListener("click", onClickButtonRediscover);
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
    let runDiscoverFeeds = function () {

        emptyDescoverFeedsList();

        let code = "browser.runtime.sendMessage( { id: \"" + MSGID_GET_DOC_TEXT_HTML + "\"," +
                                                  "txtHTML: document.documentElement.outerHTML," +
                                                  "domainName: document.domain, } );";

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

			browser.tabs.executeScript(tab.id, { code: code, runAt: "document_start" }).then((results) => {
                slUtil.disableElementTree(elmMainPanel, true);
                elmDiscoverPanel.style.display = "block";
                elmDiscoverPanel.focus();
            }).catch((error) => {
                setNoFeedsMsg("Unable to access current tab.");
                console.log("[Sage-Like]", error);
            });
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let loadDiscoverFeedsList = function (txtHTML, domainName) {

        setDiscoverLoadingState(true);
        elmLabelDomainName.textContent = domainName;
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
                setNoFeedsMsg("No valid feeds were discovered.");
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
        //elmLabel.textContent = text;

        elmListItem.className = "dfItem";
        elmListItem.setAttribute("href", url);
        elmListItem.title += format      ? "Format:\u0009" + format + "\u000d" : "";
        elmListItem.title += lastUpdated ? "Update:\u0009" + (lastUpdated.toLocaleString() || lastUpdated) + "\u000d" : "";
        elmListItem.title += items       ? "Items:\u0009" + items + "\u000d" : "";
        elmListItem.title += "URL:   \u0009" + url;


        let div1 = document.createElement("div");
        let div2 = document.createElement("div");

        div1.textContent = text;
        div2.textContent = format;

        elmLabel.appendChild(div1);
        elmLabel.appendChild(div2);

        elmListItem.appendChild(elmCheckBox);
        elmListItem.appendChild(elmLabel);

        return elmListItem;
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let setNoFeedsMsg = function (text) {
        let elm = document.createElement("li");
        elm.className = "dfItem novalidfeeds";
        elm.textContent = text;
        elmDiscoverFeedsList.appendChild(elm);
    };

	////////////////////////////////////////////////////////////////////////////////////
	//
	let setDiscoverLoadingState = function (isLoading) {

		if (isLoading === true) {
			slUtil.concatClassName(elmDiscoverPanel, "loading");
		} else {
			slUtil.removeClassName(elmDiscoverPanel, "loading");
		}
    };
    
    ////////////////////////////////////////////////////////////////////////////////////
    //
    let collectSelectedFeeds = function () {
        
        let newFeedsList = [];

        for (let item of elmDiscoverFeedsList.children) {
            if(item.firstElementChild.checked) {
                newFeedsList.push( { title: item.textContent, link: item.getAttribute("href") } );
            }
        }
        return newFeedsList;
    };
    

    ////////////////////////////////////////////////////////////////////////////////////
    //
    //      Events
    //
    ////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onKeyDownDiscoverPanel (event) {
		switch (event.key.toLowerCase()) {
			case "escape":
				close()
                break;
                //////////////////////////////
            default:
                break;
                //////////////////////////////
		}
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onClickButtonRediscover (event) {
        runDiscoverFeeds();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onClickButtonAdd (event) {

        let newFeedsList = collectSelectedFeeds();

        if(newFeedsList.length > 0) {
            rssTreeView.addNewFeeds(newFeedsList);
            close();
        }
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
