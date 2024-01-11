rssTreeView.js

	////////////////////////////////////////////////////////////////////////////////////
	// Has no useful application... yet
	function treeItemNotificationDot(elmLI, addDot = true, dotColor = "red") {

		if(addDot) {

			if( !!(elmLI.querySelector(".treeItemNotificationDot")) ) {
				return;
			}

			const elmCanvas = document.createElement("canvas");
			const ctx = elmCanvas.getContext('2d');
			const dotSize = 4;

			elmCanvas.className = 'treeItemNotificationDot'
			elmCanvas.style.position = "absolute";
			elmCanvas.style.top = elmCanvas.style.left = "0px";
			elmCanvas.width = elmCanvas.height = dotSize;

			ctx.fillStyle = dotColor;
			ctx.beginPath();
			ctx.arc(dotSize/2, dotSize/2, dotSize/2, 0, 2 * Math.PI);
			ctx.fill();

			elmLI.style.position = "relative";
			elmLI.appendChild(elmCanvas);

		} else {

			const elmCanvas = elmLI.querySelector(".treeItemNotificationDot");
			if(!!elmCanvas) {
				elmLI.removeChild(elmCanvas);
				elmLI.style.position = "";
			}
		}
	}
