"use strict";

(function() {

	//==================================================================================
	//=== Variables Declerations
	//==================================================================================

    let m_elmFeedContent;

    document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

        m_elmFeedContent = document.getElementById("feedContent");

        console.log("[Sage-Like]", slUtil.getQueryStringValue("urlFeed"));


        document.getElementById("feedTitleText").textContent = "ariel da male";
        document.getElementById("feedDescriptionText").textContent = "Who is da male ?????????";
    }

	////////////////////////////////////////////////////////////////////////////////////
	function createHTMLFeedTitle(feedData) {

        let elmFeedTitle = document.createElement("div");
        let elmFeedTitleText = document.createElement("div");
        let elmFeedDescText = document.createElement("div");

        elmFeedTitle.id = "feedTitle";
        elmFeedTitleText.id = "feedTitleText";
        elmFeedDescText.id = "feedDescriptionText";

        elmFeedTitleText.textContent = feedData.title;
        elmFeedDescText.textContent = feedData.description;

        elmFeedTitle.appendChild(elmFeedTitleText);
        elmFeedTitle.appendChild(elmFeedDescText);

        return elmFeedTitle;
    }

	////////////////////////////////////////////////////////////////////////////////////
	function createHTMLFeedItem(feedItem) {

        let elmFeedItem = document.createElement("div");
        let elmFeedItemTitle = document.createElement("div");
        let elmFeedItemLink = document.createElement("a");
        let elmFeedItemTitleText = document.createElement("div");
        let elmFeedItemLastUpdatedText = document.createElement("div");
        let elmFeedItemContent = document.createElement("div");

        elmFeedItem.className = "feedItem";
        elmFeedItemTitle.className = "feedItemTitle";
        elmFeedItemTitleText.className = "feedItemTitleText";
        elmFeedItemLastUpdatedText.className = "feedItemLastUpdatedText";
        elmFeedItemContent.className = "feedItemContent";

        elmFeedItemLink.href = feedItem.url;
        elmFeedItemTitleText.textContent = feedItem.title;
        elmFeedItemLastUpdatedText.textContent = feedItem.???;
        elmFeedItemContent.textContent = feedItem.desc;

        elmFeedItem.appendChild(elmFeedItemTitle);
        elmFeedItem.appendChild(elmFeedItemContent);
        elmFeedItemTitle.appendChild(elmFeedItemLink);
        elmFeedItemTitle.appendChild(elmFeedItemLastUpdatedText);
        elmFeedItemLink.appendChild(elmFeedItemTitleText);

        return elmFeedItem;
    }

})();
