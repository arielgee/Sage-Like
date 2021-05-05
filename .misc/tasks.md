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
* purge remove all because of async functions, executed too sone => rewriten and moved to the start on the view load
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
* discovery view; set focus (outline) on label and not on checkboxs
* redesign the discovery view
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
* message panel and discovery panel accept Enter as Yes/OK/Add button
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
* Button 'Subscribe Feeds to Sage-Like'. pageAction for feed discovery instead of toolbar button. also automatic background feed discovery for each page loaded (heavy)
* at http://feeds.tomercohen.com/tomercohen the page feeds is empty
* page Popup text direction match page text direction   => NO
* replace 'browser.tabs.query({ currentWindow: true' with 'browser.tabs.getCurrent()' => return undefined if not in browser tab context
* in message listeners the message id is sometimes 'id' and sometime 'message'. background.js, content.js CHANGE ALL TO 'id'
* when deleting and the deleted feed shows its items, I need to remote those items
* Subscribe button need to be shown when opening an rss.xml file or a feedPreview
* add preference for background feed discovery for web pages visible via pageAction/pagePopup
* in discovery view if domain name is empty use doc title (ex; file:///C:/Users/arielg/Desktop/Example.htm).
* discoveryView.runDiscoverFeeds() & PageDataByInjection()
  * use messaging between discoveryView and content.js instead of class PageDataByInjection() to get document data.    => NO. messaging will not work if pref showSubscribeButton is unchecked
  * in discovery view in runDiscoverFeeds() use PageDataByInjection.getCurrent() instead of PageDataByInjection.get(); => NO. PageDataByInjection.getCurrent() was removed.
* try to resolve the setTimeout(420) in pagePopup.js => the sidebar opening and the wait are done only if the sidebar is closed.
* sort the feeds in the discoveryView like its done in the pagePopup.js createFeedList()  (feeds.sort) => problematic may interfere with user actions
* convert: "" + num is faster then num.toString()
* in syndication.webPageFeedsDiscovery use document instead of domParser => CANNOT since using the PageDataByInjection() the Document object can't be sent via One-off messages
* create initilization(); functions in all js files
* add search capabilities to the treeView
* problem with reg exp /[^z]/.  should not get the feed named 'zzzzz' => feed title for http://megafon-news.co.il/ looks empty but has two '\u00' chars so 'zzz' is actually '\u00\u00zzz'
* re-apply filtering when statuses of feeds has changed. Notify applied filter about feed status change.
* in onDropTreeItem() event listeners are not removed from the m_elmCurrentlyDragged tree item before it's removed from the tree.
	* before this line: m_elmCurrentlyDragged.parentElement.removeChild(m_elmCurrentlyDragged);
* remember last filter
* dropdown list for filter ">" commands   => NO only 4 commands, WTF?
* use ONE SINGLE addEventListener() on entire treeview instead of many listeners on each tree item!!!!
	* https://gomakethings.com/checking-event-target-selectors-with-event-bubbling-in-vanilla-javascript/
	* https://gomakethings.com/why-event-delegation-is-a-better-way-to-listen-for-events-in-vanilla-js/
		* about focus event: https://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
* use ONE SINGLE addEventListener() for listView
* hide listView desc Tooltips when the escape key is pressed
* replace all x !== null or x !== undefined with double-tap     ==> NO; 84 replacements in 10 files; HUGE regression, not worth it
* regexp for HTML elements do not need to check for spaces between the '<' and the element tag name. /<\s*\bimg\b/
* regexp for HTML elements do not need to check for spaces between the '<' and the '/'.
* rephrase preference title and preference member    detectFeedsInWebPage
	* CHANGED THIS: Show Subscribe button <img src="../icons/pagepopup-16.png"> in address bar when feeds are detected in web page
	* TO THIS: Detect feeds in web pages and show subscribe button <img src="../icons/pagepopup-16.png"> in address bar.
	* Detect feeds in web page and show <img src="../icons/pagepopup-16.png"> button in address bar.
	* Detect feeds in web page. Subscribe button <img src="../icons/pagepopup-16.png"> will appear in address bar.
* in onClickTreeItem()
	1. restore default
	2. set a valid feed folder
	3. quickly select a feed
	4. get the error 'm_objTreeFeedsData.value(...) is undefined' in catch() in onClickTreeItem()
	==> The m_objTreeFeedsData.value() cant find the ID. the m_objTreeFeedsData was still not initialized by getStorage()
* preference "Feed check method" => "Feed refresh method" => "refresh interval"     ==> NO
* Lines are cut in listView desc Tooltips
	* https://www.manmadediy.com/site_index.rss
* use the rssListView.getListViewStats() function
* update stats after adding new feed or folder
* update stats after deleting new feed or folder
* after pref "show feed stats numbers" is implemented consider the creation of the .rtvStats div element is pref is unchecked ==> NO
* Renaming: subTree to folder (OpenSubTrees etc.)
* situation:
	1. feed selected in sidebar. Its 10 feed-items are displayed - stats are: ( 2 / 10 )
	2. background monitoring handels that feed and return 10 completely new items.
	==> Should I update the listView/feedStats Just because it is displayed?    ==> NO the list is used by user and it can by very annoying
* in list, handle keyboard event when list (UL) is selected but NO list item is selected. => Focus first item if any before focusing the parent list UL
* consider opening feed item from a single place. list click event, list KB event, ContextMenu click event, ContextMenu KB event
* include image in feedPreview  => will not get image link/title. Atom has no such thing
* BIG-BUG: when pref 'Periodic background feed check' is 'no thanks' clicking on toolbar's 'check feeds' is not working
* limit the actions of updateAllTreeFoldersStats() & updateTreeBranchFoldersStats() with m_bPrefShowFeedStats like updateFeedStatsFromHistory() & updateTreeItemStats()
* rssListView.setFeedItems() gets feed title AND feed LI.
	* feed LI contains the title.
	* when rssTreeView deletes an item in deleteTreeItem, it rssListView.disposeList() if title match rssListView.getListViewTitle(). TITLE CAN CHANGE. ==> Used MutationObserver to monitor LI caption
* common.js is getting very large. (expeselly when included in manifest's content_scripts). need to split it and include when needed.   ==> NO Need (yet)
* toggle feed-item read/unread affects the folder stats?????     => NO
* if 'mark all as read' is selected on folder it should relate to that folder only
* in Fx v67.0.1 there is some sort of 'feed preview' for some urls  ==> "syndicated content powered by FeedBurner"
	* for: http://feeds.nature.com/nature/rss/current       (RDF)
	* but not for: https://blog.mozilla.org/press/feed/     (RSS)
	* and but not for: https://ghisler.ch/board/app.php/feed/forum/3    (ATOM)
* change 'Open all in tabs' to 'Open all unread in tabs'
* discoveryView on 'http://megafon-news.co.il/asys/archives/299005' gets scroll bars. title (feedTitle) is too long
* in discovery look for links <a> with the name feed or syndication or syndicate - need to remove duplicates because <a>'s href are same?
* 'Aggressive Discovery' checkbox in the discoveryView to also look at <a> elements
* discoveryView; small text in the bottom status bar is cutting the bottom part of the letters y & g
* event delegating the discoveryView
* up/down keys in discoveryView
* for keyboard keydown I should use event.code and not event.key that can change its case
* event delegating in the pagePopup list
* use img in feedPreview; better when image is not found (google: better display when img src not fount or missing)
	* like here: http://www.bundysoft.com/news/blogfeed.php
* middle click in tree open feedPreview WITHOUT updating the feed state.
* change stats UI to and elyptic div justified to the end withot '()'       ==> looks like SHIT
* discoveryView is not working on feedPreview
* re-desigh all popups as slide-down panels
* add some caption to messagePanel & propertiesView slide-down panels
* toolbar min-width is creating a wird scroll problem. also with a panel shown  => A hidden label content was larger then sidebar overflow: hidden; to slide down panels
* change *One-off messages* with *Connection-based messaging*   => NO
* BUG: elm is null in common.js when changing feeds folder and sidebar is open;  I think its one of the panels  => cannot reproduse
* cannot drag feed items !!! the content of onMouseDownTreeRoot() is fucking the dragging
* tree item are shifting down when are bolded (example: do mark all as read/unread)
* make slideDown panel longer and move from -500px to -10px instead of -500px to 0px    => panel top padding set to 80px and top to -70px, hidden top position set to -700px
* when slide down panels are closed I can get a glimps of the hidden elements restored; the _hideXXX() in close() are faster then the transition
* expand all scroll tree to bottom to mach scrollIntoView() in setFolderState/toggleFolderState ?
* Make sure all objXXX.slYYYYY members are initilized; search for regexp: '\w\.sl\w'    => DONE
* use this when filter is first opened
	* slUtil.showInfoBar("Hover the filter text box for vital information.", m_elmTextFilter, m_elmTreeRoot.style.direction, false, 5000);
* add dotted line to tree view => NO NEED.  no one is doing it.
* support bookmark seperators in treeView.          ==> NO
	> let elmHr = document.createElement("hr");
	> elmHr.id = bookmark.id;
	> parentElement.appendChild(elmHr);
* look out for m_elmDiscoverPanel is null in discoveryView.setDiscoverLoadingState()    => never seen again
* Refactor syndication.js. Rename the functions including the term XML as preperation for JSON support
* RND & support json feeds  JSON.parse(txtXML)
	* discovery <link rel="alternate" type="application/json" title="JSON Feed" href="https://jsonfeed.org/feed.json" />
	* https://indieweb.org/JSON_Feed
	* https://adactio.com/journal/
	* https://daringfireball.net/feeds/json
* handle json as feedPreview
* detect feed from feedPreview
* add format to list items in the pagePopup
* handle 'Error: Extension does not have permission for incognito mode'
* RegExp replace [ \t\r\n]* with \s*
* the var + "\n", in console.log() is adding an extra " in the console => ALL occurrences are "\n" + var
* feed without title. why am I not using "<no title>"???    => I DO. It's that fucken feed with the invisible chars:   https://feeds.feedburner.com/co/bnZM
* search in URLs with special prefix character %
* add info about URL filtering in tooltip
	* URL search prefixed with a single percent character ('%')
* replace all the slow for-in/forEach loops with simple for loops
	* https://www.oreilly.com/library/view/high-performance-javascript/9781449382308/ch04.html
* replace typeof() with .constructor.name ???   => NO
* slUtil.disableElementTree() is too slow (opening/closing discoveryView after filtering ">load"); do I realy need to scan the entire tree?
* check all calls to slUtil.disableElementTree(). Regression!!! (also all tabindex settings)
* use properties tabIndex/disabled instaed of getAttribute()
* try to skip the 'filter: blur(1.5px);' when disableElementTree() a .slideDownPanel
* disable the filter text when closed
* toggle read/unread need to alert the reapply filter button
* replace all 'xxx.style.display' with CSS rule ? => NOT ALL. Just the ones which are inside loops and apply to multiple elements
* replace all querySelectorAll with querySelector if I use only the first one [0]
* no advantage in using a funcYes/funcNo in a loop over a simple if()
* replace xxx.querySelectorAll() with xxx.children => BULLSHIT no such cases
* Do filter '>unread' need to filter out loading feeds? => Yes
* (!!!obj.x) is NOT the same as (obj.x === undefined)! If obj.x is defined and its value is zero it returns TRUE! check all (!!!)   => problematic only when x is numeric
* CONSIDER replace all the slow for-of loops with simple for loops. regexp search: 'for *\(let\b.*\bof\b'   => Improvements is negligible
* wider --width-filter-text ? 125px!
* Remove the 'Options' caption in preferences for Fx v68 and up. Page layout was changed and the caption is redundent.
* toolbar buttons:                                                              ===> NO
  * quick access buttons to '>read', '>unread', '>error', '>load'
  * quick access buttons to '>read', '>unread' only
  * single quick access button with 4 radio buttons dropdown for '>read', '>unread', '>error', '>load'
* check if I can use those events to handle pre/post transition actions ("ugly way to apply 'overflow: visible' after the transition was completed")
	* check all setTimeout and setInterval
	* https://developer.mozilla.org/en-US/docs/Web/Events#CSS_Animation_events
	* https://developer.mozilla.org/en-US/docs/Web/Events#CSS_Transition_events
* check all funcXXX function are checked using 'typeof(funcXXX) === "function"' and not 'funcXXX === undefined'
* change 'Aggressive' to 'Aggressiveness'
* consider combobox insted of thi-toggler   => NO
* check tab attach/deattach with FeedsDiscovery
* Is there a way to handle a jsonfeed in a tab (discovery & popup) => handle jsonfeed and any plain text pages only from discovery
* use Map() for TreeFeedsData/OpenFolders instead of StoredKeyedItems   => NO.
* popup min-width
* button to abort the discovery
* member boolean flag in discoveryView for loading/not-loading
* support copy in drag & drop => NO
* drop feeds in tabs-bar and in location-bar
* replace indexOf with includes()
* use my Array.prototype.includesAll() ; did I used, somewhere, some other trick to do this => NO
* tri-toggler alternative: https://codepen.io/JiveDig/pen/jbdJXR/?editors=1100
	* box-shadow: inset 0 0 1px 1px rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(255, 255, 255, 0.1);
* tri-toggler: change the word 'Very' to 'High' => Low High
* Use keyboard Delete keys to delete tree items and not keyD => BOTH. delete is done with KeyD and Delete
* Link pagePopup & messageView with the Options page
	* manifest.json: "content_security_policy": "script-src 'self' 'sha256-VH2httsBzs0mSgiaWxj7JB7yRdSrmvTCu5iJ+QN7Gl4='; object-src 'self';",
	* messageView: In slUtil.incognitoErrorMessage() => return "Sage-Like extension is not allowed in private windows.<br>You can change that from the <a href='#' onclick='browser.runtime.openOptionsPage();'>Options page</a>.";
	* pagePopup:
		1. In onDOMContentLoaded() => updateStatusBar("Feeds folder not set in <a href='#' onclick='browser.runtime.openOptionsPage();'>Options page</a>.");
		2. In updateStatusBar() => m_elmStatusBar.innerHTML = STATUS_BAR_MESSEGE_PREFIX + msg;
	* References:
		1. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy
		2. https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
		3. https://report-uri.com/home/hash
		4. https://content-security-policy.com
		5. https://caniuse.com/#feat=contentsecuritypolicy&search=csp
* Enable user to place the feeds folder in "Other Bookmarks". Allow preferences to access the entire bookmarks tree
* handle xml without XML prolog; https://www.buzzfeed.com/nsfw.xml
* in title/description sidebar/preview replace common &#xx; like: <title>World&amp;#39;s First Extreme Cyclist?</title> => already DONE; added numeric Entities
* remove not used members m_elmMainPanel
* hide slideDown panels instead of disable using transition end (and not * disable content of slideDown panels with transitionend) => NOT GOOD ENOUGH
* better handling of slUtil.disableElementTree(m_elmToolbar, value, true)   => IT'S OK
* check all uses of disableElementTree() (slideDown panels) tabIndex
	* the filter text container is not managed correctly
* check way the "big ass" folder is not remembered
* hide infoBar when not visible (after fadeOut, use event transition end)   => NO! Just disable it
* showInfoBar() the dirStyle parameter is not page direction!
* debouncer on notifyAppliedFilter. may be called too match => NO NEED
* fixing feedPreview/sidebar encoding for windows-1255. And there is: feedData.xmlEncoding.         =====>>>> IT IS DONE! answer is charset in the XMLHttpRequest's MimeType.
	> Can this help? https://stackoverflow.com/questions/18879860/change-javascript-string-encoding
	> what about this? <meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
	> google this: javascript change encoding
	* Example: http://www.haayal.co.il/xml/rss
	* Example: http://israblog.nana.co.il/blog_rss.asp?blog=106751
	* Example: http://israblog.nana.co.il/blog_rss.asp?blog=177394
	* Example: https://www.bathlizard.com/archives/2013/arik-einstein
* when sidebar is opend the tree is checked twice!!!    => NO IT'S NOT. Duplicate feeds in tree
* hide infoBar on tree scroll only when refElement is a tree item
* Move infoBar to seperate object => new class in common.js
* can toggle read/unread when feed is updating  => not a problem
* preference select feed folder: replace the diamond with a '❯' (&#x276F; - Heavy Right-Pointing Angle Quotation Mark Ornament).
* supprt standerd copy (ctrl+c, ctrl+insert) WITH 'C'
* intercept onHeadersReceived
* dimm pageAction icon when it's hidden
* why "bummer" for https://rss.com => FIXED
* why the pageAction icon pop out and hide in https://rss.com/what-is-rss/ (just in fx v59.0.3) DEFENETLY NOT ME!! => FIXED
* testing XML file at syndication.getFeedData() need to consider XMLs that are not feeds    => NO; getFeedData() is wrpper for only determining the file type
* testing JSONFEED with json version    => NO; same reason as above
* button in feed preview to open page nativly   => DONE! link and not button
* menu text is wraping
* menu; change "Open" to "Open in tab" or "Open in Current tab" => NO
* the rss title in the discoveryView tooltip and pagePopup has newline in the string https://rss.com/what-is-rss/
* Focus lost when infobar popup while user is typing or opening filter
* contect menu to open link in Sage-Like feedPreview    => NO too intrusive
* when the feed is OK but has no feed-items and the pref 'show total unread count' is on, the feed state is set to error.
* the pref title 'Show total number of unread feeds and feed-items' need to change to just 'Show total number of unread feed-items'   => IT'S OK
* reload list view when feed-item desc pref has changed
* feed-item desc tooltips time and colors
* in dark mode the options page looks bad
	* following CSS snippet may help; need to be checked on win10 dark
		@media (prefers-color-scheme: dark) {
			body {
				background-color: rgb(42, 42, 46);
				color: rgb(249, 249, 250);
			}
		}
	* related links:
		> https://discourse.mozilla.org/t/how-to-detect-the-dark-theme-in-a-webextension/38604
		> https://discourse.mozilla.org/t/detecting-dark-theme-for-options-pages-in-webextension/43151
* redesign the feed preview
	* Header:
	  ---------------------------------------------------------------------------------
	  |                                                 [icon] Sage-Like Feed Preview |             (small text)
	  | [feed_title_text]                                                             |             (big text)
	  | [feed_description_text]                                                       |             (medium text)
	  |                                                                               |
	  ---------------------------------------------------------------------------------
* add numbring to the feed items in the feed preview
* show some title in feed preview when there is an error maybe the feed title from the tree-view?   => hostname in title when error
* read RSS <content:encoded> as a prefered alternative to description		=> Done. added '*|encoded' for encoded with any namespace (rss&rdf)
	* BUT! I don't know why 'content|encoded' is not working in querySelector() see:
		> https://www.w3.org/TR/selectors-3/#typenmsp
* remove links (<a>, not text content) in feed-item tooltip
* do something about the desigh of the the feed-item tooltip content. its ugly, get rid of the title?	=> DONE. removed underline and body indentation added item numbering
* split SyndicationStandard to classes		=> DONE!!!!!!! :)
* relative links to images are not showing the image in the feedPreview
	> https://matthiasott.com/articles/feed.json
* when propertiesView is open for new feed set focus to url location and not to feed name
* support for feed-item attachments and/or media files for all formats. see specifications.
	* RDF - n/a
	* RSS:
		* <enclosure url="required" length="required" type="required">		<!-- type is MIME ("audio/mpeg") -->
	* Atom:
		* <link href="required" rel="optional"  type="optional" hreflang="optional" title="optional" length="optional">
		* <link href="required" rel="enclosure" type="optional" hreflang="optional" title="optional" length="optional">			<!-- for media files -->
		* <link href="required" rel="related"   type="optional" hreflang="optional" title="optional" length="optional">			<!-- for documents -->
	* JSON:
		* "attachments": [ url:"required", mime_type:"required", title:"optional", size_in_bytes:"optional", duration_in_seconds:"optional" ]
	> https://www.cloudbasemayhem.com/feed/podcast/     (sample with enclosures)
	> https://www.w3schools.com/xml/rss_tag_enclosure.asp
	> https://en.wikipedia.org/wiki/RSS_enclosure
* show attachments in feedPreview			=> DONE
* look for icons for MINE types
* in the UI call the feed-item attachments 'Attached Resources' (media and http pages)	=> NO NEED
* consider adding some-sort of tooltip to feedPreview attachments on hover
* two types of feed-item descriptions - new properly 'content' in Feed._createFeedItemObject() as an additinal 'desc' properly
	* MOTIVATION: file ./misc/1.xml has <description> and <content:encoded> but <content:encoded> is prefered for feedPreview
	* for xml feed 'content' will be set by <content:encoded> using getElementsByTagNameNS("http://purl.org/rss/1.0/modules/content/", "encoded")[0]
	* for json feed 'content' will be set by content_text or content_html (preferably content_html since feedPreview is the main target for content)
	* 'desc' is for feed-item tooltip only and 'content' is for feedPreview (appending 'content' to 'desc' for feedPreview may be bad if data is same and content is HTML)
	* if 'desc' is missing in xml then use <content:encoded> instaed and 'content' remain empty		=> DONE
	* if 'desc' is missing in json then use content_text or content_html instaed and 'content' remain empty (preferably content_text since tooltip is the main target for desc)	=> DONE
	* PROBLEM: how to manage the desc/content settings ???	=> DONE
* read rss <content type="html"> as feed item content in preview	-> HERE: https://www.heise.de/rss/heise-atom.xml, IT'S ATOM => DONE
* check at home is gmail's atom feed is processed without errors.		=> Got 'Critical security alert' from google => `¯\_(ツ)_/¯`
* found a 1x1 tracking image in: https://www.npr.org/feeds/510317/feed.json								==> NOTHING TO DO! :(
	* <img src="https://media.npr.org/include/images/tracking/npr-rss-pixel.png?story=812072352">
		* 'tracking' ?
		* 'pixel' ?
* look for last user comment in mozilla [support] page
* in feedPreview the error spinner has its own frame when it spin	==> LEAVE IT IT'S OK
* where the subscribe button image in the preferences page has gone in last Fx version?????		file name is case-sensitive
* add url to feed tooltip in the treeView
* indication in feed-item tooltip for attachments (MimeType icons)
* new preference whether to 'Show feed-item attached resources in tooltip'
* look for error 'feedItems is undefined' in rssTreeView:1789  "let totalCount = feedItems.length;"
* check --color-preference-hover at home with dark mode
* executeScript() runAt: "document_end"; change to document_idle to avoide errors for slow loaded like 'https://rss.com/'		=> CHANGED TO "document_idle"
	* try this: all logs to each executeScript(),  keep first 2 as document_end and the rest set to document_idle and see what is what
* BUG: Feeds are not added to tree from pagePopup! OR are added to the top of the tree!!!
	* condition: when sidebar is closed and all tree folders are closed and all feeds are in folders
	* result: sidebar is opend but feed are not added OR are added to the top of the tree!!!
	* Thoughts:
		* sync issue. need to wait for tree to be fully loaded before adding or first add and the open tree
		* tree has many feeds, longer to load.
		* instead of MAX_WAIT_FOR_SIDEBAR in pagePopup.onClickButtonAdd(): broadcast tree created OK from rssTreeView.createRSSTree() and handle in pagePopup.
* BUG: pagePopup do not alert about existing feeds
	* condition: when sidebar is closed
	* result: sidebar is opend but feed are sometimes not added and sometime do get added
* BUG: multiple and fast deleting of feeds with keyboard like a maniac results in:							==> DONT BE A MANIAC!
	* error: [Sage-Like] Error: No bookmarks found for the provided GUID. function deleteTreeItem/</<()
* in following link pagePopup finds feed but discovery do not: http://israblog.nana10.co.il/blogread.asp?blog=177394&blogcode=11287921
	* discovery processed 'http://israblog.nana10.co.il/sidebar/blog_rss.asp?blog=177394'. '/sidebar/'!?!?!?!?!?!? REALLY?  => replaceMozExtensionOriginURL()
* From mozilla [support] page:
	* preference to open feed preview with left click		'Primary mouse click ALSO opens Feed Preview in a new tab'
* AT HOME: check subPreference design changes in dark mode
* AT HOME: check switching mouse buttons
* preferences.css Renaming
	* feedTransButton to preferenceControlButton
	* controlButton to extensionButton
* must remove all !important from css files (specificity)		=> DONE!
	* !important in feedPreview.css - check if rules from a custom css can overwrite those rules		==> THEY CAN
* in preferences.validatorCSSFile() do not match '@namespace url("http://www.w3.org/1999/xhtml")'
* missing revokeObjectURL() in opml.js (anywhere)
* From mozilla [support] page:
	* how to allow user to safly insert user-CSS's into feedPreview
* write css source to file?		=> NO there is view
* clear custom CSS file/code
* mimimize CSS code		=> NO
* save 'browser.storage.local' to m_localStorage.
* rewrite all preferences.css variables (colors)
* broadcast that custom css file was consumed and reload all feedPreview? = >reload done on tab focus
* parked.js is using 'tab.tabId' and not 'tab.id'
* 'Primary mouse click ALSO opens Feed Preview in' rewrite! no indication that we are talking about clicking on a tree feed
* change preference to open feed preview with left click 'in current tab' 'in new tab'
	> Click feed to ALSO open Feed Preview		[O] No		[O] current tab		[X] new tab
* check all uses of setTimeout() can thay be removed/replaced by sendMessage
* when feed-item tooltip height is bigger the the height of the listview the sidebar fliker (both have v scrollbars)
* open feedPreview from pagePopup without adding the feed to sage!		== with middle-click
* feed tooltip: add '\u2003' after line header (ex. URL:). add extra '\u000d' after feed title
* checking and then unchecking the 'use custom CSS' unnecessarily reload the feedPreview
* pagePopup: indication that url already in bookmarks
* menu item for treeview folder to open all feeds as feedPreview	=> all UNREAD feeds
* feedPreview tooltip flikers when moved inside attachment
* selected tree item lost when clicking on blank/ no tree
* Red warning for attention slideDown panels
* messageView do not direct enter to focused button (all slideDown panels?)
* update feed title/tooltip in treeView when middle-clicking for feed preview; reproduce: middle-clicking new feed =>NO! For that I need to fetchFeedItems()
* add option to scan page for feeds from the location bar	===> NO NO NO! use discoveryView in sidebar
	* https://www.reddit.com/r/firefox/comments/fiz263/does_firefox_now_have_any_capability_to_detect/
	* https://www.reddit.com/r/firefox/comments/fiz263/does_firefox_now_have_any_capability_to_detect/fkkrthg/
	* in preferences
		> Subscribe button <img> in address bar
			> Feed detection in web pages (?)			[O] On page load		[X] On mouse click
			> Detect Feeds in web pages on (?)			[O] Page load			[X] Mouse click
			> Feed detection in web pages				[O] No		[O] On page load		[X] On mouse click
* different behavior when i drag and drop icons from bookmarks library. (Fx v59.0.3)		Sage-Like supports strict Content-Types with semantics
	* when DnD 'https://www.technologyreview.com/topnews.rss' into a taw tab it loads feedPreview	responseHeader.Content-Type = 'application/rss+xml; charset=utf-8'
	* when DnD 'http://feeds.feedburner.com/TechCrunch' into a taw tab it loads old Fx feedHandler	responseHeader.Content-Type = '"text/xml; charset=UTF-8"'
* drag and drop feed from one browser window to other is messing the UI. leaving the drop indicator visible after drop (that didn't work)
* replace 'Attention' with 'Error'/'Delete'
* the feeder may need some sorting before a call to _getFeedLastUpdate(). the fallback to get date from an item may not return the most updated (bigger then)
* move the list Status bar icon to the right when the list is very short and the scrollbar is gone
* open folder with one click?
* support feed entries from https://www.kill-the-newsletter.com/ that provide HTML content Instead of links. WHERE IN THE BOOKMARK???
	* https://discourse.mozilla.org/t/support-sage-like-sidebar-based-rss-feed-reader/43383/5
	* 3ewnbuy1qdd8jfci1q6p@kill-the-newsletter.com
		* https://www.kill-the-newsletter.com/feeds/3ewnbuy1qdd8jfci1q6p.xml
	* udnq204nxqcfai05q7vk@kill-the-newsletter.com
		* https://www.kill-the-newsletter.com/feeds/udnq204nxqcfai05q7vk.xml
	* mvvbgk7ev4sfcfv2xanm@kill-the-newsletter.com
		* https://www.kill-the-newsletter.com/feeds/mvvbgk7ev4sfcfv2xanm.xml
* <content type="xhtml"> in https://www.php.net/feed.atom
* Ctrl+Alt+MClick in pagePopup !
* remove '<style\>' and 'style="xxx"' from description and htmlContent ; color attributes in tags are overriden (bgcolor="#000000")
* why feedPreview is not opened when clicking on this feed link (rdf) or when its types into the address bar	==> STRICT CONTENT-TYPES SEMANTICS AGAIN!!!!
	* https://www.w3.org/QA/Overview.rss (in this page: https://www.w3.org/QA/2003/09/html-xhtml.html)
* maybe the one-click open folder is not so good. consider: one click on folder's icon open and on folder caption just select. but then dblclick on caption for open. (preference??????? :( )
	> Tree Folder action (Open/Close)			[X] one-click		[O] double-click
	> Folder click action (open/close)			[X] Single-click		[O] Double-click
* https://www.npr.org/feeds/510317/feed.json has an image enrty in the feed-item entry. show it in the feedPreview ?
	* check all formats for an image entry
* folowing link not showing pagePopup with Fx buildin feedHandler		==> addons.mozilla.org --> Missing host permission for the tab
	* https://addons.mozilla.org/en-US/developers/feed?privaterss=7eedb0645da941f38c734e8e960875cd
* show url in listview when title is empty ? https://www.jvt.me/feed.xml		==> NO
* drag and drop plane text urls
* title of feedPreview is url to site
* 'urn:md5:e2c5927f3df44fc0bd421461cdd8e422' is a valid URL. check for http prefix?
* selected text from url bar is not dropped in tree
* add origin/hostname/feed-source to feedPreview html elemnt to provide option for different CSS customization for different feeds
* can't drop in empty root folder: Error: Bookmarks.jsm: fetch: Invalid value for property 'guid': "rssTreeView"
* a big bold '∅' when tree view is empty		==> NO
* replace 'innerHTML' with textContent by using \uXXXX instead of &#XXXX;
* firstChild / lastChild ==> firstElementChild / lastElementChild
* middle-click in discovery to feedPreview
* if there are attachments but no description use listViewDesc panel
* folder not getting focus when menu is visible
* think of that. any mouse click on feed item opens the feed (right-click that opens menu, middle-click that opens feedPreview) => NO
* new feed property; Always open in Feed Preview.
	* This is good for services like kill-the-newsletter or any other xxx-2-RSS service that provide all content in feed-item.
	* It will override the 'Feed click ALSO opens Feed Preview' preference
* convert the infobar into a somesort of slideDown bar (sildeBar) without refElement	=> NO but got many Improvements
* how it looks in win7 supported? (https://graphemica.com/)
	* 📁 📂 🖿 🗀 🗁 (compare with line 120)
	* ∅
	* 🛈
* the key press R, U N, F are not working when no tree item is selected
* m_objCurrentlyDraggedOver.lingered is not reset after => add 'm_objCurrentlyDraggedOver.init();' in function 'onDragLeaveTreeItem(event)'
* selected tree item remain selected when collapse all => add this in function 'onClickExpandCollapseAll()'
* all onTransitionEnd need to check event.propertyName ?
* feed title in tooltip not updated after refresh that coms from the preferences page
* create class SlideDownPanel
* change function order in messageView open() close() initMemberElements()
* escape on body keyDown closes all panels
* handle tab in listview move focus to current page
* add to opml import/export additinal attributes for 'update title from feed' and 'open in feed preview'
* first folder in opml export (root folder) must be... open! as it is open since its content is visible in the treeView
* when nested promise, do the last first promise catch() handles throws (errors) from the internal promises? or do I need to catch() the internals too?
* add stats to OPML import/export.
* optimize internalPrefs like prefs
* when deleting vary quickly (kb delete & enter) the delete-slide-down panel is not pulled-up. buttons have no events and only escape from body removes it
	* event for enter is fired before transaction-end; m_isDown is the problem; it prevents the pull-up; need to be moved from transaction-end to pull()
* abort webPageFeedsDiscovery if view is closed
* are folders removed from internalPrefs when changing root folder?
* StoredKeyedItems.purge() need a remove() w/o this.setStorage() for faster action; .purge() will call this.setStorage() at the end
* the openInFeedPreview in TreeFeedsData is not there for users updating to new version. need to check on that
* PROBLEM: changes from old version when reading data from local storage. openInFeedPreview and lastChecked are new and missing when getting storage for internalPrefs
	* replace purge() with maintenance() that will handle all version upgrades. Do not forget about uses of internalPrefs from preferences. call maintenance() before all. background.js?
	* in TreeFeedsData
	//////////////////////////////////////////
	value(key) {
		if( !!!(this._items[key].openInFeedPreview) ) {				// openInFeedPreview is new for TreeFeedsData; set it if it's missing
			this.set(key, { openInFeedPreview: false });
		}
		return super.value(key);
	}
* StoredKeyedItems default set() should be {} and not "x"
* m_objTreeFeedsData.value(elmLI.id).openInFeedPreview) in onClickTreeItem was not preceded with a .getStorage() => one .getStorage() for all treeview, .setStorage() only if needed
* m_objTreeFeedsData.setLastChecked() is not setStorage()
  checkForNewFeedData
	replace this:
		m_objTreeFeedsData.setIfNotExist(id);
		m_objTreeFeedsData.setLastChecked(id);
	with this
		m_objTreeFeedsData.set(id);
  Do not do this: 'm_objTreeFeedsData.value(elmLI.id).lastVisited = 0;' Do that: 'm_objTreeFeedsData.set(elmLI.id, { lastVisited: 0 });'
* is setIfNotExist() REALLY needed in openEditTreeItemProperties() ? at all?	=> leave it
* filter tree, delete item, reapply filter must be on	==> NO it's not
* add 'Easy' to 'Feed check method' pref. 10 batches with 4 seconds pause
* return the Promise from all set preference functions in prefs and internalPrefs
* display OPML import/export stats to user.
* alert() messages in preferences are not centered.
* in title (tooltip) there are uses on \u000d and also \n. make up your mind!
* white-space: pre-wrap; to use \n in textContent;  scan all innerHTML uses AGAIN!
* middle-click from pagePopup creates following error in console. also the feedPreview opend is w/o custom CSS:		=> happends when created tab is not active
	> [Exception... "Component returned failure code: 0x80070057 (NS_ERROR_ILLEGAL_VALUE) [nsIDOMWindowUtils.addSheet]"  nsresult: "0x80070057 (NS_ERROR_ILLEGAL_VALUE)"  location: "JS frame :: resource://gre/modules/ExtensionUtils.jsm :: runSafeSyncWithoutClone :: line 70"  data: no]
* messageBox in dark mode
* replace all \u000d (\r) with \u000a (\n)
* check all references to createNewFeed|createNewFeedInRootFolder|createNewFeedExtended
* support copy-paste in tree ?
	* https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
	* https://keycode.info/
* link to self in feedPreview => NO
* for _createSingleListItemFeed(): pass strings instead of elements => NO
* context menu paste
* using the returned Promise from the set preference functions in prefs and internalPrefs
* join broadcastCustomCSSSourceChanged() with broadcastPreferencesUpdated()
* feedPreview bottom margin with body
* from multi parked feedPreview some tabs dont get the custom css
* detect right-to-left languages and set direction
* is strUrl.stripHtmlTags() neccesery? what if I use URL() for all urls with base and for the feeData object?
* wrote (1) in feed title and then I tried to delete it !!!!!!! DAM! that innerHTML !!!		=> getTreeItemText(elmLI).escapeHtml()
	* (1) '</span><h1>Hello, <a href="https://www.888.com">World!</a></h1><span>'
* opml export: inserted an '&' from a folder title to an XML file. escape XML resereved chars; way not use XMLDoc?
* opml import: skipped a non valid URL (moz-extension://) where did it came from? no validURL() when dragANDdrop-ing?
* rename escapeHtml() to escapeMarkup
* fix hang when loading https://www.php.net/feed.atom in Fx v59.0.3		=====> only in Fx v59.0.3 and only with https://www.php.net/feed.atom
* Do NOT get drops from another window ONLY if its "text/wx-sl-treeitem-html"
	* (!!!m_elmCurrentlyDragged && transfer.types.includes(validMimes[0])) ||		// Prevent drop of "text/wx-sl-treeitem-html" from another window
* call suspendBookmarksEventHandler() with an arrow function expression and not an anonymous function (let funcMove = {} => {})		==> NO
* InfoBubble.i.show() revisit all dismissOnScroll parameter. need to be true only if it has a reference element
* offsetLeft - clientLeft		==> NOT RELEVENT
	* offsetLeft = position left+margin from the first positioned parent left edge.
	* clientLeft = left border + left scrollbar width (if present). (block level elements -only!)
	* https://stackoverflow.com/questions/27199247/what-is-the-difference-between-offsetleft-and-clientleft-in-javascript
* fast multiple delete with Kb of feeds leave the sidebar disabled (and blured) ==> situation improved but not resolved
* the InfoBubble alert about reappling filter due to feed status changed must be limited
* rename: ?etReapplyFilterShowMsgCount => ?etMsgShowCountReapplyFilter
* rename: ?etHoverFilterTextBoxShowMsgCount => ?etMsgShowCountHoverFilterTextBox
* getMsgShowCountReapplyFilter() may occure after widget is closed and the wrong message in the InfoBubble will blink
* check for getMsgShowCountReapplyFilter() in the openFilterWidget() and in the notifyAppliedFilter() just check for m_reapplyInfoBubbleMsgShownOnce (also change its name)
* when many feeds are loaded some remain in loading status until thay are clicked
* SlideDownPanel support for no animation: DONE. Still need to complate the preference wrapping to it all
	* slGlobals.MSGD_PREF_CHANGE_xxx, broadcastPreferencesUpdated(), style.setProperty("--transition-duration-slide-down-panel", animate);
	* handle situation where setting if modified while panel is down
* support without preference: consider preference for no dialog animation (.slideDownPanel transition)
	* transition-duration from 300ms to 0.1ms
* in panel.onKeyDownBody(): can I use PropertiesView.close() to close all/any of the PropertiesView panels?			=> NO
* in leatest Fx ver the discoveryView (PageDataByInjection, _injectCode) works differently, no 'Unable to access current tab' line. => executeScript not rejecting: open Bug 1639529
* when the messagesView is on the blue listView icon is moved to the left if the list has a scrollbar
* UI density, font name and font size do not impact the dialogs		=> UI density, font name and size is limited to tree and list views
* use #rssTreeView and #rssListView instead of .treeview and .listview in css and js and maybe remove the class-names
* discovery is realy slow to start on https://developer.android.com/guide. takes time to change to 'loading'
* click on link in https://www.haaretz.co.il/misc/rss not opening feedPreview	==> STRICT CONTENT-TYPES SEMANTICS ALL OVER AGAIN!!!!
* support keyboard navigation in ContextMenu
* replace querySelectorAll()[0] with querySelector()
* console error: TypeError: m_objTreeFeedsData.value(...) is undefined[Learn More]  rssTreeView.js:884:16	=> can't be repreduced
* when click on feedPreview attachment (https://www.php.net/releases/feed.php) that tries to download the page goes blank, there is no back button and only F5 works
* try to collapse parent elements of removed elements when using stripHtmlTags() and stripUnsafeHtmlComponents()
	> https://matthiasott.com/articles/feed.json
* pagePopup is doubleing the entries. not clearing? something to do with back and forward. need to repreduce. HERE: https://adactio.com/
* menu hotkeys must check that the ctrl/alt/shift are NOT pressed	=> NO
* disabling a big tree with all folders are open is realy heave on the fps	=> NO GOOD REPLACEMENT WAS FOUND
* change the slideDownPanel transition function when prefs.setAnimatedSlideDownPanel() is set to false	=> POINTLESS
* a better word for 'Easy' in 'Feed check method' pref.		=> 'Easy' IS GOOD
* consider '@media (prefers-color-scheme: dark)' for feedPreview		=> THATS WHAT CUSTOM CSS STYLE IS FOR.
* consider '@media (prefers-color-scheme: dark)' for sidebar		=> THATS WHAT PREFERENCES SIDEBAR COLORS IS FOR.
* preferences dark mode: the bullet comment at the end has its own bk color. thats not right.
* convert discoveryView and messageView to classes and create base class for slideDown		=> NO
* re-check preferences dark mode
* detect right-to-left languages and set direction by first characters of the text instead of the amount of characters in the text. => NO NEED - performed on titles (which are short)
* detect right-to-left languages and set direction in listview tooltips
* replace trim() with trimStart()
* find a way to format the Details/Changes in mozilla-extension-page.txt so that it will look pretty in both the addons website and the browser's extention page.
* manifest.json; Rename `applications` to `browser_specific_settings` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
* extension.getURL() is deprecated. Use runtime.getURL().
* test XML handling (contect._collectPageFeeds, background.onWebRequestHeadersReceived) on all rss file types
* use INJECTABLE[] in background.injectContentScripts()
* the '&_SLWxoPenuRl=nOtinFEeDPREVIew'. replace with what i did in lizard for 'reload w/o alterations' => no need
* htmlEntityToLiteral.entities: '&#8211;' long dash. There mast be a better solution then stating all characters; (http://hnapp.com/rss?q=score%3E100) => using String.fromCharCode()
* search for '(reject|resolve).*\n\s*return' with '.*' and fix then
* QA Test all test feeds in import in v59 and latest
* remove the popup button from addressbar on navigating away from page. else popup shows "something is wrong"	=> NO
* triage the buildin feed URLs. Feed from https://www.manmadediy.com/ is DEAD.
* too many log writing - temperary disable logging when discovery-Aggressive ?
* replace substr() with substring() or slice()
* detect 'host permission for the tab' to avoid injection error. Example: a github source code file displayed raw (https://raw.githubusercontent.com/arielgee/Sage-Like/master/README.md)
* feedPreview: show relative time in text (3h 1d, 2w, 5m, 1y)
* remove empty elements from the feed-item description tooltip => no need; there is no
* feed-item description tooltip: remove the images? only text? => already DONE
* pasted url from THIS file ito the tree view is 'invalid URL error' => for clipboard.readText(), it's not simple text (include formating). clipboard.read() not supported
* add table of content in feed preview to jump to each feed-item => jump list
* auto-hide sidebar => NO
* in prototypes use `oRef` to reduce references like in `Date.prototype.getRelativeShortLocaleString()`
* use browser.webNavigation like in lizard ? => NOT RELEVENT
* feedPreview: replace changed custom CSS withOUT reloading.
* create some CSS files that will serve as samples and/or templates (like the 2 columns)
* preference: maximum feed items to display (different for list and feed preview?) => NO
* can I import??? found this in background.js (Panorama extension) 'import { loadOptions } from "./_share/options.js";' => too complicated
* check following links
	* in `Sage++ (Higmmer's Edition)` feeds don’t get recognized; "Failed to get feed data. [ Feed format is neither XML nor JSON. ]" => PROBABLY performed discovery and display what's discovered
		* http://www.ohgizmo.com/
		* https://boingboing.net/
		* https://www.androidpolice.com/
		* http://hnapp.com/?q=score%3E50
		* https://www.blog.google/products/gmail/
	* in `Feedbro` and/or `Sage++ (Higmmer's Edition)` feed items differ from Sage-Like
		* Sage-Like return less (50/100 vs 10-30) => PROBABLY stores locally old items
			* http://www.theverge.com/rss/index.xml
			* http://feeds.feedburner.com/TheWirecutter
			* http://feeds.feedburner.com/blogspot/amDG
		* Sage-Like return more (100 vs 50) => PROBABLY limits the number of displayed items
			* https://cdn.kuechenstud.io/feeds/ldn-mp3.xml
			* http://feeds.megaphone.fm/intercepted
* WITH NEXT VERSION: ===> Post 'sl-customFeedPreview-CSS-files.zip' in https://discourse.mozilla.org with following text with next version
>A few basic custom CSS files for the Feed Preview page that can be used as‑is or serve as examples.
* add a link to the extension's page to the posted 'sl-customFeedPreview-CSS-files.zip' in discourse.mozilla.org
* use site's favicon for feedPreview page; access https://www.host.com/favicon.ico and replace the href of <link rel="shortcut icon"> in feedPreview.html
* try to handle more cases of site's favicons
* change preferences with multiple "radio" type <input>s into <select>s. make the page less clutter (A Feed-Click autom...   "No, I'll use Middle-click", "In a new tab")
* rebuild test feeds. fix http linsk to https, create folder with feeds (at least one or each standerd) that differ in sort order (chronological/source)
* allow two different types of feed sorting, "chronological" and "source". like old sage. don't call xxxxFeed._sortFeederByDate(). broadcast preference change.
* in syndication.fetchFeedItems() set default value to 'reload' parameter so that no one calls the function with 'undefined'
* seperate preferences into blockes with captions ?
* remove/hide the jump list button when there are no feed-items to display. for example an error ('Failed to get feed data') or an empty feed
* The stripHtmlTags() removed iframe tags and left the content of the iframe. m_sRxFrameTag was fixed to include the content.
* bypass redirect to feedPreview: when responding status code is '301 Moved Permanently' the EXTRA_URL_PARAM_NO_REDIRECT parameter is removed from url and redirect is not skipped. (fix for Fx84 and up)
* need to fix slUtil.getCurrentLocaleDate(). return 2 hours head? (tested in 23/2/2021) `new Date()` differ between Fx59 and Fx85. => `new Date()` is NOT differ between versions!
* asSafeNumericDate() returns different types: Date or numeric value ; should be `getCurrentLocaleDate().getTime()` ?
* xmlFeed._getFeedLastUpdate() and xmlFeed._getFeedItemLastUpdate() returns different types: Date or string ???	=> as design
* Update feed state when feed is middle-clicked in tree.
* add this to discovery folder in the TEST-feeds export: https://www.ynet.co.il/articles/0,7340,L-3369891,00.html
* in pagePopup.js and discoveryView.js the feed.lastUpdated may be missing and it's OK but if its string should I force it to a valid Date?
* check all `statement || statement` will not do what u think
* consider defaulting dates to `0` instaed of `Date.now()` => NO
* double click on `sort chronological` when feedPreview is open:	==> implement a debouncer
	* Error: Error index: 0, No matching message handler
		Stack trace:
		injectContentScripts/<@moz-extension://85a3dd98-2566-43d1-a4a6-31608be8bbec/background.js:352:85
	* moz-extension://85a3dd98-2566-43d1-a4a6-31608be8bbec/feedPreview/feedPreview.html?urlFeed=https%3A//www.ynet.co.il/Integration/StoryRss1854.xml
* try fix log error 'Promise resolved after context unloaded' = NOTHING TO FIX
* use `scrollbar-width: thin;` ? => what for?
* when changing state (read/unread) update all sidebars in all windows => NO. will not send a message for each and every tree modification
* add relative time to feed tooltip (title) - treeView, discovery and pagePopup
* getRelativeShortLocaleString: future date returns (Just now)
* nothing is discovered in https://www.ynet.co.il/articles/0,7340,L-3369891,00.html. Feeds are in an iframe => discoveryView now can handle iframes for Aggressive level 1 and 2
* discoveryView list show 'scroll' circule when it's full and user middle-click. => fixed also in pagePopup
* items in discoveryView and pagePopup are selected with right-click. should be only with left-click ?
* pagePopup has ugly scrollbars when to many items in list. tast-case: duplicate line `m_elmPageFeedsList.appendChild(createTagLI(feed));`
* Allow open articles in a new tab option as a permanently toggle global option. https://discourse.mozilla.org/t/support-sage-like-sidebar-based-rss-feed-reader/43383/20
* in Fx v68 preferences dark theme dropdown list are fuckedup.
* change checkbox in prefrences to green switched [x---o] ? => DONE, also retouched the radio-box
* background.js:291 `showNewBadge = !(await browser.sidebarAction.isOpen({}));` not considering multiple windows. isOpen() return false for current win only.
	* test case: pref: bg feed chk is on. reload ext when 2 windows are open and close sidebar in one window only and wait
* consider to change jump list UI. looks too much like a scroll-down button.
* [stupid] (REGEX_RSS_CONTENT_TYPES got nothing to do with discoveryView) - add switch to discover feeds withOUT semantics in discoveryView
* add feed preference (like `Update title from feed`) `Order feed-items chronologically`. => NO
* Tree scrollbar-thumb is not responding properly to dragging (clanky) after extension's first load as a temporary add-on. ==> GONE IN v86.0.1
	* second reload or closing & re-opening the sidebar fixes the issue.
* user bookmarks.description to hold 'updateTitle:1; openInFeedPreview:0;' or 'open:1;' instead of internalPrefs setOpenTreeFolders()/setTreeFeedsData() ==> NO
* take new PR pictures for version with 'order feed-items chronologically'
* import/export the sage-like preferences ?
* bug: preferences: click 'restore defaults' -> set 'Feeds bookmarks folder' -> click OPML's 'Export...' => error: "TypeError: m_objTreeFeedsData.value(...) is undefined"
	* need to reopen sidebar and wait for the tree to be loaded
* open custom CSS in new window and allow edit. no need to validate notepad text like cssFileValidator
	* custom CSS style: support in-place editing
* remember custom CSS file name	=> NO
* remove old view box that was replaced by the notepad
* PR images: preferences image changed 'Edit'
* notepad dark theme toggle hotkey
* remember last notepad color scheme in internalPrefs
* open notepad helpPopup on first loads
---


## Now
* check into the keydown's event.code / event.keyCode (multilang keyboard)
---


## Next
>`¯\_(ツ)_/¯ ¯\_(ツ)_/¯ ¯\_(ツ)_/¯ ¯\_(ツ)_/¯`


### file "sl-customFeedPreview-CSS-files.zip" is ahead of the one in https://discourse.mozilla.org/t/support-sage-like-sidebar-based-rss-feed-reader/43383/18
* one extra css file.

### preferences in own tab ('"open_in_tab": true' in manifest.options_ui)
* expose hidden_pref_animated_slide_down_panel()
* a preference (hidden?) for how strict the content-type semantics are:
	> [X] strict semantics (rss|rdf|atom|feed))		[O] Accept 'text' type in addition to 'application' type


### low priority
* MDN - DataTransfer.effectAllowed: Following is not correct 'Assigning a value to effectAllowed in events other than dragstart has no effect'
	* make a POC and post in somewhere. must me a sidebar webextension!
* Waiting for Mozilla to fix Bug 1398833/1438465: https://bugzilla.mozilla.org/show_bug.cgi?id=1438465
	* for now there is a bug workaround using *Connection-based messaging* mecanizem.   => VERY good solution


### Unresolved
* preferences: When importing options the success message box may not be displayed.
	* Reason: the import unsets the 'Feed bookmark folder' option and the options page is reloaded from the treeView before the messageBox is displayed.
	* This happends when the bookmark folder ID in the imported options file was deleted from the browser.
* feedPreview: do not show item time if there isn't one - so to not show all a page where all items are "(Just now)" (https://docs.microsoft.com/en-us/teamblog/feed.xml)
* a lot of sub folders in the tree view will fuck up the UI
* Firefox has no support for XML 1.1
* a feed visited state is based on time comparison between last visited time (1) and feed update time (2).
	* The menu items (mark/toggle) uses the terms 'Read/Unread' => THAT IS NOT ACCURATE (change?)
	* Maybe need to use feed items Read/Unread state (alterative option?)
	> (1) rssTreeView.openTreeFeed(): "lastVisited: slUtil.getCurrentLocaleDate().getTime()"
	> (2) xxxFeed.getFeedData(): "feedData.lastUpdated = this._getFeedLastUpdate(this._xxx"


### Links for PR work
* PR: https://discourse.mozilla.org/t/rss-sage-whree-are-they/21741
* moz feed: https://discourse.mozilla.org/c/add-ons.rss


### wird feeds
* https://ascraeus.org/jsonfeed/index.json ==> Date Format is bad ISO ==> "date_published": "2020-29-02T21:42:52+00:00" ==> month and day switched places.
* https://www.php.net/feed.atom ==> entry `Southeast PHP Conference` has 2 <published> tags whereas all other entries have an <updated> tag. (<updated> is prefered to <published>).
