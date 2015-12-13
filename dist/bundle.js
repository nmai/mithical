(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js":[function(require,module,exports){
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

},{}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\localforage\\dist\\localforage.js":[function(require,module,exports){
(function (process,global){
/*!
    localForage -- Offline Storage, Improved
    Version 1.3.1
    https://mozilla.github.io/localForage
    (c) 2013-2015 Mozilla, Apache License 2.0
*/
(function() {
var define, requireModule, require, requirejs;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  requirejs = require = requireModule = function(name) {
  requirejs._eak_seen = registry;

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(requireModule(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };
})();

define("promise/all", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */

    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;

    /**
      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The return promise
      is fulfilled with an array that gives all the values in the order they were
      passed in the `promises` array argument.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @for RSVP
      @param {Array} promises
      @param {String} label
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
    */
    function all(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to all.');
      }

      return new Promise(function(resolve, reject) {
        var results = [], remaining = promises.length,
        promise;

        if (remaining === 0) {
          resolve([]);
        }

        function resolver(index) {
          return function(value) {
            resolveAll(index, value);
          };
        }

        function resolveAll(index, value) {
          results[index] = value;
          if (--remaining === 0) {
            resolve(results);
          }
        }

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && isFunction(promise.then)) {
            promise.then(resolver(i), reject);
          } else {
            resolveAll(i, promise);
          }
        }
      });
    }

    __exports__.all = all;
  });
define("promise/asap", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var browserGlobal = (typeof window !== 'undefined') ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

    // node
    function useNextTick() {
      return function() {
        process.nextTick(flush);
      };
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    function useSetTimeout() {
      return function() {
        local.setTimeout(flush, 1);
      };
    }

    var queue = [];
    function flush() {
      for (var i = 0; i < queue.length; i++) {
        var tuple = queue[i];
        var callback = tuple[0], arg = tuple[1];
        callback(arg);
      }
      queue = [];
    }

    var scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function asap(callback, arg) {
      var length = queue.push([callback, arg]);
      if (length === 1) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
      }
    }

    __exports__.asap = asap;
  });
define("promise/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var config = {
      instrument: false
    };

    function configure(name, value) {
      if (arguments.length === 2) {
        config[name] = value;
      } else {
        return config[name];
      }
    }

    __exports__.config = config;
    __exports__.configure = configure;
  });
define("promise/polyfill", 
  ["./promise","./utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global self*/
    var RSVPPromise = __dependency1__.Promise;
    var isFunction = __dependency2__.isFunction;

    function polyfill() {
      var local;

      if (typeof global !== 'undefined') {
        local = global;
      } else if (typeof window !== 'undefined' && window.document) {
        local = window;
      } else {
        local = self;
      }

      var es6PromiseSupport = 
        "Promise" in local &&
        // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        "resolve" in local.Promise &&
        "reject" in local.Promise &&
        "all" in local.Promise &&
        "race" in local.Promise &&
        // Older version of the spec had a resolver object
        // as the arg rather than a function
        (function() {
          var resolve;
          new local.Promise(function(r) { resolve = r; });
          return isFunction(resolve);
        }());

      if (!es6PromiseSupport) {
        local.Promise = RSVPPromise;
      }
    }

    __exports__.polyfill = polyfill;
  });
define("promise/promise", 
  ["./config","./utils","./all","./race","./resolve","./reject","./asap","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var config = __dependency1__.config;
    var configure = __dependency1__.configure;
    var objectOrFunction = __dependency2__.objectOrFunction;
    var isFunction = __dependency2__.isFunction;
    var now = __dependency2__.now;
    var all = __dependency3__.all;
    var race = __dependency4__.race;
    var staticResolve = __dependency5__.resolve;
    var staticReject = __dependency6__.reject;
    var asap = __dependency7__.asap;

    var counter = 0;

    config.async = asap; // default async is asap;

    function Promise(resolver) {
      if (!isFunction(resolver)) {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
      }

      if (!(this instanceof Promise)) {
        throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
      }

      this._subscribers = [];

      invokeResolver(resolver, this);
    }

    function invokeResolver(resolver, promise) {
      function resolvePromise(value) {
        resolve(promise, value);
      }

      function rejectPromise(reason) {
        reject(promise, reason);
      }

      try {
        resolver(resolvePromise, rejectPromise);
      } catch(e) {
        rejectPromise(e);
      }
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        try {
          value = callback(detail);
          succeeded = true;
        } catch(e) {
          failed = true;
          error = e;
        }
      } else {
        value = detail;
        succeeded = true;
      }

      if (handleThenable(promise, value)) {
        return;
      } else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (failed) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        resolve(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    var PENDING   = void 0;
    var SEALED    = 0;
    var FULFILLED = 1;
    var REJECTED  = 2;

    function subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      subscribers[length] = child;
      subscribers[length + FULFILLED] = onFulfillment;
      subscribers[length + REJECTED]  = onRejection;
    }

    function publish(promise, settled) {
      var child, callback, subscribers = promise._subscribers, detail = promise._detail;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        invokeCallback(settled, child, callback, detail);
      }

      promise._subscribers = null;
    }

    Promise.prototype = {
      constructor: Promise,

      _state: undefined,
      _detail: undefined,
      _subscribers: undefined,

      then: function(onFulfillment, onRejection) {
        var promise = this;

        var thenPromise = new this.constructor(function() {});

        if (this._state) {
          var callbacks = arguments;
          config.async(function invokePromiseCallback() {
            invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
          });
        } else {
          subscribe(this, thenPromise, onFulfillment, onRejection);
        }

        return thenPromise;
      },

      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };

    Promise.all = all;
    Promise.race = race;
    Promise.resolve = staticResolve;
    Promise.reject = staticReject;

    function handleThenable(promise, value) {
      var then = null,
      resolved;

      try {
        if (promise === value) {
          throw new TypeError("A promises callback cannot return that same promise.");
        }

        if (objectOrFunction(value)) {
          then = value.then;

          if (isFunction(then)) {
            then.call(value, function(val) {
              if (resolved) { return true; }
              resolved = true;

              if (value !== val) {
                resolve(promise, val);
              } else {
                fulfill(promise, val);
              }
            }, function(val) {
              if (resolved) { return true; }
              resolved = true;

              reject(promise, val);
            });

            return true;
          }
        }
      } catch (error) {
        if (resolved) { return true; }
        reject(promise, error);
        return true;
      }

      return false;
    }

    function resolve(promise, value) {
      if (promise === value) {
        fulfill(promise, value);
      } else if (!handleThenable(promise, value)) {
        fulfill(promise, value);
      }
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = value;

      config.async(publishFulfillment, promise);
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) { return; }
      promise._state = SEALED;
      promise._detail = reason;

      config.async(publishRejection, promise);
    }

    function publishFulfillment(promise) {
      publish(promise, promise._state = FULFILLED);
    }

    function publishRejection(promise) {
      publish(promise, promise._state = REJECTED);
    }

    __exports__.Promise = Promise;
  });
define("promise/race", 
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global toString */
    var isArray = __dependency1__.isArray;

    /**
      `RSVP.race` allows you to watch a series of promises and act as soon as the
      first promise given to the `promises` argument fulfills or rejects.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.race` is deterministic in that only the state of the first completed
      promise matters. For example, even if other promises given to the `promises`
      array argument are resolved, but the first completed promise has become
      rejected before the other promises became fulfilled, the returned promise
      will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.race([promise1, promise2]).then(function(result){
        // Code here never runs because there are rejected promises!
      }, function(reason){
        // reason.message === "promise2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      @method race
      @for RSVP
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise that becomes fulfilled with the value the first
      completed promises is resolved with if the first completed promise was
      fulfilled, or rejected with the reason that the first completed promise
      was rejected with.
    */
    function race(promises) {
      /*jshint validthis:true */
      var Promise = this;

      if (!isArray(promises)) {
        throw new TypeError('You must pass an array to race.');
      }
      return new Promise(function(resolve, reject) {
        var results = [], promise;

        for (var i = 0; i < promises.length; i++) {
          promise = promises[i];

          if (promise && typeof promise.then === 'function') {
            promise.then(resolve, reject);
          } else {
            resolve(promise);
          }
        }
      });
    }

    __exports__.race = race;
  });
