"use strict";

(function () {

    let elmSidebarBody;
    let elmContextMenu;

	let elmMnuTreeOpenFeed;
	let elmMnuTreeOpenFeedNewTab;
	let elmMnuTreeOpenFeedNewWin;
	let elmMnuTreeCopyFeedUrl;

	let elmMnuListOpenFeedItem;
	let elmMnuListOpenFeedItemNewTab;
	let elmMnuListOpenFeedItemNewWin;
	let elmMnuListCopyFeedItemUrl;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

        elmSidebarBody = document.body;
		elmContextMenu = document.getElementById("mnuContextMenu");
		
		elmMnuTreeOpenFeed = document.getElementById("mnuTreeOpenFeed")
		elmMnuTreeOpenFeedNewTab = document.getElementById("mnuTreeOpenFeedNewTab")
		elmMnuTreeOpenFeedNewWin = document.getElementById("mnuTreeOpenFeedNewWin")
		elmMnuTreeCopyFeedUrl = document.getElementById("mnuTreeCopyFeedUrl");

		elmMnuListOpenFeedItem = document.getElementById("mnuListOpenFeedItem");
		elmMnuListOpenFeedItemNewTab = document.getElementById("mnuListOpenFeedItemNewTab");
		elmMnuListOpenFeedItemNewWin = document.getElementById("mnuListOpenFeedItemNewWin");
		elmMnuListCopyFeedItemUrl = document.getElementById("mnuListCopyFeedItemUrl");
	

        elmSidebarBody.addEventListener('contextmenu', onContextMenu);
		elmContextMenu.addEventListener('blur', onBlurContextMenu);
		elmContextMenu.addEventListener("keydown", onKeyDownContextMenu);
		
		elmMnuTreeOpenFeed.addEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.addEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.addEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.addEventListener('click', onClickMenuCopyFeedUrl);

		elmMnuListOpenFeedItem.addEventListener('click', onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.addEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.addEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.addEventListener("click", onClickMenuCopyFeedItemUrl);
    }

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onUnload(event) {

        elmSidebarBody.removeEventListener('contextmenu', onContextMenu);

		elmContextMenu.removeEventListener('blur', onBlurContextMenu);
		elmContextMenu.removeEventListener("keydown", onKeyDownContextMenu);
		
		elmMnuTreeOpenFeed.removeEventListener("click", onClickMenuOpenFeed);
		elmMnuTreeOpenFeedNewTab.removeEventListener("click", onClickMenuOpenFeedNewTab);
		elmMnuTreeOpenFeedNewWin.removeEventListener("click", onClickMenuOpenFeedNewWin);
		elmMnuTreeCopyFeedUrl.removeEventListener('click', onClickMenuCopyFeedUrl);

		
		elmMnuListOpenFeedItem.removeEventListener('click', onClickMenuOpenFeedItem);
		elmMnuListOpenFeedItemNewTab.removeEventListener("click", onClickMenuOpenFeedItemNewTab);
		elmMnuListOpenFeedItemNewWin.removeEventListener("click", onClickMenuOpenFeedItemNewWin);
		elmMnuListCopyFeedItemUrl.removeEventListener("click", onClickMenuCopyFeedItemUrl);


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

			elmMnuTreeOpenFeed.style.display = "block";
			elmMnuTreeOpenFeedNewTab.style.display = "block";
			elmMnuTreeOpenFeedNewWin.style.display = "block";
			elmMnuTreeCopyFeedUrl.style.display = "block";
			rssTreeView.setFeedSelectionState(event.target);

		} else if(trgClsList.contains(sageLikeGlobalConsts.CLS_LI_RSS_LIST_FEED_ITEM)) {

			elmMnuListOpenFeedItem.style.display = "block";
			elmMnuListOpenFeedItemNewTab.style.display = "block";
			elmMnuListOpenFeedItemNewWin.style.display = "block";
			elmMnuListCopyFeedItemUrl.style.display = "block";
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
	//		tree menu items
	//
	////////////////////////////////////////////////////////////////////////////////////
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeed (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {			
			browser.bookmarks.get(elmContextMenu.elmTargetItem.id).then((bookmarkItem) => {
				browser.tabs.update({ url: bookmarkItem[0].url });
			});
		}
		elmContextMenu.style.display = "none";	
	}	
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedNewTab (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {			
			browser.bookmarks.get(elmContextMenu.elmTargetItem.id).then((bookmarkItem) => {
				browser.tabs.create({ url: bookmarkItem[0].url });
			});
		}
		elmContextMenu.style.display = "none";	
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedNewWin (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {			
			browser.bookmarks.get(elmContextMenu.elmTargetItem.id).then((bookmarkItem) => {
				browser.windows.create({ url: bookmarkItem[0].url, type: "normal" });
			});
		}
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedUrl (event) {		

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			browser.bookmarks.get(elmContextMenu.elmTargetItem.id).then((bookmarkItem) => {
				lzUtil.copyTextToClipboard(document, bookmarkItem[0].url);
			});
		}
		elmContextMenu.style.display = "none";
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	//		list menu items
	//
	////////////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItem (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			let url = elmContextMenu.elmTargetItem.getAttribute("href");
			browser.tabs.update({ url: url });
			lzUtil.concatClassName(elmContextMenu.elmTargetItem, "visited");
			lzUtil.addUrlToBrowserHistory(url, elmContextMenu.elmTargetItem.textContent);
		}
		elmContextMenu.style.display = "none";
	}

	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItemNewTab (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			let url = elmContextMenu.elmTargetItem.getAttribute("href");
			browser.tabs.create({ url: url });
			lzUtil.concatClassName(elmContextMenu.elmTargetItem, "visited");
			lzUtil.addUrlToBrowserHistory(url, elmContextMenu.elmTargetItem.textContent);
		}
		elmContextMenu.style.display = "none";
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuOpenFeedItemNewWin (event) {

		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			let url = elmContextMenu.elmTargetItem.getAttribute("href");
			browser.windows.create({ url: url });
			lzUtil.concatClassName(elmContextMenu.elmTargetItem, "visited");
			lzUtil.addUrlToBrowserHistory(url, elmContextMenu.elmTargetItem.textContent);

		}
		elmContextMenu.style.display = "none";
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	//
	function onClickMenuCopyFeedItemUrl (event) {
		if(elmContextMenu.elmTargetItem !== undefined && elmContextMenu.elmTargetItem !== null) {
			lzUtil.copyTextToClipboard(document, elmContextMenu.elmTargetItem.getAttribute("href"));
		}
		elmContextMenu.style.display = "none";	
	}
})();
