"use strict";

class SlideDownPanel {
	///////////////////////////////////////////////////////////////
	constructor(elmPanel) {
		if( !!!elmPanel || !(elmPanel instanceof Element) || !elmPanel.classList.contains("slideDownPanel")) {
			throw new Error(new.target.name + ".constructor: Not a slide-down-panel element");
		}
		this._initMembers(elmPanel);
	}

	///////////////////////////////////////////////////////////////
	get isDown() {
		return this._isDown;
	}

	///////////////////////////////////////////////////////////////
	pull(down) {

		return new Promise((resolve) => {

			/*	To enable the transition in the case of down=true, the '.style.display="block"' must be
				set ASAP and way before the '.classList.add("visible")'.
				Those two settings (block & visible) must be as far apart as possible or the transition
				will not happend and the 'transitionend' event will not be fired.

				In the case of _pullNotAnimated() this has no importance.		*/
			if(down) this._slideDownPanel.style.display = "block";

			prefs.getAnimatedSlideDownPanel().then((animate) => {
				if(animate) {
					this._funcPromiseResolve = resolve;
					this._pullAnimated(down);
				} else {
					this._pullNotAnimated(down);
					resolve({ status: (down ? "down" : "up") });
				}
			});
		});
	}

	///////////////////////////////////////////////////////////////
	_initMembers(elmPanel) {
		this._isDown = false;
		this._slideDownPanel = elmPanel;
		this._funcPromiseResolve = null;
		this._onTransitionEndSlideDownPanel = this._onTransitionEndSlideDownPanel.bind(this);
	}

	///////////////////////////////////////////////////////////////
	_pullAnimated(down) {
		if(down) {
			this._addEventListeners();
			this._slideDownPanel.classList.add("visible");
		} else {
			this._slideDownPanel.classList.remove("visible");
		}
	}

	///////////////////////////////////////////////////////////////
	_pullNotAnimated(down) {
		if(down) {
			this._slideDownPanel.classList.add("visible");
			this._isDown = true;
		} else {
			this._slideDownPanel.classList.remove("visible");
			this._slideDownPanel.style.display = "none";
			this._isDown = false;
		}
	}

	///////////////////////////////////////////////////////////////
	_addEventListeners() {
		this._slideDownPanel.addEventListener("transitionend", this._onTransitionEndSlideDownPanel);
	}

	///////////////////////////////////////////////////////////////
	_removeEventListeners() {
		this._slideDownPanel.removeEventListener("transitionend", this._onTransitionEndSlideDownPanel);
	}

	///////////////////////////////////////////////////////////////
	_onTransitionEndSlideDownPanel(event) {

		if(event.target === this._slideDownPanel && event.propertyName === "top") {

			if(this._slideDownPanel.classList.contains("visible")) {
				this._isDown = true;
				this._funcPromiseResolve({ status: "down" });
			} else {
				this._slideDownPanel.style.display = "none";
				this._removeEventListeners();
				this._isDown = false;
				this._funcPromiseResolve({ status: "up" });
			}
			this._funcPromiseResolve = null;
		}
	}
};
