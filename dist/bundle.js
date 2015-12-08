(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/nick/Desktop/mithical/lib/mithril.js":[function(require,module,exports){
void (function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(typeof window !== "undefined" ? window : {})
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(this, function (window, undefined) { // eslint-disable-line
	"use strict"

	var VERSION = "v0.2.1"

	// Save these two.
	var type = {}.toString
	var hasOwn = {}.hasOwnProperty

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {
			// empty
		}
	}

	function forOwn(obj, f) {
		for (var prop in obj) if (hasOwn.call(obj, prop)) {
			if (f(obj[prop], prop)) break
		}
	}

	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
	var attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/
	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/ // eslint-disable-line max-len

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(window) {
		$document = window.document
		$location = window.location
		$cancelAnimationFrame = window.cancelAnimationFrame ||
			window.clearTimeout
		$requestAnimationFrame = window.requestAnimationFrame ||
			window.setTimeout
	}

	initialize(window)

	// testing API
	m.deps = function (mock) {
		initialize(window = mock || window)
		return window
	}

	m.version = function () {
		return VERSION
	}

	/**
	* @typedef {String} Tag
	* A string that looks like -> div.classname#id[param=one][param2=two]
	* Which describes a DOM node
	*/

	function checkForAttrs(pairs) {
		return pairs != null &&
			isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)
	}

	function parseSelector(tag, cell) {
		var classes = []
		var match
		while ((match = parser.exec(tag)) != null) {
			if (match[1] === "" && match[2]) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
			}
		}

		return classes
	}

	function getChildrenFromList(hasAttrs, args) {
		var children = hasAttrs ? args.slice(1) : args
		if (children.length === 1 && isArray(children[0])) {
			return children[0]
		} else {
			return children
		}
	}

	function assignAttrs(cell, attrs, classAttr, classes) {
		forOwn(attrs, function (value, attr) {
			if (attr === classAttr &&
					attrs[attr] != null &&
					attrs[attr] !== "") {
				classes.push(attrs[attr])

				// create key in correct iteration order
				cell.attrs[attr] = ""
			} else {
				cell.attrs[attr] = attrs[attr]
			}
		})

		if (classes.length) {
			cell.attrs[classAttr] = classes.join(" ")
		}
	}

	/**
	* @param {Tag} The DOM node tag
	* @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	* @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	*                      or splat (optional)
	*/
	function m(tag, pairs) {
		for (var args = [], i = 1; i < arguments.length; i++) {
			args[i - 1] = arguments[i]
		}

		if (isObject(tag)) return parameterize(tag, args)
		var hasAttrs = checkForAttrs(pairs)
		var attrs = hasAttrs ? pairs : {}
		var classAttr = "class" in attrs ? "class" : "className"
		var cell = {tag: "div", attrs: {}}

		if (!isString(tag)) {
			throw new Error("selector in m(selector, attrs, children) should " +
				"be a string")
		}

		var classes = parseSelector(tag, cell)
		cell.children = getChildrenFromList(hasAttrs, args)

		assignAttrs(cell, attrs, classAttr, classes)

		return cell
	}

	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			attrs = attrs && attrs.attrs
			return attrs && attrs.key != null && f(attrs, i)
		})
	}

	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox
		try {
			if (data != null && data.toString() != null) {
				return data
			}
		} catch (e) {
			// Swallow all errors here.
		}

		return ""
	}

	// This function was causing deopts in Chrome.
	function injectTextNode(parent, first, index, data) {
		try {
			insertNode(parent, first, index)
			first.nodeValue = data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again while there is an array at this
				// index.
				i--
			}
		}

		return list
	}

	function insertNode(parent, node, index) {
		parent.insertBefore(node, parent.childNodes[index] || null)
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function handleKeysDiffer(data, existing, cached, parent) {
		forKeys(data, function (key, i) {
			key = key.key
			if (existing[key]) {
				existing[key] = {
					action: MOVE,
					index: i,
					from: existing[key].index,
					element: cached.nodes[existing[key].index] ||
						$document.createElement("div")
				}
			} else {
				existing[key] = {action: INSERTION, index: i}
			}
		})

		var actions = []

		forOwn(existing, function (value) {
			actions.push(value)
		})

		var changes = actions.sort(sortChanges)
		var newCached = new Array(cached.length)
		newCached.nodes = cached.nodes.slice()

		forEach(changes, function (change) {
			var index = change.index

			switch (change.action) {
			case DELETION:
				clear(cached[index].nodes, cached[index])
				newCached.splice(index, 1)
				break

			case INSERTION:
				var dummy = $document.createElement("div")
				dummy.key = data[index].attrs.key
				insertNode(parent, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
				break

			case MOVE:
				var changeElement = change.element
				var maybeChanged = parent.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					parent.insertBefore(changeElement, maybeChanged || null)
				}
				newCached[index] = cached[change.from]
				newCached.nodes[index] = changeElement
			}
		})

		return newCached
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length

		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i]
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			})
		}

		if (keysDiffer) {
			return handleKeysDiffer(data, existing, cached, parentElement)
		} else {
			return cached
		}
	}

	// diffs the array itself
	function diffArray(data, cached, nodes) {
		// update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
		})

		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [cached[i]])
			}
		})

		if (data.length < cached.length) cached.length = data.length

		cached.nodes = nodes
	}

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				attrs = attrs && attrs.attrs
				if (attrs && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return true
		})
	}

	// shallow array compare, sorts
	function arraySortCompare(a, b) {
		a.sort()
		b.sort()
		var len = a.length
		if (len !== b.length) return false
		for (var i = 0; i < len; i++) {
			if (a[i] !== b[i]) return false
		}
		return true
	}

	function elemIsDifferentEnough(data, cached, dataAttrKeys) {
		if (data.tag !== cached.tag) return true
		if (!arraySortCompare(dataAttrKeys, Object.keys(cached.attrs))) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) return true
		if (data.attrs.key !== cached.attrs.key) return true

		if (m.redraw.strategy() === "all") {
			return !(cached.configContext &&
				cached.configContext.retain === true)
		} else if (m.redraw.strategy() === "diff") {
			return cached.configContext &&
				cached.configContext.retain === false
		}
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (elemIsDifferentEnough(data, cached, dataAttrKeys)) {
			if (cached.nodes.length) clear(cached.nodes)
			if (cached.configContext &&
					isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
			}

			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.unload) {
						controller.onunload({preventDefault: noop})
					}
				})
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		return data.attrs.xmlns ? data.attrs.xmlns :
			data.tag === "svg" ? "http://www.w3.org/2000/svg" :
			data.tag === "math" ? "http://www.w3.org/1998/Math/MathML" :
			namespace
	}

	var pendingRequests = 0
	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) {
					controller.onunload = controller.onunload.$old
				}

				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload
					controller.onunload = noop
					controller.onunload.$old = onunload
				}
			})
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		// schedule configs to be called. They are called after `build` finishes
		// running
		var config = data.attrs.config
		if (isFunction(config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			configs.push(function () {
				return config.call(data, node, !isNew, context, cached)
			})
		}
	}

	function buildUpdatedNode(
		cached,
		data,
		editable,
		hasKeys,
		namespace,
		views,
		configs,
		controllers
	) {
		var node = cached.nodes[0]
		if (hasKeys) {
			setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
		}

		cached.children = build(node, data.tag, undefined, undefined,
			data.children, cached.children, false, 0,
			data.attrs.contenteditable ? node : editable, namespace, configs)

		cached.nodes.intact = true

		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
		}

		return node
	}

	function handleNonexistentNodes(data, parent, index) {
		var nodes
		if (data.$trusted) {
			nodes = injectHTML(parent, index, data)
		} else {
			nodes = [$document.createTextNode(data)]
			if (!voidElements.test(parent.nodeName)) {
				insertNode(parent, nodes[0], index)
			}
		}

		var cached

		if (typeof data === "string" ||
				typeof data === "number" ||
				typeof data === "boolean") {
			cached = new data.constructor(data)
		} else {
			cached = data
		}

		cached.nodes = nodes

		return cached
	}

	function reattachNodes(data,
		cached,
		parentElement,
		editable,
		index,
		parentTag
	) {
		var nodes = cached.nodes
		if (!editable || editable !== $document.activeElement) {
			if (data.$trusted) {
				clear(nodes, cached)
				nodes = injectHTML(parentElement, index, data)
			} else if (parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				parentElement.value = data
			} else if (editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				editable.innerHTML = data
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 ||
					nodes.length > 1 ||
					(nodes[0].nodeValue.trim && !nodes[0].nodeValue.trim())
				) {
					clear(cached.nodes, cached)
					nodes = [$document.createTextNode(data)]
				}
				injectTextNode(parentElement, nodes[0], index, data)
			}
		}

		cached = new data.constructor(data)
		cached.nodes = nodes
		return cached
	}

	function handleTextNode(
		cached,
		data,
		index,
		parent,
		shouldReattach,
		editable,
		parentTag
	) {
		if (cached.nodes.length === 0) {
			return handleNonexistentNodes(data, parent, index)
		} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
			return reattachNodes(data, cached, parent, editable, index,
				parentTag)
		} else {
			cached.nodes.intact = true
			return cached
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one HTML element. the first clause in the regexp matches
			// elements the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g)
			if (match != null) return match.length
		} else if (isArray(item)) {
			return item.length
		} else {
			return 1
		}
	}

	function buildArray(
		data,
		cached,
		parentElement,
		index,
		parentTag,
		shouldReattach,
		editable,
		namespace,
		configs
	) {
		data = flatten(data)
		var nodes = []
		var intact = cached.length === data.length
		var subArrayCount = 0

		// keys algorithm:
		// sort elements without recreating them if keys are present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps
		var existing = {}
		var shouldMaintainIdentities = false
		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[cached[i].attrs.key] = {action: DELETION, index: i}
		})

		buildArrayKeys(data)
		if (shouldMaintainIdentities) {
			cached = diffKeys(data, cached, existing, parentElement)
		}
		// end key algorithm

		// don't change: faster than forEach
		var cacheCount = 0
		for (var i = 0, len = data.length; i < len; i++) {
			// diff each item in the array
			var item = build(parentElement, parentTag, cached, index, data[i],
				cached[cacheCount], shouldReattach,
				index + subArrayCount || subArrayCount,
				editable, namespace, configs)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				cached[cacheCount++] = item
			}
		}

		if (!intact) diffArray(data, cached, nodes)

		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex
				var end = offset + (isArray(data) ? data : cached.nodes).length

				clear(parentCache.nodes.slice(offset, end),
					parentCache.slice(offset, end))
			} else if (cached.nodes) {
				clear(cached.nodes, cached)
			}
		}

		cached = new data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {}
		cached.nodes = []
		return cached
	}

	function constructNode(data, namespace) {
		if (namespace === undefined) {
			if (data.attrs.is) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElement(data.tag)
			}
		} else if (data.attrs.is) {
			return $document.createElementNS(namespace, data.tag, data.attrs.is)
		} else {
			return $document.createElementNS(namespace, data.tag)
		}
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		if (hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, namespace)
		} else {
			return data.attrs
		}
	}

	function constructChildren(
		data,
		node,
		cached,
		editable,
		namespace,
		configs
	) {
		if (data.children != null && data.children.length !== 0) {
			return build(node, data.tag, undefined, undefined, data.children,
				cached.children, true, 0,
				data.attrs.contenteditable ? node : editable, namespace,
				configs)
		} else {
			return data.children
		}
	}

	function reconstructCached(
		data,
		attrs,
		children,
		node,
		namespace,
		views,
		controllers
	) {
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		unloadCachedControllers(cached, views, controllers)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				namespace)
		}
		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var index = m.redraw.strategy() === "diff" && views ?
			views.indexOf(view) :
			-1

		if (index > -1) {
			return cachedControllers[index]
		} else if (typeof controller === "function") {
			return new controller()
		} else {
			return {}
		}
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null) {
			unloaders.push({
				controller: controller,
				handler: controller.onunload
			})
		}

		views.push(view)
		controllers.push(controller)
	}

	var forcing = false

	function checkView(
		data,
		view,
		cached,
		cachedControllers,
		controllers,
		views
	) {
		var controller = getController(cached.views, view, cachedControllers,
			data.controller)

		// Faster to coerce to number and check for NaN
		var key = +(data && data.attrs && data.attrs.key)

		if (pendingRequests === 0 || forcing ||
				cachedControllers &&
				cachedControllers.indexOf(controller) > -1) {
			data = data.view(controller)
		} else {
			data = {tag: "placeholder"}
		}

		if (data.subtree === "retain") return cached
		if (key === key) { // eslint-disable-line no-self-compare
			(data.attrs = data.attrs || {}).key = key
		}
		updateLists(views, controllers, view, controller)
		return data
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers
		while (data.view != null) {
			data = checkView(data, data.view.$original || data.view, cached,
				cachedControllers, controllers, views)
		}
		return data
	}

	function initObjectNode(
		isNew,
		data,
		namespace,
		hasKeys,
		cached,
		editable,
		configs,
		views,
		controllers,
		parentElement,
		shouldReattach,
		index
	) {
		var node
		if (isNew) {
			node = constructNode(data, namespace)
			// set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)
			var children = constructChildren(data, node, cached, editable,
				namespace, configs)
			cached = reconstructCached(data, attrs, children, node, namespace,
				views, controllers)
		} else {
			node = buildUpdatedNode(cached, data, editable, hasKeys, namespace,
				views, configs, controllers)
		}
		if (isNew || shouldReattach && node != null) {
			insertNode(parentElement, node, index)
		}
		// schedule configs to be called. They are called after `build` finishes
		// running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached)
		return cached
	}

	function buildObject(
		data,
		cached,
		editable,
		parentElement,
		index,
		shouldReattach,
		namespace,
		configs
	) {
		var views = []
		var controllers = []

		data = markViews(data, cached, views, controllers)

		if (!data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		data.attrs = data.attrs || {}
		cached.attrs = cached.attrs || {}

		var dataAttrKeys = Object.keys(data.attrs)
		var hasKeys = dataAttrKeys.length > +("key" in data.attrs)

		maybeRecreateObject(data, cached, dataAttrKeys)

		if (isString(data.tag)) {
			return initObjectNode(cached.nodes.length === 0, data,
				getObjectNamespace(data, namespace), hasKeys, cached, editable,
				configs, views, controllers, parentElement, shouldReattach,
				index)
		}
	}

	function build(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		// `build` is a recursive function that manages creation/diffing/removal
		// of DOM elements based on comparison between `data` and `cached`
		//
		// the diff algorithm can be summarized as this:
		// 1) compare `data` and `cached`
		// 2) if they are different, copy `data` to `cached` and update the DOM
		//    based on what the difference is
		// 3) recursively apply this algorithm for every array and for the
		//    children of every virtual element
		//
		// the `cached` data structure is essentially the same as the previous
		// redraw's `data` data structure, with a few additions:
		// - `cached` always has a property called `nodes`, which is a list of
		//    DOM elements that correspond to the data represented by the
		//    respective virtual element
		// - in order to support attaching `nodes` as a property of `cached`,
		//    `cached` is *always* a non-primitive object, i.e. if the data was
		//    a string, then cached is a String instance. If data was `null` or
		//    `undefined`, cached is `new String("")`
		// - `cached also has a `configContext` property, which is the state
		//    storage object exposed by config(element, isInitialized, context)
		// - when `cached` is an Object, it represents a virtual element; when
		//    it's an Array, it represents a list of elements; when it's a
		//    String, Number or Boolean, it represents a text node
		//
		// `parentElement` is a DOM element used for W3C DOM API calls
		// `parentTag` is only used for handling a corner case for textarea
		// values
		// `parentCache` is used to remove nodes in some multi-node cases
		// `parentIndex` and `index` are used to figure out the offset of nodes.
		// They're artifacts from before arrays started being flattened and are
		// likely refactorable
		// `data` and `cached` are, respectively, the new and old nodes being
		// diffed
		// `shouldReattach` is a flag indicating whether a parent node was
		// recreated (if so, and if this node is reused, then this node must
		// reattach itself to the new parent)
		// `editable` is a flag that indicates whether an ancestor is
		// contenteditable
		// `namespace` indicates the closest HTML namespace as it cascades down
		// from an ancestor
		// `configs` is a list of config functions to run after the topmost
		// `build` call finishes running
		//
		// there's logic that relies on the assumption that null and undefined
		// data are equivalent to empty strings
		// - this prevents lifecycle surprises from procedural helpers that mix
		//   implicit and explicit return statements (e.g.
		//   function foo() {if (cond) return m("div")}
		// - it simplifies diffing code
		data = dataToString(data)
		if (data.subtree === "retain") return cached
		cached = makeCache(data, cached, index, parentIndex, parentCache)
		if (isArray(data)) {
			return buildArray(data, cached, parentElement, index, parentTag,
				shouldReattach, editable, namespace, configs)
		} else if (data != null && isObject(data)) {
			return buildObject(data, cached, editable, parentElement, index,
				shouldReattach, namespace, configs)
		} else if (isFunction(data)) {
			return cached
		} else {
			return handleTextNode(cached, data, index, parentElement,
				shouldReattach, editable, parentTag)
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function shouldSetAttrDirectly(attr) {
		return attr !== "list" &&
			attr !== "style" &&
			attr !== "form" &&
			attr !== "type" &&
			attr !== "width" &&
			attr !== "height"
	}

	function trySetAttribute(attr, dataAttr, cachedAttr, node, namespace, tag) {
		// `config` isn't a real attributes, so ignore it
		if (attr === "config" || attr === "key") return
		// hook event handlers to the auto-redrawing system
		else if (isFunction(dataAttr) && attr.slice(0, 2) === "on") {
			node[attr] = autoredraw(dataAttr, node)
		} else if (attr === "style" && dataAttr != null && isObject(dataAttr)) {
			// handle `style: {...}`
			forOwn(dataAttr, function (value, rule) {
				if (cachedAttr == null || cachedAttr[rule] !== value) {
					node.style[rule] = value
				}
			})

			for (var rule in cachedAttr) if (hasOwn.call(cachedAttr, rule)) {
				if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
			}
		} else if (namespace != null) {
			// handle SVG
			if (attr === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink", "href",
					dataAttr)
			} else {
				node.setAttribute(attr === "className" ? "class" : attr,
					dataAttr)
			}
		} else if (attr in node && shouldSetAttrDirectly(attr)) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead):
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348
			// don't set the value if not needed otherwise cursor placement
			// breaks in Chrome
			if (tag !== "input" || node[attr] !== dataAttr) {
				node[attr] = dataAttr
			}
		} else {
			node.setAttribute(attr, dataAttr)
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		forOwn(dataAttrs, function (dataAttr, attr) {
			var cachedAttr = cachedAttrs[attr]
			if (!(attr in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attr] = dataAttr
				try {
					trySetAttribute(attr, dataAttr, cachedAttr, node, namespace,
						tag)
				} catch (e) {
					// swallow IE's invalid argument errors to mimic HTML's
					// fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e
				}
			} else if (attr === "value" && tag === "input" &&
					// #348: dataAttr may not be a string, so use loose
					// comparison
					node.value != dataAttr) { // eslint-disable-line eqeqeq
				node.value = dataAttr
			}
		})

		return cachedAttrs
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i >= 0; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {
					nodes[i].parentNode.removeChild(nodes[i])
				} catch (e) {
					/* eslint-disable max-len */
					// ignore if this fails due to order of events (see
					// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					/* eslint-enable max-len */
				}

				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}

		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) nodes.length = 0
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) {
					controller.onunload({preventDefault: noop})
				}
			})
		}
		if (cached.children) {
			if (isArray(cached.children)) {
				forEach(cached.children, unload)
			} else if (cached.children.tag) {
				unload(cached.children)
			}
		}
	}

	var insertAdjacentBeforeEnd = (function () {
		try {
			$document.createRange().createContextualFragment("x")
			return function (parent, data) {
				parent.appendChild(
					$document.createRange().createContextualFragment(data))
			}
		} catch (e) {
			return function (parent, data) {
				parent.insertAdjacentHTML("beforeend", data)
			}
		}
	})()

	function injectHTML(parent, index, data) {
		var nextSibling = parent.childNodes[index]

		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")

			if (isElement) {
				parent.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parent.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			insertAdjacentBeforeEnd(parent, data)
		}

		var nodes = []
		while (parent.childNodes[index] !== nextSibling) {
			nodes.push(parent.childNodes[index])
			index++
		}

		return nodes
	}
	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) {
				html = $document.createElement("html")
			}

			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}

		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = build(node, null, undefined, undefined, cell,
			cellCache[id], false, 0, null, undefined, configs)

		forEach(configs, function (config) { config() })
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((store != null && isObject(store) || isFunction(store)) &&
				isFunction(store.then)) {
			return propify(store)
		} else {
			return gettersetter(store)
		}
	}

	var roots = []
	var components = []
	var controllers = []
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms
	var topComponent

	function parameterize(component, args) {
		var originalCtrl = component.controller || noop
		var originalView = component.view || noop

		function Ctrl() {
			return originalCtrl.apply(this, args) || this
		}

		if (originalCtrl !== noop) {
			Ctrl.prototype = originalCtrl.prototype
		}

		function view(ctrl) {
			var rest = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				rest.push(arguments[i])
			}

			return originalView.apply(component, rest)
		}

		view.$original = originalView
		var output = {controller: Ctrl, view: view}

		if (args[0] && args[0].key != null) {
			output.attrs = {key: args[0].key}
		}

		return output
	}

	m.component = function (component) {
		var args = []
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i])
		}

		return parameterize(component, args)
	}

	function initComponent(component, root, index, isPrevented) {
		var isNullComponent = component === null

		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			component = topComponent = component || {controller: noop}
			var controller = new (component.controller || noop)()
			// controllers may call m.mount recursively (via m.route redirects,
			// for example). this conditional ensures only the last recursive
			// m.mount call is applied
			if (component === topComponent) {
				controllers[index] = controller
				components[index] = component
			}

			endFirstComputation()

			if (isNullComponent) {
				removeRootElement(root, index)
			}

			return controllers[index]
		}

		if (isNullComponent) {
			removeRootElement(root, index)
		}
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Please ensure the DOM element exists before " +
				"rendering a template into it.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false

		var ev = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, ev)
			unloader.controller.onunload = null
		})

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler
			})
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(ev)
		}

		return initComponent(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
	}

	// lastRedrawId is a positive number if a second redraw is requested before
	// the next animation frame, or 0 if it's the first redraw and not an event
	// handler
	var lastRedrawId = 0
	var lastRedrawCallTime = 0

	function actuallyPerformRedraw() {
		if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
		lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
	}

	// when setTimeout:
	// only reschedule redraw if time between now and previous redraw is bigger
	// than a frame, otherwise keep currently scheduled timeout
	//
	// when rAF:
	// always reschedule redraw
	var performRedraw = $requestAnimationFrame ===
			window.requestAnimationFrame ?
		actuallyPerformRedraw :
		function () {
			if (+new Date() - lastRedrawCallTime > FRAME_BUDGET) {
				actuallyPerformRedraw()
			}
		}

	var redrawing = false

	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true
		try {
			if (lastRedrawId && !force) {
				performRedraw()
			} else {
				redraw()
				lastRedrawId = $requestAnimationFrame(function () {
					lastRedrawId = 0
				}, FRAME_BUDGET)
			}
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()

	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}

		forEach(roots, function (root, i) {
			var component = components[i]
			if (controllers[i]) {
				var args = [controllers[i]]
				m.render(root,
					component.view ? component.view(controllers[i], args) : "")
			}
		})

		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}

		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			/* eslint-disable no-invalid-this */
			e = e || event
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			var targetProp

			if (prop in currentTarget) {
				targetProp = currentTarget[prop]
			} else {
				targetProp = currentTarget.getAttribute(prop)
			}

			withAttrCallback.call(_this, targetProp)
			/* eslint-enable no-invalid-this */
		}
	}

	// routing
	var modes = {
		pathname: "",
		hash: "#",
		search: "?"
	}

	var redirect = noop
	var isDefaultRoute = false
	var routeParams, currentRoute

	function runHistoryListener(listener) {
		window[listener] = function () {
			var path = $location[m.route.mode]
			if (m.route.mode === "pathname") path += $location.search
			if (currentRoute !== normalizeRoute(path)) redirect(path)
		}

		computePreRedrawHook = setScroll
		window[listener]()
	}

	function getRouteBase() {
		return (m.route.mode === "pathname" ? "" : $location.pathname) +
			modes[m.route.mode]
	}

	function computeAndLaunchRedirect(shouldReplaceHistoryEntry) {
		if (window.history.pushState) {
			computePreRedrawHook = setScroll
			var method = shouldReplaceHistoryEntry ?
				"replaceState" :
				"pushState"
			computePostRedrawHook = function () {
				window.history[method](null,
					$document.title,
					modes[m.route.mode] + currentRoute)
			}

			redirect(modes[m.route.mode] + currentRoute)
		} else {
			$location[m.route.mode] = currentRoute
			redirect(modes[m.route.mode] + currentRoute)
		}
	}

	function routeTo(route, params, shouldReplaceHistoryEntry) {
		if (arguments.length < 3 && typeof params !== "object") {
			shouldReplaceHistoryEntry = params
			params = null
		}

		var oldRoute = currentRoute

		currentRoute = route
		var args = params || {}
		var queryIndex = currentRoute.indexOf("?")
		var queryString, currentPath

		if (queryIndex >= 0) {
			var paramsObj = parseQueryString(currentRoute.slice(queryIndex + 1))
			forOwn(args, function (value, key) {
				paramsObj[key] = args[key]
			})
			queryString = buildQueryString(paramsObj)
			currentPath = currentRoute.slice(0, queryIndex)
		} else {
			queryString = buildQueryString(params)
			currentPath = currentRoute
		}

		if (queryString) {
			var delimiter = currentPath.indexOf("?") === -1 ? "?" : "&"
			currentRoute = currentPath + delimiter + queryString
		}

		return computeAndLaunchRedirect(shouldReplaceHistoryEntry ||
			oldRoute === route)
	}

	m.route = function (root, arg1, arg2, vdom) {
		if (arguments.length === 0) {
			// m.route()
			return currentRoute
		} else if (arguments.length === 3 && isString(arg1)) {
			// m.route(el, defaultRoute, routes)
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			runHistoryListener(
				m.route.mode === "hash" ? "onhashchange" : "onpopstate")
		} else if (root.addEventListener || root.attachEvent) {
			// config: m.route
			root.href = getRouteBase() + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}
		} else if (isString(root)) {
			// m.route(route, params, shouldReplaceHistoryEntry)
			return routeTo.apply(this, arguments)
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (key) {
			return routeParams[key]
		} else {
			return routeParams
		}
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		var queryStart = path.indexOf("?")

		if (queryStart >= 0) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		} else {
			routeParams = {}
		}

		// Get all routes and check if there's an exact match for the current
		// path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index >= 0) {
			m.mount(root, router[keys[index]])
			return true
		}

		for (var route in router) {
			if (hasOwn.call(router, route)) {
				if (route === path) {
					m.mount(root, router[route])
					return true
				}

				var matcher = new RegExp("^" +
					route.replace(/:[^\/]+?\.{3}/g, "(.*?)")
						.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

				if (matcher.test(path)) {
					/* eslint-disable no-loop-func */
					path.replace(matcher, function () {
						var keys = route.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						forEach(keys, function (key, i) {
							key = key.replace(/:|\./g, "")
							routeParams[key] = decodeURIComponent(values[i])
						})
						m.mount(root, router[route])
					})
					/* eslint-enable no-loop-func */
					return true
				}
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event

		if (e.ctrlKey || e.metaKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement

		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") {
			currentTarget = currentTarget.parentNode
		}

		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length),
			args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			window.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []
		forOwn(object, function (value, prop) {
			var key = prefix ? prefix + "[" + prop + "]" : prop

			if (value === null) {
				str.push(encodeURIComponent(key))
			} else if (isObject(value)) {
				str.push(buildQueryString(value, key))
			} else if (isArray(value)) {
				var keys = []
				duplicates[key] = duplicates[key] || {}
				/* eslint-disable-line no-loop-func  */
				forEach(value, function (item) {
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						keys.push(encodeURIComponent(key) + "=" +
							encodeURIComponent(item))
					}
				})
				/* eslint-enable-line no-loop-func  */
				str.push(keys.join("&"))
			} else if (value !== undefined) {
				str.push(encodeURIComponent(key) + "=" +
					encodeURIComponent(value))
			}
		})
		return str.join("&")
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}
		forEach(pairs, function (string) {
			var pair = string.split("=")
			var key = decodeURIComponent(pair[0])
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]]
				params[key].push(value)
			} else {
				params[key] = value
			}
		})

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	// 	  slow, and the setImmediate polyfill is too big
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)
	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var state = 0
		var promiseValue = 0
		var next = []

		self.promise = {}

		self.resolve = function (value) {
			if (!state) {
				promiseValue = value
				state = RESOLVING

				fire()
			}
			return this
		}

		self.reject = function (value) {
			if (!state) {
				promiseValue = value
				state = REJECTING

				fire()
			}
			return this
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)
			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			} else if (state === REJECTED) {
				deferred.reject(promiseValue)
			} else {
				next.push(deferred)
			}
			return deferred.promise
		}

		function finish(type) {
			state = type || REJECTED
			forEach(next, function (deferred) {
				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else {
					deferred.reject(promiseValue)
				}
			})
		}

		function thennable(then, success, fail, notThennable) {
			if (((promiseValue != null && isObject(promiseValue)) ||
					isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0
					then.call(promiseValue, function (value) {
						if (count++) return
						promiseValue = value
						success()
					}, function (value) {
						if (count++) return
						promiseValue = value
						fail()
					})
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					fail()
				}
			} else {
				notThennable()
			}
		}

		function fire() {
			// check if it's a thenable
			var then
			try {
				then = promiseValue && promiseValue.then
			} catch (e) {
				m.deferred.onerror(e)
				promiseValue = e
				state = REJECTING
				return fire()
			}

			if (state === REJECTING) {
				m.deferred.onerror(promiseValue)
			}

			thennable(then, function () {
				state = RESOLVING
				fire()
			}, function () {
				state = REJECTING
				fire()
			}, function () {
				try {
					if (state === RESOLVING && isFunction(onSuccess)) {
						promiseValue = onSuccess(promiseValue)
					} else if (state === REJECTING && isFunction(onFailure)) {
						promiseValue = onFailure(promiseValue)
						state = RESOLVING
					}
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError()
					finish()
				} else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}

	m.deferred = function () {
		var deferred = new Deferred()
		deferred.promise = propify(deferred.promise)
		return deferred
	}

	function propify(promise, initialValue) {
		var prop = m.prop(initialValue)
		promise.then(prop)

		prop.then = function (resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		}

		prop.catch = prop.then.bind(null, null)

		prop.finally = function (callback) {
			function _callback() {
				return m.deferred().resolve(callback()).promise
			}

			return prop.then(function (value) {
				return propify(_callback().then(function () {
					return value
				}), initialValue)
			}, function (reason) {
				return propify(_callback().then(function () {
					throw new Error(reason)
				}), initialValue)
			})
		}

		return prop
	}

	function isNativeError(e) {
		return e instanceof EvalError ||
			e instanceof RangeError ||
			e instanceof ReferenceError ||
			e instanceof SyntaxError ||
			e instanceof TypeError ||
			e instanceof URIError
	}

	m.deferred.onerror = function (e) {
		if (isNativeError(e)) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = m.deferred()
		var outstanding = args.length
		var results = new Array(outstanding)
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) {
		return value
	}

	function generateCallbackKey() {
		return "mithril_callback_" + new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)
	}

	function getJsonp(options) {
		var callbackKey = generateCallbackKey()
		var script = $document.createElement("script")

		window[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)

			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})

			window[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: '{"error": "Error making jsonp request"}'
				}
			})

			window[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function runXhr(options) {
		var xhr = new window.XMLHttpRequest()

		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data

		if (options.method === "GET" || !options.data) {
			data = ""
		} else {
			data = options.data
		}

		if (data && (!isString(data) && data.constructor !== window.FormData)) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return getJsonp(options)
		} else {
			return runXhr(options)
		}
	}

	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			xhrOptions.url += querystring ? prefix + querystring : ""
		} else {
			xhrOptions.data = serialize(data)
		}
		return xhrOptions
	}

	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi)
		if (tokens && data) {
			forEach(tokens, function (token) {
				var key = token.slice(1)
				url = url.replace(token, data[key])
				delete data[key]
			})
		}
		return url
	}

	function defaultExtract(jsonp) {
		return jsonp.responseText
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()

		var deferred = new Deferred()

		var serialize = identity
		var deserialize = identity
		var extract = defaultExtract

		if (!options.dataType || options.dataType.toLowerCase() !== "jsonp") {
			serialize = options.serialize || JSON.stringify
			deserialize = options.deserialize || JSON.parse
			extract = function (xhr) {
				if (xhr.responseText.length === 0 &&
						deserialize === JSON.parse) {
					return null
				} else {
					return xhr.responseText
				}
			}
		}

		options.serialize = serialize
		options.deserialize = deserialize

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		options = bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			ev = ev || event
			var doSuccess = ev.type === "load"
			var unwrap, response

			if (doSuccess) {
				unwrap = options.unwrapSuccess
			} else {
				unwrap = options.unwrapError
			}

			try {
				response = (unwrap || identity)(
					deserialize(extract(ev.target, options)), ev.target)
				if (doSuccess) {
					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}
				}
			} catch (e) {
				m.deferred.onerror(e)
				response = e
				doSuccess = false
			}

			deferred[doSuccess ? "resolve" : "reject"](response)

			if (options.background !== true) m.endComputation()
		}

		ajax(options)
		deferred.promise = propify(deferred.promise, options.initialValue)
		return deferred.promise
	}

	return m
})

},{}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/circle.js":[function(require,module,exports){
// Circle shaped progress bar

