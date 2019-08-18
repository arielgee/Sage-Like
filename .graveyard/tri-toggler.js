
document.addEventListener("DOMContentLoaded", () => {

	const AGGRESSIVE_TOOLTIP_TITLE = "Aggressive Discovery: \u000d" +
									"  \u25cf None: Check only for standardly discoverable RSS links. \u000d" +
									"  \u25cf Low: Check each hyperlink in page that its URL might suggest it links to an RSS feed. \u000d" +
									"  \u25cf High: Check ALL hyperlinks in page (process may be lengthy).";


	let t = document.getElementById("triTglAggressiveLevel");

	t.title = AGGRESSIVE_TOOLTIP_TITLE.replace(/ /g, "\u00a0");

	t.addEventListener("mousedown", (event) => {

		let toggleWidth = Math.floor(event.target.clientWidth / 3);

		if (event.offsetX < toggleWidth) {
			event.target.parentElement.setAttribute("data-toggler-state", 0);
		} else if (event.offsetX < toggleWidth * 2) {
			event.target.parentElement.setAttribute("data-toggler-state", 1);
		} else {
			event.target.parentElement.setAttribute("data-toggler-state", 2);
		}
	});

	t.addEventListener("click", (event) => {
		console.log("[Sage-Like]", "state: " + event.target.parentElement.getAttribute("data-toggler-state"));
	});

});
