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

1. Include the `div.text-menu` template and an `<article>` with `contenteditable`
2. Include the `grande.js` file at the bottom of your `<body>`
3. Bind the events on the `document` with `grande.init()`
4. You are set!

There are two CSS files that come with the included demo:

- `editor.css`: this file provides the style for the `contenteditable` elements on the page
- `menu.css`: this file provides the toolbar styling to appear as it does below

![image](http://f.cl.ly/items/0O1M1R1g2w1P213C0S3Z/Screen%20Shot%202013-08-21%20at%2011.53.55%20PM.png)

The following tag stylings are available: `<b>`, `<i>`, `<h1>`, `<h2>`, `<blockquote>`, `<a>`, `<ol>`, `<ul>`

Questions
---------
### This is very similar to Zenpen, why?
First off, major props to @tholman for the inspirational script. grande.js is a spiritual cousin of the fantastic plugin and aims to have feature parity with Medium. It adds multiple styles and will be diverging from the vision of being an in-browser editing experience to being a *provider* of the in-browser editing experience. grande.js will be providing the foundation for your website to have a wonderful editing experience.

Roadmap
-------

- Lists (ul and ol)
- Images (figure)
- execCommand to support `<strong>` and `<em>`
