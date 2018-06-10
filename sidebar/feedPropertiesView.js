"use strict";

let feedPropertiesView = (function() {

    let elmFeedPropertiesPanel = null;

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function open() {
        
        
        elmFeedPropertiesPanel = document.getElementById("feedPropertiesPanel");


        elmFeedPropertiesPanel.style.display = "block";
    }

    return {
        open: open,
    }
    

})();