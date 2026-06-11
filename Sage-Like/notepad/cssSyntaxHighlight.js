"use strict";

const cssSyntaxHighlight = (function() {

	const m_cssChunkPattern = /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
	let m_cssTokenPattern = null;

	initialize();

	////////////////////////////////////////////////////////////////////////////////////
	function initialize() {

		const CSS_PATTERN_G1_PROPERTY_CONTEXT = String.raw`(^|[;{\n]\s*)`;
		const CSS_PATTERN_G2_PROPERTY_NAME = String.raw`((?:--[\w-]+)|(?:[\w-]+))`;
		const CSS_PATTERN_G3_PROPERTY_SUFFIX = String.raw`(\s*:)`;
		const CSS_PATTERN_G4_AT_RULE = String.raw`(@[\w-]+)`;
		const CSS_PATTERN_G5_VARIABLE_NAME = String.raw`(--[\w-]+)`;
		const CSS_PATTERN_G6_ID_NAME = String.raw`(#(?![0-9a-fA-F]{3,8}(?=[^\w-]|$))[_A-Za-z-][\w-]*)`;
		const CSS_PATTERN_G7_CLASS_NAME = String.raw`(\.[_A-Za-z-][\w-]*)`;
		const CSS_PATTERN_Gn_SELECTOR_SUFFIX = String.raw`(?=(?:\s*[.#:[>+~,{)])|(?:\s+[\w*|:-]+)|(?:\s*$))`;
		const CSS_PATTERN_G8_FUNCTION_NAME = String.raw`(-?[A-Za-z_][\w-]*)(?=\s*\()`;
		const CSS_PATTERN_G9_UNIT_CONTEXT = String.raw`(^|[^#\w-])`;
		const CSS_PATTERN_G10_NUMERIC_VALUE = String.raw`(-?(?:\d+\.\d+|\d+|\.\d+)(?:[eE][+-]?\d+)?)`;
		const CSS_PATTERN_G11_UNIT_NAME = String.raw`(cap|ch|cm|cqb|cqh|cqi|cqmax|cqmin|cqw|deg|dpcm|dpi|dppx|em|ex|fr|grad|Hz|ic|in|kHz|lh|lvb|lvi|lvh|lvmax|lvmin|lvw|mm|ms|pc|pt|px|Q|rad|rcap|rch|rem|rex|ric|rlh|s|svb|svi|svh|svmax|svmin|svw|turn|vb|vh|vi|vmax|vmin|vw|x|%)?`;
		const CSS_PATTERN_G11_UNIT_SUFFIX = String.raw`(?=[^\w-]|$)`;
		const CSS_PATTERN_G12_PUNCTUATION = String.raw`([{}:;(),])`;

		m_cssTokenPattern = new RegExp(
			CSS_PATTERN_G1_PROPERTY_CONTEXT + CSS_PATTERN_G2_PROPERTY_NAME + CSS_PATTERN_G3_PROPERTY_SUFFIX +
			"|" + CSS_PATTERN_G4_AT_RULE +
			"|" + CSS_PATTERN_G5_VARIABLE_NAME +
			"|" + CSS_PATTERN_G6_ID_NAME + CSS_PATTERN_Gn_SELECTOR_SUFFIX +
			"|" + CSS_PATTERN_G7_CLASS_NAME + CSS_PATTERN_Gn_SELECTOR_SUFFIX +
			"|" + CSS_PATTERN_G8_FUNCTION_NAME +
			"|" + CSS_PATTERN_G9_UNIT_CONTEXT + CSS_PATTERN_G10_NUMERIC_VALUE + CSS_PATTERN_G11_UNIT_NAME + CSS_PATTERN_G11_UNIT_SUFFIX +
			"|" + CSS_PATTERN_G12_PUNCTUATION,
			"gm"
		);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function renderSource(source) {

		const frag = document.createDocumentFragment();
		let tokenMatch, token, tokenClass;
		let lastIndex = 0;

		m_cssChunkPattern.lastIndex = 0;
		while((tokenMatch = m_cssChunkPattern.exec(source)) !== null) {
			appendPlainCSSHighlight(frag, source.substring(lastIndex, tokenMatch.index));

			token = tokenMatch[0];
			tokenClass = token.startsWith("/*") ? "syntax-comment" : "syntax-string";
			appendHighlightSpan(frag, tokenClass, token);

			lastIndex = m_cssChunkPattern.lastIndex;
		}

		appendPlainCSSHighlight(frag, source.substring(lastIndex));
		return frag;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendPlainCSSHighlight(parentNode, source) {

		let tokenMatch;
		let lastIndex = 0;

		m_cssTokenPattern.lastIndex = 0;
		while((tokenMatch = m_cssTokenPattern.exec(source)) !== null) {
			appendTextNode(parentNode, source.substring(lastIndex, tokenMatch.index));

			if(tokenMatch[2] !== undefined) {
				appendTextNode(parentNode, tokenMatch[1]);
				appendHighlightSpan(parentNode, (tokenMatch[2].startsWith("--") ? "syntax-variable" : "syntax-property"), tokenMatch[2]);
				appendTextNode(parentNode, tokenMatch[3]);
			} else if(tokenMatch[4] !== undefined) {
				appendHighlightSpan(parentNode, "syntax-atrule", tokenMatch[4]);
			} else if(tokenMatch[5] !== undefined) {
				appendHighlightSpan(parentNode, "syntax-variable", tokenMatch[5]);
			} else if(tokenMatch[6] !== undefined) {
				appendHighlightSpan(parentNode, "syntax-id", tokenMatch[6]);
			} else if(tokenMatch[7] !== undefined) {
				appendHighlightSpan(parentNode, "syntax-class", tokenMatch[7]);
			} else if(tokenMatch[8] !== undefined) {
				appendHighlightSpan(parentNode, "syntax-func", tokenMatch[8]);
			} else if(tokenMatch[10] !== undefined) {
				appendTextNode(parentNode, tokenMatch[9]);
				appendHighlightSpan(parentNode, "syntax-units", tokenMatch[10] + (tokenMatch[11] ?? ""));
			} else {
				appendHighlightSpan(parentNode, "syntax-punctuation", tokenMatch[12]);
			}
			lastIndex = m_cssTokenPattern.lastIndex;
		}

		appendTextNode(parentNode, source.substring(lastIndex));
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendHighlightSpan(parentNode, className, text) {
		const elmSpan = document.createElement("span");
		elmSpan.className = className;
		elmSpan.textContent = text;
		parentNode.appendChild(elmSpan);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function appendTextNode(parentNode, text) {
		if(text.length > 0) {
			parentNode.appendChild(document.createTextNode(text));
		}
	}

	return {
		renderSource: renderSource,
	};
})();
