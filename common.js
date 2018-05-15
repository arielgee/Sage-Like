"use strict"

/////////////////////////////////////////////////////////////////////////////////////////////
///
let lzUtil = (function () {

	//////////////////////////////////////////////////////////////////////
	String.prototype.format = function (args) {
		let str = this;
		return str.replace(String.prototype.format.regex, (item) => {
			let intVal = parseInt(item.substring(1, item.length - 1));
			let replace;
			if (intVal >= 0) {
				replace = args[intVal];
			} else if (intVal === -1) {
				replace = "{";
			} else if (intVal === -2) {
				replace = "}";
			} else {
				replace = "";
			}
			return replace;
		});
	};
	String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

	//////////////////////////////////////////////////////////////////////
	String.prototype.trunc = function (n) {
		return (this.length > n) ? this.substr(0, n - 1) + "&hellip;" : this;
	};

	//////////////////////////////////////////////////////////////////////
	let log = function (...args) {
		console.log("[Sage-Like]", ...args);
	};

	//////////////////////////////////////////////////////////////////////
	let concatClassName = function (elm, className) {

		// check type of className. <SVG> elements are evil.
		if (typeof elm.className === "string") {
			if (!(RegExp("\\b" + className + "\\b").test(elm.className))) {
				if (elm.className.length === 0) {
					elm.className = className;
				} else {
					elm.className += " " + className;
				}
			}
		} else {
			elm.setAttribute("class", className);
		}
	};

	//////////////////////////////////////////////////////////////////////
	let replaceClassName = function (elm, className, newClassName) {
		elm.className = elm.className.replace(RegExp("\\b" + className + "\\b"), newClassName);
	};

	//////////////////////////////////////////////////////////////////////
	let removeClassName = function (elm, className) {
		elm.className = elm.className.replace(RegExp("\\b\\s?" + className + "\\b", "g"), "");		// also remove leading space character
	};

	//////////////////////////////////////////////////////////////////////
	let escapeRegExp = function (str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	};

	//////////////////////////////////////////////////////////////////////
	let includedInClassName = function (elm, className) {

		// check type of className. <SVG> elements are evil.
		if (typeof elm.className === "string") {
			return RegExp("\\b" + className + "\\b").test(elm.className);
		}
		return false;
	};

	//////////////////////////////////////////////////////////////////////
	let random1to100 = function () {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	};

	//////////////////////////////////////////////////////////////////////
	let disableElementTree = function (elm, value) {

		if (elm.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		for (let i in elm.children) {
			disableElementTree(elm.children[i], value);
		}

		if (elm.disabled !== undefined) {
			elm.disabled = value;
		}

		if (value === true) {
			lzUtil.concatClassName(elm, "disabled");
		} else {
			lzUtil.removeClassName(elm, "disabled");
		}
	};

	// why not use classList ?!?!?!?!?!?!?!?!?!?!?!
	// https://www.w3schools.com/jsref/prop_element_classlist.asp

	return {
		log: log,
		concatClassName: concatClassName,
		replaceClassName: replaceClassName,
		removeClassName: removeClassName,
		includedInClassName: includedInClassName,
		escapeRegExp: escapeRegExp,
		random1to100: random1to100,
		disableElementTree: disableElementTree,
	};
})();

