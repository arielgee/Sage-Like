"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class RequiredPermissionsPanel extends RequiredPermissions {

	//////////////////////////////////////////
	assert() {
		return (super.granted ? true : this.#_assertRequestPermissions());
	}

	//////////////////////////////////////////
	#_assertRequestPermissions() {

		let onRequestPermissions = async function onClickRequestPermissions() {
			messageView.close();
			if(await browser.permissions.request(reqPermissions)) {
				window.location.reload();	// reload entire sidebar
			} else {
				messageDetails.text = "I apologize, but the Sage-Like sidebar can't function without your authorization of the requested permissions." + htmlTagsRequest;
				messageView.open(messageDetails);
			}
		};

		const reqPermissions = this._permissions;
		const htmlTagsRequest = "<br><br>Select the link below to allow the required permissions.<br><br><a href='#' id='messageViewRequestPermissions'>Request Permissions</a>";
		const messageDetails = {
			text: "The functionality of fetching any feed from the web requires the <b>Access your data for all websites</b> permission.<br><br>" +
					"This permission is not allowed by the browser and Sage-Like is unable to accomplish its primary purpose." + htmlTagsRequest,
			caption: "Permissions Are Required",
			anchorElementId: "messageViewRequestPermissions",
			funcOnClickAnchorCallback: onRequestPermissions,
		};

		messageView.open(messageDetails);
		return super.granted;
	}
}
