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

	let m_elmMainPanel = null;
	let m_elmMessagePanel = null;
	let m_elmMsgText;
	let m_elmButtonSetOK;
	let m_elmButtonSetYesNo;
	let m_elmButtonOK;
	let m_elmButtonYes;
	let m_elmButtonNo;

	let m_buttonSet;
	let m_buttonCodeResult = ButtonCode.none;
	let m_funcPromiseResolve = null;

	////////////////////////////////////////////////////////////////////////////////////
	function show(text, btnSet = messageView.ButtonSet.setOK, isTextLeftAlign = false) {

		return new Promise((resolve) => {

			initialize();

			m_buttonSet = btnSet;

			m_elmMsgText.innerHTML = text;
			m_elmMsgText.classList.toggle("leftAlign", isTextLeftAlign);
			m_elmButtonSetOK.classList.toggle("visible", m_buttonSet === ButtonSet.setOK);
			m_elmButtonSetYesNo.classList.toggle("visible", m_buttonSet === ButtonSet.setYesNo);

			m_elmMessagePanel.classList.add("visible");
			slUtil.disableElementTree(m_elmMessagePanel, false);
			slUtil.disableElementTree(m_elmMainPanel, true);

			m_elmMessagePanel.focus();

			m_funcPromiseResolve = resolve;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initialize() {

		if(m_elmMainPanel === null) {
			m_elmMainPanel = document.getElementById("mainPanel");
			m_elmMessagePanel = document.getElementById("messagePanel");
			m_elmMsgText = document.getElementById("msgText");
			m_elmButtonSetOK = document.getElementById("btnSetOK");
			m_elmButtonSetYesNo = document.getElementById("btnSetYesNo");
			m_elmButtonOK = document.getElementById("btnMsgOK");
			m_elmButtonYes = document.getElementById("btnMsgYes");
			m_elmButtonNo = document.getElementById("btnMsgNo");
		}

		m_elmMessagePanel.addEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.addEventListener("click", onClickButtonOK);
		m_elmButtonYes.addEventListener("click", onClickButtonYes);
		m_elmButtonNo.addEventListener("click", onClickButtonNo);

		m_buttonCodeResult = ButtonCode.none;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function close() {

		if (isOpen() === false) {
			return;
		}

		m_elmMessagePanel.classList.remove("visible");
		slUtil.disableElementTree(m_elmMessagePanel, true);
		slUtil.disableElementTree(m_elmMainPanel, false);

		m_elmMessagePanel.removeEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.removeEventListener("click", onClickButtonOK);
		m_elmButtonYes.removeEventListener("click", onClickButtonYes);
		m_elmButtonNo.removeEventListener("click", onClickButtonNo);

		m_funcPromiseResolve(m_buttonCodeResult);
		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmMessagePanel !== null && m_elmMessagePanel.classList.contains("visible"));
	}

	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownMessagePanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(m_buttonSet === ButtonSet.setOK) {
					onClickButtonOK({});
				} else if(m_buttonSet === ButtonSet.setYesNo) {
					onClickButtonYes({});
				}
				break;
				//////////////////////////////
			case "Escape":
				close();
				break;
				//////////////////////////////
			default:
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

		show: show,
		close: close,
		isOpen: isOpen,
	};

})();
