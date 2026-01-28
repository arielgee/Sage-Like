"use strict";

let messageView = (function () {

	let ButtonSet = {
		setOK: 1,
		setYesNo: 2,
	};

	let ButtonCode = {
		none: 0,
		OK: 1,
		Yes: 2,
		No: 3,
	};

	let m_elmMessagePanel = null;
	let m_elmButtonSetOK;
	let m_elmButtonSetYesNo;
	let m_elmButtonOK;
	let m_elmButtonYes;
	let m_elmButtonNo;
	let m_clickableElements = [];

	let m_buttonSet;
	let m_buttonCodeResult = ButtonCode.none;
	let m_funcPromiseResolve = null;

	let m_slideDownPanel = null;

	////////////////////////////////////////////////////////////////////////////////////
	function open(details) {

		const {
			text = "",
			btnSet = messageView.ButtonSet.setOK,
			caption = i18n("js_messageAttentionCaption"),
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

			let elmMsgText = document.getElementById("msgText");

			m_elmMessagePanel.classList.toggle("alertive", isAlertive);
			document.getElementById("msgCaption").textContent = caption;
			slUtil.replaceInnerContent(elmMsgText, textMsg);
			m_elmButtonSetOK.classList.toggle("visible", m_buttonSet === ButtonSet.setOK);
			m_elmButtonSetYesNo.classList.toggle("visible", m_buttonSet === ButtonSet.setYesNo);

			if(clickableElements instanceof Array) {
				m_clickableElements = clickableElements;
				for(let i=0, len=m_clickableElements.length; i<len; i++) {

					const clickElement = m_clickableElements[i];

					if(!!clickElement.elementId && typeof(clickElement.onClickCallback) === "function") {
						const elm = document.getElementById(clickElement.elementId);

						if(!!elm) {
							if(elm.tagName === "A") {
								prefs.getColorDialogBackground().then(color => {
									if(color < "#888888") {		// quick fix - on dark bk anchor will invert from blue to yellow. Will not adapt if bk color changes while messageView is open
										elm.style.filter = "invert(100%)";
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

			m_elmMessagePanel.focus();

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

		m_funcPromiseResolve(m_buttonCodeResult);
		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmMessagePanel !== null && m_elmMessagePanel.classList.contains("visible"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMembers() {

		if(m_elmMessagePanel === null) {
			m_elmMessagePanel = document.getElementById("messagePanel");
			m_elmButtonSetOK = document.getElementById("btnSetOK");
			m_elmButtonSetYesNo = document.getElementById("btnSetYesNo");
			m_elmButtonOK = document.getElementById("btnMsgOK");
			m_elmButtonYes = document.getElementById("btnMsgYes");
			m_elmButtonNo = document.getElementById("btnMsgNo");

			m_slideDownPanel = new SlideDownPanel(m_elmMessagePanel);
		}
		m_clickableElements = [];		// re-initialize in each display

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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEventListeners() {
		m_elmMessagePanel.removeEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.removeEventListener("click", onClickButtonOK);
		m_elmButtonYes.removeEventListener("click", onClickButtonYes);
		m_elmButtonNo.removeEventListener("click", onClickButtonNo);
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
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(m_buttonSet === ButtonSet.setOK) {
					onClickButtonOK({});
				} else if(m_buttonSet === ButtonSet.setYesNo && document.activeElement === m_elmButtonNo) {
					onClickButtonNo({});
				} else if(m_buttonSet === ButtonSet.setYesNo) {
					onClickButtonYes({});
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

	return {
		ButtonSet: ButtonSet,
		ButtonCode: ButtonCode,

		open: open,
		close: close,
		isOpen: isOpen,
	};

})();