define("promise/reject", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      `RSVP.reject` returns a promise that will become rejected with the passed
      `reason`. `RSVP.reject` is essentially shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become rejected with the given
      `reason`.
    */
    function reject(reason) {
      /*jshint validthis:true */
      var Promise = this;

      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }

    __exports__.reject = reject;
  });
define("promise/resolve", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function resolve(value) {
      /*jshint validthis:true */
      if (value && typeof value === 'object' && value.constructor === this) {
        return value;
      }

      var Promise = this;

      return new Promise(function(resolve) {
        resolve(value);
      });
    }

    __exports__.resolve = resolve;
  });
define("promise/utils", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function objectOrFunction(x) {
      return isFunction(x) || (typeof x === "object" && x !== null);
    }

    function isFunction(x) {
      return typeof x === "function";
    }

    function isArray(x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    }

    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function() { return new Date().getTime(); };


    __exports__.objectOrFunction = objectOrFunction;
    __exports__.isFunction = isFunction;
    __exports__.isArray = isArray;
    __exports__.now = now;
  });
requireModule('promise/polyfill').polyfill();
}());(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["localforage"] = factory();
	else
		root["localforage"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	(function () {
	    'use strict';

	    // Custom drivers are stored here when `defineDriver()` is called.
	    // They are shared across all instances of localForage.
	    var CustomDrivers = {};

	    var DriverType = {
	        INDEXEDDB: 'asyncStorage',
	        LOCALSTORAGE: 'localStorageWrapper',
	        WEBSQL: 'webSQLStorage'
	    };

	    var DefaultDriverOrder = [DriverType.INDEXEDDB, DriverType.WEBSQL, DriverType.LOCALSTORAGE];

	    var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

	    var DefaultConfig = {
	        description: '',
	        driver: DefaultDriverOrder.slice(),
	        name: 'localforage',
	        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
	        // we can use without a prompt.
	        size: 4980736,
	        storeName: 'keyvaluepairs',
	        version: 1.0
	    };

	    // Check to see if IndexedDB is available and if it is the latest
	    // implementation; it's our preferred backend library. We use "_spec_test"
	    // as the name of the database because it's not the one we'll operate on,
	    // but it's useful to make sure its using the right spec.
	    // See: https://github.com/mozilla/localForage/issues/128
	    var driverSupport = (function (self) {
	        // Initialize IndexedDB; fall back to vendor-prefixed versions
	        // if needed.
	        var indexedDB = indexedDB || self.indexedDB || self.webkitIndexedDB || self.mozIndexedDB || self.OIndexedDB || self.msIndexedDB;

	        var result = {};

	        result[DriverType.WEBSQL] = !!self.openDatabase;
	        result[DriverType.INDEXEDDB] = !!(function () {
	            // We mimic PouchDB here; just UA test for Safari (which, as of
	            // iOS 8/Yosemite, doesn't properly support IndexedDB).
	            // IndexedDB support is broken and different from Blink's.
	            // This is faster than the test case (and it's sync), so we just
	            // do this. *SIGH*
	            // http://bl.ocks.org/nolanlawson/raw/c83e9039edf2278047e9/
	            //
	            // We test for openDatabase because IE Mobile identifies itself
	            // as Safari. Oh the lulz...
	            if (typeof self.openDatabase !== 'undefined' && self.navigator && self.navigator.userAgent && /Safari/.test(self.navigator.userAgent) && !/Chrome/.test(self.navigator.userAgent)) {
	                return false;
	            }
	            try {
	                return indexedDB && typeof indexedDB.open === 'function' &&
	                // Some Samsung/HTC Android 4.0-4.3 devices
	                // have older IndexedDB specs; if this isn't available
	                // their IndexedDB is too old for us to use.
	                // (Replaces the onupgradeneeded test.)
	                typeof self.IDBKeyRange !== 'undefined';
	            } catch (e) {
	                return false;
	            }
	        })();

	        result[DriverType.LOCALSTORAGE] = !!(function () {
	            try {
	                return self.localStorage && 'setItem' in self.localStorage && self.localStorage.setItem;
	            } catch (e) {
	                return false;
	            }
	        })();

	        return result;
	    })(this);

	    var isArray = Array.isArray || function (arg) {
	        return Object.prototype.toString.call(arg) === '[object Array]';
	    };

	    function callWhenReady(localForageInstance, libraryMethod) {
	        localForageInstance[libraryMethod] = function () {
	            var _args = arguments;
	            return localForageInstance.ready().then(function () {
	                return localForageInstance[libraryMethod].apply(localForageInstance, _args);
	            });
	        };
	    }

	    function extend() {
	        for (var i = 1; i < arguments.length; i++) {
	            var arg = arguments[i];

	            if (arg) {
	                for (var key in arg) {
	                    if (arg.hasOwnProperty(key)) {
	                        if (isArray(arg[key])) {
	                            arguments[0][key] = arg[key].slice();
	                        } else {
	                            arguments[0][key] = arg[key];
	                        }
	                    }
	                }
	            }
	        }

	        return arguments[0];
	    }

	    function isLibraryDriver(driverName) {
	        for (var driver in DriverType) {
	            if (DriverType.hasOwnProperty(driver) && DriverType[driver] === driverName) {
	                return true;
	            }
	        }

	        return false;
	    }

	    var LocalForage = (function () {
	        function LocalForage(options) {
	            _classCallCheck(this, LocalForage);

	            this.INDEXEDDB = DriverType.INDEXEDDB;
	            this.LOCALSTORAGE = DriverType.LOCALSTORAGE;
	            this.WEBSQL = DriverType.WEBSQL;

	            this._defaultConfig = extend({}, DefaultConfig);
	            this._config = extend({}, this._defaultConfig, options);
	            this._driverSet = null;
	            this._initDriver = null;
	            this._ready = false;
	            this._dbInfo = null;

	            this._wrapLibraryMethodsWithReady();
	            this.setDriver(this._config.driver);
	        }

	        // The actual localForage object that we expose as a module or via a
	        // global. It's extended by pulling in one of our other libraries.

	        // Set any config values for localForage; can be called anytime before
	        // the first API call (e.g. `getItem`, `setItem`).
	        // We loop through options so we don't overwrite existing config
	        // values.

	        LocalForage.prototype.config = function config(options) {
	            // If the options argument is an object, we use it to set values.
	            // Otherwise, we return either a specified config value or all
	            // config values.
	            if (typeof options === 'object') {
	                // If localforage is ready and fully initialized, we can't set
	                // any new configuration values. Instead, we return an error.
	                if (this._ready) {
	                    return new Error("Can't call config() after localforage " + 'has been used.');
	                }

	                for (var i in options) {
	                    if (i === 'storeName') {
	                        options[i] = options[i].replace(/\W/g, '_');
	                    }

	                    this._config[i] = options[i];
	                }

	                // after all config options are set and
	                // the driver option is used, try setting it
	                if ('driver' in options && options.driver) {
	                    this.setDriver(this._config.driver);
	                }

	                return true;
	            } else if (typeof options === 'string') {
	                return this._config[options];
	            } else {
	                return this._config;
	            }
	        };

	        // Used to define a custom driver, shared across all instances of
	        // localForage.

	        LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
	            var promise = new Promise(function (resolve, reject) {
	                try {
	                    var driverName = driverObject._driver;
	                    var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver');
	                    var namingError = new Error('Custom driver name already in use: ' + driverObject._driver);

	                    // A driver name should be defined and not overlap with the
	                    // library-defined, default drivers.
	                    if (!driverObject._driver) {
	                        reject(complianceError);
	                        return;
	                    }
	                    if (isLibraryDriver(driverObject._driver)) {
	                        reject(namingError);
	                        return;
	                    }

	                    var customDriverMethods = LibraryMethods.concat('_initStorage');
	                    for (var i = 0; i < customDriverMethods.length; i++) {
	                        var customDriverMethod = customDriverMethods[i];
	                        if (!customDriverMethod || !driverObject[customDriverMethod] || typeof driverObject[customDriverMethod] !== 'function') {
	                            reject(complianceError);
	                            return;
	                        }
	                    }

	                    var supportPromise = Promise.resolve(true);
	                    if ('_support' in driverObject) {
	                        if (driverObject._support && typeof driverObject._support === 'function') {
	                            supportPromise = driverObject._support();
	                        } else {
	                            supportPromise = Promise.resolve(!!driverObject._support);
	                        }
	                    }

	                    supportPromise.then(function (supportResult) {
	                        driverSupport[driverName] = supportResult;
	                        CustomDrivers[driverName] = driverObject;
	                        resolve();
	                    }, reject);
	                } catch (e) {
	                    reject(e);
	                }
	            });

	            promise.then(callback, errorCallback);
	            return promise;
	        };

	        LocalForage.prototype.driver = function driver() {
	            return this._driver || null;
	        };

	        LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
	            var self = this;
	            var getDriverPromise = (function () {
	                if (isLibraryDriver(driverName)) {
	                    switch (driverName) {
	                        case self.INDEXEDDB:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(1));
	                            });
	                        case self.LOCALSTORAGE:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(2));
	                            });
	                        case self.WEBSQL:
	                            return new Promise(function (resolve, reject) {
	                                resolve(__webpack_require__(4));
	                            });
	                    }
	                } else if (CustomDrivers[driverName]) {
	                    return Promise.resolve(CustomDrivers[driverName]);
	                }

	                return Promise.reject(new Error('Driver not found.'));
	            })();

	            getDriverPromise.then(callback, errorCallback);
	            return getDriverPromise;
	        };

	        LocalForage.prototype.getSerializer = function getSerializer(callback) {
	            var serializerPromise = new Promise(function (resolve, reject) {
	                resolve(__webpack_require__(3));
	            });
	            if (callback && typeof callback === 'function') {
	                serializerPromise.then(function (result) {
	                    callback(result);
	                });
	            }
	            return serializerPromise;
	        };

	        LocalForage.prototype.ready = function ready(callback) {
	            var self = this;

	            var promise = self._driverSet.then(function () {
	                if (self._ready === null) {
	                    self._ready = self._initDriver();
	                }

	                return self._ready;
	            });

	            promise.then(callback, callback);
	            return promise;
	        };

	        LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
	            var self = this;

	            if (!isArray(drivers)) {
	                drivers = [drivers];
	            }

	            var supportedDrivers = this._getSupportedDrivers(drivers);

	            function setDriverToConfig() {
	                self._config.driver = self.driver();
	            }

	            function initDriver(supportedDrivers) {
	                return function () {
	                    var currentDriverIndex = 0;

	                    function driverPromiseLoop() {
	                        while (currentDriverIndex < supportedDrivers.length) {
	                            var driverName = supportedDrivers[currentDriverIndex];
	                            currentDriverIndex++;

	                            self._dbInfo = null;
	                            self._ready = null;

	                            return self.getDriver(driverName).then(function (driver) {
	                                self._extend(driver);
	                                setDriverToConfig();

	                                self._ready = self._initStorage(self._config);
	                                return self._ready;
	                            })['catch'](driverPromiseLoop);
	                        }

	                        setDriverToConfig();
	                        var error = new Error('No available storage method found.');
	                        self._driverSet = Promise.reject(error);
	                        return self._driverSet;
	                    }

	                    return driverPromiseLoop();
	                };
	            }

	            // There might be a driver initialization in progress
	            // so wait for it to finish in order to avoid a possible
	            // race condition to set _dbInfo
	            var oldDriverSetDone = this._driverSet !== null ? this._driverSet['catch'](function () {
	                return Promise.resolve();
	            }) : Promise.resolve();

	            this._driverSet = oldDriverSetDone.then(function () {
	                var driverName = supportedDrivers[0];
	                self._dbInfo = null;
	                self._ready = null;

	                return self.getDriver(driverName).then(function (driver) {
	                    self._driver = driver._driver;
	                    setDriverToConfig();
	                    self._wrapLibraryMethodsWithReady();
	                    self._initDriver = initDriver(supportedDrivers);
	                });
	            })['catch'](function () {
	                setDriverToConfig();
	                var error = new Error('No available storage method found.');
	                self._driverSet = Promise.reject(error);
	                return self._driverSet;
	            });

	            this._driverSet.then(callback, errorCallback);
	            return this._driverSet;
	        };

	        LocalForage.prototype.supports = function supports(driverName) {
	            return !!driverSupport[driverName];
	        };

	        LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
	            extend(this, libraryMethodsAndProperties);
	        };

	        LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
	            var supportedDrivers = [];
	            for (var i = 0, len = drivers.length; i < len; i++) {
	                var driverName = drivers[i];
	                if (this.supports(driverName)) {
	                    supportedDrivers.push(driverName);
	                }
	            }
	            return supportedDrivers;
	        };

	        LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
	            // Add a stub for each driver API method that delays the call to the
	            // corresponding driver method until localForage is ready. These stubs
	            // will be replaced by the driver methods as soon as the driver is
	            // loaded, so there is no performance impact.
	            for (var i = 0; i < LibraryMethods.length; i++) {
	                callWhenReady(this, LibraryMethods[i]);
	            }
	        };

	        LocalForage.prototype.createInstance = function createInstance(options) {
	            return new LocalForage(options);
	        };

	        return LocalForage;
	    })();

	    var localForage = new LocalForage();

	    exports['default'] = localForage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	// Some code originally from async_storage.js in
	// [Gaia](https://github.com/mozilla-b2g/gaia).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    // Initialize IndexedDB; fall back to vendor-prefixed versions if needed.
	    var indexedDB = indexedDB || this.indexedDB || this.webkitIndexedDB || this.mozIndexedDB || this.OIndexedDB || this.msIndexedDB;

	    // If IndexedDB isn't available, we get outta here!
	    if (!indexedDB) {
	        return;
	    }

	    var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
	    var supportsBlobs;
	    var dbContexts;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};
	        try {
	            return new Blob(parts, properties);
	        } catch (e) {
	            if (e.name !== 'TypeError') {
	                throw e;
	            }
	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;
	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }
	            return builder.getBlob(properties.type);
	        }
	    }

	    // Transform a binary string to an array buffer, because otherwise
	    // weird stuff happens when you try to work with the binary string directly.
	    // It is known.
	    // From http://stackoverflow.com/questions/14967647/ (continues on next line)
	    // encode-decode-image-with-base64-breaks-image (2013-04-21)
	    function _binStringToArrayBuffer(bin) {
	        var length = bin.length;
	        var buf = new ArrayBuffer(length);
	        var arr = new Uint8Array(buf);
	        for (var i = 0; i < length; i++) {
	            arr[i] = bin.charCodeAt(i);
	        }
	        return buf;
	    }

	    // Fetch a blob using ajax. This reveals bugs in Chrome < 43.
	    // For details on all this junk:
	    // https://github.com/nolanlawson/state-of-binary-data-in-the-browser#readme
	    function _blobAjax(url) {
	        return new Promise(function (resolve, reject) {
	            var xhr = new XMLHttpRequest();
	            xhr.open('GET', url);
	            xhr.withCredentials = true;
	            xhr.responseType = 'arraybuffer';

	            xhr.onreadystatechange = function () {
	                if (xhr.readyState !== 4) {
	                    return;
	                }
	                if (xhr.status === 200) {
	                    return resolve({
	                        response: xhr.response,
	                        type: xhr.getResponseHeader('Content-Type')
	                    });
	                }
	                reject({ status: xhr.status, response: xhr.response });
	            };
	            xhr.send();
	        });
	    }

	    //
	    // Detect blob support. Chrome didn't support it until version 38.
	    // In version 37 they had a broken version where PNGs (and possibly
	    // other binary types) aren't stored correctly, because when you fetch
	    // them, the content type is always null.
	    //
	    // Furthermore, they have some outstanding bugs where blobs occasionally
	    // are read by FileReader as null, or by ajax as 404s.
	    //
	    // Sadly we use the 404 bug to detect the FileReader bug, so if they
	    // get fixed independently and released in different versions of Chrome,
	    // then the bug could come back. So it's worthwhile to watch these issues:
	    // 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
	    // FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
	    //
	    function _checkBlobSupportWithoutCaching(idb) {
	        return new Promise(function (resolve, reject) {
	            var blob = _createBlob([''], { type: 'image/png' });
	            var txn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	            txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');
	            txn.oncomplete = function () {
	                // have to do it in a separate transaction, else the correct
	                // content type is always returned
	                var blobTxn = idb.transaction([DETECT_BLOB_SUPPORT_STORE], 'readwrite');
	                var getBlobReq = blobTxn.objectStore(DETECT_BLOB_SUPPORT_STORE).get('key');
	                getBlobReq.onerror = reject;
	                getBlobReq.onsuccess = function (e) {

	                    var storedBlob = e.target.result;
	                    var url = URL.createObjectURL(storedBlob);

	                    _blobAjax(url).then(function (res) {
	                        resolve(!!(res && res.type === 'image/png'));
	                    }, function () {
	                        resolve(false);
	                    }).then(function () {
	                        URL.revokeObjectURL(url);
	                    });
	                };
	            };
	        })['catch'](function () {
	            return false; // error, so assume unsupported
	        });
	    }

	    function _checkBlobSupport(idb) {
	        if (typeof supportsBlobs === 'boolean') {
	            return Promise.resolve(supportsBlobs);
	        }
	        return _checkBlobSupportWithoutCaching(idb).then(function (value) {
	            supportsBlobs = value;
	            return supportsBlobs;
	        });
	    }

	    // encode a blob for indexeddb engines that don't support blobs
	    function _encodeBlob(blob) {
	        return new Promise(function (resolve, reject) {
	            var reader = new FileReader();
	            reader.onerror = reject;
	            reader.onloadend = function (e) {
	                var base64 = btoa(e.target.result || '');
	                resolve({
	                    __local_forage_encoded_blob: true,
	                    data: base64,
	                    type: blob.type
	                });
	            };
	            reader.readAsBinaryString(blob);
	        });
	    }

	    // decode an encoded blob
	    function _decodeBlob(encodedBlob) {
	        var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
	        return _createBlob([arrayBuff], { type: encodedBlob.type });
	    }

	    // is this one of our fancy encoded blobs?
	    function _isEncodedBlob(value) {
	        return value && value.__local_forage_encoded_blob;
	    }

	    // Open the IndexedDB database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        // Initialize a singleton container for all running localForages.
	        if (!dbContexts) {
	            dbContexts = {};
	        }

	        // Get the current context of the database;
	        var dbContext = dbContexts[dbInfo.name];

	        // ...or create a new context.
	        if (!dbContext) {
	            dbContext = {
	                // Running localForages sharing a database.
	                forages: [],
	                // Shared database.
	                db: null
	            };
	            // Register the new context in the global container.
	            dbContexts[dbInfo.name] = dbContext;
	        }

	        // Register itself as a running localForage in the current context.
	        dbContext.forages.push(this);

	        // Create an array of readiness of the related localForages.
	        var readyPromises = [];

	        function ignoreErrors() {
	            // Don't handle errors here,
	            // just makes sure related localForages aren't pending.
	            return Promise.resolve();
	        }

	        for (var j = 0; j < dbContext.forages.length; j++) {
	            var forage = dbContext.forages[j];
	            if (forage !== this) {
	                // Don't wait for itself...
	                readyPromises.push(forage.ready()['catch'](ignoreErrors));
	            }
	        }

	        // Take a snapshot of the related localForages.
	        var forages = dbContext.forages.slice(0);

	        // Initialize the connection process only when
	        // all the related localForages aren't pending.
	        return Promise.all(readyPromises).then(function () {
	            dbInfo.db = dbContext.db;
	            // Get the connection or open a new one without upgrade.
	            return _getOriginalConnection(dbInfo);
	        }).then(function (db) {
	            dbInfo.db = db;
	            if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
	                // Reopen the database for upgrading.
	                return _getUpgradedConnection(dbInfo);
	            }
	            return db;
	        }).then(function (db) {
	            dbInfo.db = dbContext.db = db;
	            self._dbInfo = dbInfo;
	            // Share the final connection amongst related localForages.
	            for (var k = 0; k < forages.length; k++) {
	                var forage = forages[k];
	                if (forage !== self) {
	                    // Self is already up-to-date.
	                    forage._dbInfo.db = dbInfo.db;
	                    forage._dbInfo.version = dbInfo.version;
	                }
	            }
	        });
	    }

	    function _getOriginalConnection(dbInfo) {
	        return _getConnection(dbInfo, false);
	    }

	    function _getUpgradedConnection(dbInfo) {
	        return _getConnection(dbInfo, true);
	    }

	    function _getConnection(dbInfo, upgradeNeeded) {
	        return new Promise(function (resolve, reject) {
	            if (dbInfo.db) {
	                if (upgradeNeeded) {
	                    dbInfo.db.close();
	                } else {
	                    return resolve(dbInfo.db);
	                }
	            }

	            var dbArgs = [dbInfo.name];

	            if (upgradeNeeded) {
	                dbArgs.push(dbInfo.version);
	            }

	            var openreq = indexedDB.open.apply(indexedDB, dbArgs);

	            if (upgradeNeeded) {
	                openreq.onupgradeneeded = function (e) {
	                    var db = openreq.result;
	                    try {
	                        db.createObjectStore(dbInfo.storeName);
	                        if (e.oldVersion <= 1) {
	                            // Added when support for blob shims was added
	                            db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
	                        }
	                    } catch (ex) {
	                        if (ex.name === 'ConstraintError') {
	                            globalObject.console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
	                        } else {
	                            throw ex;
	                        }
	                    }
	                };
	            }

	            openreq.onerror = function () {
	                reject(openreq.error);
	            };

	            openreq.onsuccess = function () {
	                resolve(openreq.result);
	            };
	        });
	    }

	    function _isUpgradeNeeded(dbInfo, defaultVersion) {
	        if (!dbInfo.db) {
	            return true;
	        }

	        var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
	        var isDowngrade = dbInfo.version < dbInfo.db.version;
	        var isUpgrade = dbInfo.version > dbInfo.db.version;

	        if (isDowngrade) {
	            // If the version is not the default one
	            // then warn for impossible downgrade.
	            if (dbInfo.version !== defaultVersion) {
	                globalObject.console.warn('The database "' + dbInfo.name + '"' + ' can\'t be downgraded from version ' + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
	            }
	            // Align the versions to prevent errors.
	            dbInfo.version = dbInfo.db.version;
	        }

	        if (isUpgrade || isNewStore) {
	            // If the store is new then increment the version (if needed).
	            // This will trigger an "upgradeneeded" event which is required
	            // for creating a store.
	            if (isNewStore) {
	                var incVersion = dbInfo.db.version + 1;
	                if (incVersion > dbInfo.version) {
	                    dbInfo.version = incVersion;
	                }
	            }

	            return true;
	        }

	        return false;
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.get(key);

	                req.onsuccess = function () {
	                    var value = req.result;
	                    if (value === undefined) {
	                        value = null;
	                    }
	                    if (_isEncodedBlob(value)) {
	                        value = _decodeBlob(value);
	                    }
	                    resolve(value);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items stored in database.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var iterationNumber = 1;

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (cursor) {
	                        var value = cursor.value;
	                        if (_isEncodedBlob(value)) {
	                            value = _decodeBlob(value);
	                        }
	                        var result = iterator(value, cursor.key, iterationNumber++);

	                        if (result !== void 0) {
	                            resolve(result);
	                        } else {
	                            cursor['continue']();
	                        }
	                    } else {
	                        resolve();
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);

	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            var dbInfo;
	            self.ready().then(function () {
	                dbInfo = self._dbInfo;
	                if (value instanceof Blob) {
	                    return _checkBlobSupport(dbInfo.db).then(function (blobSupport) {
	                        if (blobSupport) {
	                            return value;
	                        }
	                        return _encodeBlob(value);
	                    });
	                }
	                return value;
	            }).then(function (value) {
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // The reason we don't _save_ null is because IE 10 does
	                // not support saving the `null` type in IndexedDB. How
	                // ironic, given the bug below!
	                // See: https://github.com/mozilla/localForage/issues/161
	                if (value === null) {
	                    value = undefined;
	                }

	                var req = store.put(value, key);
	                transaction.oncomplete = function () {
	                    // Cast to undefined so the value passed to
	                    // callback/promise is the same as what one would get out
	                    // of `getItem()` later. This leads to some weirdness
	                    // (setItem('foo', undefined) will return `null`), but
	                    // it's not my fault localStorage is our baseline and that
	                    // it's weird.
	                    if (value === undefined) {
	                        value = null;
	                    }

	                    resolve(value);
	                };
	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);

	                // We use a Grunt task to make this safe for IE and some
	                // versions of Android (including those used by Cordova).
	                // Normally IE won't like `.delete()` and will insist on
	                // using `['delete']()`, but we have a build step that
	                // fixes this for us now.
	                var req = store['delete'](key);
	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onerror = function () {
	                    reject(req.error);
	                };

	                // The request will be also be aborted if we've exceeded our storage
	                // space.
	                transaction.onabort = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var transaction = dbInfo.db.transaction(dbInfo.storeName, 'readwrite');
	                var store = transaction.objectStore(dbInfo.storeName);
	                var req = store.clear();

	                transaction.oncomplete = function () {
	                    resolve();
	                };

	                transaction.onabort = transaction.onerror = function () {
	                    var err = req.error ? req.error : req.transaction.error;
	                    reject(err);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);
	                var req = store.count();

	                req.onsuccess = function () {
	                    resolve(req.result);
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            if (n < 0) {
	                resolve(null);

	                return;
	            }

	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var advanced = false;
	                var req = store.openCursor();
	                req.onsuccess = function () {
	                    var cursor = req.result;
	                    if (!cursor) {
	                        // this means there weren't enough keys
	                        resolve(null);

	                        return;
	                    }

	                    if (n === 0) {
	                        // We have the first key, return it if that's what they
	                        // wanted.
	                        resolve(cursor.key);
	                    } else {
	                        if (!advanced) {
	                            // Otherwise, ask the cursor to skip ahead n
	                            // records.
	                            advanced = true;
	                            cursor.advance(n);
	                        } else {
	                            // When we get here, we've got the nth key.
	                            resolve(cursor.key);
	                        }
	                    }
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                var store = dbInfo.db.transaction(dbInfo.storeName, 'readonly').objectStore(dbInfo.storeName);

	                var req = store.openCursor();
	                var keys = [];

	                req.onsuccess = function () {
	                    var cursor = req.result;

	                    if (!cursor) {
	                        resolve(keys);
	                        return;
	                    }

	                    keys.push(cursor.key);
	                    cursor['continue']();
	                };

	                req.onerror = function () {
	                    reject(req.error);
	                };
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var asyncStorage = {
	        _driver: 'asyncStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = asyncStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// If IndexedDB isn't available, we'll fall back to localStorage.
	// Note that this will have considerable performance and storage
	// side-effects (all data will be serialized on save and only data that
	// can be converted to a string via `JSON.stringify()` will be saved).
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var localStorage = null;

	    // If the app is running inside a Google Chrome packaged webapp, or some
	    // other context where localStorage isn't available, we don't use
	    // localStorage. This feature detection is preferred over the old
	    // `if (window.chrome && window.chrome.runtime)` code.
	    // See: https://github.com/mozilla/localForage/issues/68
	    try {
	        // If localStorage isn't available, we get outta here!
	        // This should be inside a try catch
	        if (!this.localStorage || !('setItem' in this.localStorage)) {
	            return;
	        }
	        // Initialize localStorage and create a variable to use throughout
	        // the code.
	        localStorage = this.localStorage;
	    } catch (e) {
	        return;
	    }

	    // Config the localStorage backend, using options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {};
	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = options[i];
	            }
	        }

	        dbInfo.keyPrefix = dbInfo.name + '/';

	        if (dbInfo.storeName !== self._defaultConfig.storeName) {
	            dbInfo.keyPrefix += dbInfo.storeName + '/';
	        }

	        self._dbInfo = dbInfo;

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return Promise.resolve();
	        });
	    }

	    // Remove all keys from the datastore, effectively destroying all data in
	    // the app's key/value store!
	    function clear(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var keyPrefix = self._dbInfo.keyPrefix;

	            for (var i = localStorage.length - 1; i >= 0; i--) {
	                var key = localStorage.key(i);

	                if (key.indexOf(keyPrefix) === 0) {
	                    localStorage.removeItem(key);
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Retrieve an item from the store. Unlike the original async_storage
	    // library in Gaia, we don't modify return values at all. If a key's value
	    // is `undefined`, we pass that value to the callback function.
	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result = localStorage.getItem(dbInfo.keyPrefix + key);

	            // If a result was found, parse it from the serialized
	            // string into a JS object. If result isn't truthy, the key
	            // is likely undefined and we'll pass it straight to the
	            // callback.
	            if (result) {
	                result = dbInfo.serializer.deserialize(result);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Iterate over all items in the store.
	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var keyPrefix = dbInfo.keyPrefix;
	            var keyPrefixLength = keyPrefix.length;
	            var length = localStorage.length;

	            // We use a dedicated iterator instead of the `i` variable below
	            // so other keys we fetch in localStorage aren't counted in
	            // the `iterationNumber` argument passed to the `iterate()`
	            // callback.
	            //
	            // See: github.com/mozilla/localForage/pull/435#discussion_r38061530
	            var iterationNumber = 1;

	            for (var i = 0; i < length; i++) {
	                var key = localStorage.key(i);
	                if (key.indexOf(keyPrefix) !== 0) {
	                    continue;
	                }
	                var value = localStorage.getItem(key);

	                // If a result was found, parse it from the serialized
	                // string into a JS object. If result isn't truthy, the
	                // key is likely undefined and we'll pass it straight
	                // to the iterator.
	                if (value) {
	                    value = dbInfo.serializer.deserialize(value);
	                }

	                value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

	                if (value !== void 0) {
	                    return value;
	                }
	            }
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Same as localStorage's key() method, except takes a callback.
	    function key(n, callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var result;
	            try {
	                result = localStorage.key(n);
	            } catch (error) {
	                result = null;
	            }

	            // Remove the prefix from the key, if a key is found.
	            if (result) {
	                result = result.substring(dbInfo.keyPrefix.length);
	            }

	            return result;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;
	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            var length = localStorage.length;
	            var keys = [];

	            for (var i = 0; i < length; i++) {
	                if (localStorage.key(i).indexOf(dbInfo.keyPrefix) === 0) {
	                    keys.push(localStorage.key(i).substring(dbInfo.keyPrefix.length));
	                }
	            }

	            return keys;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Supply the number of keys in the datastore to the callback function.
	    function length(callback) {
	        var self = this;
	        var promise = self.keys().then(function (keys) {
	            return keys.length;
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Remove an item from the store, nice and simple.
	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            var dbInfo = self._dbInfo;
	            localStorage.removeItem(dbInfo.keyPrefix + key);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Set a key's value and run an optional callback once the value is set.
	    // Unlike Gaia's implementation, the callback function is passed the value,
	    // in case you want to operate on that value only after you're sure it
	    // saved, or something like that.
	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = self.ready().then(function () {
	            // Convert undefined values to null.
	            // https://github.com/mozilla/localForage/pull/42
	            if (value === undefined) {
	                value = null;
	            }

	            // Save the original value to pass to the callback.
	            var originalValue = value;

	            return new Promise(function (resolve, reject) {
	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        try {
	                            localStorage.setItem(dbInfo.keyPrefix + key, value);
	                            resolve(originalValue);
	                        } catch (e) {
	                            // localStorage capacity exceeded.
	                            // TODO: Make this a specific error/event.
	                            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
	                                reject(e);
	                            }
	                            reject(e);
	                        }
	                    }
	                });
	            });
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var localStorageWrapper = {
	        _driver: 'localStorageWrapper',
	        _initStorage: _initStorage,
	        // Default API, from Gaia/localStorage.
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = localStorageWrapper;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    // Sadly, the best way to save binary data in WebSQL/localStorage is serializing
	    // it to Base64, so this is how we store it to prevent very strange errors with less
	    // verbose ways of binary <-> string data storage.
	    var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	    var BLOB_TYPE_PREFIX = '~~local_forage_type~';
	    var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

	    var SERIALIZED_MARKER = '__lfsc__:';
	    var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

	    // OMG the serializations!
	    var TYPE_ARRAYBUFFER = 'arbf';
	    var TYPE_BLOB = 'blob';
	    var TYPE_INT8ARRAY = 'si08';
	    var TYPE_UINT8ARRAY = 'ui08';
	    var TYPE_UINT8CLAMPEDARRAY = 'uic8';
	    var TYPE_INT16ARRAY = 'si16';
	    var TYPE_INT32ARRAY = 'si32';
	    var TYPE_UINT16ARRAY = 'ur16';
	    var TYPE_UINT32ARRAY = 'ui32';
	    var TYPE_FLOAT32ARRAY = 'fl32';
	    var TYPE_FLOAT64ARRAY = 'fl64';
	    var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

	    // Get out of our habit of using `window` inline, at least.
	    var globalObject = this;

	    // Abstracts constructing a Blob object, so it also works in older
	    // browsers that don't support the native Blob constructor. (i.e.
	    // old QtWebKit versions, at least).
	    function _createBlob(parts, properties) {
	        parts = parts || [];
	        properties = properties || {};

	        try {
	            return new Blob(parts, properties);
	        } catch (err) {
	            if (err.name !== 'TypeError') {
	                throw err;
	            }

	            var BlobBuilder = globalObject.BlobBuilder || globalObject.MSBlobBuilder || globalObject.MozBlobBuilder || globalObject.WebKitBlobBuilder;

	            var builder = new BlobBuilder();
	            for (var i = 0; i < parts.length; i += 1) {
	                builder.append(parts[i]);
	            }

	            return builder.getBlob(properties.type);
	        }
	    }

	    // Serialize a value, afterwards executing a callback (which usually
	    // instructs the `setItem()` callback/promise to be executed). This is how
	    // we store binary data with localStorage.
	    function serialize(value, callback) {
	        var valueString = '';
	        if (value) {
	            valueString = value.toString();
	        }

	        // Cannot use `value instanceof ArrayBuffer` or such here, as these
	        // checks fail when running the tests using casper.js...
	        //
	        // TODO: See why those tests fail and use a better solution.
	        if (value && (value.toString() === '[object ArrayBuffer]' || value.buffer && value.buffer.toString() === '[object ArrayBuffer]')) {
	            // Convert binary arrays to a string and prefix the string with
	            // a special marker.
	            var buffer;
	            var marker = SERIALIZED_MARKER;

	            if (value instanceof ArrayBuffer) {
	                buffer = value;
	                marker += TYPE_ARRAYBUFFER;
	            } else {
	                buffer = value.buffer;

	                if (valueString === '[object Int8Array]') {
	                    marker += TYPE_INT8ARRAY;
	                } else if (valueString === '[object Uint8Array]') {
	                    marker += TYPE_UINT8ARRAY;
	                } else if (valueString === '[object Uint8ClampedArray]') {
	                    marker += TYPE_UINT8CLAMPEDARRAY;
	                } else if (valueString === '[object Int16Array]') {
	                    marker += TYPE_INT16ARRAY;
	                } else if (valueString === '[object Uint16Array]') {
	                    marker += TYPE_UINT16ARRAY;
	                } else if (valueString === '[object Int32Array]') {
	                    marker += TYPE_INT32ARRAY;
	                } else if (valueString === '[object Uint32Array]') {
	                    marker += TYPE_UINT32ARRAY;
	                } else if (valueString === '[object Float32Array]') {
	                    marker += TYPE_FLOAT32ARRAY;
	                } else if (valueString === '[object Float64Array]') {
	                    marker += TYPE_FLOAT64ARRAY;
	                } else {
	                    callback(new Error('Failed to get type for BinaryArray'));
	                }
	            }

	            callback(marker + bufferToString(buffer));
	        } else if (valueString === '[object Blob]') {
	            // Conver the blob to a binaryArray and then to a string.
	            var fileReader = new FileReader();

	            fileReader.onload = function () {
	                // Backwards-compatible prefix for the blob type.
	                var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);

	                callback(SERIALIZED_MARKER + TYPE_BLOB + str);
	            };

	            fileReader.readAsArrayBuffer(value);
	        } else {
	            try {
	                callback(JSON.stringify(value));
	            } catch (e) {
	                console.error("Couldn't convert value into a JSON string: ", value);

	                callback(null, e);
	            }
	        }
	    }

	    // Deserialize data we've inserted into a value column/field. We place
	    // special markers into our strings to mark them as encoded; this isn't
	    // as nice as a meta field, but it's the only sane thing we can do whilst
	    // keeping localStorage support intact.
	    //
	    // Oftentimes this will just deserialize JSON content, but if we have a
	    // special marker (SERIALIZED_MARKER, defined above), we will extract
	    // some kind of arraybuffer/binary data/typed array out of the string.
	    function deserialize(value) {
	        // If we haven't marked this string as being specially serialized (i.e.
	        // something other than serialized JSON), we can just return it and be
	        // done with it.
	        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
	            return JSON.parse(value);
	        }

	        // The following code deals with deserializing some kind of Blob or
	        // TypedArray. First we separate out the type of data we're dealing
	        // with from the data itself.
	        var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
	        var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

	        var blobType;
	        // Backwards-compatible blob type serialization strategy.
	        // DBs created with older versions of localForage will simply not have the blob type.
	        if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
	            var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
	            blobType = matcher[1];
	            serializedString = serializedString.substring(matcher[0].length);
	        }
	        var buffer = stringToBuffer(serializedString);

	        // Return the right type based on the code/type set during
	        // serialization.
	        switch (type) {
	            case TYPE_ARRAYBUFFER:
	                return buffer;
	            case TYPE_BLOB:
	                return _createBlob([buffer], { type: blobType });
	            case TYPE_INT8ARRAY:
	                return new Int8Array(buffer);
	            case TYPE_UINT8ARRAY:
	                return new Uint8Array(buffer);
	            case TYPE_UINT8CLAMPEDARRAY:
	                return new Uint8ClampedArray(buffer);
	            case TYPE_INT16ARRAY:
	                return new Int16Array(buffer);
	            case TYPE_UINT16ARRAY:
	                return new Uint16Array(buffer);
	            case TYPE_INT32ARRAY:
	                return new Int32Array(buffer);
	            case TYPE_UINT32ARRAY:
	                return new Uint32Array(buffer);
	            case TYPE_FLOAT32ARRAY:
	                return new Float32Array(buffer);
	            case TYPE_FLOAT64ARRAY:
	                return new Float64Array(buffer);
	            default:
	                throw new Error('Unkown type: ' + type);
	        }
	    }

	    function stringToBuffer(serializedString) {
	        // Fill the string into a ArrayBuffer.
	        var bufferLength = serializedString.length * 0.75;
	        var len = serializedString.length;
	        var i;
	        var p = 0;
	        var encoded1, encoded2, encoded3, encoded4;

	        if (serializedString[serializedString.length - 1] === '=') {
	            bufferLength--;
	            if (serializedString[serializedString.length - 2] === '=') {
	                bufferLength--;
	            }
	        }

	        var buffer = new ArrayBuffer(bufferLength);
	        var bytes = new Uint8Array(buffer);

	        for (i = 0; i < len; i += 4) {
	            encoded1 = BASE_CHARS.indexOf(serializedString[i]);
	            encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
	            encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
	            encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);

	            /*jslint bitwise: true */
	            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
	            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
	            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	        }
	        return buffer;
	    }

	    // Converts a buffer to a string to store, serialized, in the backend
	    // storage library.
	    function bufferToString(buffer) {
	        // base64-arraybuffer
	        var bytes = new Uint8Array(buffer);
	        var base64String = '';
	        var i;

	        for (i = 0; i < bytes.length; i += 3) {
	            /*jslint bitwise: true */
	            base64String += BASE_CHARS[bytes[i] >> 2];
	            base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
	            base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
	            base64String += BASE_CHARS[bytes[i + 2] & 63];
	        }

	        if (bytes.length % 3 === 2) {
	            base64String = base64String.substring(0, base64String.length - 1) + '=';
	        } else if (bytes.length % 3 === 1) {
	            base64String = base64String.substring(0, base64String.length - 2) + '==';
	        }

	        return base64String;
	    }

	    var localforageSerializer = {
	        serialize: serialize,
	        deserialize: deserialize,
	        stringToBuffer: stringToBuffer,
	        bufferToString: bufferToString
	    };

	    exports['default'] = localforageSerializer;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Includes code from:
	 *
	 * base64-arraybuffer
	 * https://github.com/niklasvh/base64-arraybuffer
	 *
	 * Copyright (c) 2012 Niklas von Hertzen
	 * Licensed under the MIT license.
	 */
	'use strict';

	exports.__esModule = true;
	(function () {
	    'use strict';

	    var globalObject = this;
	    var openDatabase = this.openDatabase;

	    // If WebSQL methods aren't available, we can stop now.
	    if (!openDatabase) {
	        return;
	    }

	    // Open the WebSQL database (automatically creates one if one didn't
	    // previously exist), using any options set in the config.
	    function _initStorage(options) {
	        var self = this;
	        var dbInfo = {
	            db: null
	        };

	        if (options) {
	            for (var i in options) {
	                dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
	            }
	        }

	        var dbInfoPromise = new Promise(function (resolve, reject) {
	            // Open the database; the openDatabase API will automatically
	            // create it for us if it doesn't exist.
	            try {
	                dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
	            } catch (e) {
	                return self.setDriver(self.LOCALSTORAGE).then(function () {
	                    return self._initStorage(options);
	                }).then(resolve)['catch'](reject);
	            }

	            // Create our key/value table if it doesn't exist.
	            dbInfo.db.transaction(function (t) {
	                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function () {
	                    self._dbInfo = dbInfo;
	                    resolve();
	                }, function (t, error) {
	                    reject(error);
	                });
	            });
	        });

	        return new Promise(function (resolve, reject) {
	            resolve(__webpack_require__(3));
	        }).then(function (lib) {
	            dbInfo.serializer = lib;
	            return dbInfoPromise;
	        });
	    }

	    function getItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).value : null;

	                        // Check to see if this is serialized content we need to
	                        // unpack.
	                        if (result) {
	                            result = dbInfo.serializer.deserialize(result);
	                        }

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function iterate(iterator, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;

	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var rows = results.rows;
	                        var length = rows.length;

	                        for (var i = 0; i < length; i++) {
	                            var item = rows.item(i);
	                            var result = item.value;

	                            // Check to see if this is serialized content
	                            // we need to unpack.
	                            if (result) {
	                                result = dbInfo.serializer.deserialize(result);
	                            }

	                            result = iterator(result, item.key, i + 1);

	                            // void(0) prevents problems with redefinition
	                            // of `undefined`.
	                            if (result !== void 0) {
	                                resolve(result);
	                                return;
	                            }
	                        }

	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function setItem(key, value, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                // The localStorage API doesn't return undefined values in an
	                // "expected" way, so undefined is always cast to null in all
	                // drivers. See: https://github.com/mozilla/localForage/pull/42
	                if (value === undefined) {
	                    value = null;
	                }

	                // Save the original value to pass to the callback.
	                var originalValue = value;

	                var dbInfo = self._dbInfo;
	                dbInfo.serializer.serialize(value, function (value, error) {
	                    if (error) {
	                        reject(error);
	                    } else {
	                        dbInfo.db.transaction(function (t) {
	                            t.executeSql('INSERT OR REPLACE INTO ' + dbInfo.storeName + ' (key, value) VALUES (?, ?)', [key, value], function () {
	                                resolve(originalValue);
	                            }, function (t, error) {
	                                reject(error);
	                            });
	                        }, function (sqlError) {
	                            // The transaction failed; check
	                            // to see if it's a quota error.
	                            if (sqlError.code === sqlError.QUOTA_ERR) {
	                                // We reject the callback outright for now, but
	                                // it's worth trying to re-run the transaction.
	                                // Even if the user accepts the prompt to use
	                                // more storage on Safari, this error will
	                                // be called.
	                                //
	                                // TODO: Try to re-run the transaction.
	                                reject(sqlError);
	                            }
	                        });
	                    }
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function removeItem(key, callback) {
	        var self = this;

	        // Cast the key to a string, as that's all we can set as a key.
	        if (typeof key !== 'string') {
	            globalObject.console.warn(key + ' used as a key, but it is not a string.');
	            key = String(key);
	        }

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
	                        resolve();
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Deletes every item in the table.
	    // TODO: Find out if this resets the AUTO_INCREMENT number.
	    function clear(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('DELETE FROM ' + dbInfo.storeName, [], function () {
	                        resolve();
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Does a simple `COUNT(key)` to get the number of items stored in
	    // localForage.
	    function length(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    // Ahhh, SQL makes this one soooooo easy.
	                    t.executeSql('SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var result = results.rows.item(0).c;

	                        resolve(result);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    // Return the key located at key index X; essentially gets the key from a
	    // `WHERE id = ?`. This is the most efficient way I can think to implement
	    // this rarely-used (in my experience) part of the API, but it can seem
	    // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
	    // the ID of each key will change every time it's updated. Perhaps a stored
	    // procedure for the `setItem()` SQL would solve this problem?
	    // TODO: Don't change ID on `setItem()`.
	    function key(n, callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
	                        var result = results.rows.length ? results.rows.item(0).key : null;
	                        resolve(result);
	                    }, function (t, error) {
	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function keys(callback) {
	        var self = this;

	        var promise = new Promise(function (resolve, reject) {
	            self.ready().then(function () {
	                var dbInfo = self._dbInfo;
	                dbInfo.db.transaction(function (t) {
	                    t.executeSql('SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
	                        var keys = [];

	                        for (var i = 0; i < results.rows.length; i++) {
	                            keys.push(results.rows.item(i).key);
	                        }

	                        resolve(keys);
	                    }, function (t, error) {

	                        reject(error);
	                    });
	                });
	            })['catch'](reject);
	        });

	        executeCallback(promise, callback);
	        return promise;
	    }

	    function executeCallback(promise, callback) {
	        if (callback) {
	            promise.then(function (result) {
	                callback(null, result);
	            }, function (error) {
	                callback(error);
	            });
	        }
	    }

	    var webSQLStorage = {
	        _driver: 'webSQLStorage',
	        _initStorage: _initStorage,
	        iterate: iterate,
	        getItem: getItem,
	        setItem: setItem,
	        removeItem: removeItem,
	        clear: clear,
	        length: length,
	        key: key,
	        keys: keys
	    };

	    exports['default'] = webSQLStorage;
	}).call(typeof window !== 'undefined' ? window : self);
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\process\\browser.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\process\\browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\circle.js":[function(require,module,exports){
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

},{"./shape":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\shape.js","./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\line.js":[function(require,module,exports){
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

},{"./shape":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\shape.js","./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\main.js":[function(require,module,exports){
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

},{"./circle":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\circle.js","./line":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\line.js","./path":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\path.js","./semicircle":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\semicircle.js","./shape":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\shape.js","./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\path.js":[function(require,module,exports){
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

},{"./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js","shifty":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\shifty\\dist\\shifty.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\semicircle.js":[function(require,module,exports){
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

},{"./circle":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\circle.js","./shape":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\shape.js","./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\shape.js":[function(require,module,exports){
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

},{"./path":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\path.js","./utils":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js"}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\utils.js":[function(require,module,exports){
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

},{}],"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\shifty\\dist\\shifty.js":[function(require,module,exports){
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

},{}],"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\bar.js":[function(require,module,exports){
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

},{"../../lib/mithril":"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js","progressbar.js":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\progressbar.js\\src\\main.js"}],"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\cell.js":[function(require,module,exports){
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
              if (e.keyCode == '8' && ctrl.task.description().length === 0) {
                // BACKSPACE key pressed AND description is empty
                e.preventDefault()
                ctrl.task.vm.remove(ctrl.task)
              } else if (e.keyCode == '40') {
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

},{"../../lib/mithril":"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js"}],"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\list.js":[function(require,module,exports){
(function (global){
/* ( ⚆ _ ⚆ )
 *
 * Come early tomorrow, for we shall do beautiful things in the morning.
 *
 */

'use strict'

let localforage = require('localforage')
let m = require('../../lib/mithril')
let Bar = require('./bar.js')
let Task = require('./task.js')
let Cell = require('./cell.js')

// the List component is structured as a singleton (sort of)
// I am in the process of stripping this down. This should only keep track of a list
// of Cell component instances, plus a counter used for updating the progress bar.
let List = {}

// @todo: pls clean up
global.localforage = localforage
global.List = List

List.vm = (function() {
  var vm = {}
  vm.init = function() {

    //a running list of todos
    vm.list = new Array()

    localforage.getItem('document').then(function(value) {
      console.log(value)
      if (value) {
        // @todo: change this to .add(), for autoselect support.
        vm.list = value.map((desc) => {
          return new Task({
            description: desc,
            vm: vm
          })
        })
      } else {
        vm.list = []
        // localforage.setItem('document', vm.list)
      }
    }).then(function() {
      console.log(vm.list)
      // a slot to store the name of a new todo before it is created
      vm.description = m.prop('')

      vm.save = function() {
        let flat = vm.list.map((task) => {
          return task.description()
        })
        localforage.setItem('document', flat)
      }

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
        let t = new Task({description: vm.description(), vm: List.vm})
        vm.list.push(t)
        vm.description('')

        if (autoselect) {
          vm.selectTask(t)
        }

        vm.save()

        return t
      }

      // deletes a task from the list and selects the previous task
      vm.remove = (task) => {
        let i = vm.list.indexOf(task)

        if (vm.list.length > 0) {
          if (i > 0) {
            vm.selectIndex(i - 1)
          } else {
            // @todo: perhaps find a cleaner solution
            // Right now we rely on the fact that selectIndex will handle
            // out of bound indices.
            vm.selectIndex(i + 1)
          }

          // @todo: ensure that task is actually a member of the list
          vm.list.pop(task)

          vm.save()

          return true
        }

        // we didn't actually remove anything, because there was only 1 item.
        return false
      }

      //add a single item to get started. set as the currently selected element.
      if(vm.list.length < 1) {
        vm.add(true)
      }

      vm.checkOff = function(task) {
        task.done(!task.done())
        vm.recalculate()
      }

      // everything above was async so we need to refresh
      m.redraw()
    })
  }
  return vm
}())

List.controller = function (){
  List.vm.init()
}

List.view = function (){
  return [
    m('button', { onclick: List.vm.save, style: {marginBottom: '10px'}}),
    m('br'),
    m.component(Bar),
    m('table',
      List.vm.list.map(function(task) {
        return m.component(Cell, {task: task, key: task})
      })
    )
  ]
}

module.exports = List
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../lib/mithril":"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js","./bar.js":"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\bar.js","./cell.js":"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\cell.js","./task.js":"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\task.js","localforage":"C:\\Users\\nick\\Desktop\\mithical\\node_modules\\localforage\\dist\\localforage.js"}],"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\task.js":[function(require,module,exports){
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

},{"../../lib/mithril":"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js"}],"C:\\Users\\nick\\Desktop\\mithical\\src\\mithical":[function(require,module,exports){
/*                     _          
 *                    (_)         
 *    __ _   ___ _ __  _ _ __ ___ 
 *   / _` | / __| '_ \| | '__/ _ \
 *  | (_| |_\__ \ |_) | | | |  __/
 *   \__,_(_)___/ .__/|_|_|  \___|
 *              | |               
 *              |_|               
 *
 * the only thing that comes to a sleeping man is dreams
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

},{"../lib/mithril":"C:\\Users\\nick\\Desktop\\mithical\\lib\\mithril.js","./component/list":"C:\\Users\\nick\\Desktop\\mithical\\src\\component\\list.js"}]},{},["C:\\Users\\nick\\Desktop\\mithical\\src\\mithical"]);
