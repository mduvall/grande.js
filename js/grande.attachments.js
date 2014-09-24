// depends on grande.js (and grande.class.js)
G.Plugins.Attachments = G.Rande.extend({

	name : 'Attachments',

	initialize : function () {
		console.log('initialize GrandeAttachments');
		console.log('this: ', this);

		// create layout
		this.initLayout();

		// add hooks
		this.addHooks();

		// mark initialized
		this.initialized = true;
	},

	initLayout : function () {

		// get grande containers
		var toolbar = this._toolbarContainer = Grande.toolbarContainer;
		// var ui = this._ui = toolbar.querySelectorAll('span.ui-inputs')[0];

		// create button and append to ui container
		var button = this._button = document.createElement('button');
		button.className = 'attachment';
		button.innerHTML = 'F';
		// ui.appendChild(button);

		// attach to Grande
		Grande.addToolbarButton(button);

		// create filepane
		this.filePane = {};
		var container = this.filePane.container = document.createElement('div');
		var inner = this.filePane.inner = document.createElement('div');

	},

	addHooks : function () {
		var that = this;
		this._button.addEventListener('mousedown', function (e) {
			that.toggleButton(e, that);
		}, false);
	},

	removeHooks : function () {
		var that = this;
		this._button.removeEventListener('mousedown', function (e) {
			that.toggleButton(e, that);
		}, false);
	},

	toggleButton : function (e, that) {
		var button = e.target;
		Wu.DomEvent.stop(e);

		if (button.active) {
			that.closeFilepane();
			button.active = false;
			button.className = 'attachment';
		} else {
			that.openFilepane();
			button.active = true;
			button.className = 'attachment active';
		}
	},

	openFilepane : function () {

		// get project
		var project = app.activeProject;

		console.log('openFilepane');
		console.log('this: ', this);

		// select text
		this.selectText();
		var selectedText = window.getSelection();
		var range = selectedText.getRangeAt(0);
		var clientRectBounds = range.getBoundingClientRect();
		console.log('free! ', selectedText, range, clientRectBounds);

		// this.Grande.setTextMenuPosition(
		// 	clientRectBounds.top - 5 + window.pageYOffset,
		// 	(clientRectBounds.left + clientRectBounds.right) / 2
		// );

		
		// create popup
		this.createPopup(files);


	},

	createPopup : function (files) {

		// get files
		var files = project.getFiles();
		console.log('files: ', files);


		var container = Wu.DomUtil.create('div', 'grande-files-container');
		var topwrapper = Wu.DomUtil.create('div', 'grande-files-topwrap');





	},

	closeFilepane : function () {
		console.log('closeFilepane');
	},


	// fired on Grande.unbind()
	destroy : function () {
		console.log('destroy');
		this.removeHooks();
	},

	// register plugin
	register : function () {
		this.Grande = Grande.registerPlugin(this);
		console.log('regitered: ', this.Grande);
	}

});

// register plugin
// GrandeAttachments.register(GrandeAttachments);
