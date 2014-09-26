// depends on grande.js (and grande.class.js)
G.Attachments = G.Class.extend({

	name : 'Attachments',

	initialize : function (source, options) {

		// set options
		G.setOptions(this, options);

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

		// create divs
		var title = source.title;
		var wrap = Wu.DomUtil.create('div', 'grande-sources-source', container);
		var icon = Wu.DomUtil.create('div', 'grande-sources-source-icon', wrap);
		var name = Wu.DomUtil.create('div', 'grande-sources-source-title', wrap, title);

		// set icon
		Wu.DomUtil.addClass(icon, source.type);
		
		// add thumbnail if available
		if (source.thumbnail) {
			var thumb = Wu.DomUtil.create('img', 'grande-sources-source-thumb', wrap);
			thumb.src = source.thumbnail;
		} 

		// add select event
		Wu.DomEvent.on(wrap, 'mousedown', function () {
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

});
