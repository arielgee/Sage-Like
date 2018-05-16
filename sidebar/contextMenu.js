"use strict";

(function () {

    let elmSidebarBody;
    let elmContextMenu;

	let elmMnuTreeCopyFeedUrl;
	let elmMnuListOpenFeedItem;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

        elmSidebarBody = document.body;
        elmContextMenu = document.getElementById("mnuContextMenu");
		elmMnuTreeCopyFeedUrl = document.getElementById("mnuTreeCopyFeedUrl");
		elmMnuListOpenFeedItem = document.getElementById("mnuListOpenFeedItem");

        elmSidebarBody.addEventListener('contextmenu', onContextMenu);

		elmContextMenu.addEventListener('blur', onBlurContextMenu);
        elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
		elmMnuTreeCopyFeedUrl.addEventListener('click', onClickMenuCopyFeedUrl);
		elmMnuListOpenFeedItem.addEventListener('click', onClickMenuOpenFeedItem);
    }

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

        elmSidebarBody.removeEventListener('contextmenu', onContextMenu);

		elmContextMenu.removeEventListener('blur', onBlurContextMenu);
        elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		elmMnuTreeCopyFeedUrl.removeEventListener('click', onClickMenuCopyFeedUrl);
		elmMnuListOpenFeedItem.removeEventListener('click', onClickMenuOpenFeedItem);

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
    }

    ////////////////////////////////////////////////////////////////////////////////////
    //
    function onContextMenu(event) {

		// hide all menu items
		for (let e of elmContextMenu.children) {
			e.style.display = "none";
		}

		let showMenu = true;
        let trgClsList = event.target.classList;

		if (trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_TREE_FEED)) {

			elmMnuTreeCopyFeedUrl.style.display = "block";
			rssTreeView.setFeedSelectionState(event.target);

		} else if(trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)) {

			elmMnuListOpenFeedItem.style.display = "block";
			rssListView.setFeedItemSelectionState(event.target);

		} else {
			showMenu = false;
		}	

		if (showMenu) {
			elmContextMenu.elmTargetItem = event.target;			

			let x = event.clientX;
			let y = event.clientY;

			// do it first so element will have dimentions (offsetWidth > 0)
			elmContextMenu.style.display = "block";

			if ((x + elmContextMenu.offsetWidth) > elmSidebarBody.offsetWidth) {
				x = elmSidebarBody.offsetWidth - elmContextMenu.offsetWidth;
			}

			if ((y + elmContextMenu.offsetHeight) > elmSidebarBody.offsetHeight) {
				y = elmSidebarBody.offsetHeight - elmContextMenu.offsetHeight;
			}

			elmContextMenu.style.left = x + "px";
			elmContextMenu.style.top = y + "px";

			elmContextMenu.focus();
		}
        event.preventDefault();
    }
    
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onBlurContextMenu (event) {
		elmContextMenu.style.display = "none";	
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onKeyDownContextMenu (event) {

		switch (event.key.toLowerCase()) {
			case "escape":
				elmContextMenu.style.display = "none";
				break;		
			case "enter":
				elmContextMenu.style.display = "none";
				break;		
			default:
				break;
		}
	}
    
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedUrl (event) {		

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			browser.bookmarks.get(elmContextMenu.elmTargetItem.id).then((bookmarkItem) => {

				let input = document.createElement("input");
				let style = input.style;
				style.height = style.width = style.borderWidth = style.padding = style.margin = 0;				
				input.value = bookmarkItem[0].url;
				document.body.appendChild(input);
				input.select();
				document.execCommand("copy");
				document.body.removeChild(input);
			});
		}
		elmContextMenu.style.display = "none";
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItem (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			browser.tabs.update({ url: elmContextMenu.elmTargetItem.getAttribute("href") });
		}
		elmContextMenu.style.display = "none";		
	};	
	
})();
