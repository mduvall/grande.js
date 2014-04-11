[![Build Status](https://travis-ci.org/mduvall/grande.js.png)](https://travis-ci.org/mduvall/grande.js)

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
3. Initialize a new editor on the `article` tags with `new Grande(document.querySelectorAll("article"))`
4. You are set!

### Included files

There are two CSS files that come with the included demo:

- `editor.css`: this file provides the style for the `contenteditable` elements on the page
- `menu.css`: this file provides the toolbar styling to appear as it does below

## Options

The Grande function currently accepts two parameters: bindableNodes and an options list.

The calling code can pass in a `NodeList` as the first parameter that will bind to these elements and enable `contentEditable` on them, if nothing is passed in it defaults to elements that match the selector `.g-body article`.

The second parameter is an `options` object that accepts the following keys:

- `mode`: defaults to rich which enable users to format the text and enter multi-line function. If set to inline, it'll only accepts single line input and no formatting. If set to `pratial` it'll allow multi-line editing without rich editing.

- `placeholder`: if set, this will be the placeholder value of the element(s), when the user focus on the element the placeholder will be deleted and put back when blurred while the field is empty.

- `animate`: if true, this will trigger the CSS animations (defaults to true). Useful to turn to false if `subpixel-antialised` is needed in Safari.

- `imagesFromUrls`: if set to true, it'll replace images URLs with <img>s tags in "rich" mode.

![image](http://f.cl.ly/items/0O1M1R1g2w1P213C0S3Z/Screen%20Shot%202013-08-21%20at%2011.53.55%20PM.png)

The following tag stylings are available: `<b>`, `<i>`, `<h1>`, `<h2>`, `<blockquote>`, `<a>`, `<ol>`, `<ul>`, `<hr>`

Notes
---------
This is a clone of Grande, but we choose to take a different approach of usage that is similar to Medium.js. Some of the grande methods were binded on document which didn't allow much configuration to be set for different elements on the same page. We plan to keep this in sync with the original mduvall/grande.js. Feel free to use this in any of your projects.

Roadmap
-------
- Images (figure)
- Shortcuts for formatting (Cmd+b, Cmd+i...)
- More Code Cleanup.
- Better unit testing.
