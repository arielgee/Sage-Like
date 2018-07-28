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
* ~~toolbar buttons on mousedown instead of click~~ => reverted
* ~~handle mouse click on tree/list body and not item~~
* ~~make all tabindex in panel.html "0"~~
* ~~after toolbar click move focus to selected item, if any~~
* ~~user configuration of the timeout for syndication in prefrences~~
* ~~list info not showing after error feed~~
* ~~try to remove all the log's "XML Parsing Error" messages~~ => I checked and there is nothing I can do about it
* ~~draging & dropping a loading feed get "stuck" on loading (the icon)~~
* ~~draging & dropping a folder with loading feed in it get "stuck" on loading (the icon)~~
* ~~user config: UI density~~
* ~~change 20px to 18px in rssTreeView.css:30 for narrow tree ?~~ => implemented UI density
* ~~replace all LI to li in querySelectorAll()~~
* ~~use forEach() whereever there is querySelectorAll()~~
* ~~delete feed with the keyboard delete key?????~~ => NO! will need a confirm dialog and it's not worth it
* ~~the bookmark ids from the bookmark lib may starts with a digit. HTML id can not start with a digit~ => Yes thay can as of HTML5
* ~~check why in openPropertiesView() there is m_objTreeFeedsData.exist() & m_objTreeFeedsData.set()~~ there's a chance feed will be missing
* ~~check why feeds from telecomnews (מבזקים על סדר היום) marked as not visited (bold) when thay were~~ => non standerd  date time format
* ~~when RTL the dot at the end of the EN sentence is to the left and not to the right (on switch direction)~~ => BS
* ~~add a new feed to the tree using the propertiesView?~~
  * ~~create a new blank bookmark and then edit it with the propertiesView~~
* ~~after delete press tab (or 2 tabs) and press arrow down. why from here?~~ => after delete move focus to next/prev LI~~
* ~~select some item right after creation~~ => NO~~
* ~~use outline instead of border in tree and list~~
* ~~move css button (props + discovery) to panel.css~~
* ~~select text in prpperties~~
* ~~set focus outline in dialogs~~
* ~~add reload extention button in preferences~~
* ~~fix rediscover button transformation~~
* ~~underline tree item when hover~~
* ~~empty title in tooltip when no title~~
* ~~why list scrollbar is gone when height is resized with splitter to minimum => by system. height too small to paint the scroll~~
* ~~click discovery when root folder is not set~~
* ~~native menu when right click on error LI => fixed error when calling to scrollIntoViewIfNeeded with firstElementChild~~
* ~~discover link with relative url: <link ... type="application/rss+xml" href="/rss/index.xml" />~~
* ~~Improve syndication.discoverWebSiteFeeds()~~
  * ~~Simplify discoveredFeedsList() to use simple url string as key instead of URL object.~~
  * ~~handle discoveredFeedsList object in discoveredFeedsList() correctly.~~
  * ~~syndication.getFeedXMLText() now return object instead of string when rejecting that results in better loging of errors when calling discoverWebSiteFeeds()~~
* ~~Replace single string quotation marks with double quotation marks~~
* ~~following feeds are not loaded due to tab char at file start (before xml prolog)~~
  * ~~"http://www.zavit.org.il/feed/"~~
  * ~~"http://www.zavit.org.il/comments/feed/"~~
* ~~if deleting tree item while it is trying to add new feeds (discovery) the "reload feeds" button may turn red~~
  * ~~convert createBookmarksSequentially to simple function with async/await function~~
* ~~add div for feed count in discoveryView. next to the caption ?~~ => added to status bar
* ~~feeds are loaded into the discoveeFeeds view asynchronously as the feed data is obtained~~
* ~~The callback function of discoverWebSiteFeeds return both titles, feed title and link title~~
* ~~in discoverWebSiteFeeds overwrite discoveredFeed with Object.assign()~~


---

#### Next

* In manifest.json add ' (Ctrl+Shift+F2)' to browser_action/default_title when it works
* a lot of sub folders in the tree view will fuck up the UI


* disabled elements using 'pointer-events: none' still react to keybourd events  fuck!
  * when focus goes from dialog (any dialog) to panel (top or bottom) the panel reacts to keynord arrows/enter: not realy disabled