var Shape = require('./shape');
var utils = require('./utils');

var Circle = function Circle(container, options) {
    // Use two arcs to form a circle
    // See this answer http://stackoverflow.com/a/10477334/1446092
    this._pathTemplate =
        'M 50,50 m 0,-{radius}' +
        ' a {radius},{radius} 0 1 1 0,{2radius}' +
        ' a {radius},{radius} 0 1 1 0,-{2radius}';

    Shape.apply(this, arguments);
};

Circle.prototype = new Shape();
Circle.prototype.constructor = Circle;

Circle.prototype._pathString = function _pathString(opts) {
    var widthOfWider = opts.strokeWidth;
    if (opts.trailWidth && opts.trailWidth > opts.strokeWidth) {
        widthOfWider = opts.trailWidth;
    }

    var r = 50 - widthOfWider / 2;

    return utils.render(this._pathTemplate, {
        radius: r,
        '2radius': r * 2
    });
};

Circle.prototype._trailString = function _trailString(opts) {
    return this._pathString(opts);
};

module.exports = Circle;

},{"./shape":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/shape.js","./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/line.js":[function(require,module,exports){
// Line shaped progress bar

var Shape = require('./shape');
var utils = require('./utils');

var Line = function Line(container, options) {
    this._pathTemplate = 'M 0,{center} L 100,{center}';
    Shape.apply(this, arguments);
};

Line.prototype = new Shape();
Line.prototype.constructor = Line;

Line.prototype._initializeSvg = function _initializeSvg(svg, opts) {
    svg.setAttribute('viewBox', '0 0 100 ' + opts.strokeWidth);
    svg.setAttribute('preserveAspectRatio', 'none');
};

Line.prototype._pathString = function _pathString(opts) {
    return utils.render(this._pathTemplate, {
        center: opts.strokeWidth / 2
    });
};

Line.prototype._trailString = function _trailString(opts) {
    return this._pathString(opts);
};

module.exports = Line;

},{"./shape":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/shape.js","./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/main.js":[function(require,module,exports){
module.exports = {
    // Higher level API, different shaped progress bars
    Line: require('./line'),
    Circle: require('./circle'),
    SemiCircle: require('./semicircle'),

    // Lower level API to use any SVG path
    Path: require('./path'),

    // Base-class for creating new custom shapes
    // to be in line with the API of built-in shapes
    // Undocumented.
    Shape: require('./shape'),

    // Internal utils, undocumented.
    utils: require('./utils')
};

},{"./circle":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/circle.js","./line":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/line.js","./path":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/path.js","./semicircle":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/semicircle.js","./shape":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/shape.js","./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/path.js":[function(require,module,exports){
// Lower level API to animate any kind of svg path

var Tweenable = require('shifty');
var utils = require('./utils');

var EASING_ALIASES = {
    easeIn: 'easeInCubic',
    easeOut: 'easeOutCubic',
    easeInOut: 'easeInOutCubic'
};

var Path = function Path(path, opts) {
    // Default parameters for animation
    opts = utils.extend({
        duration: 800,
        easing: 'linear',
        from: {},
        to: {},
        step: function() {}
    }, opts);

    var element;
    if (utils.isString(path)) {
        element = document.querySelector(path);
    } else {
        element = path;
    }

    // Reveal .path as public attribute
    this.path = element;
    this._opts = opts;
    this._tweenable = null;

    // Set up the starting positions
    var length = this.path.getTotalLength();
    this.path.style.strokeDasharray = length + ' ' + length;
    this.set(0);
};

Path.prototype.value = function value() {
    var offset = this._getComputedDashOffset();
    var length = this.path.getTotalLength();

    var progress = 1 - offset / length;
    // Round number to prevent returning very small number like 1e-30, which
    // is practically 0
    return parseFloat(progress.toFixed(6), 10);
};

Path.prototype.set = function set(progress) {
    this.stop();

    this.path.style.strokeDashoffset = this._progressToOffset(progress);

    var step = this._opts.step;
    if (utils.isFunction(step)) {
        var easing = this._easing(this._opts.easing);
        var values = this._calculateTo(progress, easing);
        var reference = this._opts.shape || this;
        step(values, reference, this._opts.attachment);
    }
};

Path.prototype.stop = function stop() {
    this._stopTween();
    this.path.style.strokeDashoffset = this._getComputedDashOffset();
};

// Method introduced here:
// http://jakearchibald.com/2013/animated-line-drawing-svg/
Path.prototype.animate = function animate(progress, opts, cb) {
    opts = opts || {};

    if (utils.isFunction(opts)) {
        cb = opts;
        opts = {};
    }

    var passedOpts = utils.extend({}, opts);

    // Copy default opts to new object so defaults are not modified
    var defaultOpts = utils.extend({}, this._opts);
    opts = utils.extend(defaultOpts, opts);

    var shiftyEasing = this._easing(opts.easing);
    var values = this._resolveFromAndTo(progress, shiftyEasing, passedOpts);

    this.stop();

    // Trigger a layout so styles are calculated & the browser
    // picks up the starting position before animating
    this.path.getBoundingClientRect();

    var offset = this._getComputedDashOffset();
    var newOffset = this._progressToOffset(progress);

    var self = this;
    this._tweenable = new Tweenable();
    this._tweenable.tween({
        from: utils.extend({ offset: offset }, values.from),
        to: utils.extend({ offset: newOffset }, values.to),
        duration: opts.duration,
        easing: shiftyEasing,
        step: function(state) {
            self.path.style.strokeDashoffset = state.offset;
            var reference = opts.shape || self;
            opts.step(state, reference, opts.attachment);
        },
        finish: function(state) {
            if (utils.isFunction(cb)) {
                cb();
            }
        }
    });
};

Path.prototype._getComputedDashOffset = function _getComputedDashOffset() {
    var computedStyle = window.getComputedStyle(this.path, null);
    return parseFloat(computedStyle.getPropertyValue('stroke-dashoffset'), 10);
};

Path.prototype._progressToOffset = function _progressToOffset(progress) {
    var length = this.path.getTotalLength();
    return length - progress * length;
};

// Resolves from and to values for animation.
Path.prototype._resolveFromAndTo = function _resolveFromAndTo(progress, easing, opts) {
    if (opts.from && opts.to) {
        return {
            from: opts.from,
            to: opts.to
        };
    }

    return {
        from: this._calculateFrom(easing),
        to: this._calculateTo(progress, easing)
    };
};

// Calculate `from` values from options passed at initialization
Path.prototype._calculateFrom = function _calculateFrom(easing) {
    return Tweenable.interpolate(this._opts.from, this._opts.to, this.value(), easing);
};

// Calculate `to` values from options passed at initialization
Path.prototype._calculateTo = function _calculateTo(progress, easing) {
    return Tweenable.interpolate(this._opts.from, this._opts.to, progress, easing);
};

Path.prototype._stopTween = function _stopTween() {
    if (this._tweenable !== null) {
        this._tweenable.stop();
        this._tweenable.dispose();
        this._tweenable = null;
    }
};

Path.prototype._easing = function _easing(easing) {
    if (EASING_ALIASES.hasOwnProperty(easing)) {
        return EASING_ALIASES[easing];
    }

    return easing;
};

module.exports = Path;

},{"./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js","shifty":"/Users/nick/Desktop/mithical/node_modules/shifty/dist/shifty.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/semicircle.js":[function(require,module,exports){
// Semi-SemiCircle shaped progress bar

var Shape = require('./shape');
var Circle = require('./circle');
var utils = require('./utils');

var SemiCircle = function SemiCircle(container, options) {
    // Use one arc to form a SemiCircle
    // See this answer http://stackoverflow.com/a/10477334/1446092
    this._pathTemplate =
        'M 50,50 m -{radius},0' +
        ' a {radius},{radius} 0 1 1 {2radius},0';

    Shape.apply(this, arguments);
};

SemiCircle.prototype = new Shape();
SemiCircle.prototype.constructor = SemiCircle;

SemiCircle.prototype._initializeSvg = function _initializeSvg(svg, opts) {
    svg.setAttribute('viewBox', '0 0 100 50');
};

SemiCircle.prototype._initializeTextElement = function _initializeTextElement(
    opts,
    container,
    element
) {
    if (opts.text.style) {
        // Reset top style
        element.style.top = 'auto';

        element.style.bottom = '0';
        if (opts.text.alignToBottom) {
            utils.setStyle(element, 'transform', 'translate(-50%, 0)');
        } else {
            utils.setStyle(element, 'transform', 'translate(-50%, 50%)');
        }
    }
};

// Share functionality with Circle, just have different path
SemiCircle.prototype._pathString = Circle.prototype._pathString;
SemiCircle.prototype._trailString = Circle.prototype._trailString;

module.exports = SemiCircle;

},{"./circle":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/circle.js","./shape":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/shape.js","./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/shape.js":[function(require,module,exports){
// Base object for different progress bar shapes

var Path = require('./path');
var utils = require('./utils');

var DESTROYED_ERROR = 'Object is destroyed';

var Shape = function Shape(container, opts) {
    // Throw a better error if progress bars are not initialized with `new`
    // keyword
    if (!(this instanceof Shape)) {
        throw new Error('Constructor was called without new keyword');
    }

    // Prevent calling constructor without parameters so inheritance
    // works correctly. To understand, this is how Shape is inherited:
    //
    //   Line.prototype = new Shape();
    //
    // We just want to set the prototype for Line.
    if (arguments.length === 0) {
        return;
    }

    // Default parameters for progress bar creation
    this._opts = utils.extend({
        color: '#555',
        strokeWidth: 1.0,
        trailColor: null,
        trailWidth: null,
        fill: null,
        text: {
            style: {
                color: null,
                position: 'absolute',
                left: '50%',
                top: '50%',
                padding: 0,
                margin: 0,
                transform: {
                    prefix: true,
                    value: 'translate(-50%, -50%)'
                }
            },
            alignToBottom: true,
            value: '',
            className: 'progressbar-text'
        },
        svgStyle: {
            display: 'block',
            width: '100%'
        }
    }, opts, true);  // Use recursive extend

    var svgView = this._createSvgView(this._opts);

    var element;
    if (utils.isString(container)) {
        element = document.querySelector(container);
    } else {
        element = container;
    }

    if (!element) {
        throw new Error('Container does not exist: ' + container);
    }

    this._container = element;
    this._container.appendChild(svgView.svg);

    if (this._opts.svgStyle) {
        utils.setStyles(svgView.svg, this._opts.svgStyle);
    }

    this.text = null;
    if (this._opts.text.value) {
        this.text = this._createTextElement(this._opts, this._container);
        this._container.appendChild(this.text);
    }

    // Expose public attributes before Path initialization
    this.svg = svgView.svg;
    this.path = svgView.path;
    this.trail = svgView.trail;
    // this.text is also a public attribute

    var newOpts = utils.extend({
        attachment: undefined,
        shape: this
    }, this._opts);
    this._progressPath = new Path(svgView.path, newOpts);
};

Shape.prototype.animate = function animate(progress, opts, cb) {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    this._progressPath.animate(progress, opts, cb);
};

Shape.prototype.stop = function stop() {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    // Don't crash if stop is called inside step function
    if (this._progressPath === undefined) {
        return;
    }

    this._progressPath.stop();
};

Shape.prototype.destroy = function destroy() {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    this.stop();
    this.svg.parentNode.removeChild(this.svg);
    this.svg = null;
    this.path = null;
    this.trail = null;
    this._progressPath = null;

    if (this.text !== null) {
        this.text.parentNode.removeChild(this.text);
        this.text = null;
    }
};

Shape.prototype.set = function set(progress) {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    this._progressPath.set(progress);
};

Shape.prototype.value = function value() {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    if (this._progressPath === undefined) {
        return 0;
    }

    return this._progressPath.value();
};

Shape.prototype.setText = function setText(text) {
    if (this._progressPath === null) {
        throw new Error(DESTROYED_ERROR);
    }

    if (this.text === null) {
        // Create new text node
        this.text = this._createTextElement(this._opts, this._container);
        this._container.appendChild(this.text);
    }

    // Remove previous text node and add new
    this.text.removeChild(this.text.firstChild);
    this.text.appendChild(document.createTextNode(text));
};

Shape.prototype._createSvgView = function _createSvgView(opts) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._initializeSvg(svg, opts);

    var trailPath = null;
    // Each option listed in the if condition are 'triggers' for creating
    // the trail path
    if (opts.trailColor || opts.trailWidth) {
        trailPath = this._createTrail(opts);
        svg.appendChild(trailPath);
    }

    var path = this._createPath(opts);
    svg.appendChild(path);

    return {
        svg: svg,
        path: path,
        trail: trailPath
    };
};

Shape.prototype._initializeSvg = function _initializeSvg(svg, opts) {
    svg.setAttribute('viewBox', '0 0 100 100');
};

Shape.prototype._createPath = function _createPath(opts) {
    var pathString = this._pathString(opts);
    return this._createPathElement(pathString, opts);
};

Shape.prototype._createTrail = function _createTrail(opts) {
    // Create path string with original passed options
    var pathString = this._trailString(opts);

    // Prevent modifying original
    var newOpts = utils.extend({}, opts);

    // Defaults for parameters which modify trail path
    if (!newOpts.trailColor) {
        newOpts.trailColor = '#eee';
    }
    if (!newOpts.trailWidth) {
        newOpts.trailWidth = newOpts.strokeWidth;
    }

    newOpts.color = newOpts.trailColor;
    newOpts.strokeWidth = newOpts.trailWidth;

    // When trail path is set, fill must be set for it instead of the
    // actual path to prevent trail stroke from clipping
    newOpts.fill = null;

    return this._createPathElement(pathString, newOpts);
};

Shape.prototype._createPathElement = function _createPathElement(pathString, opts) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathString);
    path.setAttribute('stroke', opts.color);
    path.setAttribute('stroke-width', opts.strokeWidth);

    if (opts.fill) {
        path.setAttribute('fill', opts.fill);
    } else {
        path.setAttribute('fill-opacity', '0');
    }

    return path;
};

Shape.prototype._createTextElement = function _createTextElement(opts, container) {
    var element = document.createElement('p');
    element.appendChild(document.createTextNode(opts.text.value));

    var textStyle = opts.text.style;
    if (textStyle) {
        container.style.position = 'relative';

        utils.setStyles(element, textStyle);

        // Default text color to progress bar's color
        if (!textStyle.color) {
            element.style.color = opts.color;
        }
    }

    element.className = opts.text.className;

    this._initializeTextElement(opts, container, element);
    return element;
};

// Give custom shapes possibility to modify text element
Shape.prototype._initializeTextElement = function _initializeTextElement(opts, container, element) {
    // By default, no-op
    // Custom shapes should respect API options, such as text.style
};

Shape.prototype._pathString = function _pathString(opts) {
    throw new Error('Override this function for each progress bar');
};

Shape.prototype._trailString = function _trailString(opts) {
    throw new Error('Override this function for each progress bar');
};

module.exports = Shape;

},{"./path":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/path.js","./utils":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js"}],"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/utils.js":[function(require,module,exports){
// Utility functions

var PREFIXES = 'Webkit Moz O ms'.split(' ');

// Copy all attributes from source object to destination object.
// destination object is mutated.
function extend(destination, source, recursive) {
    destination = destination || {};
    source = source || {};
    recursive = recursive || false;

    for (var attrName in source) {
        if (source.hasOwnProperty(attrName)) {
            var destVal = destination[attrName];
            var sourceVal = source[attrName];
            if (recursive && isObject(destVal) && isObject(sourceVal)) {
                destination[attrName] = extend(destVal, sourceVal, recursive);
            } else {
                destination[attrName] = sourceVal;
            }
        }
    }

    return destination;
}

// Renders templates with given variables. Variables must be surrounded with
// braces without any spaces, e.g. {variable}
// All instances of variable placeholders will be replaced with given content
// Example:
// render('Hello, {message}!', {message: 'world'})
function render(template, vars) {
    var rendered = template;

    for (var key in vars) {
        if (vars.hasOwnProperty(key)) {
            var val = vars[key];
            var regExpString = '\\{' + key + '\\}';
            var regExp = new RegExp(regExpString, 'g');

            rendered = rendered.replace(regExp, val);
        }
    }

    return rendered;
}

function setStyle(element, style, value) {
    for (var i = 0; i < PREFIXES.length; ++i) {
        var prefix = PREFIXES[i];
        element.style[prefix + capitalize(style)] = value;
    }

    element.style[style] = value;
}

function setStyles(element, styles) {
    forEachObject(styles, function(styleValue, styleName) {
        // Allow disabling some individual styles by setting them
        // to null or undefined
        if (styleValue === null || styleValue === undefined) {
            return;
        }

        // If style's value is {prefix: true, value: '50%'},
        // Set also browser prefixed styles
        if (isObject(styleValue) && styleValue.prefix === true) {
            setStyle(element, styleName, styleValue.value);
        } else {
            element.style[styleName] = styleValue;
        }
    });
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

// Returns true if `obj` is object as in {a: 1, b: 2}, not if it's function or
// array
function isObject(obj) {
    if (isArray(obj)) {
        return false;
    }

    var type = typeof obj;
    return type === 'object' && !!obj;
}

function forEachObject(object, callback) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            var val = object[key];
            callback(val, key);
        }
    }
}

