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
* ~~when dragging and dropping a selected tree item I must renew its selected status~~
* ~~toggle tree folder state with double click and not single click~~
* ~~keyboard arrows move selected marker between items (tree, list); enter simulate default mouse click~~
* ~~tab moves between views?~~
* ~~show currently selected feed name hint in listView (like the warning in the Lizard's view source window?)~~
* ~~prefrences: configure tree feeds check pace/rate  - some sleep in the processRSSTreeFeedsData() loop?~~
  * ~~Strenuous - (100% / 0s)~~
  * ~~Moderate	- ( 30% / 2s)~~
  * ~~Relaxed   - ( 20% / 3s)~~
* ~~check if using m_elmList.parentElement or m_elmTreeRoot.parentElement in call to scrollIntoViewIfNeeded() is correct. why not just m_elmList/m_elmTreeRoot~~ => using the parentElement is correct
* ~~try to remove timeout for Periodic check when not needed. (bk timeout when sidebar is open and vice versa)~~ => The bk.js can't get the msg that the sidebar was closed so I can't stop the timeout. either way when the sidebar is open the bk.js's timeout is running on empty
* ~~addlistener on bookmarks???~~
* ~~FUUUUUUUUCK !!! modifing the tree (new dicovery, drag & drop) turns the TB button read FUUUUUUUUCK~~
* ~~use promise variables like in purge to run then parallely~~
* ~~rewrite isDescendantOfRoot, work from the modified id up to the parent~~ => NO. was rewriten to handle array of ids.
* ~~need to handle seperartor bookmarks. tree is getting fucked~~
* ~~replace the key for the TreeFeedsData object from url to id of LI (also id of bookmark)~~
* ~~purge remove all becouse of async functions, executed too sone~~ => rewriten and moved to the start on the view load
* ~~lastChecked is redundent in TreeFeedsData~~ => used in purge
* ~~list not empty in discovery view or many 'still loading' rows /???~~ fixed? look out for it
* ~~check why list status bar is bold~~
* ~~toolbar buttons on mousedown instead of click~~
* ~~handle mouse click on tree/list body and not item~~

---

#### Next

* user configuration of the timeout for syndication in prefrences
  * to support this the folowing locations will need to prefs.get() the timeout value
    * discoveryView.js:103
    * rssTreeView.js:304
    * rssTreeView.js:3395

* In manifest.json add ' (Ctrl+Shift+F2)' to browser_action/default_title when it works
* when RTL the dot at the end of the EN sentence is to the left and not to the right (on switch direction)
* the bookmark ids from the bookmark lib may starts with a digit.hrml id can not start with a disit => OK by HTML5

* select some item right after creation => NO(?)
* after toolbar click move focus to selected item, if any => same as above; NO(?)
* a lot of sub folders in the tree view will fuck up the UI

* check why in openPropertiesView() there is m_objTreeFeedsData.exist() and m_objTreeFeedsData.set()

* check why feeds from telecomnews (מבזקים על סדר היום) marked as not visited (bold) when thay were. SEE NEXT
  * if date is missing the Z then convert to XML date format and appen 'Z' at the end ??????

* delete feed with the keyboard delete key?????




