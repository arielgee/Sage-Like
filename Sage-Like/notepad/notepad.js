"use strict";

let notepad = (function() {

	const DOCUMENT_TITLE = "Notepad - Custom CSS source code";

	let m_elmHelpPopup
	let m_elmSourceEditor;
	let m_elmStatusBar;

	let m_isDarkColorScheme;
	let m_windowLayoutReqIdDebouncer = null;
	let m_statusBarReqIdDebouncer = null;
	let m_isDirty;
	let m_savedCSSSource;
	let m_savedCSSSourceHash = "";
	let m_saveSelectionStart = -1;
	let m_saveSelectionEnd = -1;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onDOMContentLoaded() {

		document.title = DOCUMENT_TITLE;

		m_elmHelpPopup = document.getElementById("helpPopup");
		m_elmSourceEditor = document.getElementById("sourceEditor");
		m_elmStatusBar = document.getElementById("statusBar");

		window.addEventListener("resize", onResizeWindow, false);
		window.addEventListener("beforeunload", onBeforeUnloadWindow, { capture: true });
		window.addEventListener("keydown", onKeyDownWindow);
		window.addEventListener("wheel", onWheelWindow, { passive: false });
		m_elmSourceEditor.addEventListener("input", onInputSourceEditor);
		m_elmSourceEditor.addEventListener("keydown", onKeyDownSourceEditor);
		m_elmSourceEditor.addEventListener("keyup", onCaretMoveSourceEditor);
		m_elmSourceEditor.addEventListener("mousedown", onCaretMoveSourceEditor);
		m_elmSourceEditor.addEventListener("mouseup", onCaretMoveSourceEditor);
		m_elmSourceEditor.addEventListener("mousemove", onMouseMoveSourceEditor);

		getInitialColorScheme();
		await setSavedCSSSourceToEditor();
		setEditorScrollbarWidth();
		showFirstLoadHelpPopup();
		updateStatusBar();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload() {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		window.removeEventListener("resize", onResizeWindow, false);
		window.removeEventListener("beforeunload", onBeforeUnloadWindow, { capture: true });
		window.removeEventListener("keydown", onKeyDownWindow);
		window.removeEventListener("wheel", onWheelWindow, { passive: false });
		m_elmSourceEditor.removeEventListener("input", onInputSourceEditor);
		m_elmSourceEditor.removeEventListener("keydown", onKeyDownSourceEditor);
		m_elmSourceEditor.removeEventListener("keyup", onCaretMoveSourceEditor);
		m_elmSourceEditor.removeEventListener("mousedown", onCaretMoveSourceEditor);
		m_elmSourceEditor.removeEventListener("mouseup", onCaretMoveSourceEditor);
		m_elmSourceEditor.removeEventListener("mousemove", onMouseMoveSourceEditor);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onResizeWindow() {
		updateLayoutDebounced();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBeforeUnloadWindow(event) {
		if(isDirty()) {
			event.preventDefault();
			return (event.returnValue = "Do you want to leave? - Changes you made may not be saved.");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onKeyDownWindow(event) {

		// Key modifiers bit flags
		const KEY_MODIFIER_CTRL  = 0b0100;
		const KEY_MODIFIER_ALT   = 0b0010;
		const KEY_MODIFIER_SHIFT = 0b0001;
		const KEY_MODIFIER_NONE  = 0b0000;

		// Key modifiers bit flag state
		let stateKeyModifier =	(event.ctrlKey  ? KEY_MODIFIER_CTRL  : 0) |
								(event.altKey   ? KEY_MODIFIER_ALT   : 0) |
								(event.shiftKey ? KEY_MODIFIER_SHIFT : 0);


		if(stateKeyModifier === KEY_MODIFIER_NONE && event.code === "F1") {
			event.preventDefault();
			m_elmHelpPopup.classList.toggle("show");
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_NONE && event.code === "Escape") {
			event.preventDefault();
			if(m_elmHelpPopup.classList.contains("show")) {
				m_elmHelpPopup.classList.remove("show");
			} else {
				browser.windows.remove((await browser.windows.getCurrent()).id);
			}
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_CTRL && event.code === "KeyS") {		// Save
			event.preventDefault();
			saveModifiedCSSSource();
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_ALT && event.code === "KeyS") {		// Save and exit
			event.preventDefault();
			await saveModifiedCSSSource();
			browser.windows.remove((await browser.windows.getCurrent()).id);
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_CTRL && event.code === "KeyR") {		// Revert to saved
			event.preventDefault();
			await setSavedCSSSourceToEditor();
			setEditorScrollbarWidth();
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_CTRL && event.code === "KeyE") {		// Export to file
			event.preventDefault();
			exportToFile();
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_ALT && event.code === "KeyT") {		// Toggle color theme
			toggleColorScheme();
			return;
		}

		if(stateKeyModifier === KEY_MODIFIER_CTRL && event.code === "KeyQ") {		// Quit without saving
			event.preventDefault();
			setDirty(false);
			browser.windows.remove((await browser.windows.getCurrent()).id);
			return;
		}

		let zoomKeys = ["Minus", "Equal", "NumpadAdd", "NumpadSubtract"];
		if(stateKeyModifier === KEY_MODIFIER_CTRL && zoomKeys.includes(event.code)) {		// Prevent zooming
			event.preventDefault();
			return;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onWheelWindow(event) {
		if(event.ctrlKey && !event.altKey && !event.shiftKey) {		// Prevent zooming
			event.preventDefault();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onInputSourceEditor() {
		setDirty((m_savedCSSSourceHash !== await slUtil.hashCode(m_elmSourceEditor.value)));
		updateLayoutDebounced();
		updateStatusBarDebounced();
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onKeyDownSourceEditor(event) {

		// Tab without key modifiers
		if(event.code === "Tab" && !event.shiftKey && !event.altKey && !event.ctrlKey) {

			event.preventDefault();
			// NOTE: This action (reseting the value property) clears the undo buffer
			let newCaretPos = m_elmSourceEditor.selectionStart + 1;
			let v = m_elmSourceEditor.value;
			m_elmSourceEditor.value = v.substring(0, m_elmSourceEditor.selectionStart) + "\t" + v.substring(m_elmSourceEditor.selectionEnd, v.length);
			m_elmSourceEditor.selectionStart = m_elmSourceEditor.selectionEnd = newCaretPos;
		}

		updateStatusBarDebounced();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onCaretMoveSourceEditor() {
		updateStatusBarDebounced();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseMoveSourceEditor(event) {
		if(event.buttons === 1 && m_elmSourceEditor.selectionStart !== m_elmSourceEditor.selectionEnd) {
			updateStatusBarDebounced();		// when selecting text with mouse
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function setSavedCSSSourceToEditor() {

		m_savedCSSSource = await prefs.getCustomCSSSource();
		m_savedCSSSourceHash = await prefs.getCustomCSSSourceHash();
		setDirty(false);

		m_elmSourceEditor.value = m_savedCSSSource;
		m_elmSourceEditor.selectionStart = m_elmSourceEditor.selectionEnd = 0;
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function saveModifiedCSSSource() {

		if(isDirty()) {

			await prefs.setCustomCSSSource(m_elmSourceEditor.value);

			browser.runtime.sendMessage({
				id: slGlobals.MSG_ID_PREFERENCES_CHANGED,
				details: slGlobals.MSGD_PREF_CHANGE_CUSTOM_CSS_SOURCE,
				payload: m_savedCSSSource,
			});

			m_savedCSSSource = m_elmSourceEditor.value;
			m_savedCSSSourceHash = await prefs.getCustomCSSSourceHash();
			setDirty(false);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function exportToFile() {

		let blob = new Blob([m_elmSourceEditor.value], { type: "text/plain", endings: "native" });

		let objUrl = URL.createObjectURL(blob);

		let onChangedDownload = function(delta) {
			if (delta.state && delta.state.current === "complete") {
				browser.downloads.onChanged.removeListener(onChangedDownload);
				if(!!objUrl) URL.revokeObjectURL(objUrl);
				objUrl = null;
			}
		};

		browser.downloads.onChanged.addListener(onChangedDownload);
		browser.downloads.download({
			url: objUrl,
			filename: "untitled.css",
			saveAs: true,
		}).catch((error) => {

			if(!!objUrl) URL.revokeObjectURL(objUrl);
			objUrl = null;

			if(error.message !== "Download canceled by the user") {
				console.log("[Sage-Like]", error);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getInitialColorScheme() {

		internalPrefs.getNotepadDarkColorScheme().then((darkColorScheme) => {

			// check if NotepadDarkColorScheme was ever set

			if(darkColorScheme === undefined) {
				// flip the boolean 'matches' value so that toggleColorScheme() will toggle(flip) it back
				m_isDarkColorScheme = !(window.matchMedia("(prefers-color-scheme: dark)").matches);

			} else {
				// flip the boolean preference value so that toggleColorScheme() will toggle(flip) it back
				m_isDarkColorScheme = !darkColorScheme;
			}

			toggleColorScheme();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function toggleColorScheme() {
		m_isDarkColorScheme = !m_isDarkColorScheme;
		internalPrefs.setNotepadDarkColorScheme(m_isDarkColorScheme);
		document.documentElement.classList.toggle("darkColorScheme", m_isDarkColorScheme);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateLayoutDebounced() {
		window.cancelAnimationFrame(m_windowLayoutReqIdDebouncer);
		m_windowLayoutReqIdDebouncer = window.requestAnimationFrame(() => {
			setEditorScrollbarWidth();
			m_windowLayoutReqIdDebouncer = null;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateStatusBarDebounced() {
		window.cancelAnimationFrame(m_statusBarReqIdDebouncer);
		m_statusBarReqIdDebouncer = window.requestAnimationFrame(() => {
			updateStatusBar();
			m_statusBarReqIdDebouncer = null;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setEditorScrollbarWidth() {

		// set CSS variable accordingly depending if has VScroll
		if(slUtil.hasVScroll(m_elmSourceEditor)) {
			if(m_elmSourceEditor.parentElement.getBoundingClientRect().width !== m_elmSourceEditor.scrollWidth) {
				document.documentElement.style.setProperty("--source-editor-scrollbar-width", slUtil.getScrollbarWidth() + "px");
			} else {
				document.documentElement.style.setProperty("--source-editor-scrollbar-width", "0px");
			}
		} else {
			document.documentElement.style.setProperty("--source-editor-scrollbar-width", "0px");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function updateStatusBar() {

		let m_selStart = m_elmSourceEditor.selectionStart;
		let m_selEnd = m_elmSourceEditor.selectionEnd;

		if( (m_saveSelectionStart !== m_selStart) || (m_saveSelectionEnd !== m_selEnd) ) {

			let lines = m_elmSourceEditor.value.substring(0, (m_elmSourceEditor.selectionDirection==="forward" ? m_selEnd : m_selStart)).split("\n");
			let diff = m_selEnd - m_selStart;
			//let lfCount = (m_elmSourceEditor.value.substring(m_selStart, m_selEnd).match(/\n/g) || []).length

			m_elmStatusBar.textContent = `Ln ${lines.length}, Col ${lines[lines.length-1].length+1}` + (!!diff ? ` (${Math.abs(diff)} selected)` : ``);

			m_saveSelectionStart = m_selStart;
			m_saveSelectionEnd = m_selEnd;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function showFirstLoadHelpPopup() {
		internalPrefs.getPopupShowCountNotepadHelp().then((count) => {
			if(count>0) {
				m_elmHelpPopup.classList.add("show");
				internalPrefs.setPopupShowCountNotepadHelp(--count);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function setDirty(dirty) {
		document.title = DOCUMENT_TITLE + ((m_isDirty = dirty) ? " - [[ Modified ]]" : "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function isDirty() {
		return m_isDirty;
	}
})();
