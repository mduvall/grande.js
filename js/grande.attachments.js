// The MIT License (MIT)

// Copyright (c) 2014 @kosjoli https://github.com/knutole/grande.js/

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


// _______grande.js attachments plugin_________________________________________________________ 
// Adds possibility to create link from list of files, or to embed images into text.
// Dependencies: grande.js, grande.class.js

G.Attachments = G.Class.extend({

	name : 'Attachments',

	initialize : function (source, options) {

		// console.log('init grande attachments, ', options);

		// set options
		G.setOptions(this, options);
		this.options.className = this.options.className + ' grande-plugin';

		// set source
		this.source = source;
		
	},

	_initialize : function () {

		// create layout
		this.initLayout();

		// add hooks
		this.addHooks();

		// mark initialized
		this.initialized = true;

	},

	// hack cause i dont get it
	plug : function (grande) {
		// console.log('plug!');
		// attach grande
		this.grande = grande;
		this._initialize();
	},

	unplug : function (grande) {
		// console.log('unplug!', this);
		this.removeHooks();
	},

	initLayout : function () {

		// create button and append to ui container
		this.button = this.createButton();
		
		// add to toolbar buttons container		
		this.grande.addToolbarButton(this.button);

	},

	createButton : function () {
		var button = document.createElement('button');
		button.className = this.options.className;

		var white = "url('" + this.options.icon[0] + "')";
		var green = "url('" + this.options.icon[1] + "')";

		// set icon
		if (this.options.icon) {
			button.style.backgroundImage = white;
		} else {
			button.innerHTML = this.options.placeholder;
		}

		return button;
	},

	addHooks : function () {
		var that = this;
		this.button.addEventListener('mousedown', function (e) {
			that.toggleButton(e, that);
		}, false);
	},

	removeHooks : function () {
		var that = this;
		this.button.removeEventListener('mousedown', function (e) {
			that.toggleButton(e, that);
		}, false);
	},

	toggleButton : function (e, that) {
		// var button = e.target;
		var button = that.button;

		G.DomEvent.stop(e);

		// toggle
		button.active ? that.closePopup() : that.openPopup();

		this.grande._fireOtherClick(that);
		
	},

	closePopup : function () {
	
		// remove popup
		this.destroyPopup();
		this.button.active = false;
		this.button.className = this.options.className;
		var white = "url('" + this.options.icon[0] + "')";
		this.button.style.backgroundImage = white;

	},

	openPopup : function () {

		// create popup
		this.createPopup();
		this.button.active = true;
		this.button.className = this.options.className + ' active';
		var green = "url('" + this.options.icon[1] + "')";
		this.button.style.backgroundImage = green;

	},

	createPopup : function () {

		// get project
		this.project = app.activeProject;

		// get sources
		var sources = this.source;

		// console.log('CREATE: ', this.source);

		// create source div
		var container = this._popup = G.DomUtil.create('div', 'grande-sources-container');
		var topwrapper = G.DomUtil.create('div', 'grande-sources-topwrap', container);
		sources.forEach(function (source) {
			this._createSource(source, container);
		}, this);

		// add to options container
		this.grande.addToOptions(container);

	},


	_createSource : function (source, container) {

		// create divs
		var title = source.title;
		var wrap = G.DomUtil.create('div', 'grande-sources-source', container);
		var icon = G.DomUtil.create('div', 'grande-sources-source-icon', wrap);
		var name = G.DomUtil.create('div', 'grande-sources-source-title', wrap, title);

		// set icon
		G.DomUtil.addClass(icon, source.type);
		
		// add thumbnail if available
		if (source.thumbnail) {
			var thumb = G.DomUtil.create('img', 'grande-sources-source-thumb', wrap);
			thumb.src = source.thumbnail;
		} 

		// add select event
		G.DomEvent.on(wrap, 'mousedown', function () {
			if (this.options.embedImage) {
				
				this.embedImage(source.url);
			} else {
				this.selectSource(source);
			}
			
		}, this);
	},

	destroyPopup : function () {
		if (!this._popup) return;
		this._remove(this._popup);
		this._popup = null;		// events should now be gc'd. todo: check
	},

	embedImage : function (image) {
		this.grande.insertImage(image);
	},

	selectSource : function (source) {

		// add link to text selection
		var url = source.url;

		// create link
		this.grande.createLink(url);
		
	},

	_remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
		    parent.removeChild(el);
		}
	},


	// fired on grande.unbind();
	destroy : function () {
		this.removeHooks();
	},

	// fired on grande.hideToolbar();
	onToolbarHide : function () {
		this.closePopup();
	},

	onToolbarClick : function () {
		// console.log('ONTOOLBAR!');
		this.closePopup();
	},

});
