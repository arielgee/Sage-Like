"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class InfoBubble {

	static #m_construct = false;
	static #m_instance = null;

	#m_elmInfoBubble = null;
	#m_elmInfoBubbleText = null;
	#onClickInfoBubbleBound;
	#onTransitionEndInfoBubbleBound;

	constructor() {
		if(InfoBubble.#m_construct === false) {
			throw new Error("constructor: Don't do that, it's a singleton.");
		}
	}

	//////////////////////////////////////////
	static get i() {
		if (InfoBubble.#m_instance === null) {
			InfoBubble.#m_construct = true;
			InfoBubble.#m_instance = new this();
			InfoBubble.#m_construct = false;
		}
		return InfoBubble.#m_instance;
	}

	//////////////////////////////////////////
	show(infoText, refElement = undefined, isAlertive = true, rightPointerStyle = false, showDuration = 3500, dismissOnScroll = false) {

		if(!!!this.#m_elmInfoBubble) {
			this.#m_elmInfoBubble = document.getElementById("infoBubble");
			this.#m_elmInfoBubbleText = document.getElementById("infoBubbleText");
			this.#addEventListeners();
		}

		let isGeneral = (refElement === undefined);

		if(isGeneral) {
			refElement = document.body;
			this.#m_elmInfoBubble.slDismissOnScroll = false;
		} else {
			this.#m_elmInfoBubble.slRefElement = refElement;
			this.#m_elmInfoBubble.slDismissOnScroll = dismissOnScroll;
		}

		// by setting to most left the bubble currect offsetWidth is recalculated with less
		// interferences from the window viewport with before setting display = "block"
		this.#m_elmInfoBubble.style.left = "0px";
		this.#setTextHTML(this.#m_elmInfoBubbleText, infoText);
		this.#m_elmInfoBubble.classList.toggle("alertive", isAlertive);
		this.#m_elmInfoBubble.classList.toggle("rightPointer", rightPointerStyle);
		this.#m_elmInfoBubble.classList.toggle("generalInfo", isGeneral);
		this.#m_elmInfoBubble.style.display = "block";

		// real inner size accounting for the scrollbars width if they exist
		let innerWidth = window.innerWidth - slUtil.getVScrollWidth();
		let innerHeight = window.innerHeight - slUtil.getHScrollWidth();
		let rectRefElement = slUtil.getElementViewportRect(refElement, innerWidth, innerHeight);
		let topOffset = (isGeneral ? 4 : rectRefElement.height);
		let callTimestamp = Date.now();

		let nLeft, nTop = rectRefElement.top + topOffset;

		if(isGeneral) {
			nLeft = (innerWidth - this.#m_elmInfoBubble.offsetWidth) / 2;
		} else {
			nLeft = rectRefElement.left + (rightPointerStyle ? (rectRefElement.width-this.#m_elmInfoBubble.offsetWidth) : 0);
		}

		if (nLeft < 0) nLeft = 0;

		this.#m_elmInfoBubble.style.left = nLeft + "px";
		this.#m_elmInfoBubble.style.top = nTop + "px";
		this.#m_elmInfoBubble.slCallTimeStamp = callTimestamp;

		setTimeout(() => this.#m_elmInfoBubble.classList.replace("fadeOut", "fadeIn"), 0);

		setTimeout(() => {
			if(this.#m_elmInfoBubble.slCallTimeStamp === callTimestamp) {		// dismiss only if its for the last function call
				this.dismiss();
			}
		}, showDuration);
	}

	//////////////////////////////////////////
	dismiss(isScrolling = false) {

		if(!!this.#m_elmInfoBubble) {

			if(!isScrolling || (isScrolling && this.#m_elmInfoBubble.slDismissOnScroll)) {

				this.#m_elmInfoBubble.slCallTimeStamp = Date.now();
				this.#m_elmInfoBubble.classList.replace("fadeIn", "fadeOut");

				if(!!this.#m_elmInfoBubble.slRefElement) {
					delete this.#m_elmInfoBubble.slRefElement;
				}
			}
		}
	}

	//////////////////////////////////////////
	#addEventListeners() {

		this.#onClickInfoBubbleBound = this.#onClickInfoBubble.bind(this);
		this.#onTransitionEndInfoBubbleBound = this.#onTransitionEndInfoBubble.bind(this);

		this.#m_elmInfoBubble.addEventListener("click", this.#onClickInfoBubbleBound);
		this.#m_elmInfoBubble.addEventListener("transitionend", this.#onTransitionEndInfoBubbleBound);
	}

	//////////////////////////////////////////
	#onClickInfoBubble(event) {
		this.dismiss();
	}

	//////////////////////////////////////////
	#onTransitionEndInfoBubble(event) {
		if(event.target === this.#m_elmInfoBubble &&
			event.propertyName === "visibility" &&
			this.#m_elmInfoBubble.classList.contains("fadeOut")) {

			this.#m_elmInfoBubble.style.display = "none";
		}
	}

	//////////////////////////////////////////
	#setTextHTML(elm, infoText) {

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
