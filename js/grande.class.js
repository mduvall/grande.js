// The MIT License (MIT)

// Copyright (c) 2014 Vladimir Agafonkin. Original: https://github.com/Leaflet/Leaflet/tree/master/src/core
// Copyright (c) 2014 @kosjoli            Fork: https://github.com/knutole/grande.js/

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
 

// _______grande.js____________________________________________________________________________ 
// G.Class powers the OOP facilities of the library. 
// Taken from Class.js in Leaflet.js by Vladimir Agafonkin, @LeafletJS

G = {};
G.Class = function () {};
G.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks.length) {
			this.callInitHooks();
		}
	};

	// jshint camelcase: false
	var parentProto = NewClass.__super__ = this.prototype;

	var proto = G.Util.create(parentProto);
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		G.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		G.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (proto.options) {
		props.options = G.Util.extend(G.Util.create(proto.options), props.options);
	}

	// mix given properties into the prototype
	G.extend(proto, props);

	proto._initHooks = [];

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};

G.Util = {
	// extend an object with properties of one or more other objects
	extend: function (dest) {
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},

	// create an object from a given prototype
	create: Object.create || (function () {
		function F() {}
		return function (proto) {
			F.prototype = proto;
			return new F();
		};
	})(),

	// bind a function to be called with a given context
	bind: function (fn, obj) {
		var slice = Array.prototype.slice;

		if (fn.bind) {
			return fn.bind.apply(fn, slice.call(arguments, 1));
		}

		var args = slice.call(arguments, 2);

		return function () {
			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
		};
	},

	// set options to an object, inheriting parent's options as well
	setOptions: function (obj, options) {
		if (!obj.hasOwnProperty('options')) {
			obj.options = obj.options ? G.Util.create(obj.options) : {};
		}
		for (var i in options) {
			obj.options[i] = options[i];
		}
		return obj.options;
	},

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	castArray : function (array) {
		if (this.isArray(array)) return array;
		return [array];
	},

	// return unique ID of an object
	stamp: function (obj) {
		// jshint camelcase: false
		obj._leaflet_id = obj._leaflet_id || ++Wu.Util.lastId;
		return obj._leaflet_id;
	},

	// round a given number to a given precision
	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	// trim whitespace from both sides of a string
	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	trimAll : function (str) {
		return str.replace(/\s+/g, '');
	},

	// split a string into words
	splitWords: function (str) {
		return Wu.Util.trim(str).split(/\s+/);
	},


	
}
G.extend = G.Util.extend;
G.setOptions = G.Util.setOptions;
G.stamp = G.Util.stamp;
/*
 * G.Evented is a base class that Grande classes inherit from to handle custom events.
 */
G.Evented = G.Class.extend({

	on: function (types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (var type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}

		} else {
			// types can be a string of space-separated words
			types = G.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	off: function (types, fn, context) {

		if (!types) {
			// clear all listeners if called without arguments
			delete this._events;

		} else if (typeof types === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}

		} else {
			types = G.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on: function (type, fn, context) {

		var events = this._events = this._events || {},
		    contextId = context && context !== this && G.stamp(context);

		if (contextId) {
			// store listeners with custom context in a separate hash (if it has an id);
			// gives a major performance boost when firing and removing events (e.g. on map object)

			var indexKey = type + '_idx',
			    indexLenKey = type + '_len',
			    typeIndex = events[indexKey] = events[indexKey] || {},
			    id = G.stamp(fn) + '_' + contextId;

			if (!typeIndex[id]) {
				typeIndex[id] = {fn: fn, ctx: context};

				// keep track of the number of keys in the index to quickly check if it's empty
				events[indexLenKey] = (events[indexLenKey] || 0) + 1;
			}

		} else {
			// individual layers mostly use "this" for context and don't fire listeners too often
			// so simple array makes the memory footprint better while not degrading performance

			events[type] = events[type] || [];
			events[type].push({fn: fn});
		}
	},

	_off: function (type, fn, context) {
		var events = this._events,
		    indexKey = type + '_idx',
		    indexLenKey = type + '_len';

		if (!events) { return; }

		if (!fn) {
			// clear all listeners for a type if function isn't specified
			delete events[type];
			delete events[indexKey];
			delete events[indexLenKey];
			return;
		}

		var contextId = context && context !== this && G.stamp(context),
		    listeners, i, len, listener, id;

		if (contextId) {
			id = G.stamp(fn) + '_' + contextId;
			listeners = events[indexKey];

			if (listeners && listeners[id]) {
				listener = listeners[id];
				delete listeners[id];
				events[indexLenKey]--;
			}

		} else {
			listeners = events[type];

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					if (listeners[i].fn === fn) {
						listener = listeners[i];
						listeners.splice(i, 1);
						break;
					}
				}
			}
		}

		// set the removed listener to noop so that's not called if remove happens in fire
		if (listener) {
			listener.fn = G.Util.falseFn;
		}
	},

	fire: function (type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }

		var event = G.Util.extend({}, data, {type: type, target: this}),
		    events = this._events;

		if (events) {
		    var typeIndex = events[type + '_idx'],
		        i, len, listeners, id;

			if (events[type]) {
				// make sure adding/removing listeners inside other listeners won't cause infinite loop
				listeners = events[type].slice();

				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].fn.call(this, event);
				}
			}

			// fire event for the context-indexed listeners as well
			for (id in typeIndex) {
				typeIndex[id].fn.call(typeIndex[id].ctx, event);
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	listens: function (type, propagate) {
		var events = this._events;

		if (events && (events[type] || events[type + '_len'])) { return true; }

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) { return true; }
			}
		}
		return false;
	},

	once: function (types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		var handler = G.bind(function () {
			this
			    .off(types, fn, context)
			    .off(types, handler, context);
		}, this);

		// add a listener that's executed once and removed after that
		return this
		    .on(types, fn, context)
		    .on(types, handler, context);
	},

	// adds a parent to propagate events to (when you fire with true as a 3rd argument)
	addEventParent: function (obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[G.stamp(obj)] = obj;
		return this;
	},

	removeEventParent: function (obj) {
		if (this._eventParents) {
			delete this._eventParents[G.stamp(obj)];
		}
		return this;
	},

	_propagateEvent: function (e) {
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, G.extend({layer: e.target}, e), true);
		}
	}
});

