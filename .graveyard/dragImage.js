	elm.addEventListener("dragstart", onDragStartTreeItem, false);

		////////////////////////////////////////////////////////////////////////////////////
		function onDragStartTreeItem(event) {

		event.stopPropagation();

		m_elmCurrentlyDragged = this;

		internalPrefs.getDropInsideFolderShowMsgCount().then((count) => {
			if(count > 0) {
				slUtil.showInfoBar("Use the Shift key to drop item <b>inside</b> folder.", undefined, m_elmTreeRoot.style.direction, false);
				internalPrefs.setDropInsideFolderShowMsgCount(--count);
			}
		});

		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/html", m_elmCurrentlyDragged.outerHTML);

		m_elmCurrentlyDragged.classList.add("dragged");

		/*  setDragImage() (canvas or any other image element) is not working in the
			work machine. (windows 7; firefox 56.0.2 / 59.0.3 / 65.0.2 ) The image is
			not displayed like in the home machine (windows 10).

			Could not find any clue in the web about the resone. I'm the only person in
			the entire universe that this happend to him!!!

			https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setDragImage

			Test URLs:
				https://kryogenix.org/code/browser/custom-drag-image.html
				http://mereskin.github.io/dnd/
		*/


		const bg = "#FFFEDF";
		const fg = "#000000";
		const borderWidth = 2;

		let cnvs = document.createElement("canvas");
		cnvs.id = "canvasMessage";
		cnvs.height = 22;
		cnvs.width = 270;

		const ctx = cnvs.getContext("2d");

		// background
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, cnvs.width, cnvs.height);

		ctx.beginPath();
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = fg;
		ctx.rect(1, 1, cnvs.width-borderWidth, cnvs.height-borderWidth);
		ctx.stroke();

		ctx.fillStyle = fg;
		ctx.font = "16px serif";
		ctx.fillText("Use the Shift key to drop item inside folder.", 4, 16, cnvs.width - 8);

		/* just text
		let e = document.createElement("p");
		e.textContent = "Use the Shift key to drop item inside folder.";
		document.body.appendChild(e);
		event.dataTransfer.setDragImage(e, -12, 0);
		*/

		event.dataTransfer.setDragImage(cnvs, -12, 0);
	}
