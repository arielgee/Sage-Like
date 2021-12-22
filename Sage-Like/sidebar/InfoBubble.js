"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class InfoBubble {

	//////////////////////////////////////////
	static get i() {
		if(this.m_instance === undefined) {
			this.m_instance = new this();
		}
		return this.m_instance;
	}

	//////////////////////////////////////////
	constructor() {
		this.m_elmInfoBubble = null;
		this.m_elmInfoBubbleText = null;
	}

	//////////////////////////////////////////
	show(infoText, refElement = undefined, isAlertive = true, rightPointerStyle = false, showDuration = 3500, dismissOnScroll = false) {

		if(!!!this.m_elmInfoBubble) {
			this.m_elmInfoBubble = document.getElementById("infoBubble");
			this.m_elmInfoBubbleText = document.getElementById("infoBubbleText");
			this._addEventListeners();
		}

		let isGeneral = (refElement === undefined);

		if(isGeneral) {
			refElement = document.body;
			this.m_elmInfoBubble.slDismissOnScroll = false;
		} else {
			this.m_elmInfoBubble.slRefElement = refElement;
			this.m_elmInfoBubble.slDismissOnScroll = dismissOnScroll;
		}

		// by setting to most left the bubble currect offsetWidth is recalculated with less
		// interferences from the window viewport with before setting display = "block"
		this.m_elmInfoBubble.style.left = "0px";
		this._setTextHTML(this.m_elmInfoBubbleText, infoText);
		this.m_elmInfoBubble.classList.toggle("alertive", isAlertive);
		this.m_elmInfoBubble.classList.toggle("rightPointer", rightPointerStyle);
		this.m_elmInfoBubble.classList.toggle("generalInfo", isGeneral);
		this.m_elmInfoBubble.style.display = "block";

		// real inner size accounting for the scrollbars width if they exist
		let innerWidth = window.innerWidth - slUtil.getVScrollWidth();
		let innerHeight = window.innerHeight - slUtil.getHScrollWidth();
		let rectRefElement = slUtil.getElementViewportRect(refElement, innerWidth, innerHeight);
		let topOffset = (isGeneral ? 4 : rectRefElement.height);
		let callTimestamp = Date.now();

		let nLeft, nTop = rectRefElement.top + topOffset;

		if(isGeneral) {
			nLeft = (innerWidth - this.m_elmInfoBubble.offsetWidth) / 2;
		} else {
			nLeft = rectRefElement.left + (rightPointerStyle ? (rectRefElement.width-this.m_elmInfoBubble.offsetWidth) : 0);
		}

		if (nLeft < 0) nLeft = 0;

		this.m_elmInfoBubble.style.left = nLeft + "px";
		this.m_elmInfoBubble.style.top = nTop + "px";
		this.m_elmInfoBubble.slCallTimeStamp = callTimestamp;

		setTimeout(() => this.m_elmInfoBubble.classList.replace("fadeOut", "fadeIn"), 0);

		setTimeout(() => {
			if(this.m_elmInfoBubble.slCallTimeStamp === callTimestamp) {		// dismiss only if its for the last function call
				this.dismiss();
			}
		}, showDuration);
	}

	//////////////////////////////////////////
	dismiss(isScrolling = false) {

		if(!!this.m_elmInfoBubble) {

			if(!isScrolling || (isScrolling && this.m_elmInfoBubble.slDismissOnScroll)) {

				this.m_elmInfoBubble.slCallTimeStamp = Date.now();
				this.m_elmInfoBubble.classList.replace("fadeIn", "fadeOut");

				if(!!this.m_elmInfoBubble.slRefElement) {
					delete this.m_elmInfoBubble.slRefElement;
				}
			}
		}
	}

	//////////////////////////////////////////
	_addEventListeners() {

		this._onClickInfoBubble = this._onClickInfoBubble.bind(this);
		this._onTransitionEndInfoBubble = this._onTransitionEndInfoBubble.bind(this);

		this.m_elmInfoBubble.addEventListener("click", this._onClickInfoBubble);
		this.m_elmInfoBubble.addEventListener("transitionend", this._onTransitionEndInfoBubble);
	}

	//////////////////////////////////////////
	_onClickInfoBubble(event) {
		this.dismiss();
	}

	//////////////////////////////////////////
	_onTransitionEndInfoBubble(event) {
		if(event.target === this.m_elmInfoBubble &&
			event.propertyName === "visibility" &&
			this.m_elmInfoBubble.classList.contains("fadeOut")) {

			this.m_elmInfoBubble.style.display = "none";
		}
	}

	//////////////////////////////////////////
	_setTextHTML(elm, infoText) {

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
