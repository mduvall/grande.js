var GrandeAttachments = {

	name : 'GrandeAttachments',

	initialize : function () {
		console.log('initialize GrandeAttachments');
		console.log('this: ', this);

		// set project
		this.project = app.activeProject;

		// create layout
		this.initLayout();

		// add hooks
		this.addHooks();
	},

	initLayout : function () {

		// get grande containers
		var toolbar = this._toolbarContainer = Grande.toolbarContainer;
		var ui = this._ui = toolbar.querySelectorAll('span.ui-inputs')[0];

		// create button and append to ui container
		var button = this._button = document.createElement('button');
		button.className = 'attachment';
		button.innerHTML = 'F';
		ui.appendChild(button);

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
		console.log('openFilepane');
		console.log('this: ', this);

		var files = this.project.getFiles();
		console.log('files: ', files);
		console.log(app.activeProject.getFiles());
	},

	closeFilepane : function () {
		console.log('closeFilepane');
	},


	// fired on Grande.unbind()
	destroy : function () {
		console.log('destroy');
		this.removeHooks();
	},

}

// register plugin
Grande.registerPlugin(GrandeAttachments);