G.DomUtil = {

	get: function (id) {
	       return typeof id === 'string' ? document.getElementById(id) : id;
	},

	getStyle: function (el, style) {

		var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

		if ((!value || value === 'auto') && document.defaultView) {
		    var css = document.defaultView.getComputedStyle(el, null);
		    value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	create: function (tagName, className, container, content) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		if (content) {
			if (tagName == 'input') {
				el.setAttribute('placeholder', content);
			} else if (tagName == 'image') {
				el.src = content;
			} else if (tagName == 'img') {
				el.src = content;
			} else {
				el.innerHTML = content;
			}
		}

		return el;
	},

	makeit : function (m) {

		var hook = document.createElement(m.type);
		if ( m.id ) { hook.id = m.id; }
		if ( m.cname ) { hook.className = m.cname; }
		if ( m.style ) { hook.setAttribute("style", m.style) }	
		if ( m.hlink ) { hook.setAttribute("href", m.hlink); }
		if ( m.source ) { hook.src = m.source }
		if ( m.inner ) { hook.innerHTML = m.inner; }
		if ( m.appendto ) { m.appendto.appendChild(hook); }
		if ( m.attr ) { m.attr.forEach(function(att) { hook.setAttribute(att[0], att[1]) }) }
		return hook;

	},
	
	createId : function(tagName, id, container) {
		// https://github.com/Leaflet/Leaflet/blob/master/src/dom/DomUtil.js
		
		var el = document.createElement(tagName);
		el.id = id;

		if (container) {
			container.appendChild(el);
		}

		return el;

	},

	remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
		    parent.removeChild(el);
		}
	},

	toFront: function (el) {
		el.parentNode.appendChild(el);
	},

	toBack: function (el) {
		var parent = el.parentNode;
		parent.insertBefore(el, parent.firstChild);
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
		    return el.classList.contains(name);
		}
		var className = G.DomUtil.getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (!el) return console.error('addClass: div undefined. fix!');
		if (el.classList !== undefined) {
		    var classes = G.Util.splitWords(name);
		    for (var i = 0, len = classes.length; i < len; i++) {
			el.classList.add(classes[i]);
		    }
		} else if (!G.DomUtil.hasClass(el, name)) {
		    var className = G.DomUtil.getClass(el);
		    G.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (!el) return console.error('removeClass: div undefined. fix!');
		if (el.classList !== undefined) {
		    el.classList.remove(name);
		} else {
		    G.DomUtil.setClass(el, G.Util.trim((' ' + G.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},


	classed: function(el, name, bol) {
		if ( !bol ) {
			this.removeClass(el,name);
		} else {
			this.addClass(el,name);
		}
	},	

	clearChildClasses : function (parent, divclass) {
		for (var i=0; i < parent.children.length; i++) {
			var child = parent.children[i];
			G.DomUtil.removeClass(child, divclass);
		}
	},

	setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
		    el.className = name;
		} else {
		    // in case of SVG element
		    el.className.baseVal = name;
		}
	},

	getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	appendTemplate : function (container, template) {
		if (typeof template === 'string') {
			var holder = G.DomUtil.create('div');
			holder.innerHTML = template;
			for (i=0; i < holder.childNodes.length; i++) {
				container.appendChild(holder.childNodes[i]);
			}
		}
		return container;
	},

	prependTemplate : function (container, template, firstsibling) {
		if (typeof template === 'string') {
			var holder = G.DomUtil.create('div');
			holder.innerHTML = template;
			if (firstsibling) {
			    var firstChild = container.firstChild;
			} else {
			    var firstChild = container.firstChild.nextSibling;
			}
			for (i=0; i < holder.childNodes.length; i++) {
				container.insertBefore(holder.childNodes[i], firstChild);
			}
		}
		return container;
	},

	thumbAdjust : function (imgContainer, dimentions) {

		// Plasserer thumbs sentrert i container
		// avhengig av kvadratisk ramme!

		var img = new Image();
		img.src = imgContainer.src;
		
		img.onload = function() {
			
			var w = this.width;
			var h = this.height;
			var wProp = w/dimentions;
			var hProp = h/dimentions;

			var portrait = true;
			if ( w>=h ) portrait = false;

			// Plassere bildet i boksen
			if ( !portrait ) {
				imgContainer.style.height = '100%';
				imgContainer.style.left = - Math.floor(wProp)/2 + 'px';
			} else {
				imgContainer.style.width = '100%';
				imgContainer.style.top = - Math.floor(hProp)/2 + 'px';				
			}
		}
	},	



};

G.DomEvent = {

    on: function (obj, types, fn, context) {

	if (typeof types === 'object') {
	    for (var type in types) {
		this._on(obj, type, types[type], fn);
	    }
	} else {
	    types = G.Util.splitWords(types);

	    for (var i = 0, len = types.length; i < len; i++) {
		this._on(obj, types[i], fn, context);
	    }
	}

	return this;
    },

    off: function (obj, types, fn, context) {

	if (typeof types === 'object') {
	    for (var type in types) {
		this._off(obj, type, types[type], fn);
	    }
	} else {
	    types = G.Util.splitWords(types);

	    for (var i = 0, len = types.length; i < len; i++) {
		this._off(obj, types[i], fn, context);
	    }
	}

	return this;
    },

    _on: function (obj, type, fn, context) {

	var id = type + G.stamp(fn) + (context ? '_' + G.stamp(context) : '');

	if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

	var handler = function (e) {
	    return fn.call(context || obj, e || window.event);
	};

	var originalHandler = handler;

	if (G.Browser.pointer && type.indexOf('touch') === 0) {
	    return this.addPointerListener(obj, type, handler, id);
	}
	if (G.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
	    this.addDoubleTapListener(obj, handler, id);
	}

	if ('addEventListener' in obj) {

	    if (type === 'mousewheel') {
		obj.addEventListener('DOMMouseScroll', handler, false);
		obj.addEventListener(type, handler, false);

	    } else if ((type === 'mouseenter') || (type === 'mouseleave')) {
		handler = function (e) {
		    e = e || window.event;
		    if (!G.DomEvent._checkMouse(obj, e)) { return; }
		    return originalHandler(e);
		};
		obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false);

	    } else {
		if (type === 'click' && G.Browser.android) {
		    handler = function (e) {
			return G.DomEvent._filterClick(e, originalHandler);
		    };
		}
		obj.addEventListener(type, handler, false);
	    }

	} else if ('attachEvent' in obj) {
	    obj.attachEvent('on' + type, handler);
	}

	obj[eventsKey] = obj[eventsKey] || {};
	obj[eventsKey][id] = handler;

	return this;
    },

    _off: function (obj, type, fn, context) {

	var id = type + G.stamp(fn) + (context ? '_' + G.stamp(context) : ''),
	    handler = obj[eventsKey] && obj[eventsKey][id];

	if (!handler) { return this; }

	if (G.Browser.pointer && type.indexOf('touch') === 0) {
	    this.removePointerListener(obj, type, id);

	} else if (G.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
	    this.removeDoubleTapListener(obj, id);

	} else if ('removeEventListener' in obj) {

	    if (type === 'mousewheel') {
		obj.removeEventListener('DOMMouseScroll', handler, false);
		obj.removeEventListener(type, handler, false);

	    } else {
		obj.removeEventListener(
		    type === 'mouseenter' ? 'mouseover' :
		    type === 'mouseleave' ? 'mouseout' : type, handler, false);
	    }

	} else if ('detachEvent' in obj) {
	    obj.detachEvent('on' + type, handler);
	}

	obj[eventsKey][id] = null;

	return this;
    },

    stopPropagation: function (e) {

	if (e.stopPropagation) {
	    e.stopPropagation();
	} else {
	    e.cancelBubble = true;
	}
	G.DomEvent._skipped(e);

	return this;
    },

    disableScrollPropagation: function (el) {
	return G.DomEvent.on(el, 'mousewheel MozMousePixelScroll', G.DomEvent.stopPropagation);
    },

    preventDefault: function (e) {

	if (e.preventDefault) {
	    e.preventDefault();
	} else {
	    e.returnValue = false;
	}
	return this;
    },

    stop: function (e) {
	return G.DomEvent
	    .preventDefault(e)
	    .stopPropagation(e);
    },

    getWheelDelta: function (e) {

	var delta = 0;

	if (e.wheelDelta) {
	    delta = e.wheelDelta / 120;
	}
	if (e.detail) {
	    delta = -e.detail / 3;
	}
	return delta;
    },

    _skipEvents: {},

    _fakeStop: function (e) {
	// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
	G.DomEvent._skipEvents[e.type] = true;
    },

    _skipped: function (e) {
	var skipped = this._skipEvents[e.type];
	// reset when checking, as it's only used in map container and propagates outside of the map
	this._skipEvents[e.type] = false;
	return skipped;
    },

    // check if element really left/entered the event target (for mouseenter/mouseleave)
    _checkMouse: function (el, e) {

	var related = e.relatedTarget;

	if (!related) { return true; }

	try {
	    while (related && (related !== el)) {
		related = related.parentNode;
	    }
	} catch (err) {
	    return false;
	}
	return (related !== el);
    },

    // this is a horrible workaround for a bug in Android where a single touch triggers two click events
    _filterClick: function (e, handler) {
	var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
	    elapsed = G.DomEvent._lastClick && (timeStamp - G.DomEvent._lastClick);

	// are they closer together than 500ms yet more than 100ms?
	// Android typically triggers them ~300ms apart while multiple listeners
	// on the same event should be triggered far faster;
	// or check if click is simulated on the element, and if it is, reject any non-simulated events

	if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
	    G.DomEvent.stop(e);
	    return;
	}
	G.DomEvent._lastClick = timeStamp;

	return handler(e);
    }
};

