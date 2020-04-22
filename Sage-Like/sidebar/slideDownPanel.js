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
		if(down && !this.m_isDown) {
			this._addEventListeners();
			this.m_slideDownPanel.style.display = "block";
			setTimeout(() => this.m_slideDownPanel.classList.add("visible"), 0);
		} else if(!down && this.m_isDown) {
			this.m_slideDownPanel.classList.remove("visible");
		}
	}

	///////////////////////////////////////////////////////////////
	_initMembers(elmPanel, onPullDownCallback, onPullUpCallback) {
		this.m_slideDownPanel = elmPanel;
		this._onPullDownCallback = onPullDownCallback;
		this._onPullUpCallback = onPullUpCallback;
		this._onTransitionEndSlideDownPanel = this._onTransitionEndSlideDownPanel.bind(this);
		this.m_isDown = false;
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

				this.m_isDown = true;
				if(!!(this._onPullDownCallback)) (this._onPullDownCallback)();

			} else {

				this.m_slideDownPanel.style.display = "none";
				this._removeEventListeners();

				this.m_isDown = false;
				if(!!(this._onPullUpCallback)) (this._onPullUpCallback)();
			}
		}
	}
};
