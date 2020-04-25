"use strict";

class SlideDownPanel {
	///////////////////////////////////////////////////////////////
	constructor(elmPanel, onPullDownCallback, onPullUpCallback) {
		if( !!!elmPanel || !(elmPanel instanceof Element) || !elmPanel.classList.contains("slideDownPanel")) {
			throw new Error(new.target.name + ".constructor: Not a slide-down-panel element");
		}
		this._initMembers(elmPanel, onPullDownCallback, onPullUpCallback);
	}

	///////////////////////////////////////////////////////////////
	pull(down) {
		if(down) {
			this._addEventListeners();
			this.m_slideDownPanel.style.display = "block";
			setTimeout(() => this.m_slideDownPanel.classList.add("visible"), 0);
		} else {
			this.m_slideDownPanel.classList.remove("visible");
		}
	}

	///////////////////////////////////////////////////////////////
	_initMembers(elmPanel, onPullDownCallback, onPullUpCallback) {
		this.m_slideDownPanel = elmPanel;
		this._onPullDownCallback = onPullDownCallback;
		this._onPullUpCallback = onPullUpCallback;
		this._onTransitionEndSlideDownPanel = this._onTransitionEndSlideDownPanel.bind(this);
	}

	///////////////////////////////////////////////////////////////
	_addEventListeners() {
		this.m_slideDownPanel.addEventListener("transitionend", this._onTransitionEndSlideDownPanel);
	}

	///////////////////////////////////////////////////////////////
	_removeEventListeners() {
		this.m_slideDownPanel.removeEventListener("transitionend", this._onTransitionEndSlideDownPanel);
	}

	///////////////////////////////////////////////////////////////
	_onTransitionEndSlideDownPanel(event) {

		if(event.target === this.m_slideDownPanel && event.propertyName === "top") {

			if(this.m_slideDownPanel.classList.contains("visible")) {

				if(typeof(this._onPullDownCallback) === "function") this._onPullDownCallback();

			} else {

				this.m_slideDownPanel.style.display = "none";
				this._removeEventListeners();
				if(typeof(this._onPullUpCallback) === "function") this._onPullUpCallback();
			}
		}
	}
};
