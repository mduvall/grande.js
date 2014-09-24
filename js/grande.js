window.Grande = {

	EDGE : -999,

	editNode : document.querySelectorAll(".g-body article")[0], // TODO: cross el support for imageUpload
	
	isFirefox : navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	
	options : {
		animate: true
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
		// fired on changes to text. should be overridden by user, like Grande.events.change = fn();
		change : function (e) { console.log('change event!', e); }
	},

	bind : function(bindableNodes, opts) {

		// get nodes
		this.editableNodes = bindableNodes || document.querySelectorAll(".g-body article");

		// set options
		this.options = opts || this.options;

		// create toolbar
		this.initToolbarLayout();
		
		// add event listeners
		this.addHooks();
		
	},

	unbind : function () {
		// remove event listeners
		this.removeHooks();
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
		this.buttons 		= document.querySelectorAll(".ui-inputs")[0].childNodes;
	},

	handleKeyUp : function (event) {
		var that = Grande;
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

		// bind interaction to document
		document.addEventListener('mousedown', this.triggerTextSelection, false);
		document.addEventListener('keydown', this.preprocessKeyDown, false);
		document.addEventListener('keyup', this.handleKeyUp, false);

		// bind resize to window
		window.addEventListener('resize', this.triggerTextSelection, false);

		// bind blur to urlInput
		this.urlInput.addEventListener('blur', this.triggerUrlBlur, false);
		this.urlInput.addEventListener('keydown', this.triggerUrlSet, false);

		// bind image upload
		if (this.options.allowImages) {
			this.imageTooltip.addEventListener('mousedown', this.triggerImageUpload, false);
			this.imageInput.addEventListener('change', this.uploadImage, false);
			document.addEventListener('mousemove', this.triggerOverlayStyling, false);
		}

		// bind nodes
		for (var i = 0, len = this.editableNodes.length; i < len; i++) {
			var node = this.editableNodes[i];
			node.contentEditable = true;
			node.addEventListener('mousedown', this.triggerTextSelection, false);
			node.addEventListener('mouseup', this.triggerTextSelection, false);
			node.addEventListener('keyup', this.triggerTextSelection, false);
		}

		// bind text styling events
		var that = this;
		this.iterateTextMenuButtons(function(node) {
			node.addEventListener('mousedown', function(event) {
				that.triggerTextStyling(node);
			}, false);
		});
	},

	removeHooks : function () {

		// unbind interaction to document
		document.removeEventListener('mousedown', this.triggerTextSelection, false);
		document.removeEventListener('keydown', this.preprocessKeyDown, false);
		document.removeEventListener('keyup', this.handleKeyUp, false);

		// unbind resize to window
		window.removeEventListener('resize', this.triggerTextSelection, false);

		// unbind blur to urlInput
		this.urlInput.removeEventListener('blur', this.triggerUrlBlur, false);
		this.urlInput.removeEventListener('keydown', this.triggerUrlSet, false);

		// unbind image upload
		if (this.options.allowImages) {
			this.imageTooltip.removeEventListener('mousedown', this.triggerImageUpload, false);
			this.imageInput.removeEventListener('change', this.uploadImage, false);
			document.removeEventListener('mousemove', this.triggerOverlayStyling, false);
		}

		// unbind nodes
		for (var i = 0, len = this.editableNodes.length; i < len; i++) {
			var node = this.editableNodes[i];
			node.contentEditable = true;
			node.removeEventListener('mousedown', this.triggerTextSelection, false);
			node.removeEventListener('mouseup', this.triggerTextSelection, false);
			node.removeEventListener('keyup', this.triggerTextSelection, false);
		}

		// unbind text styling events
		var that = this;
		this.iterateTextMenuButtons(function(node) {
			node.removeEventListener('mousedown', function(event) {
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

		this.triggerTextSelection();
	},

	triggerUrlBlur : function (event) {

		// set global scope, as 'this' is event context here
		var that = Grande;

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
		var that = Grande;
		if (event.keyCode === 13) {
			event.preventDefault();
			event.stopPropagation();

			that.urlInput.blur();
		}
	},

	triggerTextSelection : function (e) {

		var that = Grande;
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
				console.log('HIIIDEE!!');
				this.textMenu.className = "text-menu hide";
			} else {
				console.log('SHOW!!');
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

		var that = Grande;
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

}; 
