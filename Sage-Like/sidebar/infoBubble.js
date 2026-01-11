"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
class InfoBubble {

	static #_constructId = null;
	static #_instance = null;

	#_elmBubble = null;
	#_elmBubbleText = null;

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
	show(infoText, details = {}) {

		const {
			pointTo: refElement = undefined,	// reference element
			alertive = true,					// alertive style
			duration = 4000,					// duration in milliseconds
			hideOnScroll = false,				// dismiss on scroll
		} = details;

		if(!!!this.#_elmBubble) {
			this.#_elmBubble = document.getElementById("info-bubble");
			this.#_elmBubbleText = document.getElementById("info-bubble-text");
			this.#_addEventListeners();
		}

		const bIsGeneral = (refElement === undefined);
		const rectRefElement = (bIsGeneral ? undefined : refElement.getBoundingClientRect());

		// do not show bubble if the reference element is not visible
		if(!bIsGeneral) {
			// Returns true if the element is hidden (offsetParent is null). SVG don't have offsetParent property - need special check
			const isOffsetParentNull = (e) => {
				// 1. If 'e' is falsy (null/undefined), return true.
				// 2. If 'offsetParent' is undefined (e.g. SVG), recursively check the parent element.
				// 3. Otherwise, return true if 'offsetParent' is null.
				return (!!!e || ( (typeof(e.offsetParent) === "undefined") ? isOffsetParentNull(e.parentElement) : (e.offsetParent === null) ));
			};
			const isRefElementHidden = (isOffsetParentNull(refElement) ||
											rectRefElement.bottom < 0 || rectRefElement.top > window.innerHeight ||
											rectRefElement.right < 0 || rectRefElement.left > window.innerWidth);
			if(isRefElementHidden) return;
		}

		slUtil.replaceInnerContent(this.#_elmBubbleText, infoText.replace(/"([^"]+)"/mg, "<b>$1</b>"));
		this.#_elmBubble.slDismissOnScroll = (bIsGeneral ? false : hideOnScroll);
		this.#_elmBubble.classList.toggle("no-arrow", bIsGeneral);
		this.#_elmBubble.classList.toggle("alertive", alertive);
		this.#_elmBubble.style.display = "block";

		const rectBubble = this.#_elmBubble.getBoundingClientRect();
		let top, left;

		if(bIsGeneral) {

			top = 4;
			left = (window.innerWidth - rectBubble.width) / 2;		// Centered at top

		} else {

			const arrowRotation = 20;	// degrees
			const edgeMargin = 1;		// px
			const computedStyle = getComputedStyle(this.#_elmBubble);
			const arrowHeight = parseFloat(computedStyle.getPropertyValue("--height-arrow"));
			const bubbleBorderWidth = parseFloat(computedStyle.borderLeftWidth);	// assuming uniform border width - borderWidth is a shorthand and may not be reliable

			// Vertical positioning
			let isAbove = false;
			top = rectRefElement.bottom + arrowHeight - bubbleBorderWidth;		// adjust for border top width
			// Check if it fits below
			if (top + rectBubble.height > window.innerHeight) {
				// Try above
				const topAbove = rectRefElement.top - rectBubble.height - arrowHeight + bubbleBorderWidth;		// adjust for border bottom width
				if (topAbove >= 0) {
					top = topAbove;
					isAbove = true;
				}
			}

			// Horizontal positioning (centered initially)
			left = rectRefElement.left + rectRefElement.width / 2 - rectBubble.width / 2;
			// Clamp horizontal
			if (left < 0) left = edgeMargin;
			if (left + rectBubble.width > window.innerWidth) {
				left = window.innerWidth - rectBubble.width - edgeMargin;
			}

			// Arrow handling
			this.#_elmBubble.classList.remove("above", "below");
			this.#_elmBubble.classList.add(isAbove ? "above" : "below");

			// Calculate arrow position relative to bubble
			const refElmCenter = rectRefElement.left + rectRefElement.width / 2;
			let arrowX = refElmCenter - left - bubbleBorderWidth;	// adjust for border left width

			// Calculate arrow rotation
			const isStart = arrowX < (rectBubble.width / 2);
			let rotation = (isStart ? -arrowRotation : arrowRotation);
			if (isAbove) rotation *= -1;

			// Adjust arrowX to account for rotation so the tip points to the center of the reference element
			const angleRad = arrowRotation * (Math.PI / 180);
			const offset = arrowHeight * Math.tan(angleRad);
			arrowX += (isStart ? offset : -offset);

			this.#_elmBubble.style.setProperty('--arrow-x', arrowX + "px");
			this.#_elmBubble.style.setProperty('--arrow-rotation', rotation + "deg");
		}

		// Apply position
		this.#_elmBubble.style.left = left + "px";
		this.#_elmBubble.style.top = top + "px";
		this.#_elmBubble.style.transform = "none";

		const callTimestamp = Date.now();
		this.#_elmBubble.slCallTimeStamp = callTimestamp;

		setTimeout(() => this.#_elmBubble.classList.replace("fadeOut", "fadeIn"), 0);

		setTimeout(() => {
			if(this.#_elmBubble.slCallTimeStamp === callTimestamp) {		// dismiss only if its for the last function call
				this.dismiss();
			}
		}, duration);
	}

	//////////////////////////////////////////
	dismiss(isScrolling = false) {
		if(!!this.#_elmBubble) {
			if(!isScrolling || (isScrolling && this.#_elmBubble.slDismissOnScroll)) {
				this.#_elmBubble.slCallTimeStamp = Date.now();
				this.#_elmBubble.classList.replace("fadeIn", "fadeOut");
			}
		}
	}

	//////////////////////////////////////////
	#_addEventListeners() {
		this.#_elmBubble.addEventListener("click", this.#_onClickInfoBubble.bind(this));
		this.#_elmBubble.addEventListener("transitionend", this.#_onTransitionEndInfoBubble.bind(this));
	}

	//////////////////////////////////////////
	#_onClickInfoBubble(event) {
		this.dismiss();
	}

	//////////////////////////////////////////
	#_onTransitionEndInfoBubble(event) {
		if(event.target === this.#_elmBubble &&
			event.propertyName === "visibility" &&
			this.#_elmBubble.classList.contains("fadeOut")) {

			this.#_elmBubble.style.display = "none";
		}
	}
}
