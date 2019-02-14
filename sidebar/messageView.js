"use strict";

let messageView = (function() {

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

    let m_elmMainPanel;
    let m_elmMessagePanel;
    let m_elmMsgText;
    let m_elmButtonSetOK;
    let m_elmButtonSetYesNo;
    let m_elmButtonOK;
    let m_elmButtonYes;
    let m_elmButtonNo;

    let m_buttonResult = ButtonCode.none;
    let m_funcPromiseResolve = null;

    ////////////////////////////////////////////////////////////////////////////////////
    function show(text, buttonsCode, isTextLeftAlign = false) {

        return new Promise((resolve) => {

            initialize();

            m_elmMsgText.innerHTML = text;
            m_elmMsgText.classList.toggle("leftAlign", isTextLeftAlign);
            m_elmButtonSetOK.classList.toggle("visible", buttonsCode === ButtonSet.setOK);
            m_elmButtonSetYesNo.classList.toggle("visible", buttonsCode === ButtonSet.setYesNo);

            m_elmMessagePanel.style.display = "block";
            slUtil.disableElementTree(m_elmMainPanel, true);

            m_elmMessagePanel.focus();

            m_funcPromiseResolve = resolve;
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function initialize() {

        m_elmMainPanel = document.getElementById("mainPanel");
        m_elmMessagePanel = document.getElementById("messagePanel");
        m_elmMsgText = document.getElementById("msgText");
        m_elmButtonSetOK = document.getElementById("btnSetOK");
        m_elmButtonSetYesNo = document.getElementById("btnSetYesNo");
        m_elmButtonOK = document.getElementById("btnMsgOK");
        m_elmButtonYes = document.getElementById("btnMsgYes");
        m_elmButtonNo = document.getElementById("btnMsgNo");

        m_elmMessagePanel.addEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.addEventListener("click", onClickButtonOK);
        m_elmButtonYes.addEventListener("click", onClickButtonYes);
        m_elmButtonNo.addEventListener("click", onClickButtonNo);

        m_buttonResult = ButtonCode.none;
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function close() {

        slUtil.disableElementTree(m_elmMainPanel, false);
        m_elmMessagePanel.style.display = "none";

        m_elmMessagePanel.removeEventListener("keydown", onKeyDownMessagePanel);
		m_elmButtonOK.removeEventListener("click", onClickButtonOK);
        m_elmButtonYes.removeEventListener("click", onClickButtonYes);
        m_elmButtonNo.removeEventListener("click", onClickButtonNo);

        m_funcPromiseResolve(m_buttonResult);
        rssTreeView.setFocus();
    }

	//==================================================================================
	//=== Events
    //==================================================================================

    ////////////////////////////////////////////////////////////////////////////////////
    function onKeyDownMessagePanel(event) {
		switch (event.key.toLowerCase()) {
			case "escape":
				close()
				break;
				//////////////////////////////
			default:
				break;
				//////////////////////////////
		}
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonOK(event) {
        m_buttonResult = ButtonCode.OK;
        close();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonYes(event) {
        m_buttonResult = ButtonCode.Yes;
        close();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickButtonNo(event) {
        m_buttonResult = ButtonCode.No;
        close();
    }

    return {
        ButtonSet: ButtonSet,
        ButtonCode: ButtonCode,

        show: show,
        close: close,
    };

})();
