"use strict";

let discoverView = (function() {

    const MSGID_GET_DOC_TEXT_HTML = "msgGetDocumentTextHTML";

    const CODE_INJECTION = "browser.runtime.sendMessage( { id: \"" + MSGID_GET_DOC_TEXT_HTML + "\"," +
                                                          "txtHTML: document.documentElement.outerHTML," +
                                                          "domainName: document.domain, } );";

    let elmMainPanel = null;
    let elmDiscoverPanel = null;
    let elmDiscoverFeedsList;

    let elmButtonRediscover;
    let elmButtonAdd;
    let elmButtonCancel;
    let elmLabelInfobar;


    /**************************************************/
    browser.runtime.onMessage.addListener((message) => {
        if(message.id === MSGID_GET_DOC_TEXT_HTML) {
            loadDiscoverFeedsList(message.txtHTML, message.domainName);
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////
    let open = function() {

        elmMainPanel = document.getElementById("mainPanel");
        elmDiscoverPanel = document.getElementById("discoverPanel");
        elmDiscoverFeedsList = document.getElementById("discoverFeedsList");
        elmButtonRediscover = document.getElementById("btnRediscover");
        elmButtonAdd = document.getElementById("btnDiscoverFeedsAdd");
        elmButtonCancel = document.getElementById("btnDiscoverFeedsCancel");
        elmLabelInfobar = document.getElementById("lblInfobar");

        elmDiscoverPanel.addEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonRediscover.addEventListener("click", onClickButtonRediscover);
        elmButtonAdd.addEventListener("click", onClickButtonAdd);
        elmButtonCancel.addEventListener("click", onClickButtonCancel);

        elmDiscoverPanel.style.display = "block";
        slUtil.disableElementTree(elmMainPanel, true);

        runDiscoverFeeds();
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let close = function() {

        slUtil.disableElementTree(elmMainPanel, false);
        elmDiscoverPanel.style.display = "none";
        emptyDiscoverFeedsList();

        elmDiscoverPanel.removeEventListener("keydown", onKeyDownDiscoverPanel);
        elmButtonRediscover.removeEventListener("click", onClickButtonRediscover);
        elmButtonAdd.removeEventListener("click", onClickButtonAdd);
        elmButtonCancel.removeEventListener("click", onClickButtonCancel);
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let isOpen = function() {
        return (elmDiscoverPanel !== null && elmDiscoverPanel.style.display === "block");
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let runDiscoverFeeds = function() {

        emptyDiscoverFeedsList();

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {

            //elmDiscoverPanel.focus();

            if(tab[0].status === "loading") {
                setNoFeedsMsg("Current tab is still loading.");
                return;
            }

			browser.tabs.executeScript(tab[0].id, { code: CODE_INJECTION, runAt: "document_start" }).catch((error) => {
                setNoFeedsMsg("Unable to access current tab.");
                console.log("[Sage-Like]", error);
            });
        });
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let loadDiscoverFeedsList = function(txtHTML, domainName) {

        setDiscoverLoadingState(true);
        setStatusbarMessage(domainName, false);
        syndication.discoverWebSiteFeeds(txtHTML).then((discoveredFeedsList) => {

            emptyDiscoverFeedsList();

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
    let emptyDiscoverFeedsList = function() {
        while(elmDiscoverFeedsList.firstChild) {
            elmDiscoverFeedsList.removeChild(elmDiscoverFeedsList.firstChild);
        }
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let createTagLI = function(index, text, url, lastUpdated, format, items) {

        let elmCheckBox = document.createElement("input");
        let elmLabelCaption = document.createElement("div");
        let elmLabelFormat = document.createElement("div");
        let elmLabel = document.createElement("label");
        let elmListItem = document.createElement("li");

        elmCheckBox.id = "chkBox" + index.toString();
        elmCheckBox.className = "dfChkBox";
        elmCheckBox.type = "checkbox";

        elmLabelCaption.textContent = text;
        elmLabelCaption.className = "dfLabelCaption";

        elmLabelFormat.textContent = format;
        elmLabelFormat.className = "dfLabelFormat smallText";

        elmLabel.className = "dfLabel";
        elmLabel.htmlFor = elmCheckBox.id;

        elmListItem.className = "dfItem";
        elmListItem.setAttribute("name", text);
        elmListItem.setAttribute("href", url);
        elmListItem.title += "Title:\u0009" + text + "\u000d";
        elmListItem.title += format      ? "Format:\u0009" + format + "\u000d" : "";
        elmListItem.title += lastUpdated ? "Update:\u0009" + (lastUpdated.toLocaleString() || lastUpdated) + "\u000d" : "";
        elmListItem.title += items       ? "Items:\u0009" + items + "\u000d" : "";
        elmListItem.title += "URL:   \u0009" + url;

        elmListItem.appendChild(elmCheckBox);
        elmLabel.appendChild(elmLabelCaption);
        elmLabel.appendChild(elmLabelFormat);
        elmListItem.appendChild(elmLabel);

        return elmListItem;
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let setNoFeedsMsg = function(text) {
        let elm = document.createElement("li");
        elm.className = "dfItem novalidfeeds";
        elm.textContent = text;
        elmDiscoverFeedsList.appendChild(elm);
    };

	////////////////////////////////////////////////////////////////////////////////////
	let setDiscoverLoadingState = function(isLoading) {

		if (isLoading === true) {
            elmDiscoverPanel.classList.add("loading");
		} else {
            elmDiscoverPanel.classList.remove("loading")
		}
    };

    ////////////////////////////////////////////////////////////////////////////////////
    let collectSelectedFeeds = function() {

        let newFeedsList = [];

        for (let item of elmDiscoverFeedsList.children) {
            if(item.firstElementChild && item.firstElementChild.checked) {

                let url = item.getAttribute("href");

                if(rssTreeView.isFeedInTree(url)) {
                    setStatusbarMessage("Already in tree: '" + item.getAttribute("name") + "'", true);

                    return [];
                }
                newFeedsList.push( { title: item.getAttribute("name"), url: url } );
            }
        }

        if(newFeedsList.length === 0) {
            setStatusbarMessage("Nothing to add", true);
            return [];
        }

        return newFeedsList;
    };

    ////////////////////////////////////////////////////////////////////////////////////
    function setStatusbarMessage(text, isError) {
        if(isError) {
            elmLabelInfobar.classList.add("error");
        } else {
            elmLabelInfobar.classList.remove("error");
        }
        elmLabelInfobar.textContent = text;
    }

    //==================================================================================
    //=== Events
    //==================================================================================

    ////////////////////////////////////////////////////////////////////////////////////
    function onKeyDownDiscoverPanel(event) {
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
    function onClickButtonRediscover(event) {
        runDiscoverFeeds();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonAdd(event) {

        let newFeedsList = collectSelectedFeeds();

        if(newFeedsList.length > 0) {
            rssTreeView.addNewFeeds(newFeedsList);
            close();
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonCancel(event) {
        close();
    }

    return {
        open: open,
        close: close,
        isOpen: isOpen,
    };

})();