module.exports = {
    extend: extend,
    render: render,
    setStyle: setStyle,
    setStyles: setStyles,
    capitalize: capitalize,
    isString: isString,
    isFunction: isFunction,
    isObject: isObject,
    forEachObject: forEachObject
};

},{}],"/Users/nick/Desktop/mithical/node_modules/shifty/dist/shifty.js":[function(require,module,exports){
/*! shifty - v1.5.0 - 2015-05-31 - http://jeremyckahn.github.io/shifty */
;(function () {
  var root = this;

/*!
 * Shifty Core
 * By Jeremy Kahn - jeremyckahn@gmail.com
 */

var Tweenable = (function () {

  'use strict';

  // Aliases that get defined later in this function
  var formula;

  // CONSTANTS
  var DEFAULT_SCHEDULE_FUNCTION;
  var DEFAULT_EASING = 'linear';
  var DEFAULT_DURATION = 500;
  var UPDATE_TIME = 1000 / 60;

  var _now = Date.now
       ? Date.now
       : function () {return +new Date();};

  var now = typeof SHIFTY_DEBUG_NOW !== 'undefined' ? SHIFTY_DEBUG_NOW : _now;

  if (typeof window !== 'undefined') {
    // requestAnimationFrame() shim by Paul Irish (modified for Shifty)
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    DEFAULT_SCHEDULE_FUNCTION = window.requestAnimationFrame
       || window.webkitRequestAnimationFrame
       || window.oRequestAnimationFrame
       || window.msRequestAnimationFrame
       || (window.mozCancelRequestAnimationFrame
       && window.mozRequestAnimationFrame)
       || setTimeout;
  } else {
    DEFAULT_SCHEDULE_FUNCTION = setTimeout;
  }

  function noop () {
    // NOOP!
  }

  /*!
   * Handy shortcut for doing a for-in loop. This is not a "normal" each
   * function, it is optimized for Shifty.  The iterator function only receives
   * the property name, not the value.
   * @param {Object} obj
   * @param {Function(string)} fn
   */
  function each (obj, fn) {
    var key;
    for (key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        fn(key);
      }
    }
  }

  /*!
   * Perform a shallow copy of Object properties.
   * @param {Object} targetObject The object to copy into
   * @param {Object} srcObject The object to copy from
   * @return {Object} A reference to the augmented `targetObj` Object
   */
  function shallowCopy (targetObj, srcObj) {
    each(srcObj, function (prop) {
      targetObj[prop] = srcObj[prop];
    });

    return targetObj;
  }

  /*!
   * Copies each property from src onto target, but only if the property to
   * copy to target is undefined.
   * @param {Object} target Missing properties in this Object are filled in
   * @param {Object} src
   */
  function defaults (target, src) {
    each(src, function (prop) {
      if (typeof target[prop] === 'undefined') {
        target[prop] = src[prop];
      }
    });
  }

  /*!
   * Calculates the interpolated tween values of an Object for a given
   * timestamp.
   * @param {Number} forPosition The position to compute the state for.
   * @param {Object} currentState Current state properties.
   * @param {Object} originalState: The original state properties the Object is
   * tweening from.
   * @param {Object} targetState: The destination state properties the Object
   * is tweening to.
   * @param {number} duration: The length of the tween in milliseconds.
   * @param {number} timestamp: The UNIX epoch time at which the tween began.
   * @param {Object} easing: This Object's keys must correspond to the keys in
   * targetState.
   */
  function tweenProps (forPosition, currentState, originalState, targetState,
    duration, timestamp, easing) {
    var normalizedPosition =
        forPosition < timestamp ? 0 : (forPosition - timestamp) / duration;


    var prop;
    var easingObjectProp;
    var easingFn;
    for (prop in currentState) {
      if (currentState.hasOwnProperty(prop)) {
        easingObjectProp = easing[prop];
        easingFn = typeof easingObjectProp === 'function'
          ? easingObjectProp
          : formula[easingObjectProp];

        currentState[prop] = tweenProp(
          originalState[prop],
          targetState[prop],
          easingFn,
          normalizedPosition
        );
      }
    }

    return currentState;
  }

  /*!
   * Tweens a single property.
   * @param {number} start The value that the tween started from.
   * @param {number} end The value that the tween should end at.
   * @param {Function} easingFunc The easing curve to apply to the tween.
   * @param {number} position The normalized position (between 0.0 and 1.0) to
   * calculate the midpoint of 'start' and 'end' against.
   * @return {number} The tweened value.
   */
  function tweenProp (start, end, easingFunc, position) {
    return start + (end - start) * easingFunc(position);
  }

  /*!
   * Applies a filter to Tweenable instance.
   * @param {Tweenable} tweenable The `Tweenable` instance to call the filter
   * upon.
   * @param {String} filterName The name of the filter to apply.
   */
  function applyFilter (tweenable, filterName) {
    var filters = Tweenable.prototype.filter;
    var args = tweenable._filterArgs;

    each(filters, function (name) {
      if (typeof filters[name][filterName] !== 'undefined') {
        filters[name][filterName].apply(tweenable, args);
      }
    });
  }

  var timeoutHandler_endTime;
  var timeoutHandler_currentTime;
  var timeoutHandler_isEnded;
  var timeoutHandler_offset;
  /*!
   * Handles the update logic for one step of a tween.
   * @param {Tweenable} tweenable
   * @param {number} timestamp
   * @param {number} delay
   * @param {number} duration
   * @param {Object} currentState
   * @param {Object} originalState
   * @param {Object} targetState
   * @param {Object} easing
   * @param {Function(Object, *, number)} step
   * @param {Function(Function,number)}} schedule
   * @param {number=} opt_currentTimeOverride Needed for accurate timestamp in
   * Tweenable#seek.
   */
  function timeoutHandler (tweenable, timestamp, delay, duration, currentState,
    originalState, targetState, easing, step, schedule,
    opt_currentTimeOverride) {

    timeoutHandler_endTime = timestamp + delay + duration;

    timeoutHandler_currentTime =
    Math.min(opt_currentTimeOverride || now(), timeoutHandler_endTime);

    timeoutHandler_isEnded =
      timeoutHandler_currentTime >= timeoutHandler_endTime;

    timeoutHandler_offset = duration - (
      timeoutHandler_endTime - timeoutHandler_currentTime);

    if (tweenable.isPlaying() && !timeoutHandler_isEnded) {
      tweenable._scheduleId = schedule(tweenable._timeoutHandler, UPDATE_TIME);

      applyFilter(tweenable, 'beforeTween');

      // If the animation has not yet reached the start point (e.g., there was
      // delay that has not yet completed), just interpolate the starting
      // position of the tween.
      if (timeoutHandler_currentTime < (timestamp + delay)) {
        tweenProps(1, currentState, originalState, targetState, 1, 1, easing);
      } else {
        tweenProps(timeoutHandler_currentTime, currentState, originalState,
          targetState, duration, timestamp + delay, easing);
      }

      applyFilter(tweenable, 'afterTween');

      step(currentState, tweenable._attachment, timeoutHandler_offset);
    } else if (tweenable.isPlaying() && timeoutHandler_isEnded) {
      step(targetState, tweenable._attachment, timeoutHandler_offset);
      tweenable.stop(true);
    }
  }


  /*!
   * Creates a usable easing Object from a string, a function or another easing
   * Object.  If `easing` is an Object, then this function clones it and fills
   * in the missing properties with `"linear"`.
   * @param {Object.<string|Function>} fromTweenParams
   * @param {Object|string|Function} easing
   * @return {Object.<string|Function>}
   */
  function composeEasingObject (fromTweenParams, easing) {
    var composedEasing = {};
    var typeofEasing = typeof easing;

    if (typeofEasing === 'string' || typeofEasing === 'function') {
      each(fromTweenParams, function (prop) {
        composedEasing[prop] = easing;
      });
    } else {
      each(fromTweenParams, function (prop) {
        if (!composedEasing[prop]) {
          composedEasing[prop] = easing[prop] || DEFAULT_EASING;
        }
      });
    }

    return composedEasing;
  }

  /**
   * Tweenable constructor.
   * @class Tweenable
   * @param {Object=} opt_initialState The values that the initial tween should
   * start at if a `from` object is not provided to `{{#crossLink
   * "Tweenable/tween:method"}}{{/crossLink}}` or `{{#crossLink
   * "Tweenable/setConfig:method"}}{{/crossLink}}`.
   * @param {Object=} opt_config Configuration object to be passed to
   * `{{#crossLink "Tweenable/setConfig:method"}}{{/crossLink}}`.
   * @module Tweenable
   * @constructor
   */
  function Tweenable (opt_initialState, opt_config) {
    this._currentState = opt_initialState || {};
    this._configured = false;
    this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;

    // To prevent unnecessary calls to setConfig do not set default
    // configuration here.  Only set default configuration immediately before
    // tweening if none has been set.
    if (typeof opt_config !== 'undefined') {
      this.setConfig(opt_config);
    }
  }

  /**
   * Configure and start a tween.
   * @method tween
   * @param {Object=} opt_config Configuration object to be passed to
   * `{{#crossLink "Tweenable/setConfig:method"}}{{/crossLink}}`.
   * @chainable
   */
  Tweenable.prototype.tween = function (opt_config) {
    if (this._isTweening) {
      return this;
    }

    // Only set default config if no configuration has been set previously and
    // none is provided now.
    if (opt_config !== undefined || !this._configured) {
      this.setConfig(opt_config);
    }

    this._timestamp = now();
    this._start(this.get(), this._attachment);
    return this.resume();
  };

  /**
   * Configure a tween that will start at some point in the future.
   *
   * @method setConfig
   * @param {Object} config The following values are valid:
   * - __from__ (_Object=_): Starting position.  If omitted, `{{#crossLink
   *   "Tweenable/get:method"}}get(){{/crossLink}}` is used.
   * - __to__ (_Object=_): Ending position.
   * - __duration__ (_number=_): How many milliseconds to animate for.
   * - __delay__ (_delay=_): How many milliseconds to wait before starting the
   *   tween.
   * - __start__ (_Function(Object, *)_): Function to execute when the tween
   *   begins.  Receives the state of the tween as the first parameter and
   *   `attachment` as the second parameter.
   * - __step__ (_Function(Object, *, number)_): Function to execute on every
   *   tick.  Receives `{{#crossLink
   *   "Tweenable/get:method"}}get(){{/crossLink}}` as the first parameter,
   *   `attachment` as the second parameter, and the time elapsed since the
   *   start of the tween as the third. This function is not called on the
   *   final step of the animation, but `finish` is.
   * - __finish__ (_Function(Object, *)_): Function to execute upon tween
   *   completion.  Receives the state of the tween as the first parameter and
   *   `attachment` as the second parameter.
   * - __easing__ (_Object.<string|Function>|string|Function=_): Easing curve
   *   name(s) or function(s) to use for the tween.
   * - __attachment__ (_*_): Cached value that is passed to the
   *   `step`/`start`/`finish` methods.
   * @chainable
   */
  Tweenable.prototype.setConfig = function (config) {
    config = config || {};
    this._configured = true;

    // Attach something to this Tweenable instance (e.g.: a DOM element, an
    // object, a string, etc.);
    this._attachment = config.attachment;

    // Init the internal state
    this._pausedAtTime = null;
    this._scheduleId = null;
    this._delay = config.delay || 0;
    this._start = config.start || noop;
    this._step = config.step || noop;
    this._finish = config.finish || noop;
    this._duration = config.duration || DEFAULT_DURATION;
    this._currentState = shallowCopy({}, config.from) || this.get();
    this._originalState = this.get();
    this._targetState = shallowCopy({}, config.to) || this.get();

    var self = this;
    this._timeoutHandler = function () {
      timeoutHandler(self,
        self._timestamp,
        self._delay,
        self._duration,
        self._currentState,
        self._originalState,
        self._targetState,
        self._easing,
        self._step,
        self._scheduleFunction
      );
    };

    // Aliases used below
    var currentState = this._currentState;
    var targetState = this._targetState;

    // Ensure that there is always something to tween to.
    defaults(targetState, currentState);

    this._easing = composeEasingObject(
      currentState, config.easing || DEFAULT_EASING);

    this._filterArgs =
      [currentState, this._originalState, targetState, this._easing];

    applyFilter(this, 'tweenCreated');
    return this;
  };

  /**
   * @method get
   * @return {Object} The current state.
   */
  Tweenable.prototype.get = function () {
    return shallowCopy({}, this._currentState);
  };

  /**
   * @method set
   * @param {Object} state The current state.
   */
  Tweenable.prototype.set = function (state) {
    this._currentState = state;
  };

  /**
   * Pause a tween.  Paused tweens can be resumed from the point at which they
   * were paused.  This is different from `{{#crossLink
   * "Tweenable/stop:method"}}{{/crossLink}}`, as that method
   * causes a tween to start over when it is resumed.
   * @method pause
   * @chainable
   */
  Tweenable.prototype.pause = function () {
    this._pausedAtTime = now();
    this._isPaused = true;
    return this;
  };

  /**
   * Resume a paused tween.
   * @method resume
   * @chainable
   */
  Tweenable.prototype.resume = function () {
    if (this._isPaused) {
      this._timestamp += now() - this._pausedAtTime;
    }

    this._isPaused = false;
    this._isTweening = true;

    this._timeoutHandler();

    return this;
  };

  /**
   * Move the state of the animation to a specific point in the tween's
   * timeline.  If the animation is not running, this will cause the `step`
   * handlers to be called.
   * @method seek
   * @param {millisecond} millisecond The millisecond of the animation to seek
   * to.  This must not be less than `0`.
   * @chainable
   */
  Tweenable.prototype.seek = function (millisecond) {
    millisecond = Math.max(millisecond, 0);
    var currentTime = now();

    if ((this._timestamp + millisecond) === 0) {
      return this;
    }

    this._timestamp = currentTime - millisecond;

    if (!this.isPlaying()) {
      this._isTweening = true;
      this._isPaused = false;

      // If the animation is not running, call timeoutHandler to make sure that
      // any step handlers are run.
      timeoutHandler(this,
        this._timestamp,
        this._delay,
        this._duration,
        this._currentState,
        this._originalState,
        this._targetState,
        this._easing,
        this._step,
        this._scheduleFunction,
        currentTime
      );

      this.pause();
    }

    return this;
  };

  /**
   * Stops and cancels a tween.
   * @param {boolean=} gotoEnd If `false` or omitted, the tween just stops at
   * its current state, and the `finish` handler is not invoked.  If `true`,
   * the tweened object's values are instantly set to the target values, and
   * `finish` is invoked.
   * @method stop
   * @chainable
   */
  Tweenable.prototype.stop = function (gotoEnd) {
    this._isTweening = false;
    this._isPaused = false;
    this._timeoutHandler = noop;

    (root.cancelAnimationFrame            ||
    root.webkitCancelAnimationFrame     ||
    root.oCancelAnimationFrame          ||
    root.msCancelAnimationFrame         ||
    root.mozCancelRequestAnimationFrame ||
    root.clearTimeout)(this._scheduleId);

    if (gotoEnd) {
      applyFilter(this, 'beforeTween');
      tweenProps(
        1,
        this._currentState,
        this._originalState,
        this._targetState,
        1,
        0,
        this._easing
      );
      applyFilter(this, 'afterTween');
      applyFilter(this, 'afterTweenEnd');
      this._finish.call(this, this._currentState, this._attachment);
    }

    return this;
  };

  /**
   * @method isPlaying
   * @return {boolean} Whether or not a tween is running.
   */
  Tweenable.prototype.isPlaying = function () {
    return this._isTweening && !this._isPaused;
  };

  /**
   * Set a custom schedule function.
   *
   * If a custom function is not set,
   * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame)
   * is used if available, otherwise
   * [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout)
   * is used.
   * @method setScheduleFunction
   * @param {Function(Function,number)} scheduleFunction The function to be
   * used to schedule the next frame to be rendered.
   */
  Tweenable.prototype.setScheduleFunction = function (scheduleFunction) {
    this._scheduleFunction = scheduleFunction;
  };

  /**
   * `delete` all "own" properties.  Call this when the `Tweenable` instance
   * is no longer needed to free memory.
   * @method dispose
   */
  Tweenable.prototype.dispose = function () {
    var prop;
    for (prop in this) {
      if (this.hasOwnProperty(prop)) {
        delete this[prop];
      }
    }
  };

  /*!
   * Filters are used for transforming the properties of a tween at various
   * points in a Tweenable's life cycle.  See the README for more info on this.
   */
  Tweenable.prototype.filter = {};

  /**
   * This object contains all of the tweens available to Shifty.  It is
   * extensible - simply attach properties to the `Tweenable.prototype.formula`
   * Object following the same format as `linear`.
   *
   * `pos` should be a normalized `number` (between 0 and 1).
   * @property formula
   * @type {Object(function)}
   */
  Tweenable.prototype.formula = {
    linear: function (pos) {
      return pos;
    }
  };

  formula = Tweenable.prototype.formula;

  shallowCopy(Tweenable, {
    'now': now
    ,'each': each
    ,'tweenProps': tweenProps
    ,'tweenProp': tweenProp
    ,'applyFilter': applyFilter
    ,'shallowCopy': shallowCopy
    ,'defaults': defaults
    ,'composeEasingObject': composeEasingObject
  });

  // `root` is provided in the intro/outro files.

  // A hook used for unit testing.
  if (typeof SHIFTY_DEBUG_NOW === 'function') {
    root.timeoutHandler = timeoutHandler;
  }

  // Bootstrap Tweenable appropriately for the environment.
  if (typeof exports === 'object') {
    // CommonJS
    module.exports = Tweenable;
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(function () {return Tweenable;});
  } else if (typeof root.Tweenable === 'undefined') {
    // Browser: Make `Tweenable` globally accessible.
    root.Tweenable = Tweenable;
  }

  return Tweenable;

} ());

/*!
 * All equations are adapted from Thomas Fuchs'
 * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js).
 *
 * Based on Easing Equations (c) 2003 [Robert
 * Penner](http://www.robertpenner.com/), all rights reserved. This work is
 * [subject to terms](http://www.robertpenner.com/easing_terms_of_use.html).
 */

/*!
 *  TERMS OF USE - EASING EQUATIONS
 *  Open source under the BSD License.
 *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
 */

;(function () {

  Tweenable.shallowCopy(Tweenable.prototype.formula, {
    easeInQuad: function (pos) {
      return Math.pow(pos, 2);
    },

    easeOutQuad: function (pos) {
      return -(Math.pow((pos - 1), 2) - 1);
    },

    easeInOutQuad: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,2);}
      return -0.5 * ((pos -= 2) * pos - 2);
    },

    easeInCubic: function (pos) {
      return Math.pow(pos, 3);
    },

    easeOutCubic: function (pos) {
      return (Math.pow((pos - 1), 3) + 1);
    },

    easeInOutCubic: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,3);}
      return 0.5 * (Math.pow((pos - 2),3) + 2);
    },

    easeInQuart: function (pos) {
      return Math.pow(pos, 4);
    },

    easeOutQuart: function (pos) {
      return -(Math.pow((pos - 1), 4) - 1);
    },

    easeInOutQuart: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
      return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
    },

    easeInQuint: function (pos) {
      return Math.pow(pos, 5);
    },

    easeOutQuint: function (pos) {
      return (Math.pow((pos - 1), 5) + 1);
    },

    easeInOutQuint: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,5);}
      return 0.5 * (Math.pow((pos - 2),5) + 2);
    },

    easeInSine: function (pos) {
      return -Math.cos(pos * (Math.PI / 2)) + 1;
    },

    easeOutSine: function (pos) {
      return Math.sin(pos * (Math.PI / 2));
    },

    easeInOutSine: function (pos) {
      return (-0.5 * (Math.cos(Math.PI * pos) - 1));
    },

    easeInExpo: function (pos) {
      return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
    },

    easeOutExpo: function (pos) {
      return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
    },

    easeInOutExpo: function (pos) {
      if (pos === 0) {return 0;}
      if (pos === 1) {return 1;}
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(2,10 * (pos - 1));}
      return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },

    easeInCirc: function (pos) {
      return -(Math.sqrt(1 - (pos * pos)) - 1);
    },

    easeOutCirc: function (pos) {
      return Math.sqrt(1 - Math.pow((pos - 1), 2));
    },

    easeInOutCirc: function (pos) {
      if ((pos /= 0.5) < 1) {return -0.5 * (Math.sqrt(1 - pos * pos) - 1);}
      return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
    },

    easeOutBounce: function (pos) {
      if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    easeInBack: function (pos) {
      var s = 1.70158;
      return (pos) * pos * ((s + 1) * pos - s);
    },

    easeOutBack: function (pos) {
      var s = 1.70158;
      return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
    },

    easeInOutBack: function (pos) {
      var s = 1.70158;
      if ((pos /= 0.5) < 1) {
        return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
      }
      return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },

    elastic: function (pos) {
      // jshint maxlen:90
      return -1 * Math.pow(4,-8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
    },

    swingFromTo: function (pos) {
      var s = 1.70158;
      return ((pos /= 0.5) < 1) ?
          0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
          0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },

    swingFrom: function (pos) {
      var s = 1.70158;
      return pos * pos * ((s + 1) * pos - s);
    },

    swingTo: function (pos) {
      var s = 1.70158;
      return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
    },

    bounce: function (pos) {
      if (pos < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    bouncePast: function (pos) {
      if (pos < (1 / 2.75)) {
        return (7.5625 * pos * pos);
      } else if (pos < (2 / 2.75)) {
        return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
      } else if (pos < (2.5 / 2.75)) {
        return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
      } else {
        return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
      }
    },

    easeFromTo: function (pos) {
      if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
      return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
    },

    easeFrom: function (pos) {
      return Math.pow(pos,4);
    },

    easeTo: function (pos) {
      return Math.pow(pos,0.25);
    }
  });

}());

