"use strict"

let preferencesData = (function() {

	const PREF_SELF_SIGNED = "pref_selfSigned";
	const SELF_SIGNED_HASH_SALT = "salt_PreferencesSelfSignedHash-1.0";

	////////////////////////////////////////////////////////////////////////////////////
	function hashStringPreferences(prefs) {
		return slUtil.hashCode(JSON.stringify(prefs, null, 2) + SELF_SIGNED_HASH_SALT);
	};

	//######################################################################################
	let importPreferences = (function() {

		let m_xhr;
		let m_objUrl = null;
		let m_funcImportResolve;
		let m_funcImportReject;

		////////////////////////////////////////////////////////////////////////////////////
		function run(file) {

			return new Promise((resolve, reject) => {

				m_funcImportResolve = resolve;
				m_funcImportReject = reject;

				m_objUrl = URL.createObjectURL(file);

				m_xhr = new XMLHttpRequest();
				m_xhr.open("GET", m_objUrl);
				m_xhr.responseType = "json";	// response is a JavaScript object
				m_xhr.overrideMimeType("application/json");
				m_xhr.addEventListener("load", onLoad);
				m_xhr.addEventListener("error", onError);
				m_xhr.addEventListener("loadend", onLoadEnd);
				m_xhr.send();
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onLoad() {
			processPreferencesObject(m_xhr.response);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onError(event) {
			console.log("[Sage-Like]", event);
			m_funcImportReject(event);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onLoadEnd() {
			m_xhr.removeEventListener("load", onLoad);
			m_xhr.removeEventListener("error", onError);
			m_xhr.removeEventListener("error", onLoadEnd);

			if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
			m_objUrl = null;
			m_xhr = null;
		}

		////////////////////////////////////////////////////////////////////////////////////
		async function processPreferencesObject(objPrefs) {

			if(!!!objPrefs || typeof(objPrefs) !== "object") {
				return m_funcImportReject("This file may not be a valid JSON file.");
			}

			try {

				let hashSelfSigned = objPrefs[PREF_SELF_SIGNED];

				if(typeof(hashSelfSigned) === "string" && hashSelfSigned.length === 64) {		// size of a 'SHA-256' hash string

					delete objPrefs[PREF_SELF_SIGNED];		// remove the self signed property before hash

					if(hashSelfSigned == await hashStringPreferences(objPrefs)) {
						await prefs.setAllPreferences(objPrefs);
						m_funcImportResolve();
					} else {
						return m_funcImportReject("This Sage-Like options file was modified.\n\nOnly an unmodified and signed file can be imported.");
					}

				} else {
					return m_funcImportReject(`This file may not be a valid Sage-Like options file.\n\nMissing '${PREF_SELF_SIGNED}'.`);
				}

			} catch(error) {
				m_funcImportReject(error);
			}
		}

		return {
			run: run,
		};
	})();

	//######################################################################################
	let exportPreferences = (function() {

		let m_objUrl = null;
		let m_funcExportResolve;
		let m_fileName;

		////////////////////////////////////////////////////////////////////////////////////
		function run() {

			return new Promise((resolve, reject) => {

				m_funcExportResolve = resolve;

				prefs.getAllPreferences().then(async (objPrefs) => {

					// calc self hash and add to object
					objPrefs[PREF_SELF_SIGNED] = await hashStringPreferences(objPrefs);

					m_fileName = slUtil.getStringExportFileName(new Date(), "sage-like-options-", "json");
					let strPrefs = JSON.stringify(objPrefs, null, 2);

					let blob = new Blob([strPrefs], { type: "application/json", endings: "native" });

					m_objUrl = URL.createObjectURL(blob);
					browser.downloads.onCreated.addListener(onCreatedDownload);
					browser.downloads.onChanged.addListener(onChangedDownload);
					browser.downloads.download({
						url: m_objUrl,
						filename: m_fileName,
						saveAs: true,
					}).catch((error) => {

						if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
						m_objUrl = null;

						if(error.message === "Download canceled by the user") {
							m_funcExportResolve({});
						} else {
							reject(error);
						}
					});

				}).catch((error) => {
					reject(error);
				});
			});
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onCreatedDownload(downloadItem) {
			m_fileName = downloadItem.filename;
			browser.downloads.onCreated.removeListener(onCreatedDownload);
		}

		////////////////////////////////////////////////////////////////////////////////////
		function onChangedDownload(delta) {
			if (delta.state && delta.state.current === "complete") {

				if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
				m_objUrl = null;

				browser.downloads.onChanged.removeListener(onChangedDownload);
				m_funcExportResolve({ fileName: m_fileName });
			}
		}

		return {
			run: run,
		};
	})();

	return {
		import: importPreferences,
		export: exportPreferences,
	};

})();
