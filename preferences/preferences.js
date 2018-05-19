"use strict";

let preferences = (function () {
    
    const menuGuid = "menu________";

    let elmRootFeedsFolder;
    let elmBtnRestoreDefaults;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {
        
        elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
        elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");
        
        
        /////////////////////////////////////////////////////////////////////////////////
        // get saved preferences
        prefs.getRootFeedsFolderId().then((value) => {
            createSelectFeedFolderElements().then(() => {
                elmRootFeedsFolder.value = value;
            });            
        });


       	/////////////////////////////////////////////////////////////////////////////////
    	// save preferences when changed
	    elmRootFeedsFolder.addEventListener("change", () => { prefs.setRootFeedsFolderId(elmRootFeedsFolder.value); });


        /////////////////////////////////////////////////////////////////////////////////
        // restore defaults when requestes
        elmBtnRestoreDefaults.addEventListener("click", () => {
            let defPrefs = prefs.restoreDefaults();

            elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;
        });
        
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload (event) {


		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
    }
    
    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createSelectFeedFolderElements () {
        
        return new Promise((resolve) => {

            while(elmRootFeedsFolder.firstChild) {
                elmRootFeedsFolder.removeChild(elmRootFeedsFolder.firstChild);
            }

            browser.bookmarks.getSubTree(menuGuid).then((bookmarkItems) => {
                for(let child of bookmarkItems[0].children) {
                    createSelectFeedFolderElement(child, 0);
                }

                let elmOption = createTagOption("", "-Select feed folder-");
                elmRootFeedsFolder.insertBefore(elmOption, elmRootFeedsFolder.firstChild);
                elmRootFeedsFolder.selectedIndex = 0;
                resolve();
            });

        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createSelectFeedFolderElement (bookmarkItem, indent) {
        
        if(bookmarkItem.url !== undefined) {        // it's not a folder
           return;
        }

        let elmOption = createTagOption(bookmarkItem.id, "&emsp;".repeat(indent) + bookmarkItem.title);
        elmRootFeedsFolder.appendChild(elmOption);
        indent++;
        for(let child of bookmarkItem.children) {
            createSelectFeedFolderElement(child, indent);
        }
        indent--;
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createTagOption (value, text) {
        let elm = document.createElement("option");
        elm.value = value;
        elm.innerHTML = text;
        return elm;
    }

})();