// jshint maxlen:100
/*!
 * The Bezier magic in this file is adapted/copied almost wholesale from
 * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/cubic-bezier.js),
 * which was adapted from Apple code (which probably came from
 * [here](http://opensource.apple.com/source/WebCore/WebCore-955.66/platform/graphics/UnitBezier.h)).
 * Special thanks to Apple and Thomas Fuchs for much of this code.
 */

/*!
 *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice,
 *  this list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation
 *  and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder(s) nor the names of any
 *  contributors may be used to endorse or promote products derived from
 *  this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
;(function () {
  // port of webkit cubic bezier handling by http://www.netzgesta.de/dev/
  function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
    var ax = 0,bx = 0,cx = 0,ay = 0,by = 0,cy = 0;
    function sampleCurveX(t) {
      return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }
    function solveEpsilon(duration) {
      return 1.0 / (200.0 * duration);
    }
    function solve(x,epsilon) {
      return sampleCurveY(solveCurveX(x, epsilon));
    }
    function fabs(n) {
      if (n >= 0) {
        return n;
      } else {
        return 0 - n;
      }
    }
    function solveCurveX(x, epsilon) {
      var t0,t1,t2,x2,d2,i;
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = sampleCurveX(t2) - x;
        if (fabs(x2) < epsilon) {
          return t2;
        }
        d2 = sampleCurveDerivativeX(t2);
        if (fabs(d2) < 1e-6) {
          break;
        }
        t2 = t2 - x2 / d2;
      }
      t0 = 0.0;
      t1 = 1.0;
      t2 = x;
      if (t2 < t0) {
        return t0;
      }
      if (t2 > t1) {
        return t1;
      }
      while (t0 < t1) {
        x2 = sampleCurveX(t2);
        if (fabs(x2 - x) < epsilon) {
          return t2;
        }
        if (x > x2) {
          t0 = t2;
        }else {
          t1 = t2;
        }
        t2 = (t1 - t0) * 0.5 + t0;
      }
      return t2; // Failure.
    }
    cx = 3.0 * p1x;
    bx = 3.0 * (p2x - p1x) - cx;
    ax = 1.0 - cx - bx;
    cy = 3.0 * p1y;
    by = 3.0 * (p2y - p1y) - cy;
    ay = 1.0 - cy - by;
    return solve(t, solveEpsilon(duration));
  }
  /*!
   *  getCubicBezierTransition(x1, y1, x2, y2) -> Function
   *
   *  Generates a transition easing function that is compatible
   *  with WebKit's CSS transitions `-webkit-transition-timing-function`
   *  CSS property.
   *
   *  The W3C has more information about CSS3 transition timing functions:
   *  http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
   *
   *  @param {number} x1
   *  @param {number} y1
   *  @param {number} x2
   *  @param {number} y2
   *  @return {function}
   */
  function getCubicBezierTransition (x1, y1, x2, y2) {
    return function (pos) {
      return cubicBezierAtTime(pos,x1,y1,x2,y2,1);
    };
  }
  // End ported code

  /**
   * Create a Bezier easing function and attach it to `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}`.  This
   * function gives you total control over the easing curve.  Matthew Lein's
   * [Ceaser](http://matthewlein.com/ceaser/) is a useful tool for visualizing
   * the curves you can make with this function.
   * @method setBezierFunction
   * @param {string} name The name of the easing curve.  Overwrites the old
   * easing function on `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}` if it
   * exists.
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @return {function} The easing function that was attached to
   * Tweenable.prototype.formula.
   */
  Tweenable.setBezierFunction = function (name, x1, y1, x2, y2) {
    var cubicBezierTransition = getCubicBezierTransition(x1, y1, x2, y2);
    cubicBezierTransition.displayName = name;
    cubicBezierTransition.x1 = x1;
    cubicBezierTransition.y1 = y1;
    cubicBezierTransition.x2 = x2;
    cubicBezierTransition.y2 = y2;

    return Tweenable.prototype.formula[name] = cubicBezierTransition;
  };


  /**
   * `delete` an easing function from `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}`.  Be
   * careful with this method, as it `delete`s whatever easing formula matches
   * `name` (which means you can delete standard Shifty easing functions).
   * @method unsetBezierFunction
   * @param {string} name The name of the easing function to delete.
   * @return {function}
   */
  Tweenable.unsetBezierFunction = function (name) {
    delete Tweenable.prototype.formula[name];
  };

})();

