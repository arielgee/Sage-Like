# Tasks
## Done
* clean oldies from m_objTreeFeedsData
* change text direction in rssListView
* narrow menu items
* handle right click on a tree folders (for some actions?)
* handle right click on a error items. tree and list (for some actions?)
* handle right click on background of tree or list  (for some actions?)
* change icons color using only css/js => No good to do it way was found
* change 'loading.gif' and 'rss.png' images in discover Panel like in the sidebar?
* rearrange the preference.css
* status bar in dialogs has fixed height. even when it has no text to display => NO, leave it
* handle the tree open/closed folder images from a single place (?) => handled from the CSS by class name manipulations
* prefrences: set views direction?
* move the classes in the rssTreeView function to a seperated file => some were moved to common.js
* automatic scheduled tree feed checking
* execute refresh function (with setTimeout) from the background.js on the bookmatds to put a browserAction.setBadgeText()
* delete MSG_ID_SIDEBAR_STATUS_CHANGE & sons from the slGlobals if redundent.
* check if m_objTreeFeedsData.purge(); works. count element after or write comment when deleteing
* replace in all code open and closed classes as slGlobals => leave it. Only in rssTreeView.js
* why selecting 'no thanks' performs 'Periodic check for new feeds performed in sidebar.' ? => leave it
* remove EventListener in prefrences.js::getTimeOfDay()!!
* when dragging and dropping a selected tree item I must renew its selected status
* toggle tree folder state with double click and not single click
* keyboard arrows move selected marker between items (tree, list); enter simulate default mouse click
* tab moves between views?
* show currently selected feed name hint in listView (like the warning in the Lizard's view source window?)
* prefrences: configure tree feeds check pace/rate  - some sleep in the processRSSTreeFeedsData() loop?
  * Strenuous - (100% / 0s)
  * Moderate	- ( 30% / 2s)
  * Relaxed   - ( 20% / 3s)
* check if using m_elmList.parentElement or m_elmTreeRoot.parentElement in call to scrollIntoViewIfNeeded() is correct. why not just m_elmList/m_elmTreeRoot => using the parentElement is correct
* try to remove timeout for Periodic check when not needed. (bk timeout when sidebar is open and vice versa) => The bk.js can't get the msg that the sidebar was closed so I can't stop the timeout. either way when the sidebar is open the bk.js's timeout is running on empty
* addlistener on bookmarks???
* FUUUUUUUUCK !!! modifing the tree (new dicovery, drag & drop) turns the TB button read FUUUUUUUUCK
* use promise variables like in purge to run then parallely
* rewrite isDescendantOfRoot, work from the modified id up to the parent => NO. was rewriten to handle array of ids.
* need to handle seperartor bookmarks. tree is getting fucked
* replace the key for the TreeFeedsData object from url to id of LI (also id of bookmark)
* purge remove all becouse of async functions, executed too sone => rewriten and moved to the start on the view load
* lastChecked is redundent in TreeFeedsData => used in purge
* list not empty in discovery view or many 'still loading' rows /??? fixed? look out for it
* check why list status bar is bold
* toolbar buttons on mousedown instead of click => reverted
* handle mouse click on tree/list body and not item
* make all tabindex in panel.html "0"
* after toolbar click move focus to selected item, if any
* user configuration of the timeout for syndication in prefrences
* list info not showing after error feed
* try to remove all the log's "XML Parsing Error" messages => I checked and there is nothing I can do about it
* draging & dropping a loading feed get "stuck" on loading (the icon)
* draging & dropping a folder with loading feed in it get "stuck" on loading (the icon)
* user config: UI density
* change 20px to 18px in rssTreeView.css:30 for narrow tree ? => implemented UI density
* replace all LI to li in querySelectorAll()
* use forEach() whereever there is querySelectorAll()
* delete feed with the keyboard delete key????? => NO! will need a confirm dialog and it's not worth it
* the bookmark ids from the bookmark lib may starts with a digit. HTML id can not start with a digit~ => Yes thay can as of HTML5
* check why in openPropertiesView() there is m_objTreeFeedsData.exist() & m_objTreeFeedsData.set() there's a chance feed will be missing
* check why feeds from telecomnews (מבזקים על סדר היום) marked as not visited (bold) when thay were => non standerd  date time format
* when RTL the dot at the end of the EN sentence is to the left and not to the right (on switch direction) => BS
* add a new feed to the tree using the propertiesView?
  * create a new blank bookmark and then edit it with the propertiesView
* after delete press tab (or 2 tabs) and press arrow down. why from here? => after delete move focus to next/prev LI
* select some item right after creation => NO
* use outline instead of border in tree and list
* move css button (props + discovery) to panel.css
* select text in prpperties
* set focus outline in dialogs
* add reload extention button in preferences
* fix rediscover button transformation
* underline tree item when hover
* empty title in tooltip when no title
* why list scrollbar is gone when height is resized with splitter to minimum => by system. height too small to paint the scroll
* click discovery when root folder is not set
* native menu when right click on error LI => fixed error when calling to scrollIntoViewIfNeeded with firstElementChild
* discover link with relative url: <link ... type="application/rss+xml" href="/rss/index.xml" />
* Improve syndication.discoverWebSiteFeeds()
  * Simplify discoveredFeedsList() to use simple url string as key instead of URL object.
  * handle discoveredFeedsList object in discoveredFeedsList() correctly.
  * syndication.getFeedXMLText() now return object instead of string when rejecting that results in better loging of errors when calling discoverWebSiteFeeds()
* Replace single string quotation marks with double quotation marks
* following feeds are not loaded due to tab char at file start (before xml prolog)
  * "http://www.zavit.org.il/feed/"
  * "http://www.zavit.org.il/comments/feed/"
* if deleting tree item while it is trying to add new feeds (discovery) the "reload feeds" button may turn red
  * convert createBookmarksSequentially to simple function with async/await function
* add div for feed count in discoveryView. next to the caption ? => added to status bar
* feeds are loaded into the discoveeFeeds view asynchronously as the feed data is obtained
* The callback function of discoverWebSiteFeeds return both titles, feed title and link title
* in discoverWebSiteFeeds overwrite discoveredFeed with Object.assign()
* Prevent disabled elements from accepting focus or keyboard events
* new method setIfNotExist() to replace if(! .exist(id)) then .set(id)
* make sure drag & drop marker is always visible no matter the background color; use inverted color.
* in propertiesView the title input can be left empty to be updated by feed
* enable drag & drop of a link from the location bar as new feed
* Following "feed" hangs the browser: https://www.reddit.com/r/oddlysatisfying/comments/93vqdo/the_way_he_cuts_avocados/
  * The Problem is the '.+' in the RegExp at: syndication.js:209 txtXML.replace(RegExp("(</(rss|feed|((.+:)?RDF))>).*"), "$1");
  * FIXED: now using '[a-zA-Z0-9-_.]+' instead of '.+'
* in list view replace '&quot;' with '"' and also: '&amp;', '&gt;', '&lt;', '&copy;', '&trade;', '&reg;'
* when selecting a folder the tree scrolls the folder out of view => when the selected IL is higher then the viewport
* By using Active color in the conext menu the UI is fucked when the selected Active color is dark (black) like the text.
    => used bk color black and invert(100%) filter for menu item while been hoverd
* when selecting a feed with the right mouse key and then a folder (also with right mouse key) the prev selection is not cleared
    => wronglly used rssListView.setFeedItemSelectionState() insted of rssTreeView.setFeedSelectionState() in onContextMenu()
* open properties for folder
* create new feed inside folder when folder is selected
  * THE-FIX: in the private case where a folder is selected, the 'New Feed/Folder' actions (context menu) will create the
    new Feed/Folder INSIDE the folder as the first item and not above it like in the case where a feed is selected.
  * For now there is no simple way to create a new feed/folder above a selected folder. It will be created
    as the first item in the selected folder and the user can always moved it (via drag&drop).
* slide down an info tip when feed folder is modified by another party
* drag a feed into a folder
  * default behavior for drag&drop and create new feed/folder is to insert new item above the selected one.
  * for drag&drop the shift key while dragging over a folder enable the user to insert the dragged item into the folder (as first item). when
    the shift key is pressed while dragging over a folder the drop marker highlights the entire folder element
  * for new feed/folder the dialog provides a checkbox for 'Insert inside selected folder' when selected item is a folder
* convert suspendBookmarksEventHandler() to a single call function
* replace all classList.add\remove pairs with classList.toggle( String [, force] )
* dingbats folder in preference feeds folder. a BLACK DIAMOND was the best I could find
    * FILE FOLDER: 📁 - &#x1f4c1;           => ugly as fuck
    * OPEN FILE FOLDER: 📂 - &#x1f4c2;      => ugly as fuck
    * BLACK FOLDER: - &#x1f5bf;             => not supported
    * OPEN FOLDER: - &#x1f5c1;              => not supported
    * FOLDER:  - &#x1f5c0;                  => not supported
* preference -> sidebar colors: write the captions in the color input. NO
* refine the infobar. + left-to-right support
* mark feed as un-visited
* the left side of the infobar is outside of the panel when direction is rtl and the text is long and the LI item is deep in the sub folders
* try to move the list's 'Open All in Tabs' to a better location in the menu
* hide showInfoBar faster when user interact with UI ; on click
* try to fix the issue where clicking to the left of a tree item icon selects it's parent -> NO. BY DESIGH
* function appendTagIL(index, title, desc, url) {; not using desc in listView. use it in tooltip(title)?
* add small delay before showing the feed item description panel
* add checkbox preference if to show list's item description panel
  * Show Feed Item Description Tooltips, if available
* change escapeHtml/unescapeHtml to string prototypes
* resize large images in feed-item description
* Unify font size in feed-item description
* add 'mark all as read' 'mark all as unread' to the context menu for the tree view.
* only the item with the focus has the outline marker
* set max-width for select TAG in preferences, a bookmark folder with a very long name will destroy the page.
* in preferences, force the initializtion of the select feeds folder control when the bookmarks are modified.
* feed-item description keeps showing bellow bottom edge. maybe when list has VScroll => NO, rewitten
* SHIT SHIT SHIT !!! web feeds can be attack vectors. see: https://www.cgisecurity.com/papers/HackingFeeds.pdf
    * remove TAGS (i)frame, script, object a, etc.
    * htmlEntityToLiteral() is not safe - must check any data from xml before display (tree title, list title, description)
    * any data from XML feed diaplayed in the sidebar need to be striped from any HTML tags AND HTML Entities
        * [V] feed title
        * [X] feed description - no need; not fatched
        * [X] feed link - no need; parsed as URL
        * [V] feed-item title
        * [V] feed-item description
        * [V] feed-item link
* fetch feed description; in getFeedData()  rss > channel > description ; RDF > channel > description ; feed > subtitle ;
* descovery view; set focus (outline) on label and not on checkboxs
* redesign the descovery view
* all over; set focus (outline) on label and not on checkboxs
* syndication not working when it a local XML file. Duh?! Browser Security!!! Can't access user's local files unless selected by the user
* disable (optional) Periodic feed check when sage-like sidebar is closed
    * Do Background Feed Check When Sage-Like Sidebar is Closed
* add 'Lazy' option to 'Feed Check method' for one by one - 1.5 seconds between each one.
* midTrunc long URLs in dicovery view title => NO
* add ? to the 'Feeds Folder' preference explaining about the bookmarks; NO(?) => changed the title to 'Feeds Bookmarks Folder'
* add the word 'background' to the 'Periodic feed check' preference
* remove infobar on click
* why when I say 'no thanks' there is one more checking?
* create default Sage-Like folder in bookmarks with some default feeds 'Sage-Like Feeds'
* I get 'Error: node is null' when feeds folder is deleted from bookmarks window; browser.bookmarks.onXXXXX events now handle when the feed folder is deleted
* need to handle all the browser.bookmarks.onXXXXX events? => onImportBegan & onImportEnded are not supported
* discovery select all feeds
* maybe add js files for different code elements => NO
* make toolbar bk color as the dialog bk color
* need to do something about the CSS buttons hover/active. it looks bad => much better
* add messagePanel with OK & Yes/No buttons => warn before delete feed and notify about RSS drop before treeOpen actions (context menu)
* get feed-item lastUpdate node from syndication
* change local dateTime string format
* what is 'replaceMozExtensionOriginURL()' to 'relativeToAbsoluteURL()' => used replaceMozExtensionOriginURL in relativeToAbsoluteURL
* handle error when previewing feed
* feedPreview: Total Commander - 'select all' link => when href is '#' do not relativeToAbsoluteURL
* add first image to mozilla product page for the options page
* convert all panels to work like the messagePanel (with a promise). MAJOR RE-WRITE!
* MASSIVE TESTING ON PropertiesView - CHECK EVERY MODIFIED LINE!!!:
* replace .open() with .show()
* remove public functions from return{}
* support delete folder
* can context menu work with a promise? like messagePanel? => NO, not relevent
* ContextAction; combine rssTreeView openEditFeedProperties() and openEditFolderProperties() to openEditTreeItemProperties()
* add screenshots with the context menus.
* change screenshot-0; drop shadow to leaf
* remove logging from background.js.browser.commands.onCommand.addListener()                => DONE
* change browser_action.default_title to 'Sage-Like sidebar (Ctrl+Shift+F2)'                => NOT DONE
* add note to Unresolved in mozilla-extension-page.txt/product page about mozilla bug       => DONE
* message panel and descovery panel accept Enter as Yes/OK/Add button
* need to perform event throttling on the resize event in panel.js (setPanelLayout)
* restore splitter position, tree-view selected item & scroll position when sidebar is reopend.
* write a features list !!!!
* support for OPML import/export
* scroll imported folder into view
* mention in the description (readme) that only my Sage preference were implemented                                     => NOT RELEVENT ANYMORE
* in syndication.getXMLTextFromBlob() replace responseText with responseXML so will not need the m_domParser        => NO WILL FAIL ON 'XML Parsing Error: not well-formed'
  * only in text I can avoid the stupid XML/RSS Parsing Errors. if I use xhr.responseType = 'xml'; will i fail on Parsing Errors?
* move all prototypes out of the slUtil function
* url or any bad data in bookmark.title (strip?)
* use a locker in preference instead of removeBookmarksEventListeners()/addBookmarksEventListeners()
* create only one bookmarks event listener in panel.js(?)                                                   => NO, SYNC PROBLEMS
  * the listener will perform some analysis on the event and send messages to the treeView.js and the preferences.js
* MSG_ID_SUSPEND_BOOKMARKS_EVENT_LISTENER/MSG_ID_RESTORE_BOOKMARKS_EVENT_LISTENER need to be deleted? => NO
* use suspendBookmarksEventHandlerReqCounter() function for the semaphore                   => NO, CREATED A LOCKER CLASS
* convert the content of the onMessage.addListener() to switch/case instead of if/else/if/else
* convert all slGlobals message codes to numbers
* convert getCurrentLocaleDate() to a prototype         => NO
* check all resolve/reject that there is a 'return' after them
* timestamp in file name export (with the word 'export'?)
* in preferences.js when disableElementTree() is true the buttons stil respond to mouse hover
* check all setTimeout()'s          => ALL GOOD
* show the infoBar when user hover over a folder. When opening the folder the infoBar will say 'press the shift key to drop item <b>in</b> folder.'
* replace alert() in preference with something nice                                     => NO NEED
* Event throttling on the dragover event in rssTreeView.js (onDragOverTreeItem)         => NO NEED
* customize sidebar font (not context menu)
* fix some small things in TimeOfDayBox
* change loading img css in feedPreview like the one in preference
* some loading gif in the tree-view until tree is shown
* same redius in feed previewing for title and body     => NO
* apply same tab size standerd on all files.
* are Prefs names (internalPrefs, prefs) must be strings and not numbers like in slGlobals?     => NO
* discovery is taking too long: http://feeds.tomercohen.com/tomercohen      => BUGFIX: discovery did not handle url feeds that returned with netwrok error
* buttons in the feed preview? toggle read/unread mark all as un/read           => NO.
* get to the bottom of getCurrentLocaleDate(). Needed or can I use Date.toLocaleString()        ==> NEEDED
* try to change the mozilla Extensions feed with something that WORKS!!!            => COULD NOT FIND ONE - LINK DELETED
* initializing member elements may be done too match (document.getElementById). log all getElementById in panels if thay are done to many times
* when opening a folder in tree that is at the bottom it is opend outside the viewport (annoying) file explorer is scrolling the folder to the top of the viewport
* keystrokes to feed-item read/unread toggle (context menu shortcut keys) and maybe to some other menu items?
* replace Array.indexOf() with Array.includes()
* allow to add new feed/folder to the root feed folder when right clicking the treeView root UL
* showing the context menu when the root folder is not set?
* replace ALL screenshots.
* Toggle sidebar open/close browserAction; Bug workaround using *Connection-based messaging* mecanizem. (https://bugzilla.mozilla.org/show_bug.cgi?id=1438465)
* In manifest.json add ' (Ctrl+Shift+F2)' to browser_action/default_title when it works     => NO. If user change suggested_key it will not match.
* parseInt() is faster the Number()
* Button 'Subscribe Feeds to Sage-Like'. pageAction for feed descovery instead of toolbar button. also automatic background feed descovery for each page loaded (heavy)
* at http://feeds.tomercohen.com/tomercohen the page feeds is empty
* page Popup text direction match page text direction   => NO
* replace 'browser.tabs.query({ currentWindow: true' with 'browser.tabs.getCurrent()' => return undefined if not in browser tab context
* in message listeners the message id is sometimes 'id' and sometime 'message'. background.js, content.js CHANGE ALL TO 'id'
* when deleting and the deleted feed shows its items, I need to remote those items
* Subscribe button need to be shown when opening an rss.xml file or a feedPreview
* add preference for background feed descovery for web pages visible via pageAction/pagePopup
* in descovery view if domain name is empty use doc title (ex; file:///C:/Users/arielg/Desktop/Example.htm).
* descoveryView.runDiscoverFeeds() & PageDataByInjection()
  * use messaging between descoveryView and content.js instead of class PageDataByInjection() to get document data.    => NO. messaging will not work if pref showSubscribeButton is unchecked
  * in descovery view in runDiscoverFeeds() use PageDataByInjection.getCurrent() instead of PageDataByInjection.get(); => NO. PageDataByInjection.getCurrent() was removed.
* try to resolve the setTimeout(420) in pagePopup.js => the sidebar opening and the wait are done only if the sidebar is closed.
* sort the feeds in the descoveryView like its done in the pagePopup.js createFeedList()  (feeds.sort) => problematic may interfere with user actions
* convert: "" + num is faster then num.toString()
* in syndication.webPageFeedsDiscovery use document instead of domParser => CANNOT since using the PageDataByInjection() the Document object can't be sent via One-off messages
* create initilization(); functions in all js files
* add search capabilities to the treeView
---

## Next
* re-apply filtering when statuses of feeds has changed ?
* in descovery look for links <a> with the name feed or syndication or syndicate - need to remove duplicates becouse <a>'s href are same?
* ? change *One-off messages* with *Connection-based messaging*
* common.js is getting very large. (expeselly when included in manifest's content_scripts). need to split it and include when needed.
* re-desigh all popups as slide-down panels (?)

### Waiting for Mozilla to fix Bug 1398833/1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465
* for now there is a bug workaround using *Connection-based messaging* mecanizem.

### Unresolved
* a lot of sub folders in the tree view will fuck up the UI

### low priority
* look out for m_elmDiscoverPanel is null in discoveryView.setDiscoverLoadingState()
* BUG: elm is null in common.js when changing feeds folder and sidebar is open;  I think its one of the panels
* support bookmark seperators in treeView.
    > let elmHr = document.createElement("hr");
    > elmHr.id = bookmark.id;
    > parentElement.appendChild(elmHr);
* add dotted line to tree view => FUUUUUUCK

### Links for PR work
* PR: https://discourse.mozilla.org/t/rss-sage-whree-are-they/21741
* moz feed: https://discourse.mozilla.org/c/add-ons.rss
