"use strict";

class SlideDownPanel {
	///////////////////////////////////////////////////////////////
	constructor(elmPanel, onShownCallback, onHiddenCallback) {

		if( !!!elmPanel || !(elmPanel instanceof Element) || !elmPanel.classList.contains("slideDownPanel")) {
			throw new Error(new.target.name + ".constructor: Not a slide-down-panel element");
		}

		this.m_slideDownPanel = elmPanel;
		this._initMembers(onShownCallback, onHiddenCallback);
	}

	///////////////////////////////////////////////////////////////
	show() {
		if(!this.m_isShown) {
			this._addEventListeners();

			this.m_slideDownPanel.style.display = "block";
			setTimeout(() => this.m_slideDownPanel.classList.add("visible"), 0);
		}
	}

	///////////////////////////////////////////////////////////////
	hide() {
		if(this.m_isShown) {
			this.m_slideDownPanel.classList.remove("visible");
		}
	}

	///////////////////////////////////////////////////////////////
	_initMembers(onShownCallback, onHiddenCallback) {
		this._onTransitionEndSlideDownPanel = this._onTransitionEndSlideDownPanel.bind(this);

		this._onShownCallback = onShownCallback;
		this._onHiddenCallback = onHiddenCallback;

		this.m_isShown = false;
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

				this.m_isShown = true;

				if(!!(this._onShownCallback)) (this._onShownCallback)();

			} else {

				this.m_slideDownPanel.style.display = "none";
				this._removeEventListeners();
				this.m_isShown = false;

				if(!!(this._onHiddenCallback)) (this._onHiddenCallback)();
			}
		}
	}
};