;(function () {

  function getInterpolatedValues (
    from, current, targetState, position, easing, delay) {
    return Tweenable.tweenProps(
      position, current, from, targetState, 1, delay, easing);
  }

  // Fake a Tweenable and patch some internals.  This approach allows us to
  // skip uneccessary processing and object recreation, cutting down on garbage
  // collection pauses.
  var mockTweenable = new Tweenable();
  mockTweenable._filterArgs = [];

  /**
   * Compute the midpoint of two Objects.  This method effectively calculates a
   * specific frame of animation that `{{#crossLink
   * "Tweenable/tween:method"}}{{/crossLink}}` does many times over the course
   * of a full tween.
   *
   *     var interpolatedValues = Tweenable.interpolate({
   *       width: '100px',
   *       opacity: 0,
   *       color: '#fff'
   *     }, {
   *       width: '200px',
   *       opacity: 1,
   *       color: '#000'
   *     }, 0.5);
   *
   *     console.log(interpolatedValues);
   *     // {opacity: 0.5, width: "150px", color: "rgb(127,127,127)"}
   *
   * @static
   * @method interpolate
   * @param {Object} from The starting values to tween from.
   * @param {Object} targetState The ending values to tween to.
   * @param {number} position The normalized position value (between `0.0` and
   * `1.0`) to interpolate the values between `from` and `to` for.  `from`
   * represents `0` and `to` represents `1`.
   * @param {Object.<string|Function>|string|Function} easing The easing
   * curve(s) to calculate the midpoint against.  You can reference any easing
   * function attached to `Tweenable.prototype.formula`, or provide the easing
   * function(s) directly.  If omitted, this defaults to "linear".
   * @param {number=} opt_delay Optional delay to pad the beginning of the
   * interpolated tween with.  This increases the range of `position` from (`0`
   * through `1`) to (`0` through `1 + opt_delay`).  So, a delay of `0.5` would
   * increase all valid values of `position` to numbers between `0` and `1.5`.
   * @return {Object}
   */
  Tweenable.interpolate = function (
    from, targetState, position, easing, opt_delay) {

    var current = Tweenable.shallowCopy({}, from);
    var delay = opt_delay || 0;
    var easingObject = Tweenable.composeEasingObject(
      from, easing || 'linear');

    mockTweenable.set({});

    // Alias and reuse the _filterArgs array instead of recreating it.
    var filterArgs = mockTweenable._filterArgs;
    filterArgs.length = 0;
    filterArgs[0] = current;
    filterArgs[1] = from;
    filterArgs[2] = targetState;
    filterArgs[3] = easingObject;

    // Any defined value transformation must be applied
    Tweenable.applyFilter(mockTweenable, 'tweenCreated');
    Tweenable.applyFilter(mockTweenable, 'beforeTween');

    var interpolatedValues = getInterpolatedValues(
      from, current, targetState, position, easingObject, delay);

    // Transform values back into their original format
    Tweenable.applyFilter(mockTweenable, 'afterTween');

    return interpolatedValues;
  };

}());