// G.Browser
(function () {

    var ua = navigator.userAgent.toLowerCase(),
	doc = document.documentElement,

	ie = 'ActiveXObject' in window,

	webkit    = ua.indexOf('webkit') !== -1,
	phantomjs = ua.indexOf('phantom') !== -1,
	android23 = ua.search('android [23]') !== -1,
	chrome    = ua.indexOf('chrome') !== -1,

	mobile = typeof orientation !== 'undefined',
	msPointer = navigator.msPointerEnabled && navigator.msMaxTouchPoints && !window.PointerEvent,
	pointer = (window.PointerEvent && navigator.pointerEnabled && navigator.maxTouchPoints) || msPointer,

	ie3d = ie && ('transition' in doc.style),
	webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	gecko3d = 'MozPerspective' in doc.style,
	opera3d = 'OTransition' in doc.style;


    var retina = 'devicePixelRatio' in window && window.devicePixelRatio > 1;

    if (!retina && 'matchMedia' in window) {
	var matches = window.matchMedia('(min-resolution:1.5dppx)');
	retina = matches && matches.matches;
    }

    var touch = !window.L_NO_TOUCH && !phantomjs && (pointer || 'ontouchstart' in window ||
	    (window.DocumentTouch && document instanceof window.DocumentTouch));

    G.Browser = {
	ie: ie,
	ielt9: ie && !document.addEventListener,
	webkit: webkit,
	gecko: (ua.indexOf('gecko') !== -1) && !webkit && !window.opera && !ie,
	android: ua.indexOf('android') !== -1,
	android23: android23,
	chrome: chrome,
	safari: !chrome && ua.indexOf('safari') !== -1,

	ie3d: ie3d,
	webkit3d: webkit3d,
	gecko3d: gecko3d,
	opera3d: opera3d,
	any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs,

	mobile: mobile,
	mobileWebkit: mobile && webkit,
	mobileWebkit3d: mobile && webkit3d,
	mobileOpera: mobile && window.opera,

	touch: !!touch,
	msPointer: !!msPointer,
	pointer: !!pointer,

	retina: !!retina
    };

}());


var proto = G.Evented.prototype;

// aliases; we should ditch those eventually
proto.addEventListener = proto.on;
proto.removeEventListener = proto.clearAllEventListeners = proto.off;
proto.addOneTimeEventListener = proto.once;
proto.fireEvent = proto.fire;
proto.hasEventListeners = proto.listens;
G.Mixin = {Events: proto};