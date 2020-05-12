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

			this._funcPromiseResolve = resolve;

			if(down) {
				this._addEventListeners();
				this._slideDownPanel.style.display = "block";
				setTimeout(() => this._slideDownPanel.classList.add("visible"), 0);
			} else {
				this._slideDownPanel.classList.remove("visible");
			}
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
