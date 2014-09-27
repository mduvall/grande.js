<h2>New features:</h2>
+ Added addEventListeners for all events.<br>
+ Added removeEventListeners for all events.<br>
+ Added unbind() method to clear listeners.<br>
+ Refactored with OOP capabilites into global G namespace.<br>
+ Added event that fires on changes, which can be listened to by others.<br>
+ Renamed some functions and organized in groups.<br>
+ Documented some lines.<br>
+ Fixed some bugs regarding Toolbar not closing properly.<br>
+ Added plugin powers!<br>
<br>
<i>5.5KB minified and gzipped.</i><br>


<h2>Usage:</h2>

```html
Add grande.js to HTML
<script src="grande.min.js"></script>

Add grande.attachments.js plugin:
<script src="grande.attachments.min.js"></script>
```
<h4>Create instance of grande.js with File and Image attachment plugin:</h4>
```javascript
		// get textarea nodes for grande
		var nodes = [node, node];	// [] of nodes

		// create sources for attachments-plugin in this format:
		var sources = [{
			
				title     : name, 	// title
				url       : url		// url to be inserted as link
				thumbnail : thumbnail,	// optional. url to thumbnail
				uuid      : uuid,	// optional. for id'ing
				type      : type,	// optional, image/file. default 'file'. 
			}]

		// set grande options
		var options = {
			plugins : {

		        	// file attachments
			        attachments : new G.Attachments(sources, {	// depends on grande.attachments.js plugin
			       		icon : 'fileAttachment.png',
			        }),

			        // image attachments
			        images :  new G.Attachments(sources, {
			        	icon : 'imageAttachment.png',
			        	embedImage : true 			// embed image in text
			        }),

			},
			events : {

				// add change event listener to be fired on each text change (useful for saving, etc.)
				change : this.textChange
			}
		}

		// create Grande with attachment and image plugin
		this.grande = G.rande(nodes, options);

		// add change event listener dynamically, will overwrite event provided in options.
		this.grande.options.events.change = this.anotherTextChange;
		

```













grande.js
=========

This is a small Javascript library that implements features from Medium's editing experience. Take a look [here](http://mattduvall.com/grande.js/).

![image](http://f.cl.ly/items/0G280f2t1s123H3k3O2z/Screen%20Shot%202013-08-31%20at%203.08.44%20PM.png)

How to get started
------------------

### Installation
Bower is the preferred way to install `grande.js`, it is available as `grande` in the Bower package repository.

Simply `bower install grande`

### Usage

See the `index.html` in this repository for a functional example using the library.

To get up and running simply...

1. Include an `<article>` with `contenteditable`
2. Include the `grande.min.js` file (in `dist/` directory) at the bottom of your `<body>`
3. Bind the events on the `article` tags with `grande.bind(document.querySelectorAll("article"))`
4. You are set!

### Included files

There are two CSS files that come with the included demo:

- `editor.css`: this file provides the style for the `contenteditable` elements on the page
- `menu.css`: this file provides the toolbar styling to appear as it does below

## Options to grande.bind

The `bind` function currently accepts two parameters: bindableNodes and an options list.

The calling code can pass in a `NodeList` as the first parameter that will bind to these elements and enable `contentEditable` on them, if nothing is passed in it defaults to elements that match the selector `.g-body article`.

The second parameter is an `options` object that accepts the following keys:

- `animate`: if true, this will trigger the CSS animations (defaults to true). Useful to turn to false if `subpixel-antialised` is needed in Safari.

![image](http://f.cl.ly/items/0O1M1R1g2w1P213C0S3Z/Screen%20Shot%202013-08-21%20at%2011.53.55%20PM.png)

The following tag stylings are available: `<b>`, `<i>`, `<h1>`, `<h2>`, `<blockquote>`, `<a>`, `<ol>`, `<ul>`, `<hr>`

Questions
---------
### This is very similar to Zenpen, why?
First off, major props to @tholman for the inspirational script. grande.js is a spiritual cousin of the fantastic plugin and aims to have feature parity with Medium. It adds multiple styles and will be diverging from the vision of being an in-browser editing experience to being a *provider* of the in-browser editing experience. grande.js will be providing the foundation for your website to have a wonderful editing experience.

Roadmap
-------
- Images (figure)
- execCommand to support `<strong>` and `<em>`
- CSS animations to match the `pop-upwards` on Medium
