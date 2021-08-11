	////////////////////////////////////////////////////////////////////////////////////
	// from: rssTreeView
	function eventOccureInItemIcon(evt, elm) {

		// This function checks if the event has occured in the top-left part of the element
		if(eventOccureInItemCaptionHeight(evt, elm)) {
			return ( ((evt.clientX - elm.getBoundingClientRect().left) <= panel.getDensity().treeIndent) );
		} else {
			return false;
		}
	}
