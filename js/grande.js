// The MIT License (MIT)

// Copyright (c) 2013 Matt DuVall Original: https://github.com/mduvall/grande.js/
// Copyright (c) 2014 @kosjoli    Fork: https://github.com/knutole/grande.js/

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// _______grande.js____________________________________________________________________________ 
// This is a small Javascript library that implements features from Medium's editing experience.
// Dependencies: grande.class.js

G.Rande = G.Class.extend({

	EDGE : -999,

	editNode : document.querySelectorAll(".g-body article")[0], // TODO: cross el support for imageUpload
	
	isFirefox : navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	
	options : {
		animate: true,
		imageUpload : true,
		events : {
			// fired on changes to text. should be overridden by user, like G.rande.events.change = fn();
			change : function (e) {}
		}

	},
	
	tagClassMap : {
		"b": "bold",
		"i": "italic",
		"h1": "header1",
		"h2": "header2",
		"a": "url",
		"blockquote": "quote"
	},
	
	events : {
		// fired on changes to text. should be overridden by user, like G.rande.events.change = fn();
		change : function (e) {}
	},

	initialize : function (options, nodes) {

		// cheatcode
		G.r = this;

		// set options
		G.setOptions(this, options);

		// create toolbar
		this.initToolbarLayout();
		
		// init plugins
		this.initPlugins();

		// bind nodes
		if (nodes) this.bind(nodes);
		
		return this;
	},

	bind : function(nodes) {

		// get nodes
		this.editableNodes = G.Util.castArray(nodes) || document.querySelectorAll(".g-body article");
		
		// add event listeners
		this.addHooks();	
	},

	unbind : function () {

		// remove event listeners
		this.removeHooks();

		// fire remove on plugins
		this.removePlugins();

	},

	destroy : function () {
		// console.log('destroy!');
		this.unbind();
		Wu.DomUtil.remove(this.buttonsContainer);
		Wu.DomUtil.remove(this.toolbarContainer);
		Wu.DomUtil.remove(this.imageTooltipTemplate);
		Wu.DomUtil.remove(this.toolbarWrapper);

		delete this;
		delete G.r;
	},

	addToolbarButton : function (button) {
		// append next to last in buttonsContainer
		this.buttonsContainer.insertBefore(button, this.buttonsContainer.lastChild);
	},

	initPlugins : function (fn, context) {
		
		// get plugins from options
		this.plugins = this.options.plugins;

		// plug in plugins
		for (p in this.plugins) {
			var plugin = this.plugins[p];
			plugin.plug(this);
		}

	},

	removePlugins : function () {
		// get plugins from options
		this.plugins = this.options.plugins;

		// plug in plugins
		for (p in this.plugins) {
			var plugin = this.plugins[p];
			plugin.unplug(this);
		}
	},
	
	select: function() {
		this.triggerTextSelection();
	},

	addToOptions : function (div) {
		this.optionsNode.appendChild(div);
	},

	addHooks : function () {
		this._setHooks(true);
	},

	removeHooks : function () {
		this._setHooks(false);
	},

	_setHooks : function (on) {
		on = (on) ? 'addEventListener' : 'removeEventListener';

		// bind interaction to document
		document[on]('mousedown', this.triggerTextSelection, false);
		document[on]('keydown', this.preprocessKeyDown, false);
		document[on]('keyup', this.handleKeyUp, false);

		// bind resize to window
		window[on]('resize', this.triggerTextSelection, false);

		// bind blur to urlInput
		this.urlInput[on]('blur', this.triggerUrlBlur, false);
		this.urlInput[on]('keydown', this.triggerUrlSet, false);

		// bind image upload
		if (this.options.allowImages) {
			this.imageTooltip[on]('mousedown', this.triggerImageUpload, false);
			this.imageInput[on]('change', this.uploadImage, false);
			document[on]('mousemove', this.triggerOverlayStyling, false);
		}

		// bind nodes
		for (var i = 0, len = this.editableNodes.length; i < len; i++) {
			var node = this.editableNodes[i];
			node.contentEditable = true;
			node[on]('mousedown', this.triggerTextSelection, false);
			node[on]('mouseup', this.triggerTextSelection, false);
			node[on]('keyup', this.triggerTextSelection, false);
		}

		// bind text styling events, ie. toolbar button clicks
		var that = this;
		this.iterateTextMenuButtons(function(node) {
			node[on]('mousedown', function(event) {
				that.triggerTextStyling(node);
			}, false);
		});
	},

	initToolbarLayout : function () {

		// create toolbar container
		this.toolbarContainer = document.createElement("div");
		this.toolbarContainer.className = "g-body";
		document.body.appendChild(this.toolbarContainer);

		// create image tooltip
		this.imageTooltipTemplate = document.createElement("div");
		this.imageTooltipTemplate.innerHTML = "<div class='pos-abs file-label'>Insert image</div> \																				<input class='file-hidden pos-abs' type='file' id='files' name='files[]' accept='image/*' multiple/>";
		this.imageTooltipTemplate.className = "image-tooltip hide";

		// create toolbar template
		this.toolbarTemplate = "<div class='options'> \
			<span class='no-overflow'> \
				<span class='ui-inputs'> \
					<button class='bold'>B</button> \
					<button class='italic'>i</button> \
					<button class='header1'>h1</button> \
					<button class='header2'>h2</button> \
					<button class='quote'>&rdquo;</button> \
					<button class='url useicons'>&#xe001;</button> \
					<input class='url-input' type='text' placeholder='Paste or type a link'/> \
				</span> \
			</span> \
		</div>";
		
		// create toolbar wrapper
		var div = this.toolbarWrapper = document.createElement("div");
		div.className = "text-menu hide";
		div.innerHTML = this.toolbarTemplate;

		// append to container
		if (document.querySelectorAll(".text-menu").length === 0) {
			this.toolbarContainer.appendChild(div);
			this.toolbarContainer.appendChild(this.imageTooltipTemplate);
		}

		// get elems
		this.imageInput 	= document.querySelectorAll(".file-label + input")[0];
		this.imageTooltip 	= document.querySelectorAll(".image-tooltip")[0];
		this.textMenu 		= document.querySelectorAll(".text-menu")[0];
		this.optionsNode 	= document.querySelectorAll(".text-menu .options")[0];
		this.urlInput 		= document.querySelectorAll(".text-menu .url-input")[0];
		this.uiInputs 		= document.querySelectorAll(".ui-inputs")[0];
		this.buttons 		= this.uiInputs.childNodes;
		this.buttonsContainer   = this.uiInputs;

	},

	handleKeyUp : function (event) {
		var that = G.r;
		var sel = window.getSelection();

		// FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
		if (sel.anchorNode && sel.anchorNode.nodeName !== "ARTICLE") {
			that.triggerNodeAnalysis(event);
			if (sel.isCollapsed) {
				that.triggerTextParse(event);
			}
		}
	},

	triggerOverlayStyling : function (event) {
		this.toggleImageTooltip(event, event.target);
	},

	triggerImageUpload : function (event) {
		// Cache the bound that was originally clicked on before the image upload
		var childrenNodes = editNode.children
		var editBounds = editNode.getBoundingClientRect();
		this.imageBound = this.getHorizontalBounds(childrenNodes, editBounds, event);
	},

	triggerNodeAnalysis : function (event) {
		var sel = window.getSelection(),
		    anchorNode,
		    parentParagraph;

		if (event.keyCode === 13) {

			// Enters should replace it's parent <div> with a <p>
			if (sel.anchorNode.nodeName === "DIV") {
				this.toggleFormatBlock("p");
			}

			parentParagraph = this.getParentWithTag(sel.anchorNode, "p");

			if (parentParagraph) {
				this.insertHorizontalRule(parentParagraph);
			}
		}
	},

	triggerTextParse : function (event) {
		var sel = window.getSelection(),
		    textProp,
		    subject,
		    insertedNode,
		    unwrap,
		    node,
		    parent,
		    range;

		// FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
		if (!sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeName === "ARTICLE") {
			return;
		}

		textProp = this.getTextProp(sel.anchorNode);
		subject = sel.anchorNode[textProp];

		if (subject.match(/^[-*]\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
			insertedNode = this.insertListOnSelection(sel, textProp, "ul");
		}

		if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
			insertedNode = this.insertListOnSelection(sel, textProp, "ol");
		}

		unwrap = insertedNode &&
			 ["ul", "ol"].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
			 ["p", "div"].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0;

		if (unwrap) {
			node = sel.anchorNode;
			parent = insertedNode.parentNode;
			parent.parentNode.insertBefore(insertedNode, parent);
			parent.parentNode.removeChild(parent);
			this.moveCursorToBeginningOfSelection(sel, node);
		}
	},

	triggerTextStyling : function (node) {

		var className = node.className,
		    sel = window.getSelection(),
		    selNode = sel.anchorNode,
		    tagClass,
		    reTag;

		for (var tag in this.tagClassMap) {
			tagClass = this.tagClassMap[tag];
			reTag = new RegExp(tagClass);

			if (reTag.test(className)) {
				// console.log('LETS DO THE ');
				this._fireOtherClick();	// works for native buttons
				switch(tag) {
				
					case "b": return document.execCommand(tagClass, false);
					case "i": return document.execCommand(tagClass, false);
					case "h1":
					case "h2":
					case "h3":
					case "blockquote": return this.toggleFormatBlock(tag);
					case "a":
						this.toggleUrlInput();
						this.optionsNode.className = "options url-mode";
						return;
				
				}
			}
		}
	},


	triggerUrlBlur : function (event) {

		// set global scope, as 'this' is event context here
		var that = G.r;

		// get url
		var url = that.urlInput.value;

		// clear url-mode
		that.optionsNode.className = "options";
	
		// return if no url
		if (url === "") return that.removeLink();

		// add http to links
		if (!url.match("^(http://|https://|mailto:)")) url = "http://" + url;
		
		// create link
		that.createLink(url)

		// clear input
		that.urlInput.value = "";
	},

	
	triggerUrlSet : function (event) {
		var that = G.r;
		if (event.keyCode === 13) {
			event.preventDefault();
			event.stopPropagation();
			that.urlInput.blur();
		}
	},


	// listen for text selection on every mousedown 
	triggerTextSelection : function (e, f) {
		var that = G.r;
		var selectedText = window.getSelection(),
		    target = e.target || e.srcElement;

		// if target is one of buttons, reload menu state
		var buttons = that.buttons;
		for (var n = 0; n < buttons.length; n++) {
			if (buttons[n] == target) return that.reloadMenuState();
		}
		
		// if target is buttons wrapper, reload menu state
		if (target == that.optionsNode) return that.reloadMenuState();
		
		// if target is anything not editable, hide buttons
		if (!target.isContentEditable) {

			that.hideToolbar();
			that.textMenu.className = "text-menu hide";
			that.reloadMenuState();
			
			// fire change event
			return that.options.events.change(false);
			
		}

		// if selected text is collapsed, hide buttons
		if (selectedText.isCollapsed) {

			that.hideToolbar();
			that.textMenu.className = "text-menu hide";	
			that.reloadMenuState();		
			return;
		}
		
		// get selected text and move menu
		that.showToolbar(selectedText);

		// refresh buttons
		that.reloadMenuState();

		// fire change event
		that.options.events.change(true);		
	},

	showToolbar : function (selectedText) {
		console.log('showtoolbar');

		var range = selectedText.getRangeAt(0);
		var clientRectBounds = range.getBoundingClientRect();
		this.setTextMenuPosition(
			clientRectBounds.top - 45 + window.pageYOffset,
			(clientRectBounds.left + clientRectBounds.right) / 2
		);

		// bool
		this.toolbarOpen = true;
	},

	hideToolbar : function () {

		// bool
		if (!this.toolbarOpen) return;
		this.toolbarOpen = false;

		// hide toolbar
		this.setTextMenuPosition(this.EDGE, this.EDGE);
		
		// fire hide event to plugins
		this._fireHiddenToolbar();
		
	},

	_fireHiddenToolbar : function () {

		// get plugins from options
		var plugins = this.plugins;

		// fire event on plugins
		for (p in plugins) {
			var plugin = plugins[p];
			plugin.onToolbarHide();
		}
	},

	_fireOtherClick : function (exception) {

		// get plugins from options
		var plugins = this.plugins;

		// fire event on plugins
		for (p in plugins) {
			var plugin = plugins[p];
			if (plugin != exception) plugin.onToolbarClick();
		}
	},

	createLink : function (url) {

		// clear existing
		this.removeLink();

		// create link
		document.execCommand("createLink", false, url);
	},

	removeLink : function () {

		// get previosly selected text
		var prev = this.previouslySelectedText;
		if (!prev) return;

		// get selection
		window.getSelection().addRange(prev);

		// clear prev link
		document.execCommand("unlink", false);
	},

	getHorizontalBounds : function (nodes, target, event) {
		var bounds = [],
		    bound,
		    i,
		    len,
		    preNode,
		    postNode,
		    bottomBound,
		    topBound,
		    coordY;

		// Compute top and bottom bounds for each child element
		for (i = 0, len = nodes.length - 1; i < len; i++) {
			preNode = nodes[i];
			postNode = nodes[i+1] || null;

			bottomBound = preNode.getBoundingClientRect().bottom - 5;
			topBound = postNode.getBoundingClientRect().top;

			bounds.push({
				top: topBound,
				bottom: bottomBound,
				topElement: preNode,
				bottomElement: postNode,
				index: i+1
			});
		}

		coordY = event.pageY - root.scrollY;

		// Find if there is a range to insert the image tooltip between two elements
		for (i = 0, len = bounds.length; i < len; i++) {
			bound = bounds[i];
			if (coordY < bound.top && coordY > bound.bottom) {
				return bound;
			}
		}

		return null;
	},

	getTextProp : function (el) {
		var textProp;

		if (el.nodeType === Node.TEXT_NODE) {
			textProp = "data";
		} else if (this.isFirefox) {
			textProp = "textContent";
		} else {
			textProp = "innerText";
		}

		return textProp;
	},

	getFocusNode : function () {
		return window.getSelection().focusNode;
	},

	getParent : function (node, condition, returnCallback) {
		if (node === null) {
			return;
		}

		while (node.parentNode) {
			if (condition(node)) {
				return returnCallback(node);
			}

			node = node.parentNode;
		}
	},

	getParentWithTag : function (node, nodeType) {
		var checkNodeType = function(node) { return node.nodeName.toLowerCase() === nodeType; }
		var returnNode = function(node) { return node; };
		return this.getParent(node, checkNodeType, returnNode);
	},

	getParentHref : function (node) {
		var checkHref = function(node) { return typeof node.href !== "undefined"; };
		var returnHref = function(node) { return node.href; };
		return this.getParent(node, checkHref, returnHref);
	},

	hasParentWithTag : function (node, nodeType) {
		return !!this.getParentWithTag(node, nodeType);
	},

	toggleFormatBlock : function (tag) {

		if (this.hasParentWithTag(this.getFocusNode(), tag)) {
			document.execCommand("formatBlock", false, "p");
			document.execCommand("outdent");
		} else {
			document.execCommand("formatBlock", false, tag);
		}
	},

	toggleUrlInput : function () {
		var that = this;
		setTimeout(function() {
			var url = that.getParentHref(that.getFocusNode());

			if (typeof url !== "undefined") {
				that.urlInput.value = url;
			} 

			that.previouslySelectedText = window.getSelection().getRangeAt(0);
			that.urlInput.focus();
		}, 150);
	},

	toggleImageTooltip : function (event, element) {
		var childrenNodes = editNode.children;
		var editBounds = editNode.getBoundingClientRect();
		var bound = getHorizontalBounds(childrenNodes, editBounds, event);

		if (bound) {
			this.imageTooltip.style.left = (editBounds.left - 90 ) + "px";
			this.imageTooltip.style.top = (bound.top - 17) + "px";
		} else {
			this.imageTooltip.style.left = EDGE + "px";
			this.imageTooltip.style.top = EDGE + "px";
		}
	},

	setTextMenuPosition : function (top, left) {

		// wu hack to prevent menu going outside viewport	
		if (left < 130) left = 130;

		// set position
		this.textMenu.style.top = top + "px";
		this.textMenu.style.left = left + "px";

		if (this.options.animate) {
			if (top === this.EDGE) {
				this.textMenu.className = "text-menu hide";
			} else {
				this.textMenu.className = "text-menu active";
			}
		}
	},


	insertHorizontalRule : function (parentParagraph) {
		var prevSibling,
		    prevPrevSibling,
		    hr;

		prevSibling = parentParagraph.previousSibling;
		prevPrevSibling = prevSibling;

		while (prevPrevSibling) {
			if (prevPrevSibling.nodeType != Node.TEXT_NODE) {
				break;
			}

			prevPrevSibling = prevPrevSibling.previousSibling;
		}

		if (!prevSibling || !prevPrevSibling) return;
		if (prevSibling.nodeName === "P" && !prevSibling.textContent.length && prevPrevSibling.nodeName !== "HR") {

			hr = document.createElement("hr");
			hr.contentEditable = false;
			parentParagraph.parentNode.replaceChild(hr, prevSibling);
		}
	},

	insertListOnSelection : function (sel, textProp, listType) {
		var execListCommand = listType === "ol" ? "insertOrderedList" : "insertUnorderedList",
		    nodeOffset = listType === "ol" ? 3 : 2;

		document.execCommand(this[execListCommand]);
		sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(nodeOffset);

		return this.getParentWithTag(sel.anchorNode, listType);
	},

	insertImage : function (url) {

		var image = document.createElement('img');
		image.src = url;
		image.style.width = '200px';
		image.style.height = 'auto';

		var range = window.getSelection().getRangeAt(0);
		range.collapse(true);
		range.insertNode(image);

	},

	reloadMenuState : function () {

		var className,
		    focusNode = this.getFocusNode(),
		    tagClass,
		    reTag,
		    that = this;


		this.iterateTextMenuButtons(function(node) {
			className = node.className;

			for (var tag in that.tagClassMap) {
				tagClass = that.tagClassMap[tag];
				reTag = new RegExp(tagClass);

				if (reTag.test(className)) {
					// console.log('DREAMING!!'); // fire 30 times on click
					// console.log('if has parent etc: focusNode, tag', focusNode, tag);
					if (that.hasParentWithTag(focusNode, tag)) {
						node.className = tagClass + " active";
					} else {
						node.className = tagClass;
					}

					break;
				}
			}
		});

	},

	preprocessKeyDown : function (event) {

		var that = G.r;
		var sel = window.getSelection(),
		    parentParagraph = that.getParentWithTag(sel.anchorNode, "p"),
		    p,
		    isHr;

		if (event.keyCode === 13 && parentParagraph) {
			prevSibling = parentParagraph.previousSibling;
			isHr = prevSibling && prevSibling.nodeName === "HR" &&
				!parentParagraph.textContent.length;

			// Stop enters from creating another <p> after a <hr> on enter
			if (isHr) event.preventDefault();
		}
	},

	iterateTextMenuButtons : function (callback) {
		var textMenuButtons = document.querySelectorAll(".text-menu button"),
		    i,
		    len,
		    node,
		    that = this,
		    fnCallback = function(n) {
		    	// that._clicked();	// fired 40 times on one click
		    	callback(n);
		    };
    
		for (i = 0, len = textMenuButtons.length; i < len; i++) {
			node = textMenuButtons[i];
			fnCallback(node);
		}
	},

	moveCursorToBeginningOfSelection : function (selection, node) {
		range = document.createRange();
		range.setStart(node, 0);
		range.setEnd(node, 0);
		selection.removeAllRanges();
		selection.addRange(range);
	},

	uploadImage : function (event) {
		// Only allow uploading of 1 image for now, this is the first file
		var file = this.files[0],
				reader = new FileReader(),
				figEl;

		reader.onload = (function(f) {
			return function(e) {
				figEl = document.createElement("figure");
				figEl.innerHTML = "<img src=\"" + e.target.result + "\"/>";
				editNode.insertBefore(figEl, imageBound.bottomElement);
			};
		}(file));

		reader.readAsDataURL(file);
	},

}); 

// grande shorthand
G.rande = function (nodes, options) {
	return new G.Rande(options, nodes);
};