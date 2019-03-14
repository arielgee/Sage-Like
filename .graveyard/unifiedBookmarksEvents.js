/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
// C:\Users\arielg\DevWork\WebExtensions\Sage-Like\background.js

browser.bookmarks.onCreated.addListener(onBookmarksEventModifiedHandler);
browser.bookmarks.onChanged.addListener(onBookmarksEventModifiedHandler);
browser.bookmarks.onMoved.addListener(onBookmarksEventModifiedHandler);
browser.bookmarks.onRemoved.addListener(onBookmarksEventRemovedHandler);

	//////////////////////////////////////////////////////////////////////
	function onBookmarksEventModifiedHandler(id, objInfo) {

		console.log("[Sage-Like]", "bm-event");
		// created/moved/changed
		browser.bookmarks.get(id).then((bmItems) => {

			let affectedIds = [id];						// created or changed

			if(objInfo.parentId) {
				affectedIds.push(objInfo.parentId)		// moved
			}

			if(objInfo.oldParentId) {
				affectedIds.push(objInfo.oldParentId)	// moved
			}

			console.log("[Sage-Like]", "bm-event sent");
			sendMessageBookmarksEventFired(bmItems[0].type, affectedIds);
		});
	}

	//////////////////////////////////////////////////////////////////////
	function onBookmarksEventRemovedHandler(id, objInfo) {
		sendMessageBookmarksEventFired(objInfo.node.type, [id, objInfo.parentId]);
	}

	//////////////////////////////////////////////////////////////////////
	function sendMessageBookmarksEventFired(nodeType, affectedIds) {

		// "bookmark", "folder" or "separator"; ignore events to separators
		if( nodeType === "folder" || nodeType === "bookmark" ) {

			browser.runtime.sendMessage({
				id: slGlobals.MSG_ID_BOOKMARKS_EVENT_FIRED,
				isFolder: (nodeType === "folder"),
				affectedIds: affectedIds,
			}).catch((error) => console.log("[Sage-Like]", error) );
		}
	}


/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
// C:\Users\arielg\DevWork\WebExtensions\Sage-Like\preferences\preferences.js

	/**************************************************/
	browser.runtime.onMessage.addListener((message) => {
		if(message.id === slGlobals.MSG_ID_BOOKMARKS_EVENT_FIRED) {
			handleBookmarksEventFired(message.isFolder);
		}
	});

	//==================================================================================
	//=== Bookmarks Event Handler
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function handleBookmarksEventFired(isFolder) {

		if(m_suspendBookmarksEventHandler.test) {

			/* Initialize the <select> element only if the modified
			   bookmark item is a folder
			*/

			if(isFolder) {
				initializeSelectFeedsFolder();
			}
		}
    }



/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
// C:\Users\arielg\DevWork\WebExtensions\Sage-Like\sidebar\rssTreeView.js

		} else if(message.id === slGlobals.MSG_ID_BOOKMARKS_EVENT_FIRED) {

			console.log("[Sage-Like]", "bm-event recieved");
			handleBookmarksEventFired(message.affectedIds);
		}

        function handleBookmarksEventFired(affectedIds) {

            if(m_suspendBookmarksEventHandler.test) {
                slUtil.isDescendantOfRoot(affectedIds).then((isDescendant) => {
                if(isDescendant) {
                    setTbButtonCheckFeedsAlert(true);
                }
            });
        }



/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
// C:\Users\arielg\DevWork\WebExtensions\Sage-Like\common.js

const MSG_ID_BOOKMARKS_EVENT_FIRED = "msgId_bookmarksEventfired";

MSG_ID_BOOKMARKS_EVENT_FIRED: MSG_ID_BOOKMARKS_EVENT_FIRED,



