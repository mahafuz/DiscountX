
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_multiple_value(select) {
        return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const { Error: Error_1, Object: Object_1$3, console: console_1 } = globals;

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
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
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
    	const if_block_creators = [create_if_block$3, create_else_block];
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

    	Object_1$3.keys($$props).forEach(key => {
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
    			add_location(a0, file$6, 2, 8, 83);
    			attr_dev(div, "class", "discountx-logo");
    			add_location(div, file$6, 1, 4, 46);
    			attr_dev(a1, "href", "#/");
    			add_location(a1, file$6, 5, 2, 133);
    			attr_dev(a2, "href", "#/rule");
    			add_location(a2, file$6, 6, 2, 157);
    			add_location(nav, file$6, 4, 4, 125);
    			attr_dev(header, "class", "discountx-admin-masthead svelte-7otpgh");
    			add_location(header, file$6, 0, 0, 0);
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

    const config = Object.assign({}, window.DISCOUNTX);
    const translations = Object.assign({}, window.DISCOUNTX.translations);


    delete window.DISCOUNTX.nonce;
    delete window.DISCOUNTX.siteurl;
    delete window.DISCOUNTX.ajaxurl;
    delete window.DISCOUNTX.adminurl;
    delete window.DISCOUNTX.options;
    delete window.DISCOUNTX.translations;

    function getCoupons() {
        return config.options.coupons;
    }

    function getAppearance() {
        return config.options.appearance;
    }

    function getCartTypes() {
        return config.options.cartTypes;
    }

    function getConditions() {
        return config.options.conditionTypes;
    }

    function getAllProducts() {
        return config.options.products;
    }

    function getDisplayOptions() {
        return config.options.displayOptions;
    }

    function getThemes() {
        return config.options.themes;
    }

    function getNonce(action) {
        return config.nonce[action];
    }

    function getAjaxURL() {
        return config.ajaxurl;
    }

    function translation(key = null) {
        return key && key in translations ? translations[key] : '';
    }

    /* src/components/Rules.svelte generated by Svelte v3.46.2 */

    const { Object: Object_1$2 } = globals;
    const file$5 = "src/components/Rules.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (66:16) {#each Object.entries( result ) as [key, rule ] }
    function create_each_block$2(ctx) {
    	let tr;
    	let th;
    	let input;
    	let t0;
    	let span0;
    	let t1;
    	let td0;
    	let t2_value = /*rule*/ ctx[5].name + "";
    	let t2;
    	let t3;
    	let td1;
    	let a0;
    	let span1;
    	let a0_href_value;
    	let t5;
    	let a1;
    	let span2;
    	let t7;
    	let a2;
    	let span3;
    	let t9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th = element("th");
    			input = element("input");
    			t0 = space();
    			span0 = element("span");
    			t1 = space();
    			td0 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td1 = element("td");
    			a0 = element("a");
    			span1 = element("span");
    			span1.textContent = "Edit";
    			t5 = space();
    			a1 = element("a");
    			span2 = element("span");
    			span2.textContent = "Clone";
    			t7 = space();
    			a2 = element("a");
    			span3 = element("span");
    			span3.textContent = "Delete";
    			t9 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "selectPopup");
    			input.value = "false";
    			add_location(input, file$5, 68, 24, 1965);
    			attr_dev(span0, "class", "input-ui");
    			add_location(span0, file$5, 68, 81, 2022);
    			attr_dev(th, "class", "check-column");
    			add_location(th, file$5, 67, 20, 1915);
    			add_location(td0, file$5, 70, 20, 2099);
    			attr_dev(span1, "class", "hidden-xs");
    			add_location(span1, file$5, 72, 60, 2229);
    			attr_dev(a0, "href", a0_href_value = "#/rule/" + /*rule*/ ctx[5].id);
    			attr_dev(a0, "class", "");
    			add_location(a0, file$5, 72, 24, 2193);
    			attr_dev(span2, "class", "hidden-xs");
    			add_location(span2, file$5, 73, 103, 2372);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "popup-clone");
    			add_location(a1, file$5, 73, 24, 2293);
    			attr_dev(span3, "class", "hidden-xs");
    			add_location(span3, file$5, 74, 105, 2518);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "popup-delete");
    			add_location(a2, file$5, 74, 24, 2437);
    			attr_dev(td1, "class", "popup-actions");
    			add_location(td1, file$5, 71, 20, 2142);
    			add_location(tr, file$5, 66, 16, 1890);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th);
    			append_dev(th, input);
    			append_dev(th, t0);
    			append_dev(th, span0);
    			append_dev(tr, t1);
    			append_dev(tr, td0);
    			append_dev(td0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td1);
    			append_dev(td1, a0);
    			append_dev(a0, span1);
    			append_dev(td1, t5);
    			append_dev(td1, a1);
    			append_dev(a1, span2);
    			append_dev(td1, t7);
    			append_dev(td1, a2);
    			append_dev(a2, span3);
    			append_dev(tr, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						a1,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*handleClone*/ ctx[2](/*rule*/ ctx[5].id))) /*handleClone*/ ctx[2](/*rule*/ ctx[5].id).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(
    						a2,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*handleDelete*/ ctx[1](/*rule*/ ctx[5].id))) /*handleDelete*/ ctx[1](/*rule*/ ctx[5].id).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*result*/ 1 && t2_value !== (t2_value = /*rule*/ ctx[5].name + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*result*/ 1 && a0_href_value !== (a0_href_value = "#/rule/" + /*rule*/ ctx[5].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(66:16) {#each Object.entries( result ) as [key, rule ] }",
    		ctx
    	});

    	return block;
    }

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
    	let td;
    	let input;
    	let t4;
    	let span;
    	let t5;
    	let th0;
    	let t7;
    	let th1;
    	let t9;
    	let tbody;
    	let each_value = Object.entries(/*result*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

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
    			td = element("td");
    			input = element("input");
    			t4 = space();
    			span = element("span");
    			t5 = space();
    			th0 = element("th");
    			th0.textContent = "Name";
    			t7 = space();
    			th1 = element("th");
    			th1.textContent = "Action";
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$5, 50, 8, 1287);
    			add_location(p, file$5, 51, 8, 1311);
    			attr_dev(div0, "class", "discountx-popups-wrap-head");
    			add_location(div0, file$5, 49, 4, 1238);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "selectShortcode");
    			input.value = "false";
    			add_location(input, file$5, 58, 20, 1590);
    			attr_dev(span, "class", "input-ui");
    			add_location(span, file$5, 58, 81, 1651);
    			attr_dev(td, "class", "manage-column column-cb check-column");
    			add_location(td, file$5, 57, 16, 1520);
    			add_location(th0, file$5, 60, 16, 1720);
    			add_location(th1, file$5, 61, 16, 1750);
    			add_location(thead, file$5, 56, 12, 1496);
    			add_location(tbody, file$5, 63, 12, 1799);
    			attr_dev(table, "class", "discountx-table wp-list-table widefat fixed striped table-view-list posts");
    			add_location(table, file$5, 55, 8, 1394);
    			attr_dev(div1, "class", "discountx-popups-wrap-body");
    			add_location(div1, file$5, 54, 4, 1345);
    			attr_dev(div2, "class", "discountx-popups-wrap");
    			add_location(div2, file$5, 48, 0, 1198);
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
    			append_dev(thead, td);
    			append_dev(td, input);
    			append_dev(td, t4);
    			append_dev(td, span);
    			append_dev(thead, t5);
    			append_dev(thead, th0);
    			append_dev(thead, t7);
    			append_dev(thead, th1);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*handleDelete, Object, result, handleClone*/ 7) {
    				each_value = Object.entries(/*result*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Rules', slots, []);
    	let result = '';

    	const syncData = async () => {
    		const res = await fetch(getAjaxURL() + '?action=discountx_get_rules');
    		const json = await res.json();
    		$$invalidate(0, result = json.data);
    	};

    	onMount(syncData);

    	const handleDelete = id => {
    		const data = new FormData();
    		data.append('action', 'discountx_delete_rules');
    		data.append('nonce', getNonce('delete_dxrule'));
    		data.append('ids', id);

    		fetch(getAjaxURL(), { method: 'POST', body: data }).then(res => {
    			if (res.ok) {
    				syncData();
    			}
    		});
    	};

    	const handleClone = id => {
    		const data = new FormData();
    		data.append('action', 'discountx_clone_rule');
    		data.append('nonce', getNonce('clone_dxrule'));
    		data.append('id', id);

    		fetch(getAjaxURL(), { method: 'POST', body: data }).then(res => {
    			if (res.ok) {
    				syncData();
    			}
    		});
    	};

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Rules> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		getAjaxURL,
    		getNonce,
    		result,
    		syncData,
    		handleDelete,
    		handleClone
    	});

    	$$self.$inject_state = $$props => {
    		if ('result' in $$props) $$invalidate(0, result = $$props.result);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [result, handleDelete, handleClone];
    }

    class Rules extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rules",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/settings/Condition.svelte generated by Svelte v3.46.2 */

    const { Object: Object_1$1 } = globals;

    const file$4 = "src/components/settings/Condition.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i][0];
    	child_ctx[14] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i][0];
    	child_ctx[14] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i][0];
    	child_ctx[14] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (29:12) {#if coupons.length}
    function create_if_block$2(ctx) {
    	let select;
    	let each_value_4 = /*coupons*/ ctx[3];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "name", "savedCoupon");
    			attr_dev(select, "id", "savedCoupon");
    			add_location(select, file$4, 29, 12, 815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*coupons, settings*/ 9) {
    				each_value_4 = /*coupons*/ ctx[3];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(29:12) {#if coupons.length}",
    		ctx
    	});

    	return block;
    }

    // (31:16) {#each coupons as coupon }
    function create_each_block_4(ctx) {
    	let option;
    	let t_value = /*coupon*/ ctx[21].text + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*coupon*/ ctx[21].text === /*settings*/ ctx[0].savedCoupon;
    			option.__value = /*coupon*/ ctx[21].text;
    			option.value = option.__value;
    			add_location(option, file$4, 31, 16, 919);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*coupon*/ ctx[21].text === /*settings*/ ctx[0].savedCoupon)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(31:16) {#each coupons as coupon }",
    		ctx
    	});

    	return block;
    }

    // (45:16) { #each Object.entries( appearnace ) as [ key, value ] }
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[14] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].appearance;
    			option.__value = /*key*/ ctx[13];
    			option.value = option.__value;
    			add_location(option, file$4, 45, 16, 1470);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].appearance)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(45:16) { #each Object.entries( appearnace ) as [ key, value ] }",
    		ctx
    	});

    	return block;
    }

    // (59:16) {#each Object.entries(cartTypes) as [ key, value ]}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[14] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].cart_type;
    			option.__value = /*key*/ ctx[13];
    			option.value = option.__value;
    			add_location(option, file$4, 59, 16, 2038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].cart_type)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(59:16) {#each Object.entries(cartTypes) as [ key, value ]}",
    		ctx
    	});

    	return block;
    }

    // (73:16) {#each Object.entries(conditions) as [ key, value ]}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[14] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].condition;
    			option.__value = /*key*/ ctx[13];
    			option.value = option.__value;
    			add_location(option, file$4, 73, 16, 2611);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[13] === /*settings*/ ctx[0].condition)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(73:16) {#each Object.entries(conditions) as [ key, value ]}",
    		ctx
    	});

    	return block;
    }

    // (87:16) {#each allProducts as product }
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = /*product*/ ctx[10].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*product*/ ctx[10].id;
    			option.value = option.__value;
    			add_location(option, file$4, 87, 16, 3226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(87:16) {#each allProducts as product }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div18;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let p0;
    	let t3;
    	let div1;
    	let t4;
    	let div5;
    	let div3;
    	let h41;
    	let t6;
    	let div4;
    	let select0;
    	let t7;
    	let div8;
    	let div6;
    	let h42;
    	let t9;
    	let p1;
    	let t11;
    	let div7;
    	let select1;
    	let t12;
    	let div11;
    	let div9;
    	let h43;
    	let t14;
    	let p2;
    	let t17;
    	let div10;
    	let select2;
    	let t18;
    	let div14;
    	let div12;
    	let h44;
    	let t20;
    	let p3;
    	let t22;
    	let div13;
    	let select3;
    	let t23;
    	let div17;
    	let div15;
    	let h45;
    	let t25;
    	let p4;
    	let t27;
    	let div16;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*coupons*/ ctx[3].length && create_if_block$2(ctx);
    	let each_value_3 = Object.entries(/*appearnace*/ ctx[4]);
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = Object.entries(/*cartTypes*/ ctx[5]);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = Object.entries(/*conditions*/ ctx[6]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*allProducts*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = `${translation('condition-tab-label')}`;
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${translation('condition-tab-desc')}`;
    			t3 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('appearence-label')}`;
    			t6 = space();
    			div4 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = `${translation('cart-type-label')}`;
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = `${translation('cart-type-desc')}`;
    			t11 = space();
    			div7 = element("div");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t12 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = `${translation('condition-label')}`;
    			t14 = space();
    			p2 = element("p");
    			p2.textContent = `${translation('condition-desc')}.`;
    			t17 = space();
    			div10 = element("div");
    			select2 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t18 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('products-label')}`;
    			t20 = space();
    			p3 = element("p");
    			p3.textContent = `${translation('products-desc')}`;
    			t22 = space();
    			div13 = element("div");
    			select3 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t23 = space();
    			div17 = element("div");
    			div15 = element("div");
    			h45 = element("h4");
    			h45.textContent = `${translation('number-label')}`;
    			t25 = space();
    			p4 = element("p");
    			p4.textContent = `${translation('number-desc')}`;
    			t27 = space();
    			div16 = element("div");
    			input = element("input");
    			add_location(h40, file$4, 24, 12, 584);
    			attr_dev(p0, "class", "desc");
    			add_location(p0, file$4, 25, 12, 646);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$4, 23, 8, 533);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$4, 27, 8, 729);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$4, 22, 4, 486);
    			add_location(h41, file$4, 40, 12, 1215);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$4, 39, 8, 1164);
    			attr_dev(select0, "name", "appearance");
    			attr_dev(select0, "id", "appearance");
    			add_location(select0, file$4, 43, 12, 1338);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$4, 42, 8, 1285);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$4, 38, 4, 1117);
    			add_location(h42, file$4, 53, 12, 1723);
    			attr_dev(p1, "class", "desc");
    			add_location(p1, file$4, 54, 12, 1781);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$4, 52, 8, 1672);
    			attr_dev(select1, "name", "cart_type");
    			attr_dev(select1, "id", "cart_type");
    			add_location(select1, file$4, 57, 12, 1913);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$4, 56, 8, 1860);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$4, 51, 4, 1625);
    			add_location(h43, file$4, 67, 12, 2294);
    			attr_dev(p2, "class", "desc");
    			add_location(p2, file$4, 68, 12, 2352);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$4, 66, 8, 2243);
    			attr_dev(select2, "name", "condition");
    			attr_dev(select2, "id", "condition");
    			add_location(select2, file$4, 71, 12, 2485);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$4, 70, 8, 2432);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$4, 65, 4, 2196);
    			add_location(h44, file$4, 81, 12, 2867);
    			attr_dev(p3, "class", "desc");
    			add_location(p3, file$4, 82, 12, 2924);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$4, 80, 8, 2816);
    			attr_dev(select3, "name", "products");
    			attr_dev(select3, "id", "products");
    			select3.multiple = true;
    			if (/*products*/ ctx[1] === void 0) add_render_callback(() => /*select3_change_handler*/ ctx[8].call(select3));
    			add_location(select3, file$4, 85, 12, 3055);
    			attr_dev(div13, "class", "discountx-settings-control");
    			add_location(div13, file$4, 84, 8, 3002);
    			attr_dev(div14, "class", "discountx-settings-panel");
    			add_location(div14, file$4, 79, 4, 2769);
    			add_location(h45, file$4, 95, 12, 3454);
    			attr_dev(p4, "class", "desc");
    			add_location(p4, file$4, 96, 12, 3508);
    			attr_dev(div15, "class", "discountx-settings-label");
    			add_location(div15, file$4, 94, 8, 3403);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", "number");
    			attr_dev(input, "id", "number");
    			add_location(input, file$4, 99, 12, 3637);
    			attr_dev(div16, "class", "discountx-settings-control");
    			add_location(div16, file$4, 98, 8, 3584);
    			attr_dev(div17, "class", "discountx-settings-panel");
    			add_location(div17, file$4, 93, 4, 3356);
    			add_location(div18, file$4, 21, 0, 476);
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
    			if (if_block) if_block.m(div1, null);
    			append_dev(div18, t4);
    			append_dev(div18, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, select0);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(select0, null);
    			}

    			append_dev(div18, t7);
    			append_dev(div18, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div6, t9);
    			append_dev(div6, p1);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div7, select1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select1, null);
    			}

    			append_dev(div18, t12);
    			append_dev(div18, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div9, t14);
    			append_dev(div9, p2);
    			append_dev(div11, t17);
    			append_dev(div11, div10);
    			append_dev(div10, select2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select2, null);
    			}

    			append_dev(div18, t18);
    			append_dev(div18, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h44);
    			append_dev(div12, t20);
    			append_dev(div12, p3);
    			append_dev(div14, t22);
    			append_dev(div14, div13);
    			append_dev(div13, select3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select3, null);
    			}

    			select_options(select3, /*products*/ ctx[1]);
    			append_dev(div18, t23);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, h45);
    			append_dev(div15, t25);
    			append_dev(div15, p4);
    			append_dev(div17, t27);
    			append_dev(div17, div16);
    			append_dev(div16, input);
    			set_input_value(input, /*settings*/ ctx[0].number);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select3, "change", /*select3_change_handler*/ ctx[8]),
    					listen_dev(
    						select3,
    						"change",
    						function () {
    							if (is_function(/*handleProducts*/ ctx[2](/*products*/ ctx[1]))) /*handleProducts*/ ctx[2](/*products*/ ctx[1]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (/*coupons*/ ctx[3].length) if_block.p(ctx, dirty);

    			if (dirty & /*Object, appearnace, settings*/ 17) {
    				each_value_3 = Object.entries(/*appearnace*/ ctx[4]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty & /*Object, cartTypes, settings*/ 33) {
    				each_value_2 = Object.entries(/*cartTypes*/ ctx[5]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*Object, conditions, settings*/ 65) {
    				each_value_1 = Object.entries(/*conditions*/ ctx[6]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*allProducts*/ 128) {
    				each_value = /*allProducts*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*products, allProducts*/ 130) {
    				select_options(select3, /*products*/ ctx[1]);
    			}

    			if (dirty & /*settings*/ 1 && to_number(input.value) !== /*settings*/ ctx[0].number) {
    				set_input_value(input, /*settings*/ ctx[0].number);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Condition', slots, []);
    	let { handleProducts } = $$props;
    	let { settings } = $$props;
    	let { products = [] } = $$props;
    	const coupons = getCoupons();
    	const appearnace = getAppearance();
    	const cartTypes = getCartTypes();
    	const conditions = getConditions();
    	const allProducts = getAllProducts();
    	const writable_props = ['handleProducts', 'settings', 'products'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Condition> was created with unknown prop '${key}'`);
    	});

    	function select3_change_handler() {
    		products = select_multiple_value(this);
    		$$invalidate(1, products);
    		$$invalidate(7, allProducts);
    	}

    	function input_input_handler() {
    		settings.number = to_number(this.value);
    		$$invalidate(0, settings);
    	}

    	$$self.$$set = $$props => {
    		if ('handleProducts' in $$props) $$invalidate(2, handleProducts = $$props.handleProducts);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('products' in $$props) $$invalidate(1, products = $$props.products);
    	};

    	$$self.$capture_state = () => ({
    		translation,
    		getCoupons,
    		getAppearance,
    		getCartTypes,
    		getConditions,
    		getAllProducts,
    		handleProducts,
    		settings,
    		products,
    		coupons,
    		appearnace,
    		cartTypes,
    		conditions,
    		allProducts
    	});

    	$$self.$inject_state = $$props => {
    		if ('handleProducts' in $$props) $$invalidate(2, handleProducts = $$props.handleProducts);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('products' in $$props) $$invalidate(1, products = $$props.products);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings,
    		products,
    		handleProducts,
    		coupons,
    		appearnace,
    		cartTypes,
    		conditions,
    		allProducts,
    		select3_change_handler,
    		input_input_handler
    	];
    }

    class Condition extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			handleProducts: 2,
    			settings: 0,
    			products: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Condition",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleProducts*/ ctx[2] === undefined && !('handleProducts' in props)) {
    			console.warn("<Condition> was created without expected prop 'handleProducts'");
    		}

    		if (/*settings*/ ctx[0] === undefined && !('settings' in props)) {
    			console.warn("<Condition> was created without expected prop 'settings'");
    		}
    	}

    	get handleProducts() {
    		throw new Error("<Condition>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleProducts(value) {
    		throw new Error("<Condition>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settings() {
    		throw new Error("<Condition>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Condition>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get products() {
    		throw new Error("<Condition>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set products(value) {
    		throw new Error("<Condition>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/settings/Settings.svelte generated by Svelte v3.46.2 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/components/settings/Settings.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (12:16) {#each Object.entries( getDisplayOptions() ) as [key, option] }
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*key*/ ctx[4];
    			option.value = option.__value;
    			add_location(option, file$3, 12, 20, 469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(12:16) {#each Object.entries( getDisplayOptions() ) as [key, option] }",
    		ctx
    	});

    	return block;
    }

    // (25:16) {#each getThemes() as theme }
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*theme*/ ctx[1].label + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*theme*/ ctx[1].value;
    			option.value = option.__value;
    			option.disabled = /*theme*/ ctx[1].pro;
    			add_location(option, file$3, 25, 16, 895);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(25:16) {#each getThemes() as theme }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div21;
    	let div2;
    	let div0;
    	let h40;
    	let t1;
    	let div1;
    	let select0;
    	let t2;
    	let div5;
    	let div3;
    	let h41;
    	let t4;
    	let div4;
    	let select1;
    	let t5;
    	let div8;
    	let div6;
    	let h42;
    	let t7;
    	let div7;
    	let button;
    	let i;
    	let t8;
    	let div11;
    	let div9;
    	let h43;
    	let t10;
    	let div10;
    	let input0;
    	let t11;
    	let div14;
    	let div12;
    	let h44;
    	let t13;
    	let div13;
    	let input1;
    	let t14;
    	let div17;
    	let div15;
    	let h45;
    	let t16;
    	let div16;
    	let textarea;
    	let t17;
    	let div20;
    	let div18;
    	let h46;
    	let t19;
    	let div19;
    	let input2;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.entries(getDisplayOptions());
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = getThemes();
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = `${translation('display-on-label')}`;
    			t1 = space();
    			div1 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('theme-label')}`;
    			t4 = space();
    			div4 = element("div");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = `${translation('image-label')}`;
    			t7 = space();
    			div7 = element("div");
    			button = element("button");
    			i = element("i");
    			t8 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = `${translation('pre-title-label')}`;
    			t10 = space();
    			div10 = element("div");
    			input0 = element("input");
    			t11 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('title-label')}`;
    			t13 = space();
    			div13 = element("div");
    			input1 = element("input");
    			t14 = space();
    			div17 = element("div");
    			div15 = element("div");
    			h45 = element("h4");
    			h45.textContent = `${translation('content-label')}`;
    			t16 = space();
    			div16 = element("div");
    			textarea = element("textarea");
    			t17 = space();
    			div20 = element("div");
    			div18 = element("div");
    			h46 = element("h4");
    			h46.textContent = `${translation('button-text-label')}`;
    			t19 = space();
    			div19 = element("div");
    			input2 = element("input");
    			add_location(h40, file$3, 7, 12, 205);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$3, 6, 8, 154);
    			attr_dev(select0, "name", "displayOn");
    			attr_dev(select0, "id", "displayOn");
    			add_location(select0, file$3, 10, 12, 328);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$3, 9, 8, 275);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$3, 5, 4, 107);
    			add_location(h41, file$3, 20, 12, 684);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$3, 19, 8, 633);
    			attr_dev(select1, "name", "theme");
    			attr_dev(select1, "id", "theme");
    			add_location(select1, file$3, 23, 12, 800);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$3, 22, 8, 747);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$3, 18, 4, 586);
    			add_location(h42, file$3, 33, 12, 1144);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$3, 32, 8, 1093);
    			attr_dev(i, "class", "dashicons-before dashicons-cloud-upload");
    			add_location(i, file$3, 36, 63, 1311);
    			attr_dev(button, "id", "discountx-upload-popup-image");
    			add_location(button, file$3, 36, 12, 1260);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$3, 35, 8, 1207);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$3, 31, 4, 1046);
    			add_location(h43, file$3, 42, 12, 1505);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$3, 41, 8, 1454);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "popupPreTitle");
    			attr_dev(input0, "id", "popupPreTitle");
    			input0.value = "";
    			add_location(input0, file$3, 45, 12, 1625);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$3, 44, 8, 1572);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$3, 40, 4, 1407);
    			add_location(h44, file$3, 56, 12, 1901);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$3, 55, 8, 1850);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "popupTitle");
    			attr_dev(input1, "id", "popupTitle");
    			input1.value = "";
    			add_location(input1, file$3, 59, 12, 2017);
    			attr_dev(div13, "class", "discountx-settings-control");
    			add_location(div13, file$3, 58, 8, 1964);
    			attr_dev(div14, "class", "discountx-settings-panel");
    			add_location(div14, file$3, 54, 4, 1803);
    			add_location(h45, file$3, 70, 12, 2287);
    			attr_dev(div15, "class", "discountx-settings-label");
    			add_location(div15, file$3, 69, 8, 2236);
    			attr_dev(textarea, "name", "popupContent");
    			attr_dev(textarea, "id", "popupContent");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			add_location(textarea, file$3, 73, 12, 2405);
    			attr_dev(div16, "class", "discountx-settings-control");
    			add_location(div16, file$3, 72, 8, 2352);
    			attr_dev(div17, "class", "discountx-settings-panel");
    			add_location(div17, file$3, 68, 4, 2189);
    			add_location(h46, file$3, 79, 12, 2614);
    			attr_dev(div18, "class", "discountx-settings-label");
    			add_location(div18, file$3, 78, 8, 2563);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "buttonText");
    			attr_dev(input2, "id", "buttonText");
    			add_location(input2, file$3, 82, 12, 2736);
    			attr_dev(div19, "class", "discountx-settings-control");
    			add_location(div19, file$3, 81, 8, 2683);
    			attr_dev(div20, "class", "discountx-settings-panel");
    			add_location(div20, file$3, 77, 4, 2516);
    			add_location(div21, file$3, 4, 0, 97);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			append_dev(div21, t2);
    			append_dev(div21, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			append_dev(div21, t5);
    			append_dev(div21, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, button);
    			append_dev(button, i);
    			append_dev(div21, t8);
    			append_dev(div21, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div10, input0);
    			append_dev(div21, t11);
    			append_dev(div21, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h44);
    			append_dev(div14, t13);
    			append_dev(div14, div13);
    			append_dev(div13, input1);
    			append_dev(div21, t14);
    			append_dev(div21, div17);
    			append_dev(div17, div15);
    			append_dev(div15, h45);
    			append_dev(div17, t16);
    			append_dev(div17, div16);
    			append_dev(div16, textarea);
    			append_dev(div21, t17);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			append_dev(div18, h46);
    			append_dev(div20, t19);
    			append_dev(div20, div19);
    			append_dev(div19, input2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, getDisplayOptions*/ 0) {
    				each_value_1 = Object.entries(getDisplayOptions());
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*getThemes*/ 0) {
    				each_value = getThemes();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$capture_state = () => ({
    		translation,
    		getDisplayOptions,
    		getThemes
    	});

    	return [click_handler];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/settings/Style.svelte generated by Svelte v3.46.2 */
    const file$2 = "src/components/settings/Style.svelte";

    // (53:16) {#if buttonColorState === 'normal' }
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
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = `${translation('color-label')}`;
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('background-label')}`;
    			t4 = space();
    			input1 = element("input");
    			add_location(h40, file$2, 54, 24, 2105);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "buttonColor");
    			attr_dev(input0, "id", "buttonColor");
    			add_location(input0, file$2, 55, 24, 2171);
    			attr_dev(div0, "class", "normal-color-picker");
    			add_location(div0, file$2, 53, 20, 2047);
    			add_location(h41, file$2, 59, 24, 2345);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "buttonBgColor");
    			attr_dev(input1, "id", "buttonBgColor");
    			add_location(input1, file$2, 60, 24, 2416);
    			attr_dev(div1, "class", "normal-bgcolor-picker");
    			add_location(div1, file$2, 58, 20, 2285);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input_handler_4*/ ctx[5], false, false, false),
    					listen_dev(input1, "input", /*input_handler_5*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(53:16) {#if buttonColorState === 'normal' }",
    		ctx
    	});

    	return block;
    }

    // (64:16) {#if buttonColorState === 'hover' }
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
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = `${translation('hover-color-label')}`;
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('hover-background-label')}`;
    			t4 = space();
    			input1 = element("input");
    			add_location(h40, file$2, 65, 24, 2664);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "buttonHoverColor");
    			attr_dev(input0, "id", "buttonHoverColor");
    			add_location(input0, file$2, 66, 24, 2736);
    			attr_dev(div0, "class", "hover-color-picker");
    			add_location(div0, file$2, 64, 20, 2607);
    			add_location(h41, file$2, 70, 24, 2919);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "buttonHoverBgColor");
    			attr_dev(input1, "id", "buttonHoverBgColor");
    			add_location(input1, file$2, 71, 24, 2996);
    			attr_dev(div1, "class", "hover-bgcolor-picker");
    			add_location(div1, file$2, 69, 20, 2860);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input_handler_6*/ ctx[3], false, false, false),
    					listen_dev(input1, "input", /*input_handler_7*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:16) {#if buttonColorState === 'hover' }",
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
    	let div1;
    	let input0;
    	let t2;
    	let div5;
    	let div3;
    	let h41;
    	let t4;
    	let div4;
    	let input1;
    	let t5;
    	let div8;
    	let div6;
    	let h42;
    	let t7;
    	let div7;
    	let input2;
    	let t8;
    	let div11;
    	let div9;
    	let h43;
    	let t10;
    	let div10;
    	let input3;
    	let t11;
    	let div16;
    	let div12;
    	let h44;
    	let t13;
    	let div15;
    	let div13;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let div14;
    	let t18;
    	let t19;
    	let div19;
    	let div17;
    	let h45;
    	let t21;
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
    			h40.textContent = `${translation('title-fontsize-label')}`;
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('title-color-label')}`;
    			t4 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = `${translation('content-fontsize-label')}`;
    			t7 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t8 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = `${translation('content-color-label')}`;
    			t10 = space();
    			div10 = element("div");
    			input3 = element("input");
    			t11 = space();
    			div16 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('button-color-label')}`;
    			t13 = space();
    			div15 = element("div");
    			div13 = element("div");
    			button0 = element("button");
    			button0.textContent = `${translation('normal-label')}`;
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = `${translation('hover-label')}`;
    			t17 = space();
    			div14 = element("div");
    			if (if_block0) if_block0.c();
    			t18 = space();
    			if (if_block1) if_block1.c();
    			t19 = space();
    			div19 = element("div");
    			div17 = element("div");
    			h45 = element("h4");
    			h45.textContent = `${translation('popup-background-label')}`;
    			t21 = space();
    			div18 = element("div");
    			input4 = element("input");
    			add_location(h40, file$2, 8, 12, 211);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$2, 7, 8, 160);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "titleFontSize");
    			attr_dev(input0, "id", "titleFontSize");
    			add_location(input0, file$2, 11, 12, 338);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$2, 10, 8, 285);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$2, 6, 4, 113);
    			add_location(h41, file$2, 17, 12, 538);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$2, 16, 8, 487);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "titleColor");
    			attr_dev(input1, "id", "titleColor");
    			add_location(input1, file$2, 20, 12, 662);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$2, 19, 8, 609);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$2, 15, 4, 440);
    			add_location(h42, file$2, 26, 12, 855);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$2, 25, 8, 804);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "name", "contentFontSize");
    			attr_dev(input2, "id", "contentFontSize");
    			add_location(input2, file$2, 29, 12, 984);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$2, 28, 8, 931);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$2, 24, 4, 757);
    			add_location(h43, file$2, 35, 12, 1188);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$2, 34, 8, 1137);
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "name", "contentColor");
    			attr_dev(input3, "id", "contentColor");
    			add_location(input3, file$2, 38, 12, 1314);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$2, 37, 8, 1261);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$2, 33, 4, 1090);
    			add_location(h44, file$2, 44, 12, 1511);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$2, 43, 8, 1460);
    			attr_dev(button0, "class", "normal");
    			add_location(button0, file$2, 48, 16, 1676);
    			attr_dev(button1, "class", "hover");
    			add_location(button1, file$2, 49, 16, 1803);
    			attr_dev(div13, "class", "color-tab");
    			add_location(div13, file$2, 47, 12, 1636);
    			attr_dev(div14, "class", "color-tab-content");
    			add_location(div14, file$2, 51, 12, 1942);
    			attr_dev(div15, "class", "discountx-settings-control");
    			add_location(div15, file$2, 46, 8, 1583);
    			attr_dev(div16, "class", "discountx-settings-panel");
    			add_location(div16, file$2, 42, 4, 1413);
    			add_location(h45, file$2, 80, 12, 3273);
    			attr_dev(div17, "class", "discountx-settings-label");
    			add_location(div17, file$2, 79, 8, 3222);
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "name", "popupBgColor");
    			attr_dev(input4, "id", "popupBgColor");
    			add_location(input4, file$2, 83, 12, 3402);
    			attr_dev(div18, "class", "discountx-settings-control");
    			add_location(div18, file$2, 82, 8, 3349);
    			attr_dev(div19, "class", "discountx-settings-panel");
    			add_location(div19, file$2, 78, 4, 3175);
    			add_location(div20, file$2, 5, 0, 103);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			append_dev(div20, t2);
    			append_dev(div20, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			append_dev(div20, t5);
    			append_dev(div20, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div8, t7);
    			append_dev(div8, div7);
    			append_dev(div7, input2);
    			append_dev(div20, t8);
    			append_dev(div20, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div10, input3);
    			append_dev(div20, t11);
    			append_dev(div20, div16);
    			append_dev(div16, div12);
    			append_dev(div12, h44);
    			append_dev(div16, t13);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, button0);
    			append_dev(div13, t15);
    			append_dev(div13, button1);
    			append_dev(div15, t17);
    			append_dev(div15, div14);
    			if (if_block0) if_block0.m(div14, null);
    			append_dev(div14, t18);
    			if (if_block1) if_block1.m(div14, null);
    			append_dev(div20, t19);
    			append_dev(div20, div19);
    			append_dev(div19, div17);
    			append_dev(div17, h45);
    			append_dev(div19, t21);
    			append_dev(div19, div18);
    			append_dev(div18, input4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input_handler*/ ctx[9], false, false, false),
    					listen_dev(input1, "input", /*input_handler_1*/ ctx[8], false, false, false),
    					listen_dev(input2, "input", /*input_handler_2*/ ctx[7], false, false, false),
    					listen_dev(input3, "input", /*input_handler_3*/ ctx[6], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(input4, "input", /*input_handler_8*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*buttonColorState*/ ctx[0] === 'normal') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div14, t18);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*buttonColorState*/ ctx[0] === 'hover') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
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

    	function input_handler_8(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_7(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_6(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler = () => $$invalidate(0, buttonColorState = 'normal');
    	const click_handler_1 = () => $$invalidate(0, buttonColorState = 'hover');
    	$$self.$capture_state = () => ({ translation, buttonColorState });

    	$$self.$inject_state = $$props => {
    		if ('buttonColorState' in $$props) $$invalidate(0, buttonColorState = $$props.buttonColorState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		buttonColorState,
    		input_handler_8,
    		input_handler_7,
    		input_handler_6,
    		input_handler_5,
    		input_handler_4,
    		input_handler_3,
    		input_handler_2,
    		input_handler_1,
    		input_handler,
    		click_handler,
    		click_handler_1
    	];
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

    // (150:12) {#if currentTab === 'condition'}
    function create_if_block_2(ctx) {
    	let div;
    	let condition;
    	let current;

    	condition = new Condition({
    			props: {
    				handleProducts: /*func*/ ctx[11],
    				settings: /*settings*/ ctx[0],
    				products: /*settings*/ ctx[0].products
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(condition.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 150, 16, 4294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(condition, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const condition_changes = {};
    			if (dirty & /*settings*/ 1) condition_changes.settings = /*settings*/ ctx[0];
    			if (dirty & /*settings*/ 1) condition_changes.products = /*settings*/ ctx[0].products;
    			condition.$set(condition_changes);
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
    		source: "(150:12) {#if currentTab === 'condition'}",
    		ctx
    	});

    	return block;
    }

    // (160:12) {#if currentTab === 'settings'}
    function create_if_block_1(ctx) {
    	let div;
    	let settings_1;
    	let current;

    	settings_1 = new Settings({
    			props: { settings: /*settings*/ ctx[0] },
    			$$inline: true
    		});

    	settings_1.$on("click", /*handleMediaUpload*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(settings_1.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 160, 16, 4669);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(settings_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const settings_1_changes = {};
    			if (dirty & /*settings*/ 1) settings_1_changes.settings = /*settings*/ ctx[0];
    			settings_1.$set(settings_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(settings_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(160:12) {#if currentTab === 'settings'}",
    		ctx
    	});

    	return block;
    }

    // (169:12) {#if currentTab === 'style'}
    function create_if_block(ctx) {
    	let div;
    	let style;
    	let current;

    	style = new Style({
    			props: { settings: /*settings*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(style.$$.fragment);
    			attr_dev(div, "class", "discountx-tab-content");
    			add_location(div, file$1, 169, 16, 4958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(style, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const style_changes = {};
    			if (dirty & /*settings*/ 1) style_changes.settings = /*settings*/ ctx[0];
    			style.$set(style_changes);
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
    		source: "(169:12) {#if currentTab === 'style'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let form;
    	let div2;
    	let div0;
    	let h20;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let h21;
    	let t5;
    	let input;
    	let t6;
    	let button0;
    	let t8;
    	let div4;
    	let div3;
    	let nav;
    	let button1;
    	let t10;
    	let button2;
    	let t12;
    	let button3;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let button4;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*currentTab*/ ctx[2] === 'condition' && create_if_block_2(ctx);
    	let if_block1 = /*currentTab*/ ctx[2] === 'settings' && create_if_block_1(ctx);
    	let if_block2 = /*currentTab*/ ctx[2] === 'style' && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div2 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = `${translation('create-title')}`;
    			t1 = space();
    			p = element("p");
    			p.textContent = `${translation('create-desc')}`;
    			t3 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = `${translation('popup-name')}`;
    			t5 = space();
    			input = element("input");
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = `${translation('save-button')}`;
    			t8 = space();
    			div4 = element("div");
    			div3 = element("div");
    			nav = element("nav");
    			button1 = element("button");
    			button1.textContent = `${translation('condition-tab-label')}`;
    			t10 = space();
    			button2 = element("button");
    			button2.textContent = `${translation('settings-tab-label')}`;
    			t12 = space();
    			button3 = element("button");
    			button3.textContent = `${translation('style-tab-label')}`;
    			t14 = space();
    			if (if_block0) if_block0.c();
    			t15 = space();
    			if (if_block1) if_block1.c();
    			t16 = space();
    			if (if_block2) if_block2.c();
    			t17 = space();
    			button4 = element("button");
    			button4.textContent = `${translation('save-button')}`;
    			add_location(h20, file$1, 125, 12, 3235);
    			add_location(p, file$1, 126, 12, 3290);
    			attr_dev(div0, "class", "discountx-popups-wrap-head");
    			add_location(div0, file$1, 124, 8, 3182);
    			add_location(h21, file$1, 130, 12, 3406);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "widefat regular-text");
    			attr_dev(input, "name", "name");
    			attr_dev(input, "id", "name");
    			add_location(input, file$1, 131, 12, 3460);
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file$1, 137, 12, 3638);
    			attr_dev(div1, "class", "discountx-popups-info");
    			add_location(div1, file$1, 129, 8, 3358);
    			attr_dev(div2, "class", "discountx-popups-box");
    			add_location(div2, file$1, 123, 4, 3139);
    			attr_dev(button1, "class", "svelte-1inllv2");
    			add_location(button1, file$1, 144, 16, 3881);
    			attr_dev(button2, "class", "svelte-1inllv2");
    			add_location(button2, file$1, 145, 16, 3999);
    			attr_dev(button3, "class", "svelte-1inllv2");
    			add_location(button3, file$1, 146, 16, 4115);
    			attr_dev(nav, "class", "discountx-tab-navbar svelte-1inllv2");
    			add_location(nav, file$1, 143, 12, 3830);
    			attr_dev(div3, "class", "discountx-popups-wrap-body");
    			add_location(div3, file$1, 142, 8, 3777);
    			attr_dev(button4, "type", "submit");
    			add_location(button4, file$1, 176, 8, 5118);
    			attr_dev(div4, "class", "discountx-popups-wrap");
    			add_location(div4, file$1, 141, 4, 3733);
    			add_location(form, file$1, 122, 0, 3092);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t5);
    			append_dev(div1, input);
    			set_input_value(input, /*name*/ ctx[1]);
    			append_dev(div1, t6);
    			append_dev(div1, button0);
    			append_dev(form, t8);
    			append_dev(form, div4);
    			append_dev(div4, div3);
    			append_dev(div3, nav);
    			append_dev(nav, button1);
    			append_dev(nav, t10);
    			append_dev(nav, button2);
    			append_dev(nav, t12);
    			append_dev(nav, button3);
    			append_dev(div3, t14);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t15);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t16);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div4, t17);
    			append_dev(div4, button4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(button1, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[9], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*onSubmit*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2 && input.value !== /*name*/ ctx[1]) {
    				set_input_value(input, /*name*/ ctx[1]);
    			}

    			if (/*currentTab*/ ctx[2] === 'condition') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*currentTab*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div3, t15);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*currentTab*/ ctx[2] === 'settings') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*currentTab*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div3, t16);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*currentTab*/ ctx[2] === 'style') {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*currentTab*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div3, null);
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
    			if (detaching) detach_dev(form);
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
    	let { params } = $$props;
    	let result = '';
    	let settings = '';
    	let name = '';

    	onMount(async () => {
    		if (params?.id) {
    			const res = await fetch(getAjaxURL() + '?action=discountx_get_rule&id=' + params.id);
    			const json = await res.json();
    			result = json.data;
    			$$invalidate(0, settings = JSON.parse(result.settings));
    			$$invalidate(1, name = result.name);
    		}
    	});

    	let currentTab = 'condition', popup = {}, frame;

    	const handleProducts = products => {
    		popup = { ...popup, products };
    	};

    	const handleMediaUpload = e => {
    		e.preventDefault();

    		if (frame) {
    			frame.open();
    			return;
    		}

    		frame = wp.media({
    			title: "Select or Upload Client logo",
    			button: { text: "Use this image" },
    			multiple: false
    		});

    		frame.on("select", function () {
    			const attachment = frame.state().get("selection").first().toJSON();
    			popup.image_id = attachment.id;
    			popup.image_url = attachment.url;
    		});

    		frame.open();
    	};

    	const createRule = e => {
    		const data = new FormData(e.target);
    		data.append('action', 'discountx_create_rule');
    		data.append('nonce', getNonce('create_dxrule'));
    		data.append('products', popup?.products?.join());
    		const settings = {};
    		const duplicates = ['action', 'nonce'];

    		for (let [key, value] of Array.from(data)) {
    			settings[key] = value;

    			if (!duplicates.includes(key)) {
    				data.delete(key);
    			}
    		}

    		data.append('settings', JSON.stringify(settings));

    		fetch(getAjaxURL(), { method: 'POST', body: data }).then(res => res.json()).then(res => {
    			if (res.data.insertId) {
    				push('#/rule/' + res.data.insertId);
    			}
    		});
    	};

    	const updateRule = e => {
    		const data = new FormData(e.target);
    		data.append('action', 'discountx_update_rule');
    		data.append('nonce', getNonce('update_dxrule'));
    		data.append('products', popup?.products?.join());
    		data.append('id', params?.id);
    		const settings = {};
    		const duplicates = ['action', 'nonce'];

    		for (let [key, value] of Array.from(data)) {
    			settings[key] = value;

    			if (!duplicates.includes(key)) {
    				data.delete(key);
    			}
    		}

    		data.append('settings', JSON.stringify(settings));
    		fetch(getAjaxURL(), { method: 'POST', body: data });
    	};

    	const onSubmit = e => {
    		(params?.id) ? updateRule(e) : createRule(e);
    	};

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Create> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	const click_handler = () => $$invalidate(2, currentTab = 'condition');
    	const click_handler_1 = () => $$invalidate(2, currentTab = 'settings');
    	const click_handler_2 = () => $$invalidate(2, currentTab = 'style');
    	const func = products => handleProducts(products);

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(6, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		push,
    		Condition,
    		Settings,
    		Style,
    		translation,
    		getAjaxURL,
    		getNonce,
    		params,
    		result,
    		settings,
    		name,
    		currentTab,
    		popup,
    		frame,
    		handleProducts,
    		handleMediaUpload,
    		createRule,
    		updateRule,
    		onSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('params' in $$props) $$invalidate(6, params = $$props.params);
    		if ('result' in $$props) result = $$props.result;
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('currentTab' in $$props) $$invalidate(2, currentTab = $$props.currentTab);
    		if ('popup' in $$props) popup = $$props.popup;
    		if ('frame' in $$props) frame = $$props.frame;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings,
    		name,
    		currentTab,
    		handleProducts,
    		handleMediaUpload,
    		onSubmit,
    		params,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		func
    	];
    }

    class Create extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Create",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[6] === undefined && !('params' in props)) {
    			console.warn("<Create> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Create>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Create>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    			add_location(main, file, 13, 0, 282);
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

    	const routes = {
    		'/': Rules,
    		'/rule': Create,
    		'/rule/:id': Create
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, Header, Rules, Create, routes });
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

    const root = document.getElementById('discountx-app-container');

    const app = new App({
    	target: root,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
