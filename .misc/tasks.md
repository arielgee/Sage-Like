# Tasks
#### Done
* ~~clean oldies from m_objTreeFeedsData~~
* ~~change text direction in rssListView~~
* ~~narrow menu items~~
* ~~handle right click on a tree folders (for some actions?)~~
* ~~handle right click on a error items. tree and list (for some actions?)~~
* ~~handle right click on background of tree or list  (for some actions?)~~
* ~~change icons color using only css/js~~ => No good to do it way was found
* ~~change 'loading.gif' and 'rss.png' images in discover Panel like in the sidebar?~~
* ~~rearrange the preference.css~~
* ~~status bar in dialogs has fixed height. even when it has no text to display => NO, leave it~~
* ~~handle the tree open/closed folder images from a single place (?)~~ => handled from the CSS by class name manipulations
* ~~prefrences: set views direction?~~
* ~~move the classes in the rssTreeView function to a seperated file~~ => some were moved to common.js
* ~~automatic scheduled tree feed checking~~
* ~~execute refresh function (with setTimeout) from the background.js on the bookmatds to put a browserAction.setBadgeText()~~
* ~~delete MSG_ID_SIDEBAR_STATUS_CHANGE & sons from the slGlobals if redundent.~~
* ~~check if m_objTreeFeedsData.purge(); works. count element after or write comment when deleteing~~
* ~~replace in all code open and closed classes as slGlobals~~ => leave it. Only in rssTreeView.js
* ~~why selecting 'no thanks' performs 'Periodic check for new feeds performed in sidebar.' ?~~ => leave it
* ~~remove EventListener in prefrences.js::getTimeOfDay()!!~~

---

#### Next
* keyboard arrows move selected marker between items (tree, list); enter simulate default mouse click
* toggle tree folder state with double click and not single click
* after toolbar click move focus to selected item, if any
* show currently selected feed name hint in listView (like the warning in the Lizard's view source window?)
* prefrences: configure tree feeds checking pace/rate  - some sleep in the processRSSTreeFeedsData() loop?
* user configuration of the timeout for syndication in prefrences
* In manifest.json add ' (Ctrl+Shift+F2)' to browser_action/default_title when it works
* when RTL the dot at the end of the EN sentence is to the left and not to the right (on switch direction)
* try to remove timeout for Periodic check when not needed. (bk timeout when sidebar is open and vice versa)

			// emulate event object
			onClickTreeItem( {
				detail: 1,
				stopPropagation: () => {},
				target: elmLI,
				shiftKey: event.shiftKey,
			} );
