
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.46.2 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.46.2 */

    const file$6 = "src/components/Header.svelte";

    function create_fragment$6(ctx) {
    	let header;
    	let div;
    	let a0;
    	let t1;
    	let nav;
    	let a1;
    	let t3;
    	let a2;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "DiscountX";
    			t1 = space();
    			nav = element("nav");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Create";
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file$6, 6, 8, 151);
    			attr_dev(div, "class", "discountx-logo");
    			add_location(div, file$6, 5, 4, 114);
    			attr_dev(a1, "href", "#/");
    			add_location(a1, file$6, 9, 2, 201);
    			attr_dev(a2, "href", "#/create");
    			add_location(a2, file$6, 10, 2, 225);
    			add_location(nav, file$6, 8, 4, 193);
    			attr_dev(header, "class", "discountx-admin-masthead svelte-idp0o1");
    			add_location(header, file$6, 4, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div);
    			append_dev(div, a0);
    			append_dev(header, t1);
    			append_dev(header, nav);
    			append_dev(nav, a1);
    			append_dev(nav, t3);
    			append_dev(nav, a2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Popups.svelte generated by Svelte v3.46.2 */

    const file$5 = "src/components/Popups.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let table;
    	let thead;
    	let td0;
    	let input0;
    	let t4;
    	let span0;
    	let t5;
    	let th0;
    	let t7;
    	let th1;
    	let t9;
    	let tbody;
    	let tr0;
    	let th2;
    	let input1;
    	let t10;
    	let span1;
    	let t11;
    	let td1;
    	let t13;
    	let td2;
    	let a0;
    	let span2;
    	let t15;
    	let a1;
    	let span3;
    	let t17;
    	let a2;
    	let span4;
    	let t19;
    	let tr1;
    	let th3;
    	let input2;
    	let t20;
    	let span5;
    	let t21;
    	let td3;
    	let t23;
    	let td4;
    	let a3;
    	let span6;
    	let t25;
    	let a4;
    	let span7;
    	let t27;
    	let a5;
    	let span8;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Popups";
    			t1 = space();
    			p = element("p");
    			p.textContent = "All popups";
    			t3 = space();
    			div1 = element("div");
    			table = element("table");
    			thead = element("thead");
    			td0 = element("td");
    			input0 = element("input");
    			t4 = space();
    			span0 = element("span");
    			t5 = space();
    			th0 = element("th");
    			th0.textContent = "Name";
    			t7 = space();
    			th1 = element("th");
    			th1.textContent = "Action";
    			t9 = space();
    			tbody = element("tbody");
    			tr0 = element("tr");
    			th2 = element("th");
    			input1 = element("input");
    			t10 = space();
    			span1 = element("span");
    			t11 = space();
    			td1 = element("td");
    			td1.textContent = "Popup 1";
    			t13 = space();
    			td2 = element("td");
    			a0 = element("a");
    			span2 = element("span");
    			span2.textContent = "Edit";
    			t15 = space();
    			a1 = element("a");
    			span3 = element("span");
    			span3.textContent = "Clone";
    			t17 = space();
    			a2 = element("a");
    			span4 = element("span");
    			span4.textContent = "Delete";
    			t19 = space();
    			tr1 = element("tr");
    			th3 = element("th");
    			input2 = element("input");
    			t20 = space();
    			span5 = element("span");
    			t21 = space();
    			td3 = element("td");
    			td3.textContent = "Popup 2";
    			t23 = space();
    			td4 = element("td");
    			a3 = element("a");
    			span6 = element("span");
    			span6.textContent = "Edit";
    			t25 = space();
    			a4 = element("a");
    			span7 = element("span");
    			span7.textContent = "Clone";
    			t27 = space();
    			a5 = element("a");
    			span8 = element("span");
    			span8.textContent = "Delete";
    			add_location(h2, file$5, 6, 8, 110);
    			add_location(p, file$5, 7, 8, 134);
    			attr_dev(div0, "class", "discountx-popups-wrap-head");
    			add_location(div0, file$5, 5, 4, 61);
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "name", "selectShortcode");
    			input0.value = "false";
    			add_location(input0, file$5, 14, 20, 413);
    			attr_dev(span0, "class", "input-ui");
    			add_location(span0, file$5, 14, 81, 474);
    			attr_dev(td0, "class", "manage-column column-cb check-column");
    			add_location(td0, file$5, 13, 16, 343);
    			add_location(th0, file$5, 16, 16, 543);
    			add_location(th1, file$5, 17, 16, 573);
    			add_location(thead, file$5, 12, 12, 319);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "name", "selectPopup");
    			input1.value = "false";
    			add_location(input1, file$5, 22, 24, 721);
    			attr_dev(span1, "class", "input-ui");
    			add_location(span1, file$5, 22, 81, 778);
    			attr_dev(th2, "class", "check-column");
    			add_location(th2, file$5, 21, 20, 671);
    			add_location(td1, file$5, 24, 20, 855);
    			attr_dev(span2, "class", "hidden-xs");
    			add_location(span2, file$5, 26, 53, 972);
    			attr_dev(a0, "href", "#/popup/1");
    			attr_dev(a0, "class", "");
    			add_location(a0, file$5, 26, 24, 943);
    			attr_dev(span3, "class", "hidden-xs");
    			add_location(span3, file$5, 27, 56, 1068);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "popup-clone");
    			add_location(a1, file$5, 27, 24, 1036);
    			attr_dev(span4, "class", "hidden-xs");
    			add_location(span4, file$5, 28, 57, 1166);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "popup-delete");
    			add_location(a2, file$5, 28, 24, 1133);
    			attr_dev(td2, "class", "popup-actions");
    			add_location(td2, file$5, 25, 20, 892);
    			add_location(tr0, file$5, 20, 16, 646);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "name", "selectPopup");
    			input2.value = "false";
    			add_location(input2, file$5, 34, 24, 1348);
    			attr_dev(span5, "class", "input-ui");
    			add_location(span5, file$5, 34, 81, 1405);
    			attr_dev(th3, "class", "check-column");
    			add_location(th3, file$5, 33, 20, 1298);
    			add_location(td3, file$5, 36, 20, 1482);
    			attr_dev(span6, "class", "hidden-xs");
    			add_location(span6, file$5, 38, 53, 1599);
    			attr_dev(a3, "href", "#/popup/2");
    			attr_dev(a3, "class", "");
    			add_location(a3, file$5, 38, 24, 1570);
    			attr_dev(span7, "class", "hidden-xs");
    			add_location(span7, file$5, 39, 56, 1695);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "popup-clone");
    			add_location(a4, file$5, 39, 24, 1663);
    			attr_dev(span8, "class", "hidden-xs");
    			add_location(span8, file$5, 40, 57, 1793);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "popup-delete");
    			add_location(a5, file$5, 40, 24, 1760);
    			attr_dev(td4, "class", "popup-actions");
    			add_location(td4, file$5, 37, 20, 1519);
    			add_location(tr1, file$5, 32, 16, 1273);
    			add_location(tbody, file$5, 19, 12, 622);
    			attr_dev(table, "class", "discountx-table wp-list-table widefat fixed striped table-view-list posts");
    			add_location(table, file$5, 11, 8, 217);
    			attr_dev(div1, "class", "discountx-popups-wrap-body");
    			add_location(div1, file$5, 10, 4, 168);
    			attr_dev(div2, "class", "discountx-popups-wrap");
    			add_location(div2, file$5, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, td0);
    			append_dev(td0, input0);
    			append_dev(td0, t4);
    			append_dev(td0, span0);
    			append_dev(thead, t5);
    			append_dev(thead, th0);
    			append_dev(thead, t7);
    			append_dev(thead, th1);
    			append_dev(table, t9);
    			append_dev(table, tbody);
    			append_dev(tbody, tr0);
    			append_dev(tr0, th2);
    			append_dev(th2, input1);
    			append_dev(th2, t10);
    			append_dev(th2, span1);
    			append_dev(tr0, t11);
    			append_dev(tr0, td1);
    			append_dev(tr0, t13);
    			append_dev(tr0, td2);
    			append_dev(td2, a0);
    			append_dev(a0, span2);
    			append_dev(td2, t15);
    			append_dev(td2, a1);
    			append_dev(a1, span3);
    			append_dev(td2, t17);
    			append_dev(td2, a2);
    			append_dev(a2, span4);
    			append_dev(tbody, t19);
    			append_dev(tbody, tr1);
    			append_dev(tr1, th3);
    			append_dev(th3, input2);
    			append_dev(th3, t20);
    			append_dev(th3, span5);
    			append_dev(tr1, t21);
    			append_dev(tr1, td3);
    			append_dev(tr1, t23);
    			append_dev(tr1, td4);
    			append_dev(td4, a3);
    			append_dev(a3, span6);
    			append_dev(td4, t25);
    			append_dev(td4, a4);
    			append_dev(a4, span7);
    			append_dev(td4, t27);
    			append_dev(td4, a5);
    			append_dev(a5, span8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Popups', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Popups> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Popups extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popups",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/settings/Condition.svelte generated by Svelte v3.46.2 */

    const file$4 = "src/components/settings/Condition.svelte";

    function create_fragment$4(ctx) {
    	let div18;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let p0;
    	let t3;
    	let div1;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t7;
    	let div5;
    	let div3;
    	let h41;
    	let t9;
    	let div4;
    	let select1;
    	let option3;
    	let option4;
    	let t12;
    	let div8;
    	let div6;
    	let h42;
    	let t14;
    	let p1;
    	let t16;
    	let div7;
    	let select2;
    	let option5;
    	let option6;
    	let option7;
    	let t20;
    	let div11;
    	let div9;
    	let h43;
    	let t22;
    	let p2;
    	let t24;
    	let div10;
    	let select3;
    	let option8;
    	let option9;
    	let option10;
    	let t28;
    	let div14;
    	let div12;
    	let h44;
    	let t30;
    	let p3;
    	let t32;
    	let div13;
    	let select4;
    	let option11;
    	let option12;
    	let option13;
    	let t36;
    	let div17;
    	let div15;
    	let h45;
    	let t38;
    	let p4;
    	let t40;
    	let div16;
    	let input;

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Coupon Code";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t3 = space();
    			div1 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Coupon 1";
    			option1 = element("option");
    			option1.textContent = "Coupon 2";
    			option2 = element("option");
    			option2.textContent = "Coupon 3";
    			t7 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Appearence";
    			t9 = space();
    			div4 = element("div");
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Show";
    			option4 = element("option");
    			option4.textContent = "Dont Show";
    			t12 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Cart Type";
    			t14 = space();
    			p1 = element("p");
    			p1.textContent = "Select Cart Type condition.";
    			t16 = space();
    			div7 = element("div");
    			select2 = element("select");
    			option5 = element("option");
    			option5.textContent = "Cart money value";
    			option6 = element("option");
    			option6.textContent = "Number of cart items";
    			option7 = element("option");
    			option7.textContent = "Products in the cart";
    			t20 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = "Condition";
    			t22 = space();
    			p2 = element("p");
    			p2.textContent = "Select the condition.";
    			t24 = space();
    			div10 = element("div");
    			select3 = element("select");
    			option8 = element("option");
    			option8.textContent = "Over or equal";
    			option9 = element("option");
    			option9.textContent = "Equal";
    			option10 = element("option");
    			option10.textContent = "Under";
    			t28 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = "Products";
    			t30 = space();
    			p3 = element("p");
    			p3.textContent = "Choose products.";
    			t32 = space();
    			div13 = element("div");
    			select4 = element("select");
    			option11 = element("option");
    			option11.textContent = "Product 1";
    			option12 = element("option");
    			option12.textContent = "Product 2";
    			option13 = element("option");
    			option13.textContent = "Product 3";
    			t36 = space();
    			div17 = element("div");
    			div15 = element("div");
    			h45 = element("h4");
    			h45.textContent = "Number";
    			t38 = space();
    			p4 = element("p");
    			p4.textContent = "The number to set the condition.";
    			t40 = space();
    			div16 = element("div");
    			input = element("input");
    			add_location(h40, file$4, 3, 12, 108);
    			attr_dev(p0, "class", "desc");
    			add_location(p0, file$4, 4, 12, 141);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$4, 2, 8, 57);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 8, 16, 352);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 9, 16, 404);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 10, 16, 456);
    			attr_dev(select0, "name", "");
    			attr_dev(select0, "id", "");
    			add_location(select0, file$4, 7, 12, 313);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$4, 6, 8, 260);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$4, 1, 4, 10);
    			add_location(h41, file$4, 17, 12, 643);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$4, 16, 8, 592);
    			option3.__value = "1";
    			option3.value = option3.__value;
    			add_location(option3, file$4, 21, 16, 778);
    			option4.__value = "2";
    			option4.value = option4.__value;
    			add_location(option4, file$4, 22, 16, 826);
    			attr_dev(select1, "name", "");
    			attr_dev(select1, "id", "");
    			add_location(select1, file$4, 20, 12, 739);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$4, 19, 8, 686);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$4, 15, 4, 545);
    			add_location(h42, file$4, 29, 12, 1014);
    			attr_dev(p1, "class", "desc");
    			add_location(p1, file$4, 30, 12, 1045);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$4, 28, 8, 963);
    			option5.__value = "1";
    			option5.value = option5.__value;
    			add_location(option5, file$4, 34, 16, 1208);
    			option6.__value = "1";
    			option6.value = option6.__value;
    			add_location(option6, file$4, 35, 16, 1268);
    			option7.__value = "2";
    			option7.value = option7.__value;
    			add_location(option7, file$4, 36, 16, 1332);
    			attr_dev(select2, "name", "");
    			attr_dev(select2, "id", "");
    			add_location(select2, file$4, 33, 12, 1169);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$4, 32, 8, 1116);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$4, 27, 4, 916);
    			add_location(h43, file$4, 43, 12, 1531);
    			attr_dev(p2, "class", "desc");
    			add_location(p2, file$4, 44, 12, 1562);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$4, 42, 8, 1480);
    			option8.__value = "1";
    			option8.value = option8.__value;
    			add_location(option8, file$4, 48, 16, 1719);
    			option9.__value = "1";
    			option9.value = option9.__value;
    			add_location(option9, file$4, 49, 16, 1776);
    			option10.__value = "2";
    			option10.value = option10.__value;
    			add_location(option10, file$4, 50, 16, 1825);
    			attr_dev(select3, "name", "");
    			attr_dev(select3, "id", "");
    			add_location(select3, file$4, 47, 12, 1680);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$4, 46, 8, 1627);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$4, 41, 4, 1433);
    			add_location(h44, file$4, 57, 12, 2009);
    			attr_dev(p3, "class", "desc");
    			add_location(p3, file$4, 58, 12, 2039);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$4, 56, 8, 1958);
    			option11.__value = "1";
    			option11.value = option11.__value;
    			add_location(option11, file$4, 62, 16, 2200);
    			option12.__value = "1";
    			option12.value = option12.__value;
    			add_location(option12, file$4, 63, 16, 2253);
    			option13.__value = "2";
    			option13.value = option13.__value;
    			add_location(option13, file$4, 64, 16, 2306);
    			attr_dev(select4, "name", "");
    			attr_dev(select4, "id", "");
    			select4.multiple = true;
    			add_location(select4, file$4, 61, 12, 2152);
    			attr_dev(div13, "class", "discountx-settings-control");
    			add_location(div13, file$4, 60, 8, 2099);
    			attr_dev(div14, "class", "discountx-settings-panel");
    			add_location(div14, file$4, 55, 4, 1911);
    			add_location(h45, file$4, 71, 12, 2494);
    			attr_dev(p4, "class", "desc");
    			add_location(p4, file$4, 72, 12, 2522);
    			attr_dev(div15, "class", "discountx-settings-label");
    			add_location(div15, file$4, 70, 8, 2443);
    			attr_dev(input, "type", "number");
    			add_location(input, file$4, 75, 12, 2651);
    			attr_dev(div16, "class", "discountx-settings-control");
    			add_location(div16, file$4, 74, 8, 2598);
    			attr_dev(div17, "class", "discountx-settings-panel");
    			add_location(div17, file$4, 69, 4, 2396);
    			add_location(div18, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(div18, t7);
    			append_dev(div18, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(div18, t12);
    			append_dev(div18, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div6, t14);
    			append_dev(div6, p1);
    			append_dev(div8, t16);
    			append_dev(div8, div7);
    			append_dev(div7, select2);
    			append_dev(select2, option5);
    			append_dev(select2, option6);
    			append_dev(select2, option7);
    			append_dev(div18, t20);
    			append_dev(div18, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div9, t22);
    			append_dev(div9, p2);
    			append_dev(div11, t24);
    			append_dev(div11, div10);
    			append_dev(div10, select3);
    			append_dev(select3, option8);
    			append_dev(select3, option9);
    			append_dev(select3, option10);
    			append_dev(div18, t28);
    			append_dev(div18, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h44);
    			append_dev(div12, t30);
    			append_dev(div12, p3);
    			append_dev(div14, t32);
    			append_dev(div14, div13);
    			append_dev(div13, select4);
    			append_dev(select4, option11);
    			append_dev(select4, option12);
    			append_dev(select4, option13);
    			append_dev(div18, t36);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, h45);
    			append_dev(div15, t38);
    			append_dev(div15, p4);
    			append_dev(div17, t40);
    			append_dev(div17, div16);
    			append_dev(div16, input);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Condition', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Condition> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Condition extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Condition",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/settings/General.svelte generated by Svelte v3.46.2 */

    const file$3 = "src/components/settings/General.svelte";

    function create_fragment$3(ctx) {
    	let div21;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let p0;
    	let t3;
    	let div1;
    	let select0;
    	let option0;
    	let option1;
    	let t6;
    	let div5;
    	let div3;
    	let h41;
    	let t8;
    	let p1;
    	let t10;
    	let div4;
    	let select1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t15;
    	let div8;
    	let div6;
    	let h42;
    	let t17;
    	let p2;
    	let t19;
    	let div7;
    	let button;
    	let i;
    	let t20;
    	let div11;
    	let div9;
    	let h43;
    	let t22;
    	let p3;
    	let t24;
    	let div10;
    	let input0;
    	let t25;
    	let div14;
    	let div12;
    	let h44;
    	let t27;
    	let p4;
    	let t29;
    	let div13;
    	let input1;
    	let t30;
    	let div17;
    	let div15;
    	let h45;
    	let t32;
    	let p5;
    	let t34;
    	let div16;
    	let textarea;
    	let t35;
    	let div20;
    	let div18;
    	let h46;
    	let t37;
    	let p6;
    	let t39;
    	let div19;
    	let input2;

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Display On";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t3 = space();
    			div1 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Cart Page";
    			option1 = element("option");
    			option1.textContent = "Every Page";
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Theme";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t10 = space();
    			div4 = element("div");
    			select1 = element("select");
    			option2 = element("option");
    			option2.textContent = "Theme 1";
    			option3 = element("option");
    			option3.textContent = "Theme 2 (PRO)";
    			option4 = element("option");
    			option4.textContent = "Theme 3 (PRO)";
    			option5 = element("option");
    			option5.textContent = "Theme 4 (PRO)";
    			t15 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Image";
    			t17 = space();
    			p2 = element("p");
    			p2.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t19 = space();
    			div7 = element("div");
    			button = element("button");
    			i = element("i");
    			t20 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = "Pre Title";
    			t22 = space();
    			p3 = element("p");
    			p3.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t24 = space();
    			div10 = element("div");
    			input0 = element("input");
    			t25 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = "Title";
    			t27 = space();
    			p4 = element("p");
    			p4.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t29 = space();
    			div13 = element("div");
    			input1 = element("input");
    			t30 = space();
    			div17 = element("div");
    			div15 = element("div");
    			h45 = element("h4");
    			h45.textContent = "Content";
    			t32 = space();
    			p5 = element("p");
    			p5.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t34 = space();
    			div16 = element("div");
    			textarea = element("textarea");
    			t35 = space();
    			div20 = element("div");
    			div18 = element("div");
    			h46 = element("h4");
    			h46.textContent = "Button Text";
    			t37 = space();
    			p6 = element("p");
    			p6.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t39 = space();
    			div19 = element("div");
    			input2 = element("input");
    			add_location(h40, file$3, 3, 12, 108);
    			attr_dev(p0, "class", "desc");
    			add_location(p0, file$3, 4, 12, 140);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$3, 2, 8, 57);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 8, 16, 351);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 9, 16, 404);
    			attr_dev(select0, "name", "");
    			attr_dev(select0, "id", "");
    			add_location(select0, file$3, 7, 12, 312);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$3, 6, 8, 259);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$3, 1, 4, 10);
    			add_location(h41, file$3, 16, 12, 593);
    			attr_dev(p1, "class", "desc");
    			add_location(p1, file$3, 17, 12, 620);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$3, 15, 8, 542);
    			option2.__value = "1";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 21, 16, 831);
    			option3.__value = "2";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 22, 16, 882);
    			option4.__value = "2";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 23, 16, 939);
    			option5.__value = "2";
    			option5.value = option5.__value;
    			add_location(option5, file$3, 24, 16, 996);
    			attr_dev(select1, "name", "");
    			attr_dev(select1, "id", "");
    			add_location(select1, file$3, 20, 12, 792);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$3, 19, 8, 739);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$3, 14, 4, 495);
    			add_location(h42, file$3, 31, 12, 1188);
    			attr_dev(p2, "class", "desc");
    			add_location(p2, file$3, 32, 12, 1215);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$3, 30, 8, 1137);
    			attr_dev(i, "class", "dashicons-before dashicons-cloud-upload");
    			add_location(i, file$3, 35, 54, 1429);
    			attr_dev(button, "id", "discountx-upload-popup-image");
    			add_location(button, file$3, 35, 12, 1387);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$3, 34, 8, 1334);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$3, 29, 4, 1090);
    			add_location(h43, file$3, 41, 12, 1623);
    			attr_dev(p3, "class", "desc");
    			add_location(p3, file$3, 42, 12, 1654);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$3, 40, 8, 1572);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "popupPreTitle");
    			attr_dev(input0, "id", "popup-pre-title");
    			input0.value = "";
    			add_location(input0, file$3, 45, 12, 1826);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$3, 44, 8, 1773);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$3, 39, 4, 1525);
    			add_location(h44, file$3, 56, 12, 2104);
    			attr_dev(p4, "class", "desc");
    			add_location(p4, file$3, 57, 12, 2131);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$3, 55, 8, 2053);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "popupPreTitle");
    			attr_dev(input1, "id", "popup-pre-title");
    			input1.value = "";
    			add_location(input1, file$3, 60, 12, 2303);
    			attr_dev(div13, "class", "discountx-settings-control");
    			add_location(div13, file$3, 59, 8, 2250);
    			attr_dev(div14, "class", "discountx-settings-panel");
    			add_location(div14, file$3, 54, 4, 2006);
    			add_location(h45, file$3, 71, 12, 2581);
    			attr_dev(p5, "class", "desc");
    			add_location(p5, file$3, 72, 12, 2610);
    			attr_dev(div15, "class", "discountx-settings-label");
    			add_location(div15, file$3, 70, 8, 2530);
    			attr_dev(textarea, "name", "");
    			attr_dev(textarea, "id", "");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			add_location(textarea, file$3, 75, 12, 2782);
    			attr_dev(div16, "class", "discountx-settings-control");
    			add_location(div16, file$3, 74, 8, 2729);
    			attr_dev(div17, "class", "discountx-settings-panel");
    			add_location(div17, file$3, 69, 4, 2483);
    			add_location(h46, file$3, 81, 12, 2967);
    			attr_dev(p6, "class", "desc");
    			add_location(p6, file$3, 82, 12, 3000);
    			attr_dev(div18, "class", "discountx-settings-label");
    			add_location(div18, file$3, 80, 8, 2916);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$3, 85, 12, 3172);
    			attr_dev(div19, "class", "discountx-settings-control");
    			add_location(div19, file$3, 84, 8, 3119);
    			attr_dev(div20, "class", "discountx-settings-panel");
    			add_location(div20, file$3, 79, 4, 2869);
    			add_location(div21, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(div21, t6);
    			append_dev(div21, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div3, t8);
    			append_dev(div3, p1);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, select1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(div21, t15);
    			append_dev(div21, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div6, t17);
    			append_dev(div6, p2);
    			append_dev(div8, t19);
    			append_dev(div8, div7);
    			append_dev(div7, button);
    			append_dev(button, i);
    			append_dev(div21, t20);
    			append_dev(div21, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div9, t22);
    			append_dev(div9, p3);
    			append_dev(div11, t24);
    			append_dev(div11, div10);
    			append_dev(div10, input0);
    			append_dev(div21, t25);
    			append_dev(div21, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h44);
    			append_dev(div12, t27);
    			append_dev(div12, p4);
    			append_dev(div14, t29);
    			append_dev(div14, div13);
    			append_dev(div13, input1);
    			append_dev(div21, t30);
    			append_dev(div21, div17);
    			append_dev(div17, div15);
    			append_dev(div15, h45);
    			append_dev(div15, t32);
    			append_dev(div15, p5);
    			append_dev(div17, t34);
    			append_dev(div17, div16);
    			append_dev(div16, textarea);
    			append_dev(div21, t35);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, h46);
    			append_dev(div18, t37);
    			append_dev(div18, p6);
    			append_dev(div20, t39);
    			append_dev(div20, div19);
    			append_dev(div19, input2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('General', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<General> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class General extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "General",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/settings/Style.svelte generated by Svelte v3.46.2 */

    const file$2 = "src/components/settings/Style.svelte";

    // (57:16) {#if buttonColorState === 'normal' }
    function create_if_block_1$1(ctx) {
    	let div0;
    	let h40;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let h41;
    	let t4;
    	let input1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Color";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Background Color";
    			t4 = space();
    			input1 = element("input");
    			add_location(h40, file$2, 58, 24, 2280);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "");
    			attr_dev(input0, "id", "");
    			add_location(input0, file$2, 59, 24, 2319);
    			attr_dev(div0, "class", "normal-color-picker");
    			add_location(div0, file$2, 57, 20, 2222);
    			add_location(h41, file$2, 63, 24, 2462);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "");
    			attr_dev(input1, "id", "");
    			add_location(input1, file$2, 64, 24, 2512);
    			attr_dev(div1, "class", "normal-bgcolor-picker");
    			add_location(div1, file$2, 62, 20, 2402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h41);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(57:16) {#if buttonColorState === 'normal' }",
    		ctx
    	});

    	return block;
    }

    // (68:16) {#if buttonColorState === 'hover' }
    function create_if_block$1(ctx) {
    	let div0;
    	let h40;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let h41;
    	let t4;
    	let input1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Hover Color";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Hover Background Color";
    			t4 = space();
    			input1 = element("input");
    			add_location(h40, file$2, 69, 24, 2725);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "");
    			attr_dev(input0, "id", "");
    			add_location(input0, file$2, 70, 24, 2770);
    			attr_dev(div0, "class", "hover-color-picker");
    			add_location(div0, file$2, 68, 20, 2668);
    			add_location(h41, file$2, 74, 24, 2912);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "");
    			attr_dev(input1, "id", "");
    			add_location(input1, file$2, 75, 24, 2968);
    			attr_dev(div1, "class", "hover-bgcolor-picker");
    			add_location(div1, file$2, 73, 20, 2853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h41);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(68:16) {#if buttonColorState === 'hover' }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div20;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let p0;
    	let t3;
    	let div1;
    	let input0;
    	let t4;
    	let div5;
    	let div3;
    	let h41;
    	let t6;
    	let p1;
    	let t8;
    	let div4;
    	let input1;
    	let t9;
    	let div8;
    	let div6;
    	let h42;
    	let t11;
    	let p2;
    	let t13;
    	let div7;
    	let input2;
    	let t14;
    	let div11;
    	let div9;
    	let h43;
    	let t16;
    	let p3;
    	let t18;
    	let div10;
    	let input3;
    	let t19;
    	let div16;
    	let div12;
    	let h44;
    	let t21;
    	let p4;
    	let t23;
    	let div15;
    	let div13;
    	let button0;
    	let t25;
    	let button1;
    	let t27;
    	let div14;
    	let t28;
    	let t29;
    	let div19;
    	let div17;
    	let h45;
    	let t31;
    	let p5;
    	let t33;
    	let div18;
    	let input4;
    	let mounted;
    	let dispose;
    	let if_block0 = /*buttonColorState*/ ctx[0] === 'normal' && create_if_block_1$1(ctx);
    	let if_block1 = /*buttonColorState*/ ctx[0] === 'hover' && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div20 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Title Font Size";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t3 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Title Color";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t8 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t9 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Content Font Size";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t13 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t14 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = "Content Color";
    			t16 = space();
    			p3 = element("p");
    			p3.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t18 = space();
    			div10 = element("div");
    			input3 = element("input");
    			t19 = space();
    			div16 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = "Button Color";
    			t21 = space();
    			p4 = element("p");
    			p4.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t23 = space();
    			div15 = element("div");
    			div13 = element("div");
    			button0 = element("button");
    			button0.textContent = "Normal";
    			t25 = space();
    			button1 = element("button");
    			button1.textContent = "Hover";
    			t27 = space();
    			div14 = element("div");
    			if (if_block0) if_block0.c();
    			t28 = space();
    			if (if_block1) if_block1.c();
    			t29 = space();
    			div19 = element("div");
    			div17 = element("div");
    			h45 = element("h4");
    			h45.textContent = "Popup Background Color";
    			t31 = space();
    			p5 = element("p");
    			p5.textContent = "Select coupon code to apply when user will click on the popup apply button.";
    			t33 = space();
    			div18 = element("div");
    			input4 = element("input");
    			add_location(h40, file$2, 7, 12, 165);
    			attr_dev(p0, "class", "desc");
    			add_location(p0, file$2, 8, 12, 202);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$2, 6, 8, 114);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "");
    			attr_dev(input0, "id", "");
    			add_location(input0, file$2, 11, 12, 374);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$2, 10, 8, 321);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$2, 5, 4, 67);
    			add_location(h41, file$2, 17, 12, 539);
    			attr_dev(p1, "class", "desc");
    			add_location(p1, file$2, 18, 12, 572);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$2, 16, 8, 488);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "");
    			attr_dev(input1, "id", "");
    			add_location(input1, file$2, 21, 12, 744);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$2, 20, 8, 691);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$2, 15, 4, 441);
    			add_location(h42, file$2, 27, 12, 908);
    			attr_dev(p2, "class", "desc");
    			add_location(p2, file$2, 28, 12, 947);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$2, 26, 8, 857);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "");
    			attr_dev(input2, "id", "");
    			add_location(input2, file$2, 31, 12, 1119);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$2, 30, 8, 1066);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$2, 25, 4, 810);
    			add_location(h43, file$2, 37, 12, 1284);
    			attr_dev(p3, "class", "desc");
    			add_location(p3, file$2, 38, 12, 1319);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$2, 36, 8, 1233);
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "name", "");
    			attr_dev(input3, "id", "");
    			add_location(input3, file$2, 41, 12, 1491);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$2, 40, 8, 1438);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$2, 35, 4, 1186);
    			add_location(h44, file$2, 47, 12, 1655);
    			attr_dev(p4, "class", "desc");
    			add_location(p4, file$2, 48, 12, 1689);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$2, 46, 8, 1604);
    			attr_dev(button0, "class", "normal");
    			add_location(button0, file$2, 52, 16, 1901);
    			attr_dev(button1, "class", "hover");
    			add_location(button1, file$2, 53, 16, 2003);
    			attr_dev(div13, "class", "color-tab");
    			add_location(div13, file$2, 51, 12, 1861);
    			attr_dev(div14, "class", "color-tab-content");
    			add_location(div14, file$2, 55, 12, 2117);
    			attr_dev(div15, "class", "discountx-settings-control");
    			add_location(div15, file$2, 50, 8, 1808);
    			attr_dev(div16, "class", "discountx-settings-panel");
    			add_location(div16, file$2, 45, 4, 1557);
    			add_location(h45, file$2, 84, 12, 3200);
    			attr_dev(p5, "class", "desc");
    			add_location(p5, file$2, 85, 12, 3244);
    			attr_dev(div17, "class", "discountx-settings-label");
    			add_location(div17, file$2, 83, 8, 3149);
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "name", "");
    			attr_dev(input4, "id", "");
    			add_location(input4, file$2, 88, 12, 3416);
    			attr_dev(div18, "class", "discountx-settings-control");
    			add_location(div18, file$2, 87, 8, 3363);
    			attr_dev(div19, "class", "discountx-settings-panel");
    			add_location(div19, file$2, 82, 4, 3102);
    			add_location(div20, file$2, 4, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			append_dev(div20, t4);
    			append_dev(div20, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div3, t6);
    			append_dev(div3, p1);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			append_dev(div20, t9);
    			append_dev(div20, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div6, t11);
    			append_dev(div6, p2);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(div7, input2);
    			append_dev(div20, t14);
    			append_dev(div20, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div9, t16);
    			append_dev(div9, p3);
    			append_dev(div11, t18);
    			append_dev(div11, div10);
    			append_dev(div10, input3);
    			append_dev(div20, t19);
    			append_dev(div20, div16);
    			append_dev(div16, div12);
    			append_dev(div12, h44);
    			append_dev(div12, t21);
    			append_dev(div12, p4);
    			append_dev(div16, t23);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, button0);
    			append_dev(div13, t25);
    			append_dev(div13, button1);
    			append_dev(div15, t27);
    			append_dev(div15, div14);
    			if (if_block0) if_block0.m(div14, null);
    			append_dev(div14, t28);
    			if (if_block1) if_block1.m(div14, null);
    			append_dev(div20, t29);
    			append_dev(div20, div19);
    			append_dev(div19, div17);
    			append_dev(div17, h45);
    			append_dev(div17, t31);
    			append_dev(div17, p5);
    			append_dev(div19, t33);
    			append_dev(div19, div18);
    			append_dev(div18, input4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*buttonColorState*/ ctx[0] === 'normal') {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div14, t28);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*buttonColorState*/ ctx[0] === 'hover') {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div14, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Style', slots, []);
    	let buttonColorState = 'normal';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Style> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, buttonColorState = 'normal');
    	const click_handler_1 = () => $$invalidate(0, buttonColorState = 'hover');
    	$$self.$capture_state = () => ({ buttonColorState });

    	$$self.$inject_state = $$props => {
    		if ('buttonColorState' in $$props) $$invalidate(0, buttonColorState = $$props.buttonColorState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [buttonColorState, click_handler, click_handler_1];
    }

    class Style extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Style",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Create.svelte generated by Svelte v3.46.2 */
    const file$1 = "src/components/Create.svelte";

    // (34:8) {#if currentTab === 'condition'}
    function create_if_block_2(ctx) {
    	let div;
    	let condition;
    	let current;
    	condition = new Condition({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(condition.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 34, 8, 1048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(condition, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(condition.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(condition.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(condition);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(34:8) {#if currentTab === 'condition'}",
    		ctx
    	});

    	return block;
    }

    // (40:8) {#if currentTab === 'settings'}
    function create_if_block_1(ctx) {
    	let div;
    	let general;
    	let current;
    	general = new General({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(general.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 40, 8, 1188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(general, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(general.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(general.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(general);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(40:8) {#if currentTab === 'settings'}",
    		ctx
    	});

    	return block;
    }

    // (46:8) {#if currentTab === 'style'}
    function create_if_block(ctx) {
    	let div;
    	let style;
    	let current;
    	style = new Style({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(style.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 46, 8, 1323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(style, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(style.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(style.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(46:8) {#if currentTab === 'style'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let h20;
    	let t1;
    	let p0;
    	let t3;
    	let div1;
    	let h21;
    	let t5;
    	let input;
    	let t6;
    	let button0;
    	let t8;
    	let div5;
    	let div3;
    	let h22;
    	let t10;
    	let p1;
    	let t12;
    	let div4;
    	let nav;
    	let button1;
    	let t14;
    	let button2;
    	let t16;
    	let button3;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let button4;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*currentTab*/ ctx[0] === 'condition' && create_if_block_2(ctx);
    	let if_block1 = /*currentTab*/ ctx[0] === 'settings' && create_if_block_1(ctx);
    	let if_block2 = /*currentTab*/ ctx[0] === 'style' && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Create";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Create Popup";
    			t3 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Name:";
    			t5 = space();
    			input = element("input");
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Save";
    			t8 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Create";
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "Create Popup";
    			t12 = space();
    			div4 = element("div");
    			nav = element("nav");
    			button1 = element("button");
    			button1.textContent = "Condition";
    			t14 = space();
    			button2 = element("button");
    			button2.textContent = "Settings";
    			t16 = space();
    			button3 = element("button");
    			button3.textContent = "Style";
    			t18 = space();
    			if (if_block0) if_block0.c();
    			t19 = space();
    			if (if_block1) if_block1.c();
    			t20 = space();
    			if (if_block2) if_block2.c();
    			t21 = space();
    			button4 = element("button");
    			button4.textContent = "Save";
    			add_location(h20, file$1, 9, 8, 300);
    			add_location(p0, file$1, 10, 8, 324);
    			attr_dev(div0, "class", "discountx-popups-wrap-head");
    			add_location(div0, file$1, 8, 4, 251);
    			add_location(h21, file$1, 14, 8, 404);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "");
    			attr_dev(input, "id", "");
    			add_location(input, file$1, 15, 8, 428);
    			add_location(button0, file$1, 16, 8, 470);
    			attr_dev(div1, "class", "discountx-popups-info");
    			add_location(div1, file$1, 13, 4, 360);
    			attr_dev(div2, "class", "discountx-popups-box");
    			add_location(div2, file$1, 7, 0, 212);
    			add_location(h22, file$1, 22, 8, 600);
    			add_location(p1, file$1, 23, 8, 624);
    			attr_dev(div3, "class", "discountx-popups-wrap-head");
    			add_location(div3, file$1, 21, 4, 551);
    			attr_dev(button1, "class", "svelte-1inllv2");
    			add_location(button1, file$1, 28, 12, 756);
    			attr_dev(button2, "class", "svelte-1inllv2");
    			add_location(button2, file$1, 29, 12, 839);
    			attr_dev(button3, "class", "svelte-1inllv2");
    			add_location(button3, file$1, 30, 12, 920);
    			attr_dev(nav, "class", "discountx-tab-navbar svelte-1inllv2");
    			add_location(nav, file$1, 27, 8, 709);
    			attr_dev(div4, "class", "discountx-popups-wrap-body");
    			add_location(div4, file$1, 26, 4, 660);
    			add_location(button4, file$1, 53, 4, 1427);
    			attr_dev(div5, "class", "discountx-popups-wrap");
    			add_location(div5, file$1, 20, 0, 511);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			append_dev(div1, t6);
    			append_dev(div1, button0);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, h22);
    			append_dev(div3, t10);
    			append_dev(div3, p1);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, nav);
    			append_dev(nav, button1);
    			append_dev(nav, t14);
    			append_dev(nav, button2);
    			append_dev(nav, t16);
    			append_dev(nav, button3);
    			append_dev(div4, t18);
    			if (if_block0) if_block0.m(div4, null);
    			append_dev(div4, t19);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t20);
    			if (if_block2) if_block2.m(div4, null);
    			append_dev(div5, t21);
    			append_dev(div5, button4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button1, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*currentTab*/ ctx[0] === 'condition') {
    				if (if_block0) {
    					if (dirty & /*currentTab*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div4, t19);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*currentTab*/ ctx[0] === 'settings') {
    				if (if_block1) {
    					if (dirty & /*currentTab*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div4, t20);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*currentTab*/ ctx[0] === 'style') {
    				if (if_block2) {
    					if (dirty & /*currentTab*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div4, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div5);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Create', slots, []);
    	let currentTab = 'condition';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Create> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, currentTab = 'condition');
    	const click_handler_1 = () => $$invalidate(0, currentTab = 'settings');
    	const click_handler_2 = () => $$invalidate(0, currentTab = 'style');
    	$$self.$capture_state = () => ({ Condition, General, Style, currentTab });

    	$$self.$inject_state = $$props => {
    		if ('currentTab' in $$props) $$invalidate(0, currentTab = $$props.currentTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentTab, click_handler, click_handler_1, click_handler_2];
    }

    class Create extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Create",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t;
    	let router;
    	let current;
    	header = new Header({ $$inline: true });

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    			add_location(main, file, 12, 0, 265);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const routes = { '/': Popups, '/create': Create };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, Header, Popups, Create, routes });
    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const root = document.getElementById( 'discountx-app-container' );

    const app = new App({
    	target: root,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
