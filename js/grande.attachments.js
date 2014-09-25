// depends on grande.js (and grande.class.js)
G.Attachments = G.Class.extend({

	name : 'Attachments',

	initialize : function (source) {
		this.source = source;
		console.log('intilaisie: ', this.source, this);
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
	plugin : function (grande) {
		// attach grande
		this.grande = grande;
		this._initialize();
	},

	initLayout : function () {

		// create button and append to ui container
		this.button = this.createButton();
		
		// add to toolbar buttons container		
		this.grande.addToolbarButton(this.button);

	},

	createButton : function () {
		var button = document.createElement('button');
		button.className = 'attachment';
		button.innerHTML = 'F';
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
		var button = e.target;
		Wu.DomEvent.stop(e);

		if (button.active) {
			that.closePopup();
			button.active = false;
			button.className = 'attachment';
		} else {
			that.openPopup();
			button.active = true;
			button.className = 'attachment active';
		}
	},

	closePopup : function () {
	
		// remove popup
		this.destroyPopup();

	},

	openPopup : function () {

		// // select text
		// var selectedText = window.getSelection();
		// var range = selectedText.getRangeAt(0);
		// var clientRectBounds = range.getBoundingClientRect();
		
		// create popup
		this.createPopup();

	},

	createPopup : function () {

		// get project
		this.project = app.activeProject;

		// get sources
		var sources = this.source;

		// create source div
		var container = this._popup = Wu.DomUtil.create('div', 'grande-sources-container');
		var topwrapper = Wu.DomUtil.create('div', 'grande-sources-topwrap', container);
		sources.forEach(function (source) {
			this._createSource(source, container);
		}, this);

		// add to options container
		this.grande.addToOptions(container);

	},


	_createSource : function (source, container) {

		var title = source.name;
		var wrap = Wu.DomUtil.create('div', 'grande-sources-source', container);
		var icon = Wu.DomUtil.create('div', 'grande-sources-source-icon', wrap);
		var name = Wu.DomUtil.create('div', 'grande-sources-source-title', wrap, title);

		// add icon to source
		Wu.DomUtil.addClass(icon, source.type);
		
		if (source.thumbnail) {

			// add thumbnail if available
			var thumb = Wu.DomUtil.create('img', 'grande-sources-source-thumb', wrap);
			thumb.src = source.thumbnail;


		// if (source.type == 'image') {
		// 	var size = '?width=50&height=50';
		// 	var url = '/pixels/' + source.uuid + size;
		// 	console.log('url: ', url);
		// 	var thumb = Wu.DomUtil.create('img', 'grande-sources-source-thumb', wrap);
		// 	thumb.src = url;
		// 	console.log('thumb: ', thumb);
		

		} 

		Wu.DomEvent.on(wrap, 'mousedown', function () {
			this.selectSource(source);
		}, this);
	},

	destroyPopup : function () {
		this._remove(this._popup);
		this._popup = null;		// events should now be gc'd. todo: check
	},

	selectSource : function (source) {
		console.log('selected source!', source);

		// add link to text selection
		var url = source.uuid;

		// create link
		this.grande.createLink(url);
		
	},

	_remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
		    parent.removeChild(el);
		}
	},

	// fired on G.Rande.unbind();
	destroy : function () {
		this.removeHooks();
	},

});
