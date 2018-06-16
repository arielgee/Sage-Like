"use strict";

let preferences = (function() {

    const MENU_GUID = "menu________";

    let m_elmRootFeedsFolder;
    let m_elmBtnRestoreDefaults;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

        m_elmRootFeedsFolder = document.getElementById("rootFeedsFolder");
        m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");


        /////////////////////////////////////////////////////////////////////////////////
        // get saved preferences
        prefs.getRootFeedsFolderId().then((value) => {
            createSelectFeedFolderElements().then(() => {
                m_elmRootFeedsFolder.value = value;
                setTimeout(() => {
                    flashRootFeedsFolderElement();
                }, 500);
            });
        });


       	/////////////////////////////////////////////////////////////////////////////////
    	// save preferences when changed
	    m_elmRootFeedsFolder.addEventListener("change", () => {
            prefs.setRootFeedsFolderId(m_elmRootFeedsFolder.value);
            flashRootFeedsFolderElement();
        });


        /////////////////////////////////////////////////////////////////////////////////
        // restore defaults when requestes
        m_elmBtnRestoreDefaults.addEventListener("click", () => {
            let defPrefs = prefs.restoreDefaults();

            m_elmRootFeedsFolder.value = defPrefs.rootFeedsFolderId;

            flashRootFeedsFolderElement();
        });
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function flashRootFeedsFolderElement() {

        let selected = m_elmRootFeedsFolder.options[m_elmRootFeedsFolder.selectedIndex];

        if(selected === undefined || selected.value === sageLikeGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET) {
            m_elmRootFeedsFolder.classList.add("flash");
        } else {
            m_elmRootFeedsFolder.classList.remove("flash");
        }
    }
    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createSelectFeedFolderElements() {

        return new Promise((resolve) => {

            while(m_elmRootFeedsFolder.firstChild) {
                m_elmRootFeedsFolder.removeChild(m_elmRootFeedsFolder.firstChild);
            }

            browser.bookmarks.getSubTree(MENU_GUID).then((bookmarkItems) => {

                let elmOption = createTagOption(sageLikeGlobalConsts.ROOT_FEEDS_FOLDER_ID_NOT_SET, "-Select feeds folder-");
                m_elmRootFeedsFolder.appendChild(elmOption);

                for(let child of bookmarkItems[0].children) {
                    createSelectFeedFolderElement(child, 0);
                }
                resolve();
            });

        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createSelectFeedFolderElement(bookmarkItem, indent) {

        // it's a folder
        if(bookmarkItem.url === undefined) {
            let elmOption = createTagOption(bookmarkItem.id, "&emsp;".repeat(indent) + bookmarkItem.title);
            m_elmRootFeedsFolder.appendChild(elmOption);
            indent++;
            for(let child of bookmarkItem.children) {
                createSelectFeedFolderElement(child, indent);
            }
            indent--;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function createTagOption(value, text) {
        let elm = document.createElement("option");
        elm.value = value;
        elm.innerHTML = text;
        return elm;
    }

})();