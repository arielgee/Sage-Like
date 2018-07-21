"use strict";

let feedPropertiesView = (function() {

	let m_elmSidebarBody;
	let m_elmMainPanel = null;
	let m_elmFeedPropertiesPanel = null;
	let m_elmTextTitle;
	let m_elmTextLocation;
	let m_elmChkUpdateTitle;
	let m_elmButtonSave;
	let m_elmButtonCancel;
	let m_elmLabelErrorMsgs;

	let m_elmFeedItemLI = null;
	let m_bUpdateTitle = true;
	let m_bForNewFeed = false;

	let m_originalProperties = {
		title: "",
		location: "",
		updateTitle: false,
	};

	////////////////////////////////////////////////////////////////////////////////////
	function open(elmLI, updateTitle, forNewFeed = false) {

		m_elmSidebarBody = document.body;
		m_elmMainPanel = document.getElementById("mainPanel");
		m_elmFeedPropertiesPanel = document.getElementById("feedPropertiesPanel");
		m_elmTextTitle = document.getElementById("txtFpTitle");
		m_elmTextLocation = document.getElementById("txtFpLocation");
		m_elmChkUpdateTitle = document.getElementById("chkFpUpdateTitle");
		m_elmButtonSave = document.getElementById("btnFeedPropertiesSave");
		m_elmButtonCancel = document.getElementById("btnFeedPropertiesCancel");
		m_elmLabelErrorMsgs = document.getElementById("lblErrorMsgs");

		m_elmFeedPropertiesPanel.addEventListener("keydown", onKeyDownFeedPropertiesPanel);
		m_elmButtonSave.addEventListener("click", onClickButtonSave);
		m_elmButtonCancel.addEventListener("click", onClickButtonCancel);

		// the element been updated
		m_elmFeedItemLI = elmLI;
		m_bUpdateTitle = updateTitle;
		m_bForNewFeed = forNewFeed;

		showPanel();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function close() {

		if(isOpen() === false) {
			return;
		}

		slUtil.disableElementTree(m_elmMainPanel, false);
		m_elmFeedPropertiesPanel.style.display = "none";

		m_elmFeedPropertiesPanel.removeEventListener("keydown", onKeyDownFeedPropertiesPanel);
		m_elmButtonSave.removeEventListener("click", onClickButtonSave);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);

		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmFeedPropertiesPanel !== null && m_elmFeedPropertiesPanel.style.display === "block");
	};

	////////////////////////////////////////////////////////////////////////////////////
	//
	function showPanel() {

		let r = m_elmFeedItemLI.getBoundingClientRect();
		// let x = r.left;
		let y = r.top;

		// do it first so element will have dimentions (offsetWidth > 0)
		m_elmFeedPropertiesPanel.style.display = "block";
		slUtil.disableElementTree(m_elmMainPanel, true);

		// if ((x + elmFeedPropertiesPanel.offsetWidth) > elmSidebarBody.offsetWidth) {
		// 	x = elmSidebarBody.offsetWidth - elmFeedPropertiesPanel.offsetWidth;
		// }

		if ((y + m_elmFeedPropertiesPanel.offsetHeight) > m_elmSidebarBody.offsetHeight) {
			y = m_elmSidebarBody.offsetHeight - m_elmFeedPropertiesPanel.offsetHeight;
		}

		// elmFeedPropertiesPanel.style.left = x + "px";
		m_elmFeedPropertiesPanel.style.top = y + "px";

		m_elmTextTitle.value = m_originalProperties.title = m_elmFeedItemLI.firstElementChild.textContent;
		m_elmTextLocation.value = m_originalProperties.location = m_bForNewFeed ? "" : m_elmFeedItemLI.getAttribute("href");
		m_elmChkUpdateTitle.checked = m_originalProperties.updateTitle = m_bUpdateTitle;
		m_elmLabelErrorMsgs.textContent = "";

		m_elmTextTitle.focus();
		m_elmTextTitle.setSelectionRange(0, -1);	// select all
	}

	////////////////////////////////////////////////////////////////////////////////////
	function saveAndClose() {

		let valTitle = m_elmTextTitle.value;
		let valLocation = m_elmTextLocation.value;
		let updateTitle = m_elmChkUpdateTitle.checked;

		// Any value was modified
		if (m_originalProperties.title === valTitle &&
			m_originalProperties.location === valLocation &&
			m_originalProperties.updateTitle === updateTitle) {
			m_elmLabelErrorMsgs.textContent = "Nothing to modify."
			return;
		}

		// Title validation
		if(valTitle.length === 0) {
			m_elmLabelErrorMsgs.textContent = "Title text is empty."
			return;
		}

		// URL validation
		try {
			new URL(valLocation);
		} catch (error) {
			m_elmLabelErrorMsgs.textContent = "Location URL is not valid."
			return;
		}

		rssTreeView.updateFeedProperties(m_elmFeedItemLI, valTitle, valLocation, updateTitle);
		close();
	}


	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownFeedPropertiesPanel(event) {
		switch (event.key.toLowerCase()) {
			case "enter":
				saveAndClose();
				break;
				//////////////////////////////
			case "escape":
				if(m_bForNewFeed) {
					rssTreeView.deleteFeed(m_elmFeedItemLI);
				}
				close()
				break;
				//////////////////////////////
			default:
				break;
				//////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonSave(event) {
		saveAndClose();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonCancel(event) {
		if(m_bForNewFeed) {
			rssTreeView.deleteFeed(m_elmFeedItemLI);
		}
		close();
	}

	return {
		open: open,
		close: close,
		isOpen: isOpen,
	}
})();