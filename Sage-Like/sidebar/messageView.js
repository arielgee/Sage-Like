"use strict";

const messageView = (function () {

	let ButtonSet = {
		setOK: 1,
		setYesNo: 2,
		setCancel: 3,
	};

	let ButtonCode = {
		none: 0,
		OK: 1,
		Yes: 2,
		No: 3,
		Cancel: 4,
	};

	let m_elmMessagePanel = null;
	let m_elmMessageText;
	let m_elmButtonSetOK;
	let m_elmButtonSetYesNo;
	let m_elmButtonSetCancel;
	let m_elmButtonOK;
	let m_elmButtonYes;
	let m_elmButtonNo;
	let m_elmButtonCancel;
	let m_clickableElements = [];
	let m_elmMenuItems;
	let m_activeMenuItemIndex;

	let m_buttonSet;
	let m_buttonCodeResult = ButtonCode.none;
	let m_funcPromiseResolve = null;

	let m_slideDownPanel = null;

	////////////////////////////////////////////////////////////////////////////////////
	function open(details) {

		const {
			text = "",
			btnSet = messageView.ButtonSet.setOK,
			caption = "Attention!",
			isAlertive = true,
			boldDoubleQuotedText = true,
			breakNewLine = true,
			clickableElements = [],
		} = details;

		return new Promise((resolve) => {

			initMembers();

			if(m_slideDownPanel.isDown) return;

			m_buttonSet = btnSet;

			let textMsg = text;

			if(boldDoubleQuotedText) {
				textMsg = textMsg.replace(/"([^"]+)"/mg, "<b>$1</b>");
			}

			if(breakNewLine) {
				textMsg = textMsg.replace(/\n/mg, "<br>");
			}

			m_elmMessagePanel.classList.toggle("alertive", isAlertive);
			document.getElementById("msgCaption").textContent = caption;
			slUtil.replaceInnerContent(m_elmMessageText, textMsg);
			m_elmMenuItems = Array.from(m_elmMessagePanel.querySelectorAll(".message-menu-item"));
			m_elmButtonSetOK.classList.toggle("visible", m_buttonSet === ButtonSet.setOK);
			m_elmButtonSetYesNo.classList.toggle("visible", m_buttonSet === ButtonSet.setYesNo);
			m_elmButtonSetCancel.classList.toggle("visible", m_buttonSet === ButtonSet.setCancel);

			if(clickableElements instanceof Array) {
				m_clickableElements = clickableElements;
				for(let i=0, len=m_clickableElements.length; i<len; i++) {

					const clickElement = m_clickableElements[i];

					if(!!clickElement.elementId && typeof(clickElement.onClickCallback) === "function") {
						const elm = document.getElementById(clickElement.elementId);

						if(!!elm) {
							if(elm.tagName === "A" || (!!clickElement.anchorStyle && clickElement.anchorStyle === true)) {
								prefs.getColorDialogBackground().then(color => {
									if(color < "#888888") {		// quick fix - on dark bk anchor will invert from blue to yellow. Will not adapt if bk color changes while messageView is open
										elm.style.color = slUtil.contrastColor(color);
									}
								});
							}
							elm.addEventListener("click", clickElement.onClickCallback);
						}
					}
				}
			}

			m_slideDownPanel.pull(true).then(() => {
				addEventListeners();
			});
			panel.disable(true);

			// focus first menu item if any, otherwise focus the panel itself
			if(m_elmMenuItems.length > 0) {
				m_elmMenuItems[0].focus();
				m_activeMenuItemIndex = 0;
			} else {
				m_elmMessagePanel.focus();
				m_activeMenuItemIndex = -2;
			}


			m_funcPromiseResolve = resolve;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function close() {

		if (isOpen() === false) {
			return;
		}

		m_slideDownPanel.pull(false);
		panel.disable(false);

		removeEventListeners();

		m_funcPromiseResolve({ buttonCode: m_buttonCodeResult });
		rssTreeView.setFocus();

		m_elmMenuItems = [];
		m_clickableElements = [];
		m_elmMessageText.replaceChildren();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmMessagePanel !== null && m_elmMessagePanel.classList.contains("visible"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMembers() {

		if(m_elmMessagePanel === null) {
			m_elmMessagePanel = document.getElementById("messagePanel");
			m_elmMessageText = document.getElementById("msgText");
			m_elmButtonSetOK = document.getElementById("btnSetOK");
			m_elmButtonSetYesNo = document.getElementById("btnSetYesNo");
			m_elmButtonSetCancel = document.getElementById("btnSetCancel");
			m_elmButtonOK = document.getElementById("btnMsgOK");
			m_elmButtonYes = document.getElementById("btnMsgYes");
			m_elmButtonNo = document.getElementById("btnMsgNo");
			m_elmButtonCancel = document.getElementById("btnMsgCancel");

			m_slideDownPanel = new SlideDownPanel(m_elmMessagePanel);
		}
		m_clickableElements = [];		// re-initialize in each display
		m_elmMenuItems = [];

		m_buttonCodeResult = ButtonCode.none;
	}

	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {
		m_elmMessagePanel.addEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.addEventListener("click", onClickButtonOK);
		m_elmButtonYes.addEventListener("click", onClickButtonYes);
		m_elmButtonNo.addEventListener("click", onClickButtonNo);
		m_elmButtonCancel.addEventListener("click", onClickButtonCancel);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEventListeners() {
		m_elmMessagePanel.removeEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.removeEventListener("click", onClickButtonOK);
		m_elmButtonYes.removeEventListener("click", onClickButtonYes);
		m_elmButtonNo.removeEventListener("click", onClickButtonNo);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);
		for(let i=0, len=m_clickableElements.length; i<len; i++) {
			const clickElement = m_clickableElements[i];
			if(!!clickElement.elementId && typeof(clickElement.onClickCallback) === "function") {
				const elm = document.getElementById(clickElement.elementId);
				if(!!elm) {
					elm.removeEventListener("click", clickElement.onClickCallback);
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownMessagePanel(event) {

		m_activeMenuItemIndex = (m_elmMenuItems.length > 0) ? m_elmMenuItems.indexOf(document.activeElement) : -2;

		switch (event.code) {
			case "ArrowDown":
				if(m_activeMenuItemIndex === -1) {
					m_elmMenuItems[0].focus();
				} else if(m_activeMenuItemIndex > -1) {
					m_elmMenuItems[(m_activeMenuItemIndex + 1) % m_elmMenuItems.length].focus();
				}
				break;
				//////////////////////////////
			case "ArrowUp":
				if(m_activeMenuItemIndex === -1) {
					m_elmMenuItems[m_elmMenuItems.length - 1].focus();
				} else if(m_activeMenuItemIndex > -1) {
					m_elmMenuItems[(m_activeMenuItemIndex - 1 + m_elmMenuItems.length) % m_elmMenuItems.length].focus();
				}
				break;
				//////////////////////////////
			case "Enter":
			case "NumpadEnter":
				if(m_activeMenuItemIndex > -1) {
					m_elmMenuItems[m_activeMenuItemIndex].click();
				} else if(m_buttonSet === ButtonSet.setOK) {
					onClickButtonOK({});
				} else if(m_buttonSet === ButtonSet.setYesNo && document.activeElement === m_elmButtonNo) {
					onClickButtonNo({});
				} else if(m_buttonSet === ButtonSet.setYesNo) {
					onClickButtonYes({});
				} else if(m_buttonSet === ButtonSet.setCancel) {
					onClickButtonCancel({});
				}
				break;
				//////////////////////////////
			case "Escape":
				close();
				break;
				//////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonOK(event) {
		m_buttonCodeResult = ButtonCode.OK;
		close();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonYes(event) {
		m_buttonCodeResult = ButtonCode.Yes;
		close();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonNo(event) {
		m_buttonCodeResult = ButtonCode.No;
		close();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonCancel(event) {
		m_buttonCodeResult = ButtonCode.Cancel;
		close();
	}

	return {
		ButtonSet: ButtonSet,
		ButtonCode: ButtonCode,

		open: open,
		close: close,
		isOpen: isOpen,
	};

})();
