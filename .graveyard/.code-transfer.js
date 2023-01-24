	////////////////////////////////////////////////////////////////////////////////////
	async function checkManifestVersionV2() {

		const manifest = browser.runtime.getManifest();

		if( (manifest.manifest_version === 2) && (parseInt(await slUtil.getBrowserVersion()) >= 109) ) {

			let urlAboutMV3 = "https://blog.mozilla.org/addons/2021/05/27/manifest-v3-update/";
			let urlSageLikeMV3 = "https://github.com/arielgee/Sage-Like/releases/tag/3.1";
			const messageDetails = {
				text: `If you want to try a pre-release version that supports ` +
						`<a id='aboutMV3' href='${urlAboutMV3}'><b>Manifest-V3</b></a> ` +
						`before it goes on Mozilla's add-ons website, you can ` +
						`manually download and install the .XPI file from <a id='sageLikeMV3' href='${urlSageLikeMV3}'><b>GitHub</b></a>.`,
				caption: "Manifest-V3 Pre-release Version",
				isAlertive: false,
				clickableElements: [
					{
						elementId: "aboutMV3",
					},
					{
						elementId: "sageLikeMV3",
					},
				],
			};

			await messageView.open(messageDetails);
		}
	}
