"use strict";

let feedPropertiesView = (function() {

    let elmSidebarBody;
    let elmMainPanel = null;
    let elmFeedPropertiesPanel = null;
    let elmButtonSave;
    let elmButtonCancel;


    ////////////////////////////////////////////////////////////////////////////////////
    function open(elmLI) {
        
        elmSidebarBody = document.body;
        elmMainPanel = document.getElementById("mainPanel");
        elmFeedPropertiesPanel = document.getElementById("feedPropertiesPanel");
        elmButtonSave = document.getElementById("btnFeedPropertiesSave");
        elmButtonCancel = document.getElementById("btnFeedPropertiesCancel");


        elmFeedPropertiesPanel.addEventListener("keydown", onKeyDownFeedPropertiesPanel);
        elmButtonSave.addEventListener("click", onClickButtonSave);
        elmButtonCancel.addEventListener("click", onClickButtonCancel);

        slUtil.disableElementTree(elmMainPanel, true);
        elmFeedPropertiesPanel.style.display = "block";

        let y = elmLI.getBoundingClientRect().top;

        // do it first so element will have dimentions (offsetWidth > 0)
        elmFeedPropertiesPanel.style.display = "block";

        if ((y + elmFeedPropertiesPanel.offsetHeight) > elmSidebarBody.offsetHeight) {
            y = elmSidebarBody.offsetHeight - elmFeedPropertiesPanel.offsetHeight;
        }

        elmFeedPropertiesPanel.style.top = y + "px";

        elmFeedPropertiesPanel.focus();

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