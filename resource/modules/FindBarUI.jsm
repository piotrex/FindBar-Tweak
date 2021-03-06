moduleAid.VERSION = '1.1.6';

this.__defineGetter__('findCSButton', function() { return gFindBar.getElement(objName+'-find-cs-button'); });
this.__defineGetter__('findCSCheckbox', function() { return gFindBar.getElement('find-case-sensitive'); });

this.doOpenOptions = function() {
	openOptions();
};

this.updateButtonsUI = function() {
	if(prefAid.keepButtons && gFindBar._findMode != gFindBar.FIND_NORMAL) {
		var nodes = gFindBar.getElement("findbar-container").childNodes;
		for(var i = 0; i < nodes.length; i++) {
			if(nodes[i].className.indexOf("findbar-find-fast") != -1 || nodes[i].className.indexOf('findbar-no-find-fast') > -1) { continue; }
			nodes[i].hidden = false;
		}
	}
};

this.updateCSUI = function() {
	if(prefAid.keepButtons && gFindBar._findMode != gFindBar.FIND_NORMAL) {
		gFindBar.getElement("find-case-sensitive").hidden = (gFindBar._typeAheadCaseSensitive != 0 && gFindBar._typeAheadCaseSensitive != 1);
	}
};

this.alwaysFindNormal = function(e) {
	// If typing when Find bar is already opened in normal mode, use that instead of "reopening" as quick find mode
	if(!gFindBar.hidden && e.detail == gFindBar.FIND_TYPEAHEAD && gFindBar._findMode == gFindBar.FIND_NORMAL) {
		e.preventDefault();
		e.stopPropagation();
		gFindBar.open(gFindBar.FIND_NORMAL);
		return;
	}
	
	// If the FindBar is already open do nothing, this prevents the hangup when triggering the QuickFind bar when Find bar is open
	if(!gFindBar.hidden) { return; }
	
	// FAYT: option to force normal mode over quick find mode
	if(e.detail == gFindBar.FIND_TYPEAHEAD && prefAid.FAYTmode != 'quick') {
		e.preventDefault();
		e.stopPropagation();
		gFindBar.open(gFindBar.FIND_NORMAL);
	}
};

this.triggerUIChange = function() {
	dispatch(gFindBar, { type: 'FindBarUIChanged', cancelable: false });
};

// Handler for Ctrl+F, it closes the findbar if it is already opened
this.ctrlF = function(event) {
	if(!viewSource && window.TabView.isVisible()) {
		window.TabView.enableSearch(event);
	}
	else {
		if(gFindBar.hidden) {
			gFindBar.onFindCommand();
			gFindBar.open();
			if(gFindBar._findField.value) {
				gFindBar._setHighlightTimeout();
			}
		}
		else {
			gFindBar.close();
		}
	}
};

this.csButtonCommand = function(e) {
	if(e.which != 0) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
	
	findCSCheckbox.checked = !findCSCheckbox.checked;
	toggleAttribute(findCSButton, 'checked', findCSCheckbox.checked);
  	gFindBar._setCaseSensitivity(findCSCheckbox.checked);
	return true;
};

this.toggleButtonState = function(e) {
	toggleAttribute($(objName+'-button'), 'checked', (e.type == 'OpenedFindBar'));
};

this.toggleClose = function() {
	toggleAttribute(gFindBar, 'noClose', prefAid.hideClose);
	triggerUIChange();
};

this.toggleLabels = function() {
	if(prefAid.hideLabels && !findCSButton) {
		var button = document.createElement('toolbarbutton');
		button.setAttribute('anonid', objName+'-find-cs-button');
		button.setAttribute('class', 'findbar-highlight findbar-cs-button tabbable');
		button.setAttribute('tooltiptext', findCSCheckbox.getAttribute('label'));
		toggleAttribute(button, 'checked', prefAid.casesensitive);
		gFindBar.getElement("findbar-container").insertBefore(button, findCSCheckbox);
		listenerAid.add(findCSButton, 'command', csButtonCommand, true);
	} else if(!prefAid.hideLabels && findCSButton) {
		listenerAid.remove(findCSButton, 'command', csButtonCommand, true);
		findCSButton.parentNode.removeChild(findCSButton);
	}
	
	toggleAttribute(gFindBar, 'hideLabels', prefAid.hideLabels);
	triggerUIChange();
};

