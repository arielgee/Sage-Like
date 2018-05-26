"use strict";

let discoverView = (function () {

    const MSGID_GET_DOC_TEXT_HTML = "msgGetDocumentTextHTML";


    let elmDiscoverPanel;
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

        elmButtonAdd = document.getElementById("elmButtonAdd");
        elmButtonCancel = document.getElementById("elmButtonCancel");


        let code = "browser.runtime.sendMessage( { id: \"" + MSGID_GET_DOC_TEXT_HTML + "\"," + 
                                                  "txtHTML: document.documentElement.outerHTML } );";

		browser.tabs.query({ currentWindow: true, active: true }).then((tab) => {
			browser.tabs.executeScript(tab.id, { code: code, runAt: "document_start" })
		});

        elmDiscoverPanel.style.display = "block";
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    let loadDiscoverFeedsList = function (txtHTML) {
      
        let feedUrlList = syndication.discoverWebSiteFeed(txtHTML);

        console.log("[Sage-Like]", feedUrlList);

        emptyDescoverFeedsList();

        if(feedUrlList.length > 0) {
            for(let i of feedUrlList) {
                elmDiscoverFeedsList.appendChild(createTagLI(i.title, i.url, i.lastUpdated));
            }
        }
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
    let createTagLI = function (text, url, format, lastUpdated, items) {
       
        let elmCheckBox = document.createElement("input");
        let elmLabel = document.createElement("label");
        let elmListItem = document.createElement("li");

        // create unique id from timestamp
        elmCheckBox.id = btoa(window.performance.now() + window.performance.timing.navigationStart).replace(/=*$/, "");
        elmCheckBox.className = "dfChkBox";
        elmCheckBox.type = "checkbox";

        elmLabel.className = "dfLabel";
        elmLabel.htmlFor = elmCheckBox.id;
        elmLabel.textContent = text;

        elmListItem.className = "dfItem";
        elmListItem.setAttribute("href", url);
        elmListItem.title += format ? "Format: " + format + "&#013;" : "";
        elmListItem.title += lastUpdated ? "Last Updated: " + lastUpdated + "&#013;" : "";
        elmListItem.title += items ? "Items: " + items + "&#013;" : "";
        elmListItem.title += "URL: " + url;

        elmListItem.appendChild(elmCheckBox);
        elmListItem.appendChild(elmLabel);

        return elmListItem;
    };

    return {
        open: open,
    };

})();