/**
 * This module adds string interpolation support to Shifty.
 *
 * The Token extension allows Shifty to tween numbers inside of strings.  Among
 * other things, this allows you to animate CSS properties.  For example, you
 * can do this:
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90xp)' }
 *     });
 *
 * `translateX(45)` will be tweened to `translateX(90)`.  To demonstrate:
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90px)' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will log something like this in the console:
 *
 *     translateX(60.3px)
 *     ...
 *     translateX(76.05px)
 *     ...
 *     translateX(90px)
 *
 * Another use for this is animating colors:
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { color: 'rgb(0,255,0)' },
 *       to: { color: 'rgb(255,0,255)' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
 *
 * The above snippet will log something like this:
 *
 *     rgb(84,170,84)
 *     ...
 *     rgb(170,84,170)
 *     ...
 *     rgb(255,0,255)
 *
 * This extension also supports hexadecimal colors, in both long (`#ff00ff`)
 * and short (`#f0f`) forms.  Be aware that hexadecimal input values will be
 * converted into the equivalent RGB output values.  This is done to optimize
 * for performance.
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { color: '#0f0' },
 *       to: { color: '#f0f' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
 *
 * This snippet will generate the same output as the one before it because
 * equivalent values were supplied (just in hexadecimal form rather than RGB):
 *
 *     rgb(84,170,84)
 *     ...
 *     rgb(170,84,170)
 *     ...
 *     rgb(255,0,255)
 *
 * ## Easing support
 *
 * Easing works somewhat differently in the Token extension.  This is because
 * some CSS properties have multiple values in them, and you might need to
 * tween each value along its own easing curve.  A basic example:
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will create values like this:
 *
 *     translateX(11.56px) translateY(11.56px)
 *     ...
 *     translateX(46.24px) translateY(46.24px)
 *     ...
 *     translateX(100px) translateY(100px)
 *
 * In this case, the values for `translateX` and `translateY` are always the
 * same for each step of the tween, because they have the same start and end
 * points and both use the same easing curve.  We can also tween `translateX`
 * and `translateY` along independent curves:
 *
 *     var tweenable = new Tweenable();
 *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad bounce' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
 *
 * The above snippet will create values like this:
 *
 *     translateX(10.89px) translateY(82.35px)
 *     ...
 *     translateX(44.89px) translateY(86.73px)
 *     ...
 *     translateX(100px) translateY(100px)
 *
 * `translateX` and `translateY` are not in sync anymore, because `easeInQuad`
 * was specified for `translateX` and `bounce` for `translateY`.  Mixing and
 * matching easing curves can make for some interesting motion in your
 * animations.
 *
 * The order of the space-separated easing curves correspond the token values
 * they apply to.  If there are more token values than easing curves listed,
 * the last easing curve listed is used.
 * @submodule Tweenable.token
 */

