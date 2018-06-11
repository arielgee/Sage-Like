"use strict";

let feedPropertiesView = (function() {

    let elmSidebarBody;
    let elmMainPanel = null;
    let elmFeedPropertiesPanel = null;
    let elmTextTitle;
    let elmTextLocation;
    let elmButtonSave;
    let elmButtonCancel;
    let elmLabelErrorMsgs;

    let elmFeedItemLI = null;


    ////////////////////////////////////////////////////////////////////////////////////
    function open(elmLI) {

        elmSidebarBody = document.body;
        elmMainPanel = document.getElementById("mainPanel");
        elmFeedPropertiesPanel = document.getElementById("feedPropertiesPanel");
        elmTextTitle = document.getElementById("txtFpTitle");
        elmTextLocation = document.getElementById("txtFpLocation");
        elmButtonSave = document.getElementById("btnFeedPropertiesSave");
        elmButtonCancel = document.getElementById("btnFeedPropertiesCancel");
        elmLabelErrorMsgs = document.getElementById("lblErrorMsgs");

        elmFeedPropertiesPanel.addEventListener("keydown", onKeyDownFeedPropertiesPanel);
        elmButtonSave.addEventListener("click", onClickButtonSave);
        elmButtonCancel.addEventListener("click", onClickButtonCancel);

        // the element been updated
        elmFeedItemLI = elmLI;

        showPanel();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function close() {

        slUtil.disableElementTree(elmMainPanel, false);
        elmFeedPropertiesPanel.style.display = "none";

        elmFeedPropertiesPanel.removeEventListener("keydown", onKeyDownFeedPropertiesPanel);
        elmButtonSave.removeEventListener("click", onClickButtonSave);
        elmButtonCancel.removeEventListener("click", onClickButtonCancel);
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function isOpen() {
        return (elmFeedPropertiesPanel !== null && elmFeedPropertiesPanel.style.display === "block");
    };

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function showPanel() {

        let r = elmFeedItemLI.getBoundingClientRect();
        // let x = r.left;
        let y = r.top;

        // do it first so element will have dimentions (offsetWidth > 0)
        elmFeedPropertiesPanel.style.display = "block";
        slUtil.disableElementTree(elmMainPanel, true);

        // if ((x + elmFeedPropertiesPanel.offsetWidth) > elmSidebarBody.offsetWidth) {
        //     x = elmSidebarBody.offsetWidth - elmFeedPropertiesPanel.offsetWidth;
        // }

        if ((y + elmFeedPropertiesPanel.offsetHeight) > elmSidebarBody.offsetHeight) {
            y = elmSidebarBody.offsetHeight - elmFeedPropertiesPanel.offsetHeight;
        }

        // elmFeedPropertiesPanel.style.left = x + "px";
        elmFeedPropertiesPanel.style.top = y + "px";

        elmTextTitle.value = elmFeedItemLI.firstElementChild.textContent;
        elmTextLocation.value = elmFeedItemLI.getAttribute("href");
        elmLabelErrorMsgs.textContent = "";

        elmTextTitle.focus();
    }

    //==================================================================================
    //=== Events
    //==================================================================================

    ////////////////////////////////////////////////////////////////////////////////////
    function onKeyDownFeedPropertiesPanel(event) {
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
    function onClickButtonSave(event) {

        let valTitle = elmTextTitle.value;
        let valLocation = elmTextLocation.value;

        // Title validation
        if(valTitle.length === 0) {
            elmLabelErrorMsgs.textContent = "Title text is empty."
            return;
        }

        // URL validation
        try {
            new URL(valLocation);
        } catch (error) {
            elmLabelErrorMsgs.textContent = "Location URL is not valid."
            return;
        }

        rssTreeView.updateFeedProperties(elmFeedItemLI, valTitle, valLocation);
        close();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonCancel(event) {
        close();
    }

    return {
        open: open,
        close: close,
        isOpen: isOpen,
    }
})();