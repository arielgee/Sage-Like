"use strict";

let signinView = (function () {

	let m_elmSigninPanel = null;
	let m_elmUserName;
	let m_elmPassword;
	let m_elmButtonSignin;
	let m_elmButtonCancel;
	let m_elmStatusbar;

	let m_signinCredentialResult = null;
	let m_funcPromiseResolve = null;

	let m_slideDownPanel = null;

	////////////////////////////////////////////////////////////////////////////////////
	function open() {

		return new Promise((resolve) => {

			initMembers();

			if(m_slideDownPanel.isDown) return;

			m_slideDownPanel.pull(true).then(() => {
				addEventListeners();
			});
			panel.disable(true);

			m_elmUserName.focus();

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

		m_elmUserName.value = m_elmPassword.value = "";
		m_elmStatusbar.textContent = "";

		removeEventListeners();

		m_funcPromiseResolve(m_signinCredentialResult);
		rssTreeView.setFocus();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isOpen() {
		return (m_elmSigninPanel !== null && m_elmSigninPanel.classList.contains("visible"));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function initMembers() {

		if(m_elmSigninPanel === null) {
			m_elmSigninPanel = document.getElementById("signinPanel");
			m_elmUserName = document.getElementById("userName");
			m_elmPassword = document.getElementById("password");
			m_elmButtonSignin = document.getElementById("btnSigninSignin");
			m_elmButtonCancel = document.getElementById("btnSigninCancel");
			m_elmStatusbar = document.getElementById("signinStatusbar");

			m_slideDownPanel = new SlideDownPanel(m_elmSigninPanel);
		}
		m_elmUserName.value = m_elmPassword.value = "";
		m_elmStatusbar.textContent = "";
		m_signinCredentialResult = null;
	}

	//==================================================================================
	//=== Events
	//==================================================================================

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {
		m_elmSigninPanel.addEventListener("keydown", onKeyDownSigninPanel);
		m_elmPassword.addEventListener("keyup", onKeyUpPassword);
		m_elmPassword.addEventListener("blur", onBlurPassword);
		m_elmButtonSignin.addEventListener("click", onClickButtonSignin);
		m_elmButtonCancel.addEventListener("click", onClickButtonCancel);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEventListeners() {
		m_elmSigninPanel.removeEventListener("keydown", onKeyDownSigninPanel);
		m_elmPassword.removeEventListener("keyup", onKeyUpPassword);
		m_elmPassword.removeEventListener("blur", onBlurPassword);
		m_elmButtonSignin.removeEventListener("click", onClickButtonSignin);
		m_elmButtonCancel.removeEventListener("click", onClickButtonCancel);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownSigninPanel(event) {
		switch (event.code) {
			case "Enter":
			case "NumpadEnter":
				if(document.activeElement === m_elmButtonCancel) {
					close();
				} else {
					onClickButtonSignin();
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
	function onKeyUpPassword(event) {
		m_elmStatusbar.textContent = event.getModifierState("CapsLock") ? "Your caps lock is ON" : "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBlurPassword() {
		m_elmStatusbar.textContent = "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonSignin() {
		m_signinCredentialResult = new SigninCredential({
			username: m_elmUserName.value,
			password: m_elmPassword.value,
		});
		close();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickButtonCancel() {
		m_signinCredentialResult = null;
		close();
	}

	return {
		open: open,
		close: close,
		isOpen: isOpen,
	};

})();
