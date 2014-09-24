// depends on grande.class.js
G.Rande = G.Class.extend({

	EDGE : -999,

	editNode : document.querySelectorAll(".g-body article")[0], // TODO: cross el support for imageUpload
	
	isFirefox : navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	
	options : {
		animate: true,
		imageUpload : true
	},

	plugins : {}, // space for plugins
	
	tagClassMap : {
		"b": "bold",
		"i": "italic",
		"h1": "header1",
		"h2": "header2",
		"a": "url",
		"blockquote": "quote"
	},
	
	events : {
		// fired on changes to text. should be overridden by user, like Grande.events.change = fn();
		change : function (e) { console.log('change event!', e); }
	},

	initialize : function (options, nodes) {

		// cheating
		G.r = this;

		// set options
		G.setOptions(this, options);

		// bind nodes
		if (nodes) this.bind(nodes);
		
		return this;
	},

	bind : function(nodes) {

		console.log('grande.js: bind()');


		// get nodes
		this.editableNodes = G.Util.castArray(nodes) || document.querySelectorAll(".g-body article");

		// create toolbar
		this.initToolbarLayout();
		
		// add event listeners
		this.addHooks();

		// initialize registered plugins
		this.addPlugins();
		
	},

	unbind : function () {
		if (!this.bound) return;
		this.bound = false;

		console.log('grande.js: unbind()');

		// remove event listeners
		this.removeHooks();

		// fire remove on plugins
		this.removePlugins();
	},

	registerPlugin : function (plugin) {
		if (!this.plugins[plugin.name]) {
			var plug = this.plugins[plugin.name] = plugin;
		} else {
			// name not tasty, add salt
			var salt = Math.random().toString().slice(15);
			var plug = this.plugins[plugin.name + salt] = plugin;
		}
		return this;
	},

	addPlugins : function () {
		var plugins = this.plugins;
		for (p in plugins) {
			var plugin = plugins[p];
			if (!plugin.initialized) plugin.initialize();
		}
	},

	removePlugins : function () {
		var plugins = this.plugins;
		for (p in plugins) {
			var plugin = plugins[p];
			plugin.destroy();
		}
	},

	addToolbarButton : function (button) {

		// append button to toolbar
		this.uiInputs.insertBefore(button, this.urlInput);

		// register trigger


		console.log('added: ', this.buttons);

	},

	select: function() {
		this.triggerTextSelection();
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
		var div = document.createElement("div");
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

	addHooks : function () {
		this._setHooks('addEventListener');
	},

	removeHooks : function () {
		this._setHooks('removeEventListener');
	},

	_setHooks : function (onoff) {
		console.log('onoff: ', onoff);

		// bind interaction to document
		document[onoff]('mousedown', this.triggerTextSelection, false);
		document[onoff]('keydown', this.preprocessKeyDown, false);
		document[onoff]('keyup', this.handleKeyUp, false);

		// bind resize to window
		window[onoff]('resize', this.triggerTextSelection, false);

		// bind blur to urlInput
		this.urlInput[onoff]('blur', this.triggerUrlBlur, false);
		this.urlInput[onoff]('keydown', this.triggerUrlSet, false);

		// bind image upload
		if (this.options.allowImages) {
			this.imageTooltip[onoff]('mousedown', this.triggerImageUpload, false);
			this.imageInput[onoff]('change', this.uploadImage, false);
			document[onoff]('mousemove', this.triggerOverlayStyling, false);
		}

		// bind nodes
		for (var i = 0, len = this.editableNodes.length; i < len; i++) {
			var node = this.editableNodes[i];
			node.contentEditable = true;
			node[onoff]('mousedown', this.triggerTextSelection, false);
			node[onoff]('mouseup', this.triggerTextSelection, false);
			node[onoff]('keyup', this.triggerTextSelection, false);
		}

		// bind text styling events
		var that = this;
		this.iterateTextMenuButtons(function(node) {
			node[onoff]('mousedown', function(event) {
				console.log('NONO:', node);
				console.log('node:', node.target);
				that.triggerTextStyling(node);
			}, false);
		});
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
			insertedNode = insertListOnSelection(sel, textProp, "ul");
		}

		if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
			insertedNode = insertListOnSelection(sel, textProp, "ol");
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

		// this.triggerTextSelection();
	},

	triggerUrlBlur : function (event) {

		// set global scope, as 'this' is event context here
		var that = G.r;

		// get url
		var url = that.urlInput.value;

		// clear url-mode
		that.optionsNode.className = "options";
		
		// get text
		window.getSelection().addRange(that.previouslySelectedText);

		// clear prev link
		document.execCommand("unlink", false);

		// return if no url
		if (url === "") return false;
		
		// add http to url
		if (!url.match("^(http://|https://|mailto:)")) url = "http://" + url;

		// create link
		document.execCommand("createLink", false, url);

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

	triggerTextSelection : function (e, f) {

		console.log('grande.js: triggerTextSelection', e, f);

		var that = G.r;
		var selectedText = window.getSelection(),
		    range,
		    clientRectBounds,
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
			that.setTextMenuPosition(this.EDGE, this.EDGE);
			that.textMenu.className = "text-menu hide";
			that.reloadMenuState();
			
			// fire change event
			return that.events.change();
		}


		// if selected text is collapsed, hide buttons
		if (selectedText.isCollapsed) {
			that.setTextMenuPosition(this.EDGE, this.EDGE);
			that.textMenu.className = "text-menu hide";	
			that.reloadMenuState();		
			return;
		}

		
		// get selected text and move menu
		range = selectedText.getRangeAt(0);
		clientRectBounds = range.getBoundingClientRect();
		that.reloadMenuState();
		that.setTextMenuPosition(
			clientRectBounds.top - 5 + window.pageYOffset,
			(clientRectBounds.left + clientRectBounds.right) / 2
		);

		// fire change event
		return that.events.change();
		
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
			} else {
				document.execCommand("createLink", false, "/");
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
			if (isHr) {
				event.preventDefault();
			}
		}
	},

	iterateTextMenuButtons : function (callback) {
		var textMenuButtons = document.querySelectorAll(".text-menu button"),
		    i,
		    len,
		    node,
		    fnCallback = function(n) {
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

// shorthand for creating grande things
G.rande = function (nodes, options) {
	return new G.Rande(options, nodes);
};