// token function is defined above only so that dox-foundation sees it as
// documentation and renders it.  It is never used, and is optimized away at
// build time.

;(function (Tweenable) {

  /*!
   * @typedef {{
   *   formatString: string
   *   chunkNames: Array.<string>
   * }}
   */
  var formatManifest;

  // CONSTANTS

  var R_NUMBER_COMPONENT = /(\d|\-|\.)/;
  var R_FORMAT_CHUNKS = /([^\-0-9\.]+)/g;
  var R_UNFORMATTED_VALUES = /[0-9.\-]+/g;
  var R_RGB = new RegExp(
    'rgb\\(' + R_UNFORMATTED_VALUES.source +
    (/,\s*/.source) + R_UNFORMATTED_VALUES.source +
    (/,\s*/.source) + R_UNFORMATTED_VALUES.source + '\\)', 'g');
  var R_RGB_PREFIX = /^.*\(/;
  var R_HEX = /#([0-9]|[a-f]){3,6}/gi;
  var VALUE_PLACEHOLDER = 'VAL';

  // HELPERS

  /*!
   * @param {Array.number} rawValues
   * @param {string} prefix
   *
   * @return {Array.<string>}
   */
  function getFormatChunksFrom (rawValues, prefix) {
    var accumulator = [];

    var rawValuesLength = rawValues.length;
    var i;

    for (i = 0; i < rawValuesLength; i++) {
      accumulator.push('_' + prefix + '_' + i);
    }

    return accumulator;
  }

  /*!
   * @param {string} formattedString
   *
   * @return {string}
   */
  function getFormatStringFrom (formattedString) {
    var chunks = formattedString.match(R_FORMAT_CHUNKS);

    if (!chunks) {
      // chunks will be null if there were no tokens to parse in
      // formattedString (for example, if formattedString is '2').  Coerce
      // chunks to be useful here.
      chunks = ['', ''];

      // If there is only one chunk, assume that the string is a number
      // followed by a token...
      // NOTE: This may be an unwise assumption.
    } else if (chunks.length === 1 ||
      // ...or if the string starts with a number component (".", "-", or a
      // digit)...
    formattedString[0].match(R_NUMBER_COMPONENT)) {
      // ...prepend an empty string here to make sure that the formatted number
      // is properly replaced by VALUE_PLACEHOLDER
      chunks.unshift('');
    }

    return chunks.join(VALUE_PLACEHOLDER);
  }

  /*!
   * Convert all hex color values within a string to an rgb string.
   *
   * @param {Object} stateObject
   *
   * @return {Object} The modified obj
   */
  function sanitizeObjectForHexProps (stateObject) {
    Tweenable.each(stateObject, function (prop) {
      var currentProp = stateObject[prop];

      if (typeof currentProp === 'string' && currentProp.match(R_HEX)) {
        stateObject[prop] = sanitizeHexChunksToRGB(currentProp);
      }
    });
  }

  /*!
   * @param {string} str
   *
   * @return {string}
   */
  function  sanitizeHexChunksToRGB (str) {
    return filterStringChunks(R_HEX, str, convertHexToRGB);
  }

  /*!
   * @param {string} hexString
   *
   * @return {string}
   */
  function convertHexToRGB (hexString) {
    var rgbArr = hexToRGBArray(hexString);
    return 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')';
  }

  var hexToRGBArray_returnArray = [];
  /*!
   * Convert a hexadecimal string to an array with three items, one each for
   * the red, blue, and green decimal values.
   *
   * @param {string} hex A hexadecimal string.
   *
   * @returns {Array.<number>} The converted Array of RGB values if `hex` is a
   * valid string, or an Array of three 0's.
   */
  function hexToRGBArray (hex) {

    hex = hex.replace(/#/, '');

    // If the string is a shorthand three digit hex notation, normalize it to
    // the standard six digit notation
    if (hex.length === 3) {
      hex = hex.split('');
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    hexToRGBArray_returnArray[0] = hexToDec(hex.substr(0, 2));
    hexToRGBArray_returnArray[1] = hexToDec(hex.substr(2, 2));
    hexToRGBArray_returnArray[2] = hexToDec(hex.substr(4, 2));

    return hexToRGBArray_returnArray;
  }

  /*!
   * Convert a base-16 number to base-10.
   *
   * @param {Number|String} hex The value to convert
   *
   * @returns {Number} The base-10 equivalent of `hex`.
   */
  function hexToDec (hex) {
    return parseInt(hex, 16);
  }

  /*!
   * Runs a filter operation on all chunks of a string that match a RegExp
   *
   * @param {RegExp} pattern
   * @param {string} unfilteredString
   * @param {function(string)} filter
   *
   * @return {string}
   */
  function filterStringChunks (pattern, unfilteredString, filter) {
    var pattenMatches = unfilteredString.match(pattern);
    var filteredString = unfilteredString.replace(pattern, VALUE_PLACEHOLDER);

    if (pattenMatches) {
      var pattenMatchesLength = pattenMatches.length;
      var currentChunk;

      for (var i = 0; i < pattenMatchesLength; i++) {
        currentChunk = pattenMatches.shift();
        filteredString = filteredString.replace(
          VALUE_PLACEHOLDER, filter(currentChunk));
      }
    }

    return filteredString;
  }

  /*!
   * Check for floating point values within rgb strings and rounds them.
   *
   * @param {string} formattedString
   *
   * @return {string}
   */
  function sanitizeRGBChunks (formattedString) {
    return filterStringChunks(R_RGB, formattedString, sanitizeRGBChunk);
  }

  /*!
   * @param {string} rgbChunk
   *
   * @return {string}
   */
  function sanitizeRGBChunk (rgbChunk) {
    var numbers = rgbChunk.match(R_UNFORMATTED_VALUES);
    var numbersLength = numbers.length;
    var sanitizedString = rgbChunk.match(R_RGB_PREFIX)[0];

    for (var i = 0; i < numbersLength; i++) {
      sanitizedString += parseInt(numbers[i], 10) + ',';
    }

    sanitizedString = sanitizedString.slice(0, -1) + ')';

    return sanitizedString;
  }

  /*!
   * @param {Object} stateObject
   *
   * @return {Object} An Object of formatManifests that correspond to
   * the string properties of stateObject
   */
  function getFormatManifests (stateObject) {
    var manifestAccumulator = {};

    Tweenable.each(stateObject, function (prop) {
      var currentProp = stateObject[prop];

      if (typeof currentProp === 'string') {
        var rawValues = getValuesFrom(currentProp);

        manifestAccumulator[prop] = {
          'formatString': getFormatStringFrom(currentProp)
          ,'chunkNames': getFormatChunksFrom(rawValues, prop)
        };
      }
    });

    return manifestAccumulator;
  }

  /*!
   * @param {Object} stateObject
   * @param {Object} formatManifests
   */
  function expandFormattedProperties (stateObject, formatManifests) {
    Tweenable.each(formatManifests, function (prop) {
      var currentProp = stateObject[prop];
      var rawValues = getValuesFrom(currentProp);
      var rawValuesLength = rawValues.length;

      for (var i = 0; i < rawValuesLength; i++) {
        stateObject[formatManifests[prop].chunkNames[i]] = +rawValues[i];
      }

      delete stateObject[prop];
    });
  }

  /*!
   * @param {Object} stateObject
   * @param {Object} formatManifests
   */
  function collapseFormattedProperties (stateObject, formatManifests) {
    Tweenable.each(formatManifests, function (prop) {
      var currentProp = stateObject[prop];
      var formatChunks = extractPropertyChunks(
        stateObject, formatManifests[prop].chunkNames);
      var valuesList = getValuesList(
        formatChunks, formatManifests[prop].chunkNames);
      currentProp = getFormattedValues(
        formatManifests[prop].formatString, valuesList);
      stateObject[prop] = sanitizeRGBChunks(currentProp);
    });
  }

  /*!
   * @param {Object} stateObject
   * @param {Array.<string>} chunkNames
   *
   * @return {Object} The extracted value chunks.
   */
  function extractPropertyChunks (stateObject, chunkNames) {
    var extractedValues = {};
    var currentChunkName, chunkNamesLength = chunkNames.length;

    for (var i = 0; i < chunkNamesLength; i++) {
      currentChunkName = chunkNames[i];
      extractedValues[currentChunkName] = stateObject[currentChunkName];
      delete stateObject[currentChunkName];
    }

    return extractedValues;
  }

  var getValuesList_accumulator = [];
  /*!
   * @param {Object} stateObject
   * @param {Array.<string>} chunkNames
   *
   * @return {Array.<number>}
   */
  function getValuesList (stateObject, chunkNames) {
    getValuesList_accumulator.length = 0;
    var chunkNamesLength = chunkNames.length;

    for (var i = 0; i < chunkNamesLength; i++) {
      getValuesList_accumulator.push(stateObject[chunkNames[i]]);
    }

    return getValuesList_accumulator;
  }

  /*!
   * @param {string} formatString
   * @param {Array.<number>} rawValues
   *
   * @return {string}
   */
  function getFormattedValues (formatString, rawValues) {
    var formattedValueString = formatString;
    var rawValuesLength = rawValues.length;

    for (var i = 0; i < rawValuesLength; i++) {
      formattedValueString = formattedValueString.replace(
        VALUE_PLACEHOLDER, +rawValues[i].toFixed(4));
    }

    return formattedValueString;
  }

  /*!
   * Note: It's the duty of the caller to convert the Array elements of the
   * return value into numbers.  This is a performance optimization.
   *
   * @param {string} formattedString
   *
   * @return {Array.<string>|null}
   */
  function getValuesFrom (formattedString) {
    return formattedString.match(R_UNFORMATTED_VALUES);
  }

  /*!
   * @param {Object} easingObject
   * @param {Object} tokenData
   */
  function expandEasingObject (easingObject, tokenData) {
    Tweenable.each(tokenData, function (prop) {
      var currentProp = tokenData[prop];
      var chunkNames = currentProp.chunkNames;
      var chunkLength = chunkNames.length;

      var easing = easingObject[prop];
      var i;

      if (typeof easing === 'string') {
        var easingChunks = easing.split(' ');
        var lastEasingChunk = easingChunks[easingChunks.length - 1];

        for (i = 0; i < chunkLength; i++) {
          easingObject[chunkNames[i]] = easingChunks[i] || lastEasingChunk;
        }

      } else {
        for (i = 0; i < chunkLength; i++) {
          easingObject[chunkNames[i]] = easing;
        }
      }

      delete easingObject[prop];
    });
  }

  /*!
   * @param {Object} easingObject
   * @param {Object} tokenData
   */
  function collapseEasingObject (easingObject, tokenData) {
    Tweenable.each(tokenData, function (prop) {
      var currentProp = tokenData[prop];
      var chunkNames = currentProp.chunkNames;
      var chunkLength = chunkNames.length;

      var firstEasing = easingObject[chunkNames[0]];
      var typeofEasings = typeof firstEasing;

      if (typeofEasings === 'string') {
        var composedEasingString = '';

        for (var i = 0; i < chunkLength; i++) {
          composedEasingString += ' ' + easingObject[chunkNames[i]];
          delete easingObject[chunkNames[i]];
        }

        easingObject[prop] = composedEasingString.substr(1);
      } else {
        easingObject[prop] = firstEasing;
      }
    });
  }

  Tweenable.prototype.filter.token = {
    'tweenCreated': function (currentState, fromState, toState, easingObject) {
      sanitizeObjectForHexProps(currentState);
      sanitizeObjectForHexProps(fromState);
      sanitizeObjectForHexProps(toState);
      this._tokenData = getFormatManifests(currentState);
    },

    'beforeTween': function (currentState, fromState, toState, easingObject) {
      expandEasingObject(easingObject, this._tokenData);
      expandFormattedProperties(currentState, this._tokenData);
      expandFormattedProperties(fromState, this._tokenData);
      expandFormattedProperties(toState, this._tokenData);
    },

    'afterTween': function (currentState, fromState, toState, easingObject) {
      collapseFormattedProperties(currentState, this._tokenData);
      collapseFormattedProperties(fromState, this._tokenData);
      collapseFormattedProperties(toState, this._tokenData);
      collapseEasingObject(easingObject, this._tokenData);
    }
  };

} (Tweenable));

}).call(null);

},{}],"/Users/nick/Desktop/mithical/src/component/bar.js":[function(require,module,exports){
/* ( $ _ $ )
 *
 * Holla holla holla
 *
 */

'use strict'

let m = require('../../lib/mithril')
let ProgressBar = require('progressbar.js')

let options = {
  strokeWidth: 12.0,
  trailColor: '#eee',
  easing: 'easeInOut',
  duration: 500,
  from: { color: '#AC3232' },
  to: { color: '#99E450' },
  step: function(state, shape) {
    shape.path.setAttribute('stroke', state.color)
  }
}

let Bar = {
  controller: function () {
    console.log('controller called')
    Bar.update = function (val){
      if(Bar.progressbar) {
        if (val >= 0.0 && val <= 1.0) {
          this.progressbar.animate(val)
        } else {
          throw new Error('Value not valid: ' + val)
        }
      } else {
        throw new Error('ProgressBar child instance not defined')
      }
    }
  },
  view: function (ctrl) {
    return m('div', {
      style: {
        maxWidth: '400px', 
        marginBottom: '12px'
      },
      config: function (el, isInit, context) {
        context.retain = true
        if (!isInit) {
          console.log('initializing')
          Bar.progressbar = new ProgressBar.Line(el, options)
          Bar.progressbar.set(0)
        }
      }
    })
  }
}

module.exports = Bar

},{"../../lib/mithril":"/Users/nick/Desktop/mithical/lib/mithril.js","progressbar.js":"/Users/nick/Desktop/mithical/node_modules/progressbar.js/src/main.js"}],"/Users/nick/Desktop/mithical/src/component/cell.js":[function(require,module,exports){
/* ( ☼ _ ☼ )
 *
 * Hello sunshine.
 *
 */

'use strict'

let m = require('../../lib/mithril')

// Cell 2.0: serves strictly as a template to structure data stored elsewhere
let Cell = {
  controller: function (args) {
    // propogate higher-order input events to the list model


    return {
      task: args.task
    }
  },
  view: function (ctrl) {
    return (
      m('tr', [
        m('td', {style: {width: '100%'}}, [
          m('div', {
            style: {
              textDecoration: ctrl.task.done() ? 'line-through' : 'none',
              outline: 0,
              width: '100%',
              fontFamily: 'Helvetica Neue',
              fontWeight: '300',
              fontSize: '20px',
              whiteSpace: 'pre'
            },
            contentEditable: true,
            innerText: ctrl.task.description(),
            onkeypress: (e) => {
              // Catch return keystrokes
              if (e.keyCode == '13') {
                e.preventDefault()
                ctrl.task.vm.add(true)
              }
            },
            onkeydown: (e) => {
              if (e.keyCode == '40') {
                // DOWN key pressed
                e.preventDefault()
                ctrl.task.vm.shiftDown()
              } else if (e.keyCode == '38') {
                // UP key pressed
                e.preventDefault()
                ctrl.task.vm.shiftUp()
              }
            },
            oninput: (e) => {
              ctrl.task.description(e.target.innerText)
              if (ctrl.task.description().length > 0) {
                if (!ctrl.task.valid()) {
                  ctrl.task.valid(true)
                  ctrl.task.vm.recalculate()
                }
              } else {
                ctrl.task.valid(false)
                ctrl.task.done(false)
                ctrl.task.vm.recalculate()
              }
            },
            config: (el) => {
              // If a request was queued, grab the focus and reset.
              if (ctrl.task.needFocus()) {
                el.focus()
                ctrl.task.needFocus(false)
              }
            }
          })
        ]),
        m('td', [
          m('input[type=checkbox]', {
            style: {
              visibility: ctrl.task.valid() ? 'visible' : 'hidden'
            },
            //Here we need to add onclick listener to toggle states
            onclick: () => {ctrl.task.vm.checkOff(ctrl.task)},
            checked: ctrl.task.done()
          })
        ])
      ])
    )
  }
}

module.exports = Cell

},{"../../lib/mithril":"/Users/nick/Desktop/mithical/lib/mithril.js"}],"/Users/nick/Desktop/mithical/src/component/list.js":[function(require,module,exports){
/* ( ⚆ _ ⚆ )
 *
 * Come early tomorrow, for we shall do beautiful things in the morning.
 *
 */

'use strict'

let m = require('../../lib/mithril')
let Bar = require('./bar.js')
let Task = require('./task.js')
let Cell = require('./cell.js')

// the List component is structured as a singleton (sort of)
// I am in the process of stripping this down. This should only keep track of a list
// of Cell component instances, plus a counter used for updating the progress bar.
let List = {}

List.vm = (function() {
  var vm = {}
  vm.init = function() {
    //a running list of todos
    vm.list = new Array()

    // a slot to store the name of a new todo before it is created
    vm.description = m.prop('')

    // index of currently selected item
    let _selected = 0
    vm.selectTask = (t) => {
      if (t) {
        let memberIndex = -1
        for (let i = 0; i < vm.list.length; i++) {
          let item = vm.list[i]
          if (item === t) {
            memberIndex = i
            break
          }
        }
        if (memberIndex >= 0) {
          _selected = memberIndex
          t.needFocus(true)
        } else {
          throw new Error('Could not find referenced task in list')
        }
      } else {
        throw new Error('Cannot select undefined task')
      }
    }
    vm.selectIndex = (i, cursorPlacement) => {
      let t = vm.list[i]
      if (t) {
        vm.selectTask(t, cursorPlacement)
        return true
      } else {
        // If no such item exists, don't throw an error. This is by design.
        // @todo: check i < 0 and i > length instead
        return false
      }
    }
    vm.shiftUp = (cursorPlacement) => {
      vm.selectIndex(_selected - 1, cursorPlacement)
    }
    vm.shiftDown = (cursorPlacement) => {
      vm.selectIndex(_selected + 1, cursorPlacement)
    }

    vm.recalculate = () => {
      // @TODO: optimize further and (maybe) break this out to a separate helper function
      //        Or perhaps dispatch a custom event.
      // Update the progress bar.
      console.log('Recalculating progress...')
      let complete = 0
      let total = 0
      vm.list.map( (t) => {
        if (t.done()) {
          ++complete
        }
        if (t.valid()) {
          ++total
        }
      })
      console.log(Bar)
      if (total > 0) {
        Bar.update(complete / total)
      } else if (complete === total) {
        Bar.update(0)
      } else {
        throw new Error()
      }
    }

    //adds a todo to the list, and clears the description field for user convenience
    vm.add = (autoselect) => {
      //if (vm.description()) {
      let t = new Task({description: vm.description(), vm: List.vm})
      vm.list.push(t)
      vm.description('')
      if (autoselect) {
        vm.selectTask(t)
      }
      return t
      //}
    }

    //add a single item to get started. set as the currently selected element.
    vm.add(true)

    vm.checkOff = function(task) {
      task.done(!task.done())
      vm.recalculate()
    }
  }
  return vm
}())

List.controller = function (){
  List.vm.init()
}

List.view = function (){
  return [
    m.component(Bar),
    m('table',
      List.vm.list.map(function(task) {
        return m.component(Cell, {task: task, key: task})
      })
    )
  ]
}

module.exports = List
},{"../../lib/mithril":"/Users/nick/Desktop/mithical/lib/mithril.js","./bar.js":"/Users/nick/Desktop/mithical/src/component/bar.js","./cell.js":"/Users/nick/Desktop/mithical/src/component/cell.js","./task.js":"/Users/nick/Desktop/mithical/src/component/task.js"}],"/Users/nick/Desktop/mithical/src/component/task.js":[function(require,module,exports){
/* ( ◎ _ ◎ )
 *
 * Once more, it is I who will guide you.
 *
 */

'use strict'

let m = require('../../lib/mithril')

// Not really a component. A Task just keeps track of data
// @todo: consider combining Task and Cell into one.
// I see no reason to keep them apart, especially given how much
// they depend on each other.
let Task = function(data) {
  this.description = m.prop(data.description)
  this.done = m.prop(false)
  this.valid = m.prop(false)
  this.needFocus = m.prop(false)
  this.vm = data.vm ? data.vm : null
}

module.exports = Task
},{"../../lib/mithril":"/Users/nick/Desktop/mithical/lib/mithril.js"}],"/Users/nick/Desktop/mithical/src/mithical":[function(require,module,exports){
/* 
 * The only thing that comes to a sleeping man is dreams.
 *
 */

'use strict'

let m = require('../lib/mithril')
let List = require('./component/list')

// @todo: the ability to save.
// add a recent todolist browser component
// add a "new" and "delete" button
// localstorage or database.
// loads and displays most recent list by default.
// most of this shit will be managed OUTSIDE of the List class. List will just provide JSON representations.

m.mount(document.getElementById('container'), {controller: List.controller, view: List.view})

// @todo: persistent cursor position (when shifting up and down)
// medium priority. turns out this is slightly more complex than I originally thought.

// @todo: more polishing. lower priority.
// replace current tiny checkboxes with something nicer
// perhaps move checkboxes to outside the list, but let them collapse into the list if necessary
// add the animated caret thingy
// add the ability to check items off with a keystroke

// thought: perhaps I really do need to switch to a hidden textarea.
// I just realized selection and copy/paste is impossible with my current implementation.

},{"../lib/mithril":"/Users/nick/Desktop/mithical/lib/mithril.js","./component/list":"/Users/nick/Desktop/mithical/src/component/list.js"}]},{},["/Users/nick/Desktop/mithical/src/mithical"]);
