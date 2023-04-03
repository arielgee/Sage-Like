"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class InfoBubble {

	static #_constructId = null;
	static #_instance = null;

	#_elmInfoBubble = null;
	#_elmInfoBubbleText = null;

	constructor(id) {
		if(InfoBubble.#_constructId !== parseInt(id)) {
			throw new Error(`${new.target.name}.constructor: Don't do that, it's a singleton.`);
		}
		InfoBubble.#_constructId = null;
	}

	//////////////////////////////////////////
	static get i() {
		if (InfoBubble.#_instance === null) {
			InfoBubble.#_instance = new this(InfoBubble.#_constructId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
		}
		return InfoBubble.#_instance;
	}

	//////////////////////////////////////////
	show(infoText, refElement = undefined, isAlertive = true, rightPointerStyle = false, showDuration = 3500, dismissOnScroll = false) {

		if(!!!this.#_elmInfoBubble) {
			this.#_elmInfoBubble = document.getElementById("infoBubble");
			this.#_elmInfoBubbleText = document.getElementById("infoBubbleText");
			this.#_addEventListeners();
		}

		let isGeneral = (refElement === undefined);

		if(isGeneral) {
			refElement = document.body;
			this.#_elmInfoBubble.slDismissOnScroll = false;
		} else {
			this.#_elmInfoBubble.slRefElement = refElement;
			this.#_elmInfoBubble.slDismissOnScroll = dismissOnScroll;
		}

		// by setting to most left the bubble currect offsetWidth is recalculated with less
		// interferences from the window viewport with before setting display = "block"
		this.#_elmInfoBubble.style.left = "0px";
		this.#_setTextHTML(this.#_elmInfoBubbleText, infoText);
		this.#_elmInfoBubble.classList.toggle("alertive", isAlertive);
		this.#_elmInfoBubble.classList.toggle("rightPointer", rightPointerStyle);
		this.#_elmInfoBubble.classList.toggle("generalInfo", isGeneral);
		this.#_elmInfoBubble.style.display = "block";

		// real inner size accounting for the scrollbars width if they exist
		let innerWidth = window.innerWidth - slUtil.getVScrollWidth();
		let innerHeight = window.innerHeight - slUtil.getHScrollWidth();
		let rectRefElement = slUtil.getElementViewportRect(refElement, innerWidth, innerHeight);
		let topOffset = (isGeneral ? 4 : rectRefElement.height);
		let callTimestamp = Date.now();

		let nLeft, nTop = rectRefElement.top + topOffset;

		if(isGeneral) {
			nLeft = (innerWidth - this.#_elmInfoBubble.offsetWidth) / 2;
		} else {
			nLeft = rectRefElement.left + (rightPointerStyle ? (rectRefElement.width-this.#_elmInfoBubble.offsetWidth) : 0);
		}

		if (nLeft < 0) nLeft = 0;

		this.#_elmInfoBubble.style.left = nLeft + "px";
		this.#_elmInfoBubble.style.top = nTop + "px";
		this.#_elmInfoBubble.slCallTimeStamp = callTimestamp;

		setTimeout(() => this.#_elmInfoBubble.classList.replace("fadeOut", "fadeIn"), 0);

		setTimeout(() => {
			if(this.#_elmInfoBubble.slCallTimeStamp === callTimestamp) {		// dismiss only if its for the last function call
				this.dismiss();
			}
		}, showDuration);
	}

	//////////////////////////////////////////
	dismiss(isScrolling = false) {

		if(!!this.#_elmInfoBubble) {

			if(!isScrolling || (isScrolling && this.#_elmInfoBubble.slDismissOnScroll)) {

				this.#_elmInfoBubble.slCallTimeStamp = Date.now();
				this.#_elmInfoBubble.classList.replace("fadeIn", "fadeOut");

				if(!!this.#_elmInfoBubble.slRefElement) {
					delete this.#_elmInfoBubble.slRefElement;
				}
			}
		}
	}

	//////////////////////////////////////////
	#_addEventListeners() {
		this.#_elmInfoBubble.addEventListener("click", this.#_onClickInfoBubble.bind(this));
		this.#_elmInfoBubble.addEventListener("transitionend", this.#_onTransitionEndInfoBubble.bind(this));
	}

	//////////////////////////////////////////
	#_onClickInfoBubble(event) {
		this.dismiss();
	}

	//////////////////////////////////////////
	#_onTransitionEndInfoBubble(event) {
		if(event.target === this.#_elmInfoBubble &&
			event.propertyName === "visibility" &&
			this.#_elmInfoBubble.classList.contains("fadeOut")) {

			this.#_elmInfoBubble.style.display = "none";
		}
	}

	//////////////////////////////////////////
	#_setTextHTML(elm, infoText) {

		// empty
		while(elm.firstChild) {
			elm.removeChild(elm.firstChild);
		}

		// support for words that are <b>
		let matches;
		let infoTextTagNodesB = [];
		let indexStart = 0;
		let reTagB = /<b>.+?<\/b>/gim;

		while( (matches = reTagB.exec(infoText)) !== null ) {
			infoTextTagNodesB.push(infoText.substring(indexStart, matches.index));
			infoTextTagNodesB.push(matches[0]);
			indexStart = reTagB.lastIndex;
		}
		infoTextTagNodesB.push(infoText.substring(indexStart));

		// remove empties
		infoTextTagNodesB = infoTextTagNodesB.filter((x) => x.length > 0);

		let node;
		let reOnlyTagB = new RegExp("^(" + reTagB.source + ")$", "im");

		for(let i=0, len=infoTextTagNodesB.length; i<len; i++) {
			if(reOnlyTagB.test(infoTextTagNodesB[i])) {
				node = document.createElement("b");
				node.textContent = infoTextTagNodesB[i].replace(/<\/?b>/g, "");
			} else {
				node = document.createTextNode(infoTextTagNodesB[i]);
			}
			elm.appendChild(node);
		}
	}
}