this.toggleMoveToTop = function() {
	moduleAid.loadIf('moveToTop', prefAid.movetoTop);
};

this.toggleMoveToRight = function(startup) {
	toggleAttribute(gFindBar, 'movetoright', prefAid.movetoRight);
};
	
moduleAid.LOADMODULE = function() {
	// For the case-sensitive button
	prefAid.setDefaults({ casesensitive: 0 }, 'typeaheadfind', 'accessibility');
	
	// The dummy function in this call prevents a weird bug where the overlay wouldn't be properly applied when opening a second window... for some reason...
	overlayAid.overlayURI('chrome://browser/content/browser.xul', 'findbar', function(window) { window.gFindBar; });
	overlayAid.overlayURI('chrome://global/content/viewSource.xul', 'findbar');
	overlayAid.overlayURI('chrome://global/content/viewPartialSource.xul', 'findbar');
	
	listenerAid.add(gFindBar, 'UpdatedUIFindBar', updateButtonsUI, false);
	listenerAid.add(gFindBar, 'UpdatedUIFindBar', updateCSUI, false);
	listenerAid.add(gFindBar, 'FoundFindBar', updateCSUI, false);
	listenerAid.add(gFindBar, 'WillOpenFindBar', alwaysFindNormal, true);
	listenerAid.add(gFindBar, 'OpenedFindBar', toggleButtonState);
	listenerAid.add(gFindBar, 'ClosedFindBar', toggleButtonState);
	
	prefAid.listen('hideClose', toggleClose);
	prefAid.listen('hideLabels', toggleLabels);
	prefAid.listen('movetoTop', toggleMoveToTop);
	prefAid.listen('movetoRight', toggleMoveToRight);
	
	toggleClose();
	toggleLabels();
	toggleMoveToTop();
	toggleMoveToRight();
};

moduleAid.UNLOADMODULE = function() {
	prefAid.unlisten('hideClose', toggleClose);
	prefAid.unlisten('hideLabels', toggleLabels);
	prefAid.unlisten('movetoTop', toggleMoveToTop);
	prefAid.unlisten('movetoRight', toggleMoveToRight);
	
	moduleAid.unload('moveToTop');
	
	removeAttribute(gFindBar, 'noClose');
	removeAttribute(gFindBar, 'hideLabels');
	removeAttribute(gFindBar, 'movetoright');
	
	if(findCSButton) {
		listenerAid.remove(findCSButton, 'command', csButtonCommand, true);
		findCSButton.parentNode.removeChild(findCSButton);
	}
	
	listenerAid.remove(gFindBar, 'UpdatedUIFindBar', updateButtonsUI, false);
	listenerAid.remove(gFindBar, 'UpdatedUIFindBar', updateCSUI, false);
	listenerAid.remove(gFindBar, 'FoundFindBar', updateCSUI, false);
	listenerAid.remove(gFindBar, 'WillOpenFindBar', alwaysFindNormal, true);
	listenerAid.remove(gFindBar, 'OpenedFindBar', toggleButtonState);
	listenerAid.remove(gFindBar, 'ClosedFindBar', toggleButtonState);
	
	if(UNLOADED) {
		overlayAid.removeOverlayURI('chrome://browser/content/browser.xul', 'findbar');
		overlayAid.removeOverlayURI('chrome://global/content/viewSource.xul', 'findbar');
		overlayAid.removeOverlayURI('chrome://global/content/viewPartialSource.xul', 'findbar');
	}
};
