
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
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

    const { Error: Error_1, Object: Object_1$3, console: console_1$3 } = globals;

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
    function create_if_block$6(ctx) {
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block];
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
    		id: create_fragment$a.name,
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

    function instance$a($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Router> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$a.name
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

    /* src/components/Header.svelte generated by Svelte v3.46.2 */
    const file$9 = "src/components/Header.svelte";

    function create_fragment$9(ctx) {
    	let header;
    	let div;
    	let a0;
    	let t1;
    	let nav;
    	let a1;
    	let svg0;
    	let path0;
    	let t2;
    	let t3_value = translation('menu-item-home') + "";
    	let t3;
    	let t4;
    	let a2;
    	let svg1;
    	let path1;
    	let path2;
    	let t5;
    	let t6_value = translation('menu-item-create') + "";
    	let t6;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "DiscountX";
    			t1 = space();
    			nav = element("nav");
    			a1 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			a2 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t5 = space();
    			t6 = text(t6_value);
    			attr_dev(a0, "href", "#/");
    			attr_dev(a0, "class", "svelte-1xy48bg");
    			add_location(a0, file$9, 6, 8, 147);
    			attr_dev(div, "class", "discountx-logo svelte-1xy48bg");
    			add_location(div, file$9, 5, 4, 110);
    			attr_dev(path0, "d", "M11.9726 14C8.67582 14 5.37901 14 2.0822 14C2.05626 13.992 2.03105 13.9814 2.00475 13.9766C1.00676 13.7962 0.372969 13.211 0.0789043 12.2495C0.0460275 12.1421 0.0259361 12.031 0 11.9218C0 10.053 0 8.18446 0 6.3156C0.00840184 6.28564 0.0204567 6.25605 0.0248402 6.22537C0.107397 5.68802 0.345937 5.23176 0.74886 4.8661C2.31635 3.44363 3.88384 2.02152 5.45535 0.603438C5.88348 0.217318 6.39271 0.00982892 6.97317 0.00033118C7.62157 -0.0102625 8.17061 0.233756 8.64623 0.665538C10.1929 2.06974 11.7421 3.47175 13.2903 4.8745C13.5697 5.12765 13.7739 5.43194 13.8919 5.7892C13.9485 5.96089 13.9829 6.13989 14.0274 6.3156C14.0274 8.14793 14.0274 9.98026 14.0274 11.8122C14.0179 11.8557 14.007 11.8988 13.9989 11.9426C13.8404 12.8369 13.3816 13.5025 12.5202 13.851C12.3463 13.9215 12.1556 13.9514 11.9726 14ZM6.97207 12.6579C8.5107 12.6579 10.049 12.659 11.5876 12.6572C12.1436 12.6564 12.5498 12.2652 12.5509 11.7194C12.5542 10.0245 12.5535 8.32912 12.5513 6.63414C12.5509 6.31633 12.4176 6.04345 12.1892 5.83523C10.6762 4.4555 9.14961 3.08965 7.64312 1.70298C7.22303 1.31613 6.63965 1.42134 6.32659 1.70262C5.86522 2.11723 5.4064 2.53477 4.94686 2.95121C3.87179 3.92472 2.79854 4.90043 1.71946 5.86957C1.57005 6.00363 1.45827 6.14866 1.42868 6.34665C1.41114 6.46318 1.40201 6.58226 1.40201 6.70026C1.40019 8.34519 1.40055 9.99013 1.40092 11.6354C1.40092 12.2667 1.79288 12.6575 2.42521 12.6575C3.94083 12.6579 5.45645 12.6579 6.97207 12.6579Z");
    			attr_dev(path0, "fill", "#93A1BC");
    			add_location(path0, file$9, 10, 12, 318);
    			attr_dev(svg0, "height", "14");
    			attr_dev(svg0, "width", "14");
    			attr_dev(svg0, "viewBox", "0 0 15 14");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "svelte-1xy48bg");
    			add_location(svg0, file$9, 9, 15, 210);
    			attr_dev(a1, "href", "#/");
    			attr_dev(a1, "class", "svelte-1xy48bg");
    			add_location(a1, file$9, 9, 2, 197);
    			attr_dev(path1, "d", "M14.0447 8.60235C13.9551 8.52642 13.8627 8.45049 13.7735 8.37769C13.6721 8.29472 13.5668 8.20861 13.4658 8.12211C13.2693 7.95382 13.1613 7.73307 13.1613 7.4998C13.1613 7.26693 13.2693 7.04658 13.4654 6.87867C13.5613 6.79648 13.6611 6.71507 13.7574 6.6364C13.8592 6.55303 13.9648 6.46693 14.0666 6.37926C14.5465 5.96673 14.6576 5.34834 14.3492 4.80391C13.9418 4.08415 13.5331 3.37495 13.1347 2.69589C12.9034 2.30176 12.5183 2.07593 12.078 2.07593C11.9281 2.07593 11.777 2.10254 11.629 2.15538C11.5022 2.20039 11.375 2.24932 11.2517 2.29628C11.1406 2.33894 11.0255 2.38278 10.912 2.42387C10.8071 2.46184 10.7014 2.48102 10.5981 2.48102C10.2059 2.48102 9.89518 2.20352 9.82434 1.79061C9.78872 1.58356 9.75193 1.36125 9.7081 1.09159C9.61651 0.527593 9.27522 0.158904 8.72101 0.0258317C8.71788 0.0250489 8.70888 0.0203522 8.70301 0.0172211C8.69635 0.0136986 8.6897 0.0101761 8.68305 0.0074364L8.667 0H5.85526L5.83999 0.00704501C5.83334 0.0101761 5.82669 0.0133072 5.82003 0.0168297C5.81416 0.0199609 5.80516 0.0246575 5.80203 0.0254403C5.24743 0.159295 4.90614 0.527593 4.81494 1.09119L4.81338 1.10098C4.7762 1.3319 4.73745 1.57025 4.69675 1.80431C4.62747 2.20352 4.3081 2.48258 3.92062 2.48258C3.8259 2.48258 3.73041 2.46614 3.63647 2.43366C3.49087 2.38317 3.34371 2.32681 3.20164 2.27241C3.1081 2.2364 3.01495 2.20078 2.92101 2.16595C2.75976 2.10646 2.59772 2.07671 2.4396 2.07671C2.00007 2.07671 1.61142 2.31155 1.37307 2.72094C0.989896 3.37965 0.59107 4.07162 0.187548 4.77808C-0.138479 5.34912 -0.0269335 5.96947 0.477959 6.39765C0.570327 6.47593 0.665434 6.55382 0.75702 6.62896C0.856041 6.70998 0.958194 6.79374 1.05682 6.87789C1.25252 7.04501 1.36054 7.26536 1.36054 7.49902C1.36054 7.73307 1.25252 7.95421 1.05643 8.12172C0.959368 8.2047 0.858781 8.28728 0.760933 8.36673C0.659955 8.44932 0.555845 8.53464 0.454867 8.62113C-0.0249766 9.03327 -0.13574 9.65166 0.173067 10.1969C0.569935 10.8967 0.978155 11.6059 1.38755 12.3045C1.61808 12.6982 2.00281 12.9237 2.44273 12.9237C2.58833 12.9237 2.7351 12.8982 2.87913 12.8485C3.02003 12.7996 3.16172 12.7456 3.29831 12.6935C3.40085 12.6544 3.50653 12.6141 3.61103 12.5761C3.71553 12.5382 3.82121 12.519 3.92453 12.519C4.3171 12.519 4.62825 12.7965 4.69831 13.2098C4.73784 13.4427 4.77698 13.6779 4.81455 13.9088C4.90614 14.4728 5.24743 14.8411 5.80203 14.9746C5.80516 14.9753 5.81377 14.98 5.81964 14.9832C5.8263 14.9867 5.83295 14.9902 5.8396 14.993L5.85487 15H8.667L8.68226 14.993C8.68892 14.9898 8.69557 14.9863 8.70222 14.9828C8.7077 14.9796 8.71632 14.9753 8.71945 14.9746C9.27365 14.8415 9.61494 14.4728 9.70692 13.9088L9.71436 13.8634C9.74997 13.6442 9.78677 13.4176 9.82512 13.1953C9.89361 12.7961 10.2126 12.517 10.6005 12.517C10.6952 12.517 10.7907 12.5335 10.8846 12.5659C11.029 12.616 11.1746 12.6716 11.3155 12.7256C11.4102 12.762 11.5054 12.7984 11.6005 12.8333C11.7617 12.8924 11.9238 12.9225 12.0823 12.9225C12.5222 12.9225 12.9108 12.6881 13.1488 12.2787C13.5284 11.627 13.9269 10.9346 14.3343 10.2215C14.6607 9.65088 14.5496 9.03053 14.0447 8.60235ZM12.2087 11.2849C12.1555 11.3761 12.1007 11.4701 12.0498 11.5656C12.0392 11.5855 12.0329 11.5906 12.0329 11.5906C12.0286 11.5906 12.0181 11.5894 11.9958 11.5808C11.9194 11.5523 11.8431 11.5225 11.7672 11.4928C11.5437 11.4051 11.3124 11.3147 11.074 11.2591C10.912 11.2211 10.7476 11.202 10.5852 11.202C9.54763 11.202 8.67757 11.9816 8.51631 13.056C8.49283 13.2113 8.467 13.3632 8.43921 13.5241C8.43021 13.5765 8.42121 13.629 8.4122 13.6818H6.11084C6.09988 13.618 6.08931 13.5546 6.07835 13.4908C6.04743 13.3084 6.01534 13.1194 5.98089 12.9342C5.79381 11.9303 4.92767 11.202 3.92179 11.202C3.67248 11.202 3.42395 11.2462 3.18403 11.3339L3.16524 11.3405C2.95271 11.418 2.73314 11.4978 2.51905 11.5828C2.50301 11.589 2.4944 11.591 2.49009 11.5914C2.48774 11.5886 2.48266 11.5828 2.47561 11.5706C2.17659 11.0477 1.86896 10.5143 1.5715 9.99804L1.33941 9.59491L1.46583 9.49002C1.58833 9.38826 1.71005 9.28689 1.83217 9.1863C2.37541 8.73855 2.67483 8.13933 2.67483 7.49941C2.67483 6.85988 2.37581 6.26184 1.83373 5.81526C1.71123 5.71429 1.58872 5.61292 1.46504 5.51037L1.34097 5.40783C1.34841 5.39217 1.35624 5.3773 1.36406 5.3636C1.46309 5.19178 1.56211 5.02035 1.66113 4.84853C1.92219 4.39648 2.19185 3.92955 2.45291 3.46771C2.48305 3.41448 2.49635 3.41448 2.5034 3.41448C2.51592 3.41448 2.5351 3.41957 2.56054 3.42896C2.62356 3.45323 2.68657 3.47828 2.74958 3.50333C2.97268 3.59217 3.2032 3.68376 3.44078 3.74012C3.60438 3.77886 3.77033 3.79843 3.93471 3.79843C4.97111 3.79843 5.84195 3.02114 6.00516 1.95068C6.02864 1.79569 6.05448 1.64305 6.08187 1.48102C6.09127 1.42622 6.10066 1.37065 6.11005 1.31389H8.41103C8.42003 1.36634 8.42904 1.41918 8.43843 1.47123C8.46504 1.62583 8.49283 1.78591 8.51671 1.94286C8.65839 2.88415 9.31279 3.5816 10.2247 3.76321C10.3496 3.78826 10.4776 3.80078 10.6044 3.80078C10.867 3.80078 11.1402 3.74638 11.4161 3.63914C11.6032 3.56634 11.8024 3.49002 12.0056 3.42192C12.0173 3.42192 12.0345 3.42818 12.0423 3.43249C12.3719 3.99648 12.7046 4.57378 13.0263 5.13229L13.1832 5.4047L13.0482 5.51624C12.9183 5.62387 12.7899 5.73033 12.6607 5.8364C12.1441 6.26106 11.8478 6.86693 11.8478 7.49824C11.8478 8.12994 12.1437 8.73581 12.6603 9.16086C12.7895 9.26693 12.9183 9.37378 13.0486 9.4818L13.1825 9.59256L12.2733 11.1722C12.2521 11.2106 12.2306 11.2477 12.2087 11.2849Z");
    			attr_dev(path1, "fill", "#93A1BC");
    			add_location(path1, file$9, 12, 12, 1962);
    			attr_dev(path2, "d", "M7.34421 5.07984C7.31055 5.07827 7.27728 5.07788 7.24401 5.07788C5.95673 5.07788 4.90115 6.10371 4.84088 7.4133C4.81192 8.04657 5.0354 8.65674 5.47102 9.13072C5.91563 9.61487 6.52385 9.8951 7.18374 9.92054C7.21505 9.92172 7.24636 9.9225 7.27767 9.9225C8.57395 9.9225 9.62914 8.89393 9.67923 7.58121C9.71016 6.9542 9.4898 6.34872 9.05888 5.87671C8.61544 5.39021 8.00644 5.10723 7.34421 5.07984ZM8.57787 7.49862C8.57865 7.84774 8.4401 8.17886 8.18843 8.43052C7.93794 8.6814 7.60957 8.81956 7.26319 8.81956H7.25693C6.53442 8.81604 5.94538 8.22465 5.9446 7.50136C5.94421 7.15224 6.08237 6.82113 6.33403 6.56947C6.58452 6.31859 6.91289 6.18082 7.25888 6.18082H7.26514C7.98765 6.18395 8.57669 6.77534 8.57787 7.49862Z");
    			attr_dev(path2, "fill", "#93A1BC");
    			add_location(path2, file$9, 13, 12, 7309);
    			attr_dev(svg1, "height", "14");
    			attr_dev(svg1, "width", "14");
    			attr_dev(svg1, "viewBox", "0 0 15 15");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "svelte-1xy48bg");
    			add_location(svg1, file$9, 11, 19, 1854);
    			attr_dev(a2, "href", "#/rule");
    			attr_dev(a2, "class", "svelte-1xy48bg");
    			add_location(a2, file$9, 11, 2, 1837);
    			attr_dev(nav, "class", "svelte-1xy48bg");
    			add_location(nav, file$9, 8, 4, 189);
    			attr_dev(header, "class", "discountx-admin-masthead svelte-1xy48bg");
    			add_location(header, file$9, 4, 0, 64);
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
    			append_dev(a1, svg0);
    			append_dev(svg0, path0);
    			append_dev(a1, t2);
    			append_dev(a1, t3);
    			append_dev(nav, t4);
    			append_dev(nav, a2);
    			append_dev(a2, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(a2, t5);
    			append_dev(a2, t6);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ translation });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/controls/Switch.svelte generated by Svelte v3.46.2 */

    const file$8 = "src/controls/Switch.svelte";

    function create_fragment$8(ctx) {
    	let label;
    	let input;
    	let t;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = space();
    			span = element("span");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-b68ckc");
    			add_location(input, file$8, 62, 4, 1250);
    			attr_dev(span, "class", "slider svelte-b68ckc");
    			add_location(span, file$8, 63, 4, 1293);
    			attr_dev(label, "class", "switch svelte-b68ckc");
    			add_location(label, file$8, 61, 0, 1213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(label, t);
    			append_dev(label, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[3]),
    					listen_dev(label, "change", /*change_handler*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Switch', slots, []);
    	let { checked = false } = $$props;
    	checked = checked == '0' ? false : true;
    	let { color = "#2196F3" } = $$props;
    	const writable_props = ['checked', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ checked, color });

    	$$self.$inject_state = $$props => {
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, color, change_handler, input_change_handler];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { checked: 0, color: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Rules.svelte generated by Svelte v3.46.2 */

    const { Object: Object_1$2, console: console_1$2 } = globals;
    const file$7 = "src/components/Rules.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	child_ctx[17] = list;
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (98:12) {#each Object.entries( result ) as [key, rule ] }
    function create_each_block$4(ctx) {
    	let div4;
    	let div0;
    	let input;
    	let t0;
    	let div1;
    	let t1_value = /*rule*/ ctx[16].name + "";
    	let t1;
    	let t2;
    	let div2;
    	let switch_1;
    	let updating_checked;
    	let t3;
    	let div3;
    	let a0;
    	let svg0;
    	let path0;
    	let t4;
    	let span0;
    	let a0_href_value;
    	let t6;
    	let a1;
    	let svg1;
    	let path1;
    	let t7;
    	let span1;
    	let t9;
    	let a2;
    	let svg2;
    	let path2;
    	let t10;
    	let span2;
    	let t12;
    	let current;
    	let mounted;
    	let dispose;

    	function input_handler_1(...args) {
    		return /*input_handler_1*/ ctx[9](/*rule*/ ctx[16], ...args);
    	}

    	function input_change_handler_1() {
    		/*input_change_handler_1*/ ctx[10].call(input, /*each_value*/ ctx[17], /*each_index*/ ctx[18]);
    	}

    	function switch_1_checked_binding(value) {
    		/*switch_1_checked_binding*/ ctx[11](value, /*rule*/ ctx[16]);
    	}

    	function change_handler(...args) {
    		return /*change_handler*/ ctx[12](/*rule*/ ctx[16], ...args);
    	}

    	let switch_1_props = {};

    	if (/*rule*/ ctx[16].status !== void 0) {
    		switch_1_props.checked = /*rule*/ ctx[16].status;
    	}

    	switch_1 = new Switch({ props: switch_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(switch_1, 'checked', switch_1_checked_binding));
    	switch_1.$on("change", change_handler);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			create_component(switch_1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t4 = space();
    			span0 = element("span");
    			span0.textContent = `${translation('table-action-edit')}`;
    			t6 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = `${translation('table-action-clone')}`;
    			t9 = space();
    			a2 = element("a");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t10 = space();
    			span2 = element("span");
    			span2.textContent = `${translation('table-action-delete')}`;
    			t12 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "selectRule");
    			add_location(input, file$7, 100, 20, 3110);
    			attr_dev(div0, "class", "check-column svelte-rneqfa");
    			add_location(div0, file$7, 99, 16, 3063);
    			attr_dev(div1, "class", "rule-name svelte-rneqfa");
    			add_location(div1, file$7, 107, 16, 3381);
    			attr_dev(div2, "class", "rule-status svelte-rneqfa");
    			add_location(div2, file$7, 108, 16, 3440);
    			attr_dev(path0, "d", "M3.82429 14.3947H0V10.5704L10.3066 0.263893C10.4756 0.0949226 10.7048 0 10.9438 0C11.1828 0 11.412 0.0949226 11.581 0.263893L14.1308 2.81372C14.2998 2.98274 14.3947 3.21195 14.3947 3.45095C14.3947 3.68995 14.2998 3.91916 14.1308 4.08818L3.82429 14.3947ZM0 16.1974H16.2237V18H0V16.1974Z");
    			attr_dev(path0, "fill", "#B2BFD8");
    			add_location(path0, file$7, 120, 28, 4007);
    			attr_dev(svg0, "width", "17");
    			attr_dev(svg0, "height", "17");
    			attr_dev(svg0, "viewBox", "0 0 17 18");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "svelte-rneqfa");
    			add_location(svg0, file$7, 119, 24, 3883);
    			attr_dev(span0, "class", "hidden-xs");
    			add_location(span0, file$7, 122, 24, 4375);
    			attr_dev(a0, "href", a0_href_value = "#/rule/" + /*rule*/ ctx[16].id);
    			attr_dev(a0, "clone", "rule-edit");
    			attr_dev(a0, "class", "svelte-rneqfa");
    			add_location(a0, file$7, 115, 20, 3744);
    			attr_dev(path1, "d", "M4 4V1C4 0.734784 4.10536 0.48043 4.29289 0.292893C4.48043 0.105357 4.73478 0 5 0H17C17.2652 0 17.5196 0.105357 17.7071 0.292893C17.8946 0.48043 18 0.734784 18 1V15C18 15.2652 17.8946 15.5196 17.7071 15.7071C17.5196 15.8946 17.2652 16 17 16H14V19C14 19.552 13.55 20 12.993 20H1.007C0.875127 20.0008 0.744397 19.9755 0.622322 19.9256C0.500247 19.8757 0.389233 19.8022 0.295659 19.7093C0.202084 19.6164 0.127793 19.5059 0.0770543 19.3841C0.0263156 19.2624 0.000129374 19.1319 0 19L0.00300002 5C0.00300002 4.448 0.453 4 1.01 4H4ZM6 4H14V14H16V2H6V4Z");
    			attr_dev(path1, "fill", "#B2BFD8");
    			add_location(path1, file$7, 130, 24, 4815);
    			attr_dev(svg1, "width", "16");
    			attr_dev(svg1, "height", "16");
    			attr_dev(svg1, "viewBox", "0 0 18 20");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "svelte-rneqfa");
    			add_location(svg1, file$7, 129, 24, 4695);
    			attr_dev(span1, "class", "hidden-xs");
    			add_location(span1, file$7, 132, 24, 5444);
    			attr_dev(a1, "href", ":javascript;");
    			attr_dev(a1, "class", "rule-clone svelte-rneqfa");
    			add_location(a1, file$7, 124, 20, 4488);
    			attr_dev(path2, "d", "M12.7778 17H19.7778V19H10.7778L6.77979 19.002L0.292786 12.515C0.105315 12.3274 0 12.0731 0 11.808C0 11.5428 0.105315 11.2885 0.292786 11.101L10.8978 0.49397C10.9907 0.400994 11.1009 0.327235 11.2223 0.276911C11.3437 0.226586 11.4739 0.200684 11.6053 0.200684C11.7367 0.200684 11.8668 0.226586 11.9882 0.276911C12.1096 0.327235 12.2199 0.400994 12.3128 0.49397L20.0908 8.27197C20.2783 8.4595 20.3836 8.71381 20.3836 8.97897C20.3836 9.24413 20.2783 9.49844 20.0908 9.68597L12.7778 17ZM14.4348 12.515L17.9698 8.97897L11.6058 2.61497L8.07079 6.15097L14.4348 12.515Z");
    			attr_dev(path2, "fill", "#E25454");
    			add_location(path2, file$7, 140, 24, 5887);
    			attr_dev(svg2, "width", "18");
    			attr_dev(svg2, "height", "18");
    			attr_dev(svg2, "viewBox", "0 0 21 20");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "svelte-rneqfa");
    			add_location(svg2, file$7, 139, 24, 5767);
    			attr_dev(span2, "class", "hidden-xs");
    			add_location(span2, file$7, 142, 24, 6531);
    			attr_dev(a2, "href", ":javascript;");
    			attr_dev(a2, "class", "rule-delete svelte-rneqfa");
    			add_location(a2, file$7, 134, 20, 5558);
    			attr_dev(div3, "class", "rule-actions rule-actions-wrap svelte-rneqfa");
    			add_location(div3, file$7, 114, 16, 3679);
    			attr_dev(div4, "class", "discountx-single-rule svelte-rneqfa");
    			add_location(div4, file$7, 98, 12, 3011);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, input);
    			input.checked = /*rule*/ ctx[16].selected;
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div1, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			mount_component(switch_1, div2, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(a0, t4);
    			append_dev(a0, span0);
    			append_dev(div3, t6);
    			append_dev(div3, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(a1, t7);
    			append_dev(a1, span1);
    			append_dev(div3, t9);
    			append_dev(div3, a2);
    			append_dev(a2, svg2);
    			append_dev(svg2, path2);
    			append_dev(a2, t10);
    			append_dev(a2, span2);
    			append_dev(div4, t12);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_handler_1, false, false, false),
    					listen_dev(input, "change", input_change_handler_1),
    					listen_dev(
    						a1,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*handleClone*/ ctx[3](/*rule*/ ctx[16].id))) /*handleClone*/ ctx[3](/*rule*/ ctx[16].id).apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(
    						a2,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*handleDelete*/ ctx[2](/*rule*/ ctx[16].id))) /*handleDelete*/ ctx[2](/*rule*/ ctx[16].id).apply(this, arguments);
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

    			if (dirty & /*Object, result*/ 1) {
    				input.checked = /*rule*/ ctx[16].selected;
    			}

    			if ((!current || dirty & /*result*/ 1) && t1_value !== (t1_value = /*rule*/ ctx[16].name + "")) set_data_dev(t1, t1_value);
    			const switch_1_changes = {};

    			if (!updating_checked && dirty & /*Object, result*/ 1) {
    				updating_checked = true;
    				switch_1_changes.checked = /*rule*/ ctx[16].status;
    				add_flush_callback(() => updating_checked = false);
    			}

    			switch_1.$set(switch_1_changes);

    			if (!current || dirty & /*result*/ 1 && a0_href_value !== (a0_href_value = "#/rule/" + /*rule*/ ctx[16].id)) {
    				attr_dev(a0, "href", a0_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(switch_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(switch_1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(98:12) {#each Object.entries( result ) as [key, rule ] }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let input;
    	let t0;
    	let div1;
    	let t2;
    	let div2;
    	let t4;
    	let div3;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Object.entries(/*result*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			div1.textContent = `${translation('rules-title')}`;
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = `${translation('status-title')}`;
    			t4 = space();
    			div3 = element("div");
    			div3.textContent = `${translation('actions-title')}`;
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "selectAllRules");
    			add_location(input, file$7, 86, 20, 2406);
    			attr_dev(div0, "class", "check-column svelte-rneqfa");
    			add_location(div0, file$7, 85, 16, 2359);
    			attr_dev(div1, "class", "rule-name svelte-rneqfa");
    			set_style(div1, "text-align", "left");
    			add_location(div1, file$7, 93, 16, 2672);
    			attr_dev(div2, "class", "rule-status svelte-rneqfa");
    			add_location(div2, file$7, 94, 16, 2774);
    			attr_dev(div3, "class", "rule-actions svelte-rneqfa");
    			add_location(div3, file$7, 95, 16, 2853);
    			attr_dev(div4, "class", "discountx-single-rule rules-head svelte-rneqfa");
    			add_location(div4, file$7, 84, 12, 2296);
    			attr_dev(div5, "class", "discountx-rules-list");
    			add_location(div5, file$7, 83, 8, 2249);
    			attr_dev(div6, "class", "discountx-rules-wrap-body");
    			add_location(div6, file$7, 82, 4, 2201);
    			attr_dev(div7, "class", "discountx-rules-wrap");
    			add_location(div7, file$7, 80, 0, 2161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, input);
    			input.checked = /*selected*/ ctx[1];
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div5, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[7]),
    					listen_dev(input, "input", /*input_handler*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 2) {
    				input.checked = /*selected*/ ctx[1];
    			}

    			if (dirty & /*handleDelete, Object, result, translation, handleClone, handleRuleStatus, detectSelection*/ 93) {
    				each_value = Object.entries(/*result*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Rules', slots, []);
    	let result = [], selected = false, checkdClass;

    	const syncData = async () => {
    		const res = await fetch(getAjaxURL() + '?action=discountx_get_rules');
    		const json = await res.json();
    		$$invalidate(0, result = json.data);
    		$$invalidate(0, result = result.map(rule => ({ ...rule, selected: false })));
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

    	const handleRuleStatus = (e, id) => {
    		checkdClass = !checkdClass;
    		const data = new FormData();
    		data.append('action', 'discountx_set_rule_status');
    		data.append('nonce', getNonce('status_dxrule'));
    		data.append('status', e.target.checked);
    		data.append('id', id);

    		fetch(getAjaxURL(), { method: 'POST', body: data }).then(res => {
    			console.log(res);
    		});
    	};

    	const toggleAllSelection = e => {
    		$$invalidate(0, result = result.map(rule => ({ ...rule, selected: e.target.checked })));
    	};

    	const detectSelection = (e, id) => {
    		$$invalidate(0, result = result.map(rule => rule.id === id
    		? { ...rule, selected: e.target.checked }
    		: rule));
    	};

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Rules> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		selected = this.checked;
    		$$invalidate(1, selected);
    	}

    	const input_handler = e => toggleAllSelection(e);
    	const input_handler_1 = (rule, e) => detectSelection(e, rule.id);

    	function input_change_handler_1(each_value, each_index) {
    		each_value[each_index][1].selected = this.checked;
    		$$invalidate(0, result);
    	}

    	function switch_1_checked_binding(value, rule) {
    		if ($$self.$$.not_equal(rule.status, value)) {
    			rule.status = value;
    		}
    	}

    	const change_handler = (rule, e) => handleRuleStatus(e, rule.id);

    	$$self.$capture_state = () => ({
    		onMount,
    		getAjaxURL,
    		getNonce,
    		translation,
    		Switch,
    		result,
    		selected,
    		checkdClass,
    		syncData,
    		handleDelete,
    		handleClone,
    		handleRuleStatus,
    		toggleAllSelection,
    		detectSelection
    	});

    	$$self.$inject_state = $$props => {
    		if ('result' in $$props) $$invalidate(0, result = $$props.result);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('checkdClass' in $$props) checkdClass = $$props.checkdClass;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		result,
    		selected,
    		handleDelete,
    		handleClone,
    		handleRuleStatus,
    		toggleAllSelection,
    		detectSelection,
    		input_change_handler,
    		input_handler,
    		input_handler_1,
    		input_change_handler_1,
    		switch_1_checked_binding,
    		change_handler
    	];
    }

    class Rules extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rules",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/settings/Condition.svelte generated by Svelte v3.46.2 */

    const { Object: Object_1$1, console: console_1$1 } = globals;

    const file$6 = "src/components/settings/Condition.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i][0];
    	child_ctx[16] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (33:12) {#if coupons.length}
    function create_if_block_1$4(ctx) {
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
    			add_location(select, file$6, 33, 12, 894);
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
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(33:12) {#if coupons.length}",
    		ctx
    	});

    	return block;
    }

    // (35:16) {#each coupons as coupon }
    function create_each_block_4(ctx) {
    	let option;
    	let t_value = /*coupon*/ ctx[23].text + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*coupon*/ ctx[23].text === /*settings*/ ctx[0].savedCoupon;
    			option.__value = /*coupon*/ ctx[23].text;
    			option.value = option.__value;
    			add_location(option, file$6, 35, 16, 998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*coupon*/ ctx[23].text === /*settings*/ ctx[0].savedCoupon)) {
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
    		source: "(35:16) {#each coupons as coupon }",
    		ctx
    	});

    	return block;
    }

    // (49:16) { #each Object.entries( appearnace ) as [ key, value ] }
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[16] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].appearance;
    			option.__value = /*key*/ ctx[15];
    			option.value = option.__value;
    			add_location(option, file$6, 49, 16, 1549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].appearance)) {
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
    		source: "(49:16) { #each Object.entries( appearnace ) as [ key, value ] }",
    		ctx
    	});

    	return block;
    }

    // (63:16) {#each Object.entries(cartTypes) as [ key, value ]}
    function create_each_block_2(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[16] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].cart_type;
    			option.__value = /*key*/ ctx[15];
    			option.value = option.__value;
    			add_location(option, file$6, 63, 16, 2174);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].cart_type)) {
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
    		source: "(63:16) {#each Object.entries(cartTypes) as [ key, value ]}",
    		ctx
    	});

    	return block;
    }

    // (77:16) {#each Object.entries(conditions) as [ key, value ]}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*value*/ ctx[16] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].condition;
    			option.__value = /*key*/ ctx[15];
    			option.value = option.__value;
    			add_location(option, file$6, 77, 16, 2747);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[15] === /*settings*/ ctx[0].condition)) {
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
    		source: "(77:16) {#each Object.entries(conditions) as [ key, value ]}",
    		ctx
    	});

    	return block;
    }

    // (84:4) {#if settings.cart_type === 'products' }
    function create_if_block$5(ctx) {
    	let div2;
    	let div0;
    	let h4;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*allProducts*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h4 = element("h4");
    			h4.textContent = `${translation('products-label')}`;
    			t1 = space();
    			p = element("p");
    			p.textContent = `${translation('products-desc')}`;
    			t3 = space();
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$6, 86, 12, 3048);
    			attr_dev(p, "class", "desc");
    			add_location(p, file$6, 87, 12, 3105);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$6, 85, 8, 2997);
    			attr_dev(select, "name", "products");
    			attr_dev(select, "id", "products");
    			select.multiple = true;
    			if (/*products*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[9].call(select));
    			add_location(select, file$6, 90, 12, 3236);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$6, 89, 8, 3183);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$6, 84, 4, 2950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h4);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_options(select, /*products*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[9]),
    					listen_dev(
    						select,
    						"change",
    						function () {
    							if (is_function(/*handleProducts*/ ctx[2](/*products*/ ctx[1]))) /*handleProducts*/ ctx[2](/*products*/ ctx[1]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*allProducts*/ 128) {
    				each_value = /*allProducts*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*products, allProducts*/ 130) {
    				select_options(select, /*products*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(84:4) {#if settings.cart_type === 'products' }",
    		ctx
    	});

    	return block;
    }

    // (92:16) {#each allProducts as product }
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*product*/ ctx[12].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*product*/ ctx[12].id;
    			option.value = option.__value;
    			add_location(option, file$6, 92, 16, 3407);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(92:16) {#each allProducts as product }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div15;
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
    	let t19;
    	let div14;
    	let div12;
    	let h44;
    	let t21;
    	let p3;
    	let t23;
    	let div13;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block0 = /*coupons*/ ctx[3].length && create_if_block_1$4(ctx);
    	let each_value_3 = Object.entries(/*appearnace*/ ctx[4]);
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = Object.entries(/*cartTypes*/ ctx[5]);
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = Object.entries(/*conditions*/ ctx[6]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let if_block1 = /*settings*/ ctx[0].cart_type === 'products' && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = `${translation('condition-tab-label')}`;
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${translation('condition-tab-desc')}`;
    			t3 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('appearence-label')}`;
    			t6 = space();
    			div4 = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
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

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			if (if_block1) if_block1.c();
    			t19 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('number-label')}`;
    			t21 = space();
    			p3 = element("p");
    			p3.textContent = `${translation('number-desc')}`;
    			t23 = space();
    			div13 = element("div");
    			input = element("input");
    			add_location(h40, file$6, 28, 12, 663);
    			attr_dev(p0, "class", "desc");
    			add_location(p0, file$6, 29, 12, 725);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$6, 27, 8, 612);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$6, 31, 8, 808);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$6, 26, 4, 565);
    			add_location(h41, file$6, 44, 12, 1294);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$6, 43, 8, 1243);
    			attr_dev(select0, "name", "appearance");
    			attr_dev(select0, "id", "appearance");
    			add_location(select0, file$6, 47, 12, 1417);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$6, 46, 8, 1364);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$6, 42, 4, 1196);
    			add_location(h42, file$6, 57, 12, 1802);
    			attr_dev(p1, "class", "desc");
    			add_location(p1, file$6, 58, 12, 1860);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$6, 56, 8, 1751);
    			attr_dev(select1, "name", "cart_type");
    			attr_dev(select1, "id", "cart_type");
    			add_location(select1, file$6, 61, 12, 1992);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$6, 60, 8, 1939);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$6, 55, 4, 1704);
    			add_location(h43, file$6, 71, 12, 2430);
    			attr_dev(p2, "class", "desc");
    			add_location(p2, file$6, 72, 12, 2488);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$6, 70, 8, 2379);
    			attr_dev(select2, "name", "condition");
    			attr_dev(select2, "id", "condition");
    			add_location(select2, file$6, 75, 12, 2621);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$6, 74, 8, 2568);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$6, 69, 4, 2332);
    			add_location(h44, file$6, 101, 12, 3645);
    			attr_dev(p3, "class", "desc");
    			add_location(p3, file$6, 102, 12, 3699);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$6, 100, 8, 3594);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", "number");
    			attr_dev(input, "id", "number");
    			add_location(input, file$6, 105, 12, 3828);
    			attr_dev(div13, "class", "discountx-settings-control");
    			add_location(div13, file$6, 104, 8, 3775);
    			attr_dev(div14, "class", "discountx-settings-panel");
    			add_location(div14, file$6, 99, 4, 3547);
    			add_location(div15, file$6, 25, 0, 555);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div15, t4);
    			append_dev(div15, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, select0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			append_dev(div15, t7);
    			append_dev(div15, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div6, t9);
    			append_dev(div6, p1);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div7, select1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			append_dev(div15, t12);
    			append_dev(div15, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div9, t14);
    			append_dev(div9, p2);
    			append_dev(div11, t17);
    			append_dev(div11, div10);
    			append_dev(div10, select2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			append_dev(div15, t18);
    			if (if_block1) if_block1.m(div15, null);
    			append_dev(div15, t19);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h44);
    			append_dev(div12, t21);
    			append_dev(div12, p3);
    			append_dev(div14, t23);
    			append_dev(div14, div13);
    			append_dev(div13, input);
    			set_input_value(input, /*settings*/ ctx[0].number);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select1, "change", /*change_handler*/ ctx[8], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*coupons*/ ctx[3].length) if_block0.p(ctx, dirty);

    			if (dirty & /*Object, appearnace, settings*/ 17) {
    				each_value_3 = Object.entries(/*appearnace*/ ctx[4]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty & /*Object, cartTypes, settings*/ 33) {
    				each_value_2 = Object.entries(/*cartTypes*/ ctx[5]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*Object, conditions, settings*/ 65) {
    				each_value_1 = Object.entries(/*conditions*/ ctx[6]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*settings*/ ctx[0].cart_type === 'products') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					if_block1.m(div15, t19);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*settings*/ 1 && to_number(input.value) !== /*settings*/ ctx[0].number) {
    				set_input_value(input, /*settings*/ ctx[0].number);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
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

    function instance$6($$self, $$props, $$invalidate) {
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

    	const handleCartType = e => {
    		console.log(e.target.value);
    	};

    	const writable_props = ['handleProducts', 'settings', 'products'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Condition> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => $$invalidate(0, settings.cart_type = e.target.value, settings);

    	function select_change_handler() {
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
    		allProducts,
    		handleCartType
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
    		change_handler,
    		select_change_handler,
    		input_input_handler
    	];
    }

    class Condition extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			handleProducts: 2,
    			settings: 0,
    			products: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Condition",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleProducts*/ ctx[2] === undefined && !('handleProducts' in props)) {
    			console_1$1.warn("<Condition> was created without expected prop 'handleProducts'");
    		}

    		if (/*settings*/ ctx[0] === undefined && !('settings' in props)) {
    			console_1$1.warn("<Condition> was created without expected prop 'settings'");
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
    const file$5 = "src/components/settings/Settings.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i][0];
    	child_ctx[7] = list[i][1];
    	return child_ctx;
    }

    // (13:16) {#each Object.entries( getDisplayOptions() ) as [key, option] }
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[7] + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*key*/ ctx[6] === /*settings*/ ctx[0].displayOn;
    			option.__value = /*key*/ ctx[6];
    			option.value = option.__value;
    			add_location(option, file$5, 13, 20, 493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*key*/ ctx[6] === /*settings*/ ctx[0].displayOn)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(13:16) {#each Object.entries( getDisplayOptions() ) as [key, option] }",
    		ctx
    	});

    	return block;
    }

    // (26:16) {#each getThemes() as theme }
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*theme*/ ctx[3].label + "";
    	let t;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.selected = option_selected_value = /*theme*/ ctx[3].value === /*settings*/ ctx[0].theme;
    			option.__value = /*theme*/ ctx[3].value;
    			option.value = option.__value;
    			option.disabled = /*theme*/ ctx[3].pro;
    			add_location(option, file$5, 26, 20, 961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && option_selected_value !== (option_selected_value = /*theme*/ ctx[3].value === /*settings*/ ctx[0].theme)) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(26:16) {#each getThemes() as theme }",
    		ctx
    	});

    	return block;
    }

    // (39:16) {#if settings.image_url}
    function create_if_block$4(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			span.textContent = "x";
    			if (!src_url_equal(img.src, img_src_value = /*settings*/ ctx[0].image_url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$5, 39, 20, 1472);
    			attr_dev(span, "class", "discountx-remove-image");
    			add_location(span, file$5, 40, 20, 1530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", prevent_default(/*click_handler_1*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && !src_url_equal(img.src, img_src_value = /*settings*/ ctx[0].image_url)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(39:16) {#if settings.image_url}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div22;
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
    	let div9;
    	let div6;
    	let h42;
    	let t7;
    	let div8;
    	let div7;
    	let t8;
    	let input0;
    	let input0_value_value;
    	let t9;
    	let button;
    	let i;
    	let t10;
    	let div12;
    	let div10;
    	let h43;
    	let t12;
    	let div11;
    	let input1;
    	let input1_value_value;
    	let t13;
    	let div15;
    	let div13;
    	let h44;
    	let t15;
    	let div14;
    	let input2;
    	let input2_value_value;
    	let t16;
    	let div18;
    	let div16;
    	let h45;
    	let t18;
    	let div17;
    	let textarea;
    	let textarea_value_value;
    	let t19;
    	let div21;
    	let div19;
    	let h46;
    	let t21;
    	let div20;
    	let input3;
    	let input3_value_value;
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let if_block = /*settings*/ ctx[0].image_url && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div22 = element("div");
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
    			div9 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = `${translation('image-label')}`;
    			t7 = space();
    			div8 = element("div");
    			div7 = element("div");
    			if (if_block) if_block.c();
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			button = element("button");
    			i = element("i");
    			t10 = space();
    			div12 = element("div");
    			div10 = element("div");
    			h43 = element("h4");
    			h43.textContent = `${translation('pre-title-label')}`;
    			t12 = space();
    			div11 = element("div");
    			input1 = element("input");
    			t13 = space();
    			div15 = element("div");
    			div13 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('title-label')}`;
    			t15 = space();
    			div14 = element("div");
    			input2 = element("input");
    			t16 = space();
    			div18 = element("div");
    			div16 = element("div");
    			h45 = element("h4");
    			h45.textContent = `${translation('content-label')}`;
    			t18 = space();
    			div17 = element("div");
    			textarea = element("textarea");
    			t19 = space();
    			div21 = element("div");
    			div19 = element("div");
    			h46 = element("h4");
    			h46.textContent = `${translation('button-text-label')}`;
    			t21 = space();
    			div20 = element("div");
    			input3 = element("input");
    			add_location(h40, file$5, 8, 12, 229);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$5, 7, 8, 178);
    			attr_dev(select0, "name", "displayOn");
    			attr_dev(select0, "id", "displayOn");
    			add_location(select0, file$5, 11, 12, 352);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$5, 10, 8, 299);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$5, 6, 4, 131);
    			add_location(h41, file$5, 21, 12, 746);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$5, 20, 8, 695);
    			attr_dev(select1, "name", "theme");
    			attr_dev(select1, "id", "theme");
    			add_location(select1, file$5, 24, 12, 862);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$5, 23, 8, 809);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$5, 19, 4, 648);
    			add_location(h42, file$5, 34, 12, 1252);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$5, 33, 8, 1201);
    			attr_dev(div7, "class", "discountx-image-control-wrap");
    			add_location(div7, file$5, 37, 12, 1368);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "image_url");
    			attr_dev(input0, "id", "image_url");
    			input0.value = input0_value_value = /*settings*/ ctx[0].image_url;
    			add_location(input0, file$5, 44, 12, 1686);
    			attr_dev(i, "class", "dashicons-before dashicons-cloud-upload");
    			add_location(i, file$5, 45, 63, 1832);
    			attr_dev(button, "id", "discountx-upload-popup-image");
    			add_location(button, file$5, 45, 12, 1781);
    			attr_dev(div8, "class", "discountx-settings-control");
    			add_location(div8, file$5, 36, 8, 1315);
    			attr_dev(div9, "class", "discountx-settings-panel");
    			add_location(div9, file$5, 32, 4, 1154);
    			add_location(h43, file$5, 51, 12, 2026);
    			attr_dev(div10, "class", "discountx-settings-label");
    			add_location(div10, file$5, 50, 8, 1975);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "popupPreTitle");
    			attr_dev(input1, "id", "popupPreTitle");
    			input1.value = input1_value_value = /*settings*/ ctx[0].popupPreTitle;
    			add_location(input1, file$5, 54, 12, 2146);
    			attr_dev(div11, "class", "discountx-settings-control");
    			add_location(div11, file$5, 53, 8, 2093);
    			attr_dev(div12, "class", "discountx-settings-panel");
    			add_location(div12, file$5, 49, 4, 1928);
    			add_location(h44, file$5, 65, 12, 2444);
    			attr_dev(div13, "class", "discountx-settings-label");
    			add_location(div13, file$5, 64, 8, 2393);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "name", "popupTitle");
    			attr_dev(input2, "id", "popupTitle");
    			input2.value = input2_value_value = /*settings*/ ctx[0].popupTitle;
    			add_location(input2, file$5, 68, 12, 2560);
    			attr_dev(div14, "class", "discountx-settings-control");
    			add_location(div14, file$5, 67, 8, 2507);
    			attr_dev(div15, "class", "discountx-settings-panel");
    			add_location(div15, file$5, 63, 4, 2346);
    			add_location(h45, file$5, 79, 12, 2849);
    			attr_dev(div16, "class", "discountx-settings-label");
    			add_location(div16, file$5, 78, 8, 2798);
    			attr_dev(textarea, "name", "popupContent");
    			attr_dev(textarea, "id", "popupContent");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			textarea.value = textarea_value_value = /*settings*/ ctx[0].popupContent;
    			add_location(textarea, file$5, 82, 12, 2967);
    			attr_dev(div17, "class", "discountx-settings-control");
    			add_location(div17, file$5, 81, 8, 2914);
    			attr_dev(div18, "class", "discountx-settings-panel");
    			add_location(div18, file$5, 77, 4, 2751);
    			add_location(h46, file$5, 88, 12, 3199);
    			attr_dev(div19, "class", "discountx-settings-label");
    			add_location(div19, file$5, 87, 8, 3148);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "name", "buttonText");
    			attr_dev(input3, "id", "buttonText");
    			input3.value = input3_value_value = /*settings*/ ctx[0].buttonText;
    			add_location(input3, file$5, 91, 12, 3321);
    			attr_dev(div20, "class", "discountx-settings-control");
    			add_location(div20, file$5, 90, 8, 3268);
    			attr_dev(div21, "class", "discountx-settings-panel");
    			add_location(div21, file$5, 86, 4, 3101);
    			add_location(div22, file$5, 5, 0, 121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h40);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			append_dev(div22, t2);
    			append_dev(div22, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			append_dev(div22, t5);
    			append_dev(div22, div9);
    			append_dev(div9, div6);
    			append_dev(div6, h42);
    			append_dev(div9, t7);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			if (if_block) if_block.m(div7, null);
    			append_dev(div8, t8);
    			append_dev(div8, input0);
    			append_dev(div8, t9);
    			append_dev(div8, button);
    			append_dev(button, i);
    			append_dev(div22, t10);
    			append_dev(div22, div12);
    			append_dev(div12, div10);
    			append_dev(div10, h43);
    			append_dev(div12, t12);
    			append_dev(div12, div11);
    			append_dev(div11, input1);
    			append_dev(div22, t13);
    			append_dev(div22, div15);
    			append_dev(div15, div13);
    			append_dev(div13, h44);
    			append_dev(div15, t15);
    			append_dev(div15, div14);
    			append_dev(div14, input2);
    			append_dev(div22, t16);
    			append_dev(div22, div18);
    			append_dev(div18, div16);
    			append_dev(div16, h45);
    			append_dev(div18, t18);
    			append_dev(div18, div17);
    			append_dev(div17, textarea);
    			append_dev(div22, t19);
    			append_dev(div22, div21);
    			append_dev(div21, div19);
    			append_dev(div19, h46);
    			append_dev(div21, t21);
    			append_dev(div21, div20);
    			append_dev(div20, input3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, getDisplayOptions, settings*/ 1) {
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

    			if (dirty & /*getThemes, settings*/ 1) {
    				each_value = getThemes();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*settings*/ ctx[0].image_url) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div7, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*settings*/ 1 && input0_value_value !== (input0_value_value = /*settings*/ ctx[0].image_url)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*settings*/ 1 && input1_value_value !== (input1_value_value = /*settings*/ ctx[0].popupPreTitle) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*settings*/ 1 && input2_value_value !== (input2_value_value = /*settings*/ ctx[0].popupTitle) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (dirty & /*settings*/ 1 && textarea_value_value !== (textarea_value_value = /*settings*/ ctx[0].popupContent)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}

    			if (dirty & /*settings*/ 1 && input3_value_value !== (input3_value_value = /*settings*/ ctx[0].buttonText) && input3.value !== input3_value_value) {
    				prop_dev(input3, "value", input3_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div22);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
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
    	validate_slots('Settings', slots, []);
    	let { settings } = $$props;
    	const writable_props = ['settings'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => $$invalidate(0, settings.image_url = '', settings);

    	$$self.$$set = $$props => {
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		translation,
    		getDisplayOptions,
    		getThemes,
    		settings
    	});

    	$$self.$inject_state = $$props => {
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [settings, click_handler, click_handler_1];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { settings: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*settings*/ ctx[0] === undefined && !('settings' in props)) {
    			console.warn("<Settings> was created without expected prop 'settings'");
    		}
    	}

    	get settings() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value) {
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            }
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled) {
                        task = null;
                    }
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    /* node_modules/svelte-range-slider-pips/src/RangePips.svelte generated by Svelte v3.46.2 */

    const file$4 = "node_modules/svelte-range-slider-pips/src/RangePips.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    // (174:2) {#if ( all && first !== false ) || first }
    function create_if_block_9(ctx) {
    	let span;
    	let span_style_value;
    	let mounted;
    	let dispose;
    	let if_block = (/*all*/ ctx[6] === 'label' || /*first*/ ctx[7] === 'label') && create_if_block_10(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "pip first");
    			attr_dev(span, "style", span_style_value = "" + (/*orientationStart*/ ctx[14] + ": 0%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[17](/*min*/ ctx[0]));
    			toggle_class(span, "in-range", /*inRange*/ ctx[16](/*min*/ ctx[0]));
    			add_location(span, file$4, 174, 4, 4340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						span,
    						"click",
    						function () {
    							if (is_function(/*labelClick*/ ctx[20](/*min*/ ctx[0]))) /*labelClick*/ ctx[20](/*min*/ ctx[0]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span,
    						"touchend",
    						prevent_default(function () {
    							if (is_function(/*labelClick*/ ctx[20](/*min*/ ctx[0]))) /*labelClick*/ ctx[20](/*min*/ ctx[0]).apply(this, arguments);
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

    			if (/*all*/ ctx[6] === 'label' || /*first*/ ctx[7] === 'label') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_10(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*orientationStart*/ 16384 && span_style_value !== (span_style_value = "" + (/*orientationStart*/ ctx[14] + ": 0%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, min*/ 131073) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[17](/*min*/ ctx[0]));
    			}

    			if (dirty & /*inRange, min*/ 65537) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[16](/*min*/ ctx[0]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(174:2) {#if ( all && first !== false ) || first }",
    		ctx
    	});

    	return block;
    }

    // (183:6) {#if all === 'label' || first === 'label'}
    function create_if_block_10(ctx) {
    	let span;
    	let t_value = /*formatter*/ ctx[12](/*min*/ ctx[0], 0, 0) + "";
    	let t;
    	let if_block0 = /*prefix*/ ctx[10] && create_if_block_12(ctx);
    	let if_block1 = /*suffix*/ ctx[11] && create_if_block_11(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t = text(t_value);
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$4, 183, 8, 4630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t);
    			if (if_block1) if_block1.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*prefix*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_12(ctx);
    					if_block0.c();
    					if_block0.m(span, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*formatter, min*/ 4097 && t_value !== (t_value = /*formatter*/ ctx[12](/*min*/ ctx[0], 0, 0) + "")) set_data_dev(t, t_value);

    			if (/*suffix*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(183:6) {#if all === 'label' || first === 'label'}",
    		ctx
    	});

    	return block;
    }

    // (185:10) {#if prefix}
    function create_if_block_12(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*prefix*/ ctx[10]);
    			attr_dev(span, "class", "pipVal-prefix");
    			add_location(span, file$4, 184, 22, 4674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 1024) set_data_dev(t, /*prefix*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(185:10) {#if prefix}",
    		ctx
    	});

    	return block;
    }

    // (185:90) {#if suffix}
    function create_if_block_11(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*suffix*/ ctx[11]);
    			attr_dev(span, "class", "pipVal-suffix");
    			add_location(span, file$4, 184, 102, 4754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*suffix*/ 2048) set_data_dev(t, /*suffix*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(185:90) {#if suffix}",
    		ctx
    	});

    	return block;
    }

    // (191:2) {#if ( all && rest !== false ) || rest}
    function create_if_block_4$1(ctx) {
    	let each_1_anchor;
    	let each_value = Array(/*pipCount*/ ctx[19] + 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*orientationStart, percentOf, pipVal, isSelected, inRange, labelClick, suffix, formatter, prefix, all, rest, min, max, pipCount*/ 2088515) {
    				each_value = Array(/*pipCount*/ ctx[19] + 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(191:2) {#if ( all && rest !== false ) || rest}",
    		ctx
    	});

    	return block;
    }

    // (193:6) {#if pipVal(i) !== min && pipVal(i) !== max}
    function create_if_block_5(ctx) {
    	let span;
    	let t;
    	let span_style_value;
    	let mounted;
    	let dispose;
    	let if_block = (/*all*/ ctx[6] === 'label' || /*rest*/ ctx[9] === 'label') && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(span, "class", "pip");
    			attr_dev(span, "style", span_style_value = "" + (/*orientationStart*/ ctx[14] + ": " + /*percentOf*/ ctx[15](/*pipVal*/ ctx[18](/*i*/ ctx[29])) + "%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[17](/*pipVal*/ ctx[18](/*i*/ ctx[29])));
    			toggle_class(span, "in-range", /*inRange*/ ctx[16](/*pipVal*/ ctx[18](/*i*/ ctx[29])));
    			add_location(span, file$4, 193, 8, 4993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						span,
    						"click",
    						function () {
    							if (is_function(/*labelClick*/ ctx[20](/*pipVal*/ ctx[18](/*i*/ ctx[29])))) /*labelClick*/ ctx[20](/*pipVal*/ ctx[18](/*i*/ ctx[29])).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span,
    						"touchend",
    						prevent_default(function () {
    							if (is_function(/*labelClick*/ ctx[20](/*pipVal*/ ctx[18](/*i*/ ctx[29])))) /*labelClick*/ ctx[20](/*pipVal*/ ctx[18](/*i*/ ctx[29])).apply(this, arguments);
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

    			if (/*all*/ ctx[6] === 'label' || /*rest*/ ctx[9] === 'label') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					if_block.m(span, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*orientationStart, percentOf, pipVal*/ 311296 && span_style_value !== (span_style_value = "" + (/*orientationStart*/ ctx[14] + ": " + /*percentOf*/ ctx[15](/*pipVal*/ ctx[18](/*i*/ ctx[29])) + "%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, pipVal*/ 393216) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[17](/*pipVal*/ ctx[18](/*i*/ ctx[29])));
    			}

    			if (dirty & /*inRange, pipVal*/ 327680) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[16](/*pipVal*/ ctx[18](/*i*/ ctx[29])));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(193:6) {#if pipVal(i) !== min && pipVal(i) !== max}",
    		ctx
    	});

    	return block;
    }

    // (202:10) {#if all === 'label' || rest === 'label'}
    function create_if_block_6(ctx) {
    	let span;
    	let t_value = /*formatter*/ ctx[12](/*pipVal*/ ctx[18](/*i*/ ctx[29]), /*i*/ ctx[29], /*percentOf*/ ctx[15](/*pipVal*/ ctx[18](/*i*/ ctx[29]))) + "";
    	let t;
    	let if_block0 = /*prefix*/ ctx[10] && create_if_block_8(ctx);
    	let if_block1 = /*suffix*/ ctx[11] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t = text(t_value);
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$4, 202, 12, 5357);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t);
    			if (if_block1) if_block1.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*prefix*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(span, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*formatter, pipVal, percentOf*/ 299008 && t_value !== (t_value = /*formatter*/ ctx[12](/*pipVal*/ ctx[18](/*i*/ ctx[29]), /*i*/ ctx[29], /*percentOf*/ ctx[15](/*pipVal*/ ctx[18](/*i*/ ctx[29]))) + "")) set_data_dev(t, t_value);

    			if (/*suffix*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(202:10) {#if all === 'label' || rest === 'label'}",
    		ctx
    	});

    	return block;
    }

    // (204:14) {#if prefix}
    function create_if_block_8(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*prefix*/ ctx[10]);
    			attr_dev(span, "class", "pipVal-prefix");
    			add_location(span, file$4, 203, 26, 5405);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 1024) set_data_dev(t, /*prefix*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(204:14) {#if prefix}",
    		ctx
    	});

    	return block;
    }

    // (204:119) {#if suffix}
    function create_if_block_7(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*suffix*/ ctx[11]);
    			attr_dev(span, "class", "pipVal-suffix");
    			add_location(span, file$4, 203, 131, 5510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*suffix*/ 2048) set_data_dev(t, /*suffix*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(204:119) {#if suffix}",
    		ctx
    	});

    	return block;
    }

    // (192:4) {#each Array(pipCount + 1) as _, i}
    function create_each_block$1(ctx) {
    	let show_if = /*pipVal*/ ctx[18](/*i*/ ctx[29]) !== /*min*/ ctx[0] && /*pipVal*/ ctx[18](/*i*/ ctx[29]) !== /*max*/ ctx[1];
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pipVal, min, max*/ 262147) show_if = /*pipVal*/ ctx[18](/*i*/ ctx[29]) !== /*min*/ ctx[0] && /*pipVal*/ ctx[18](/*i*/ ctx[29]) !== /*max*/ ctx[1];

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(192:4) {#each Array(pipCount + 1) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (212:2) {#if ( all && last !== false ) || last}
    function create_if_block$3(ctx) {
    	let span;
    	let span_style_value;
    	let mounted;
    	let dispose;
    	let if_block = (/*all*/ ctx[6] === 'label' || /*last*/ ctx[8] === 'label') && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "pip last");
    			attr_dev(span, "style", span_style_value = "" + (/*orientationStart*/ ctx[14] + ": 100%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[17](/*max*/ ctx[1]));
    			toggle_class(span, "in-range", /*inRange*/ ctx[16](/*max*/ ctx[1]));
    			add_location(span, file$4, 212, 4, 5690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						span,
    						"click",
    						function () {
    							if (is_function(/*labelClick*/ ctx[20](/*max*/ ctx[1]))) /*labelClick*/ ctx[20](/*max*/ ctx[1]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						span,
    						"touchend",
    						prevent_default(function () {
    							if (is_function(/*labelClick*/ ctx[20](/*max*/ ctx[1]))) /*labelClick*/ ctx[20](/*max*/ ctx[1]).apply(this, arguments);
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

    			if (/*all*/ ctx[6] === 'label' || /*last*/ ctx[8] === 'label') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*orientationStart*/ 16384 && span_style_value !== (span_style_value = "" + (/*orientationStart*/ ctx[14] + ": 100%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, max*/ 131074) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[17](/*max*/ ctx[1]));
    			}

    			if (dirty & /*inRange, max*/ 65538) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[16](/*max*/ ctx[1]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(212:2) {#if ( all && last !== false ) || last}",
    		ctx
    	});

    	return block;
    }

    // (221:6) {#if all === 'label' || last === 'label'}
    function create_if_block_1$3(ctx) {
    	let span;
    	let t_value = /*formatter*/ ctx[12](/*max*/ ctx[1], /*pipCount*/ ctx[19], 100) + "";
    	let t;
    	let if_block0 = /*prefix*/ ctx[10] && create_if_block_3$1(ctx);
    	let if_block1 = /*suffix*/ ctx[11] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t = text(t_value);
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$4, 221, 8, 5980);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t);
    			if (if_block1) if_block1.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*prefix*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(span, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*formatter, max, pipCount*/ 528386 && t_value !== (t_value = /*formatter*/ ctx[12](/*max*/ ctx[1], /*pipCount*/ ctx[19], 100) + "")) set_data_dev(t, t_value);

    			if (/*suffix*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(221:6) {#if all === 'label' || last === 'label'}",
    		ctx
    	});

    	return block;
    }

    // (223:10) {#if prefix}
    function create_if_block_3$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*prefix*/ ctx[10]);
    			attr_dev(span, "class", "pipVal-prefix");
    			add_location(span, file$4, 222, 22, 6024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 1024) set_data_dev(t, /*prefix*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(223:10) {#if prefix}",
    		ctx
    	});

    	return block;
    }

    // (223:99) {#if suffix}
    function create_if_block_2$2(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*suffix*/ ctx[11]);
    			attr_dev(span, "class", "pipVal-suffix");
    			add_location(span, file$4, 222, 111, 6113);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*suffix*/ 2048) set_data_dev(t, /*suffix*/ ctx[11]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(223:99) {#if suffix}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let if_block0 = (/*all*/ ctx[6] && /*first*/ ctx[7] !== false || /*first*/ ctx[7]) && create_if_block_9(ctx);
    	let if_block1 = (/*all*/ ctx[6] && /*rest*/ ctx[9] !== false || /*rest*/ ctx[9]) && create_if_block_4$1(ctx);
    	let if_block2 = (/*all*/ ctx[6] && /*last*/ ctx[8] !== false || /*last*/ ctx[8]) && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "rangePips");
    			toggle_class(div, "disabled", /*disabled*/ ctx[5]);
    			toggle_class(div, "hoverable", /*hoverable*/ ctx[4]);
    			toggle_class(div, "vertical", /*vertical*/ ctx[2]);
    			toggle_class(div, "reversed", /*reversed*/ ctx[3]);
    			toggle_class(div, "focus", /*focus*/ ctx[13]);
    			add_location(div, file$4, 165, 0, 4175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*all*/ ctx[6] && /*first*/ ctx[7] !== false || /*first*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*all*/ ctx[6] && /*rest*/ ctx[9] !== false || /*rest*/ ctx[9]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*all*/ ctx[6] && /*last*/ ctx[8] !== false || /*last*/ ctx[8]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*disabled*/ 32) {
    				toggle_class(div, "disabled", /*disabled*/ ctx[5]);
    			}

    			if (dirty & /*hoverable*/ 16) {
    				toggle_class(div, "hoverable", /*hoverable*/ ctx[4]);
    			}

    			if (dirty & /*vertical*/ 4) {
    				toggle_class(div, "vertical", /*vertical*/ ctx[2]);
    			}

    			if (dirty & /*reversed*/ 8) {
    				toggle_class(div, "reversed", /*reversed*/ ctx[3]);
    			}

    			if (dirty & /*focus*/ 8192) {
    				toggle_class(div, "focus", /*focus*/ ctx[13]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	let pipStep;
    	let pipCount;
    	let pipVal;
    	let isSelected;
    	let inRange;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RangePips', slots, []);
    	let { range = false } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 1 } = $$props;
    	let { values = [(max + min) / 2] } = $$props;
    	let { vertical = false } = $$props;
    	let { reversed = false } = $$props;
    	let { hoverable = true } = $$props;
    	let { disabled = false } = $$props;
    	let { pipstep = undefined } = $$props;
    	let { all = true } = $$props;
    	let { first = undefined } = $$props;
    	let { last = undefined } = $$props;
    	let { rest = undefined } = $$props;
    	let { prefix = "" } = $$props;
    	let { suffix = "" } = $$props;
    	let { formatter = (v, i) => v } = $$props;
    	let { focus = undefined } = $$props;
    	let { orientationStart = undefined } = $$props;
    	let { percentOf = undefined } = $$props;
    	let { moveHandle = undefined } = $$props;

    	function labelClick(val) {
    		moveHandle(undefined, val);
    	}

    	const writable_props = [
    		'range',
    		'min',
    		'max',
    		'step',
    		'values',
    		'vertical',
    		'reversed',
    		'hoverable',
    		'disabled',
    		'pipstep',
    		'all',
    		'first',
    		'last',
    		'rest',
    		'prefix',
    		'suffix',
    		'formatter',
    		'focus',
    		'orientationStart',
    		'percentOf',
    		'moveHandle'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RangePips> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('range' in $$props) $$invalidate(21, range = $$props.range);
    		if ('min' in $$props) $$invalidate(0, min = $$props.min);
    		if ('max' in $$props) $$invalidate(1, max = $$props.max);
    		if ('step' in $$props) $$invalidate(22, step = $$props.step);
    		if ('values' in $$props) $$invalidate(23, values = $$props.values);
    		if ('vertical' in $$props) $$invalidate(2, vertical = $$props.vertical);
    		if ('reversed' in $$props) $$invalidate(3, reversed = $$props.reversed);
    		if ('hoverable' in $$props) $$invalidate(4, hoverable = $$props.hoverable);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('pipstep' in $$props) $$invalidate(24, pipstep = $$props.pipstep);
    		if ('all' in $$props) $$invalidate(6, all = $$props.all);
    		if ('first' in $$props) $$invalidate(7, first = $$props.first);
    		if ('last' in $$props) $$invalidate(8, last = $$props.last);
    		if ('rest' in $$props) $$invalidate(9, rest = $$props.rest);
    		if ('prefix' in $$props) $$invalidate(10, prefix = $$props.prefix);
    		if ('suffix' in $$props) $$invalidate(11, suffix = $$props.suffix);
    		if ('formatter' in $$props) $$invalidate(12, formatter = $$props.formatter);
    		if ('focus' in $$props) $$invalidate(13, focus = $$props.focus);
    		if ('orientationStart' in $$props) $$invalidate(14, orientationStart = $$props.orientationStart);
    		if ('percentOf' in $$props) $$invalidate(15, percentOf = $$props.percentOf);
    		if ('moveHandle' in $$props) $$invalidate(25, moveHandle = $$props.moveHandle);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		min,
    		max,
    		step,
    		values,
    		vertical,
    		reversed,
    		hoverable,
    		disabled,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		prefix,
    		suffix,
    		formatter,
    		focus,
    		orientationStart,
    		percentOf,
    		moveHandle,
    		labelClick,
    		inRange,
    		isSelected,
    		pipStep,
    		pipVal,
    		pipCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('range' in $$props) $$invalidate(21, range = $$props.range);
    		if ('min' in $$props) $$invalidate(0, min = $$props.min);
    		if ('max' in $$props) $$invalidate(1, max = $$props.max);
    		if ('step' in $$props) $$invalidate(22, step = $$props.step);
    		if ('values' in $$props) $$invalidate(23, values = $$props.values);
    		if ('vertical' in $$props) $$invalidate(2, vertical = $$props.vertical);
    		if ('reversed' in $$props) $$invalidate(3, reversed = $$props.reversed);
    		if ('hoverable' in $$props) $$invalidate(4, hoverable = $$props.hoverable);
    		if ('disabled' in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ('pipstep' in $$props) $$invalidate(24, pipstep = $$props.pipstep);
    		if ('all' in $$props) $$invalidate(6, all = $$props.all);
    		if ('first' in $$props) $$invalidate(7, first = $$props.first);
    		if ('last' in $$props) $$invalidate(8, last = $$props.last);
    		if ('rest' in $$props) $$invalidate(9, rest = $$props.rest);
    		if ('prefix' in $$props) $$invalidate(10, prefix = $$props.prefix);
    		if ('suffix' in $$props) $$invalidate(11, suffix = $$props.suffix);
    		if ('formatter' in $$props) $$invalidate(12, formatter = $$props.formatter);
    		if ('focus' in $$props) $$invalidate(13, focus = $$props.focus);
    		if ('orientationStart' in $$props) $$invalidate(14, orientationStart = $$props.orientationStart);
    		if ('percentOf' in $$props) $$invalidate(15, percentOf = $$props.percentOf);
    		if ('moveHandle' in $$props) $$invalidate(25, moveHandle = $$props.moveHandle);
    		if ('inRange' in $$props) $$invalidate(16, inRange = $$props.inRange);
    		if ('isSelected' in $$props) $$invalidate(17, isSelected = $$props.isSelected);
    		if ('pipStep' in $$props) $$invalidate(26, pipStep = $$props.pipStep);
    		if ('pipVal' in $$props) $$invalidate(18, pipVal = $$props.pipVal);
    		if ('pipCount' in $$props) $$invalidate(19, pipCount = $$props.pipCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pipstep, max, min, step, vertical*/ 20971527) {
    			$$invalidate(26, pipStep = pipstep || ((max - min) / step >= (vertical ? 50 : 100)
    			? (max - min) / (vertical ? 10 : 20)
    			: 1));
    		}

    		if ($$self.$$.dirty & /*max, min, step, pipStep*/ 71303171) {
    			$$invalidate(19, pipCount = parseInt((max - min) / (step * pipStep), 10));
    		}

    		if ($$self.$$.dirty & /*min, step, pipStep*/ 71303169) {
    			$$invalidate(18, pipVal = function (val) {
    				return min + val * step * pipStep;
    			});
    		}

    		if ($$self.$$.dirty & /*values*/ 8388608) {
    			$$invalidate(17, isSelected = function (val) {
    				return values.some(v => v === val);
    			});
    		}

    		if ($$self.$$.dirty & /*range, values*/ 10485760) {
    			$$invalidate(16, inRange = function (val) {
    				if (range === "min") {
    					return values[0] > val;
    				} else if (range === "max") {
    					return values[0] < val;
    				} else if (range) {
    					return values[0] < val && values[1] > val;
    				}
    			});
    		}
    	};

    	return [
    		min,
    		max,
    		vertical,
    		reversed,
    		hoverable,
    		disabled,
    		all,
    		first,
    		last,
    		rest,
    		prefix,
    		suffix,
    		formatter,
    		focus,
    		orientationStart,
    		percentOf,
    		inRange,
    		isSelected,
    		pipVal,
    		pipCount,
    		labelClick,
    		range,
    		step,
    		values,
    		pipstep,
    		moveHandle,
    		pipStep
    	];
    }

    class RangePips extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			range: 21,
    			min: 0,
    			max: 1,
    			step: 22,
    			values: 23,
    			vertical: 2,
    			reversed: 3,
    			hoverable: 4,
    			disabled: 5,
    			pipstep: 24,
    			all: 6,
    			first: 7,
    			last: 8,
    			rest: 9,
    			prefix: 10,
    			suffix: 11,
    			formatter: 12,
    			focus: 13,
    			orientationStart: 14,
    			percentOf: 15,
    			moveHandle: 25
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangePips",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get range() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get values() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reversed() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reversed(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoverable() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hoverable(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pipstep() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pipstep(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get first() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rest() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rest(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get suffix() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set suffix(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatter() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatter(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focus(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orientationStart() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orientationStart(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get percentOf() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set percentOf(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get moveHandle() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set moveHandle(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-range-slider-pips/src/RangeSlider.svelte generated by Svelte v3.46.2 */

    const { console: console_1 } = globals;
    const file$3 = "node_modules/svelte-range-slider-pips/src/RangeSlider.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[63] = list[i];
    	child_ctx[65] = i;
    	return child_ctx;
    }

    // (821:6) {#if float}
    function create_if_block_2$1(ctx) {
    	let span;
    	let t_value = /*handleFormatter*/ ctx[21](/*value*/ ctx[63], /*index*/ ctx[65], /*percentOf*/ ctx[23](/*value*/ ctx[63])) + "";
    	let t;
    	let if_block0 = /*prefix*/ ctx[18] && create_if_block_4(ctx);
    	let if_block1 = /*suffix*/ ctx[19] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t = text(t_value);
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", "rangeFloat");
    			add_location(span, file$3, 821, 8, 24398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t);
    			if (if_block1) if_block1.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*prefix*/ ctx[18]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(span, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*handleFormatter, values, percentOf*/ 10485761 && t_value !== (t_value = /*handleFormatter*/ ctx[21](/*value*/ ctx[63], /*index*/ ctx[65], /*percentOf*/ ctx[23](/*value*/ ctx[63])) + "")) set_data_dev(t, t_value);

    			if (/*suffix*/ ctx[19]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(821:6) {#if float}",
    		ctx
    	});

    	return block;
    }

    // (823:10) {#if prefix}
    function create_if_block_4(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*prefix*/ ctx[18]);
    			attr_dev(span, "class", "rangeFloat-prefix");
    			add_location(span, file$3, 822, 22, 24446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*prefix*/ 262144) set_data_dev(t, /*prefix*/ ctx[18]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(823:10) {#if prefix}",
    		ctx
    	});

    	return block;
    }

    // (823:121) {#if suffix}
    function create_if_block_3(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*suffix*/ ctx[19]);
    			attr_dev(span, "class", "rangeFloat-suffix");
    			add_location(span, file$3, 822, 133, 24557);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*suffix*/ 524288) set_data_dev(t, /*suffix*/ ctx[19]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(823:121) {#if suffix}",
    		ctx
    	});

    	return block;
    }

    // (800:2) {#each values as value, index}
    function create_each_block(ctx) {
    	let span1;
    	let span0;
    	let t;
    	let span1_style_value;
    	let span1_aria_valuemin_value;
    	let span1_aria_valuemax_value;
    	let span1_aria_valuenow_value;
    	let span1_aria_valuetext_value;
    	let span1_aria_orientation_value;
    	let span1_tabindex_value;
    	let mounted;
    	let dispose;
    	let if_block = /*float*/ ctx[7] && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "rangeNub");
    			add_location(span0, file$3, 819, 6, 24346);
    			attr_dev(span1, "role", "slider");
    			attr_dev(span1, "class", "rangeHandle");
    			attr_dev(span1, "data-handle", /*index*/ ctx[65]);
    			attr_dev(span1, "style", span1_style_value = "" + (/*orientationStart*/ ctx[28] + ": " + /*$springPositions*/ ctx[29][/*index*/ ctx[65]] + "%; z-index: " + (/*activeHandle*/ ctx[26] === /*index*/ ctx[65] ? 3 : 2) + ";"));

    			attr_dev(span1, "aria-valuemin", span1_aria_valuemin_value = /*range*/ ctx[2] === true && /*index*/ ctx[65] === 1
    			? /*values*/ ctx[0][0]
    			: /*min*/ ctx[3]);

    			attr_dev(span1, "aria-valuemax", span1_aria_valuemax_value = /*range*/ ctx[2] === true && /*index*/ ctx[65] === 0
    			? /*values*/ ctx[0][1]
    			: /*max*/ ctx[4]);

    			attr_dev(span1, "aria-valuenow", span1_aria_valuenow_value = /*value*/ ctx[63]);
    			attr_dev(span1, "aria-valuetext", span1_aria_valuetext_value = "" + (/*prefix*/ ctx[18] + /*handleFormatter*/ ctx[21](/*value*/ ctx[63], /*index*/ ctx[65], /*percentOf*/ ctx[23](/*value*/ ctx[63])) + /*suffix*/ ctx[19]));
    			attr_dev(span1, "aria-orientation", span1_aria_orientation_value = /*vertical*/ ctx[6] ? 'vertical' : 'horizontal');
    			attr_dev(span1, "aria-disabled", /*disabled*/ ctx[10]);
    			attr_dev(span1, "disabled", /*disabled*/ ctx[10]);
    			attr_dev(span1, "tabindex", span1_tabindex_value = /*disabled*/ ctx[10] ? -1 : 0);
    			toggle_class(span1, "active", /*focus*/ ctx[24] && /*activeHandle*/ ctx[26] === /*index*/ ctx[65]);
    			toggle_class(span1, "press", /*handlePressed*/ ctx[25] && /*activeHandle*/ ctx[26] === /*index*/ ctx[65]);
    			add_location(span1, file$3, 800, 4, 23533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t);
    			if (if_block) if_block.m(span1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span1, "blur", /*sliderBlurHandle*/ ctx[33], false, false, false),
    					listen_dev(span1, "focus", /*sliderFocusHandle*/ ctx[34], false, false, false),
    					listen_dev(span1, "keydown", /*sliderKeydown*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*float*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*orientationStart, $springPositions, activeHandle*/ 872415232 && span1_style_value !== (span1_style_value = "" + (/*orientationStart*/ ctx[28] + ": " + /*$springPositions*/ ctx[29][/*index*/ ctx[65]] + "%; z-index: " + (/*activeHandle*/ ctx[26] === /*index*/ ctx[65] ? 3 : 2) + ";"))) {
    				attr_dev(span1, "style", span1_style_value);
    			}

    			if (dirty[0] & /*range, values, min*/ 13 && span1_aria_valuemin_value !== (span1_aria_valuemin_value = /*range*/ ctx[2] === true && /*index*/ ctx[65] === 1
    			? /*values*/ ctx[0][0]
    			: /*min*/ ctx[3])) {
    				attr_dev(span1, "aria-valuemin", span1_aria_valuemin_value);
    			}

    			if (dirty[0] & /*range, values, max*/ 21 && span1_aria_valuemax_value !== (span1_aria_valuemax_value = /*range*/ ctx[2] === true && /*index*/ ctx[65] === 0
    			? /*values*/ ctx[0][1]
    			: /*max*/ ctx[4])) {
    				attr_dev(span1, "aria-valuemax", span1_aria_valuemax_value);
    			}

    			if (dirty[0] & /*values*/ 1 && span1_aria_valuenow_value !== (span1_aria_valuenow_value = /*value*/ ctx[63])) {
    				attr_dev(span1, "aria-valuenow", span1_aria_valuenow_value);
    			}

    			if (dirty[0] & /*prefix, handleFormatter, values, percentOf, suffix*/ 11272193 && span1_aria_valuetext_value !== (span1_aria_valuetext_value = "" + (/*prefix*/ ctx[18] + /*handleFormatter*/ ctx[21](/*value*/ ctx[63], /*index*/ ctx[65], /*percentOf*/ ctx[23](/*value*/ ctx[63])) + /*suffix*/ ctx[19]))) {
    				attr_dev(span1, "aria-valuetext", span1_aria_valuetext_value);
    			}

    			if (dirty[0] & /*vertical*/ 64 && span1_aria_orientation_value !== (span1_aria_orientation_value = /*vertical*/ ctx[6] ? 'vertical' : 'horizontal')) {
    				attr_dev(span1, "aria-orientation", span1_aria_orientation_value);
    			}

    			if (dirty[0] & /*disabled*/ 1024) {
    				attr_dev(span1, "aria-disabled", /*disabled*/ ctx[10]);
    			}

    			if (dirty[0] & /*disabled*/ 1024) {
    				attr_dev(span1, "disabled", /*disabled*/ ctx[10]);
    			}

    			if (dirty[0] & /*disabled*/ 1024 && span1_tabindex_value !== (span1_tabindex_value = /*disabled*/ ctx[10] ? -1 : 0)) {
    				attr_dev(span1, "tabindex", span1_tabindex_value);
    			}

    			if (dirty[0] & /*focus, activeHandle*/ 83886080) {
    				toggle_class(span1, "active", /*focus*/ ctx[24] && /*activeHandle*/ ctx[26] === /*index*/ ctx[65]);
    			}

    			if (dirty[0] & /*handlePressed, activeHandle*/ 100663296) {
    				toggle_class(span1, "press", /*handlePressed*/ ctx[25] && /*activeHandle*/ ctx[26] === /*index*/ ctx[65]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(800:2) {#each values as value, index}",
    		ctx
    	});

    	return block;
    }

    // (828:2) {#if range}
    function create_if_block_1$2(ctx) {
    	let span;
    	let span_style_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "rangeBar");
    			attr_dev(span, "style", span_style_value = "" + (/*orientationStart*/ ctx[28] + ": " + /*rangeStart*/ ctx[31](/*$springPositions*/ ctx[29]) + "%; " + /*orientationEnd*/ ctx[27] + ": " + /*rangeEnd*/ ctx[32](/*$springPositions*/ ctx[29]) + "%;"));
    			add_location(span, file$3, 828, 4, 24678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*orientationStart, $springPositions, orientationEnd*/ 939524096 && span_style_value !== (span_style_value = "" + (/*orientationStart*/ ctx[28] + ": " + /*rangeStart*/ ctx[31](/*$springPositions*/ ctx[29]) + "%; " + /*orientationEnd*/ ctx[27] + ": " + /*rangeEnd*/ ctx[32](/*$springPositions*/ ctx[29]) + "%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(828:2) {#if range}",
    		ctx
    	});

    	return block;
    }

    // (834:2) {#if pips}
    function create_if_block$2(ctx) {
    	let rangepips;
    	let current;

    	rangepips = new RangePips({
    			props: {
    				values: /*values*/ ctx[0],
    				min: /*min*/ ctx[3],
    				max: /*max*/ ctx[4],
    				step: /*step*/ ctx[5],
    				range: /*range*/ ctx[2],
    				vertical: /*vertical*/ ctx[6],
    				reversed: /*reversed*/ ctx[8],
    				orientationStart: /*orientationStart*/ ctx[28],
    				hoverable: /*hoverable*/ ctx[9],
    				disabled: /*disabled*/ ctx[10],
    				all: /*all*/ ctx[13],
    				first: /*first*/ ctx[14],
    				last: /*last*/ ctx[15],
    				rest: /*rest*/ ctx[16],
    				pipstep: /*pipstep*/ ctx[12],
    				prefix: /*prefix*/ ctx[18],
    				suffix: /*suffix*/ ctx[19],
    				formatter: /*formatter*/ ctx[20],
    				focus: /*focus*/ ctx[24],
    				percentOf: /*percentOf*/ ctx[23],
    				moveHandle: /*moveHandle*/ ctx[30]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(rangepips.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rangepips, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const rangepips_changes = {};
    			if (dirty[0] & /*values*/ 1) rangepips_changes.values = /*values*/ ctx[0];
    			if (dirty[0] & /*min*/ 8) rangepips_changes.min = /*min*/ ctx[3];
    			if (dirty[0] & /*max*/ 16) rangepips_changes.max = /*max*/ ctx[4];
    			if (dirty[0] & /*step*/ 32) rangepips_changes.step = /*step*/ ctx[5];
    			if (dirty[0] & /*range*/ 4) rangepips_changes.range = /*range*/ ctx[2];
    			if (dirty[0] & /*vertical*/ 64) rangepips_changes.vertical = /*vertical*/ ctx[6];
    			if (dirty[0] & /*reversed*/ 256) rangepips_changes.reversed = /*reversed*/ ctx[8];
    			if (dirty[0] & /*orientationStart*/ 268435456) rangepips_changes.orientationStart = /*orientationStart*/ ctx[28];
    			if (dirty[0] & /*hoverable*/ 512) rangepips_changes.hoverable = /*hoverable*/ ctx[9];
    			if (dirty[0] & /*disabled*/ 1024) rangepips_changes.disabled = /*disabled*/ ctx[10];
    			if (dirty[0] & /*all*/ 8192) rangepips_changes.all = /*all*/ ctx[13];
    			if (dirty[0] & /*first*/ 16384) rangepips_changes.first = /*first*/ ctx[14];
    			if (dirty[0] & /*last*/ 32768) rangepips_changes.last = /*last*/ ctx[15];
    			if (dirty[0] & /*rest*/ 65536) rangepips_changes.rest = /*rest*/ ctx[16];
    			if (dirty[0] & /*pipstep*/ 4096) rangepips_changes.pipstep = /*pipstep*/ ctx[12];
    			if (dirty[0] & /*prefix*/ 262144) rangepips_changes.prefix = /*prefix*/ ctx[18];
    			if (dirty[0] & /*suffix*/ 524288) rangepips_changes.suffix = /*suffix*/ ctx[19];
    			if (dirty[0] & /*formatter*/ 1048576) rangepips_changes.formatter = /*formatter*/ ctx[20];
    			if (dirty[0] & /*focus*/ 16777216) rangepips_changes.focus = /*focus*/ ctx[24];
    			if (dirty[0] & /*percentOf*/ 8388608) rangepips_changes.percentOf = /*percentOf*/ ctx[23];
    			rangepips.$set(rangepips_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rangepips.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rangepips.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rangepips, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(834:2) {#if pips}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*values*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*range*/ ctx[2] && create_if_block_1$2(ctx);
    	let if_block1 = /*pips*/ ctx[11] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", /*id*/ ctx[17]);
    			attr_dev(div, "class", "rangeSlider");
    			toggle_class(div, "range", /*range*/ ctx[2]);
    			toggle_class(div, "disabled", /*disabled*/ ctx[10]);
    			toggle_class(div, "hoverable", /*hoverable*/ ctx[9]);
    			toggle_class(div, "vertical", /*vertical*/ ctx[6]);
    			toggle_class(div, "reversed", /*reversed*/ ctx[8]);
    			toggle_class(div, "focus", /*focus*/ ctx[24]);
    			toggle_class(div, "min", /*range*/ ctx[2] === 'min');
    			toggle_class(div, "max", /*range*/ ctx[2] === 'max');
    			toggle_class(div, "pips", /*pips*/ ctx[11]);
    			toggle_class(div, "pip-labels", /*all*/ ctx[13] === 'label' || /*first*/ ctx[14] === 'label' || /*last*/ ctx[15] === 'label' || /*rest*/ ctx[16] === 'label');
    			add_location(div, file$3, 780, 0, 22999);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			/*div_binding*/ ctx[49](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mousedown", /*bodyInteractStart*/ ctx[38], false, false, false),
    					listen_dev(window, "touchstart", /*bodyInteractStart*/ ctx[38], false, false, false),
    					listen_dev(window, "mousemove", /*bodyInteract*/ ctx[39], false, false, false),
    					listen_dev(window, "touchmove", /*bodyInteract*/ ctx[39], false, false, false),
    					listen_dev(window, "mouseup", /*bodyMouseUp*/ ctx[40], false, false, false),
    					listen_dev(window, "touchend", /*bodyTouchEnd*/ ctx[41], false, false, false),
    					listen_dev(window, "keydown", /*bodyKeyDown*/ ctx[42], false, false, false),
    					listen_dev(div, "mousedown", /*sliderInteractStart*/ ctx[36], false, false, false),
    					listen_dev(div, "mouseup", /*sliderInteractEnd*/ ctx[37], false, false, false),
    					listen_dev(div, "touchstart", prevent_default(/*sliderInteractStart*/ ctx[36]), false, true, false),
    					listen_dev(div, "touchend", prevent_default(/*sliderInteractEnd*/ ctx[37]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*orientationStart, $springPositions, activeHandle, range, values, min, max, prefix, handleFormatter, percentOf, suffix, vertical, disabled, focus, handlePressed, float*/ 934020317 | dirty[1] & /*sliderBlurHandle, sliderFocusHandle, sliderKeydown*/ 28) {
    				each_value = /*values*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*range*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*pips*/ ctx[11]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*pips*/ 2048) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*id*/ 131072) {
    				attr_dev(div, "id", /*id*/ ctx[17]);
    			}

    			if (dirty[0] & /*range*/ 4) {
    				toggle_class(div, "range", /*range*/ ctx[2]);
    			}

    			if (dirty[0] & /*disabled*/ 1024) {
    				toggle_class(div, "disabled", /*disabled*/ ctx[10]);
    			}

    			if (dirty[0] & /*hoverable*/ 512) {
    				toggle_class(div, "hoverable", /*hoverable*/ ctx[9]);
    			}

    			if (dirty[0] & /*vertical*/ 64) {
    				toggle_class(div, "vertical", /*vertical*/ ctx[6]);
    			}

    			if (dirty[0] & /*reversed*/ 256) {
    				toggle_class(div, "reversed", /*reversed*/ ctx[8]);
    			}

    			if (dirty[0] & /*focus*/ 16777216) {
    				toggle_class(div, "focus", /*focus*/ ctx[24]);
    			}

    			if (dirty[0] & /*range*/ 4) {
    				toggle_class(div, "min", /*range*/ ctx[2] === 'min');
    			}

    			if (dirty[0] & /*range*/ 4) {
    				toggle_class(div, "max", /*range*/ ctx[2] === 'max');
    			}

    			if (dirty[0] & /*pips*/ 2048) {
    				toggle_class(div, "pips", /*pips*/ ctx[11]);
    			}

    			if (dirty[0] & /*all, first, last, rest*/ 122880) {
    				toggle_class(div, "pip-labels", /*all*/ ctx[13] === 'label' || /*first*/ ctx[14] === 'label' || /*last*/ ctx[15] === 'label' || /*rest*/ ctx[16] === 'label');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div_binding*/ ctx[49](null);
    			mounted = false;
    			run_all(dispose);
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

    function index(el) {
    	if (!el) return -1;
    	var i = 0;

    	while (el = el.previousElementSibling) {
    		i++;
    	}

    	return i;
    }

    /**
     * normalise a mouse or touch event to return the
     * client (x/y) object for that event
     * @param {event} e a mouse/touch event to normalise
     * @returns {object} normalised event client object (x,y)
     **/
    function normalisedClient(e) {
    	if (e.type.includes("touch")) {
    		return e.touches[0];
    	} else {
    		return e;
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let percentOf;
    	let clampValue;
    	let alignValueToStep;
    	let orientationStart;
    	let orientationEnd;

    	let $springPositions,
    		$$unsubscribe_springPositions = noop,
    		$$subscribe_springPositions = () => ($$unsubscribe_springPositions(), $$unsubscribe_springPositions = subscribe(springPositions, $$value => $$invalidate(29, $springPositions = $$value)), springPositions);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_springPositions());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RangeSlider', slots, []);
    	let { slider } = $$props;
    	let { range = false } = $$props;
    	let { pushy = false } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 1 } = $$props;
    	let { values = [(max + min) / 2] } = $$props;
    	let { vertical = false } = $$props;
    	let { float = false } = $$props;
    	let { reversed = false } = $$props;
    	let { hoverable = true } = $$props;
    	let { disabled = false } = $$props;
    	let { pips = false } = $$props;
    	let { pipstep = undefined } = $$props;
    	let { all = undefined } = $$props;
    	let { first = undefined } = $$props;
    	let { last = undefined } = $$props;
    	let { rest = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { prefix = "" } = $$props;
    	let { suffix = "" } = $$props;
    	let { formatter = (v, i, p) => v } = $$props;
    	let { handleFormatter = formatter } = $$props;
    	let { precision = 2 } = $$props;
    	let { springValues = { stiffness: 0.15, damping: 0.4 } } = $$props;

    	// prepare dispatched events
    	const dispatch = createEventDispatcher();

    	// state management
    	let valueLength = 0;

    	let focus = false;
    	let handleActivated = false;
    	let handlePressed = false;
    	let keyboardActive = false;
    	let activeHandle = values.length - 1;
    	let startValue;
    	let previousValue;

    	// copy the initial values in to a spring function which
    	// will update every time the values array is modified
    	let springPositions;

    	/**
     * check if an element is a handle on the slider
     * @param {object} el dom object reference we want to check
     * @returns {boolean}
     **/
    	function targetIsHandle(el) {
    		const handles = slider.querySelectorAll(".handle");
    		const isHandle = Array.prototype.includes.call(handles, el);
    		const isChild = Array.prototype.some.call(handles, e => e.contains(el));
    		return isHandle || isChild;
    	}

    	/**
     * trim the values array based on whether the property
     * for 'range' is 'min', 'max', or truthy. This is because we
     * do not want more than one handle for a min/max range, and we do
     * not want more than two handles for a true range.
     * @param {array} values the input values for the rangeSlider
     * @return {array} the range array for creating a rangeSlider
     **/
    	function trimRange(values) {
    		if (range === "min" || range === "max") {
    			return values.slice(0, 1);
    		} else if (range) {
    			return values.slice(0, 2);
    		} else {
    			return values;
    		}
    	}

    	/**
     * helper to return the slider dimensions for finding
     * the closest handle to user interaction
     * @return {object} the range slider DOM client rect
     **/
    	function getSliderDimensions() {
    		return slider.getBoundingClientRect();
    	}

    	/**
     * helper to return closest handle to user interaction
     * @param {object} clientPos the client{x,y} positions to check against
     * @return {number} the index of the closest handle to clientPos
     **/
    	function getClosestHandle(clientPos) {
    		// first make sure we have the latest dimensions
    		// of the slider, as it may have changed size
    		const dims = getSliderDimensions();

    		// calculate the interaction position, percent and value
    		let handlePos = 0;

    		let handlePercent = 0;
    		let handleVal = 0;

    		if (vertical) {
    			handlePos = clientPos.clientY - dims.top;
    			handlePercent = handlePos / dims.height * 100;
    			handlePercent = reversed ? handlePercent : 100 - handlePercent;
    		} else {
    			handlePos = clientPos.clientX - dims.left;
    			handlePercent = handlePos / dims.width * 100;
    			handlePercent = reversed ? 100 - handlePercent : handlePercent;
    		}

    		handleVal = (max - min) / 100 * handlePercent + min;
    		let closest;

    		// if we have a range, and the handles are at the same
    		// position, we want a simple check if the interaction
    		// value is greater than return the second handle
    		if (range === true && values[0] === values[1]) {
    			if (handleVal > values[1]) {
    				return 1;
    			} else {
    				return 0;
    			}
    		} else // we sort the handles values, and return the first one closest
    		// to the interaction value
    		{
    			closest = values.indexOf([...values].sort((a, b) => Math.abs(handleVal - a) - Math.abs(handleVal - b))[0]); // if there are multiple handles, and not a range, then
    		}

    		return closest;
    	}

    	/**
     * take the interaction position on the slider, convert
     * it to a value on the range, and then send that value
     * through to the moveHandle() method to set the active
     * handle's position
     * @param {object} clientPos the client{x,y} of the interaction
     **/
    	function handleInteract(clientPos) {
    		// first make sure we have the latest dimensions
    		// of the slider, as it may have changed size
    		const dims = getSliderDimensions();

    		// calculate the interaction position, percent and value
    		let handlePos = 0;

    		let handlePercent = 0;
    		let handleVal = 0;

    		if (vertical) {
    			handlePos = clientPos.clientY - dims.top;
    			handlePercent = handlePos / dims.height * 100;
    			handlePercent = reversed ? handlePercent : 100 - handlePercent;
    		} else {
    			handlePos = clientPos.clientX - dims.left;
    			handlePercent = handlePos / dims.width * 100;
    			handlePercent = reversed ? 100 - handlePercent : handlePercent;
    		}

    		handleVal = (max - min) / 100 * handlePercent + min;

    		// move handle to the value
    		moveHandle(activeHandle, handleVal);
    	}

    	/**
     * move a handle to a specific value, respecting the clamp/align rules
     * @param {number} index the index of the handle we want to move
     * @param {number} value the value to move the handle to
     * @return {number} the value that was moved to (after alignment/clamping)
     **/
    	function moveHandle(index, value) {
    		// align & clamp the value so we're not doing extra
    		// calculation on an out-of-range value down below
    		value = alignValueToStep(value);

    		// use the active handle if handle index is not provided
    		if (typeof index === 'undefined') {
    			index = activeHandle;
    		}

    		// if this is a range slider perform special checks
    		if (range) {
    			// restrict the handles of a range-slider from
    			// going past one-another unless "pushy" is true
    			if (index === 0 && value > values[1]) {
    				if (pushy) {
    					$$invalidate(0, values[1] = value, values);
    				} else {
    					value = values[1];
    				}
    			} else if (index === 1 && value < values[0]) {
    				if (pushy) {
    					$$invalidate(0, values[0] = value, values);
    				} else {
    					value = values[0];
    				}
    			}
    		}

    		// if the value has changed, update it
    		if (values[index] !== value) {
    			$$invalidate(0, values[index] = value, values);
    		}

    		// fire the change event when the handle moves,
    		// and store the previous value for the next time
    		if (previousValue !== value) {
    			eChange();
    			previousValue = value;
    		}

    		return value;
    	}

    	/**
     * helper to find the beginning range value for use with css style
     * @param {array} values the input values for the rangeSlider
     * @return {number} the beginning of the range
     **/
    	function rangeStart(values) {
    		if (range === "min") {
    			return 0;
    		} else {
    			return values[0];
    		}
    	}

    	/**
     * helper to find the ending range value for use with css style
     * @param {array} values the input values for the rangeSlider
     * @return {number} the end of the range
     **/
    	function rangeEnd(values) {
    		if (range === "max") {
    			return 0;
    		} else if (range === "min") {
    			return 100 - values[0];
    		} else {
    			return 100 - values[1];
    		}
    	}

    	/**
     * when the user has unfocussed (blurred) from the
     * slider, deactivate all handles
     * @param {event} e the event from browser
     **/
    	function sliderBlurHandle(e) {
    		if (keyboardActive) {
    			$$invalidate(24, focus = false);
    			handleActivated = false;
    			$$invalidate(25, handlePressed = false);
    		}
    	}

    	/**
     * when the user focusses the handle of a slider
     * set it to be active
     * @param {event} e the event from browser
     **/
    	function sliderFocusHandle(e) {
    		if (!disabled) {
    			$$invalidate(26, activeHandle = index(e.target));
    			$$invalidate(24, focus = true);
    		}
    	}

    	/**
     * handle the keyboard accessible features by checking the
     * input type, and modfier key then moving handle by appropriate amount
     * @param {event} e the event from browser
     **/
    	function sliderKeydown(e) {
    		if (!disabled) {
    			const handle = index(e.target);
    			let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
    			let prevent = false;

    			switch (e.key) {
    				case "PageDown":
    					jump *= 10;
    				case "ArrowRight":
    				case "ArrowUp":
    					moveHandle(handle, values[handle] + jump);
    					prevent = true;
    					break;
    				case "PageUp":
    					jump *= 10;
    				case "ArrowLeft":
    				case "ArrowDown":
    					moveHandle(handle, values[handle] - jump);
    					prevent = true;
    					break;
    				case "Home":
    					moveHandle(handle, min);
    					prevent = true;
    					break;
    				case "End":
    					moveHandle(handle, max);
    					prevent = true;
    					break;
    			}

    			if (prevent) {
    				e.preventDefault();
    				e.stopPropagation();
    			}
    		}
    	}

    	/**
     * function to run when the user touches
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    	function sliderInteractStart(e) {
    		if (!disabled) {
    			const el = e.target;
    			const clientPos = normalisedClient(e);

    			// set the closest handle as active
    			$$invalidate(24, focus = true);

    			handleActivated = true;
    			$$invalidate(25, handlePressed = true);
    			$$invalidate(26, activeHandle = getClosestHandle(clientPos));

    			// fire the start event
    			startValue = previousValue = alignValueToStep(values[activeHandle]);

    			eStart();

    			// for touch devices we want the handle to instantly
    			// move to the position touched for more responsive feeling
    			if (e.type === "touchstart" && !el.matches(".pipVal")) {
    				handleInteract(clientPos);
    			}
    		}
    	}

    	/**
     * function to run when the user stops touching
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    	function sliderInteractEnd(e) {
    		// fire the stop event for touch devices
    		if (e.type === "touchend") {
    			eStop();
    		}

    		$$invalidate(25, handlePressed = false);
    	}

    	/**
     * unfocus the slider if the user clicked off of
     * it, somewhere else on the screen
     * @param {event} e the event from browser
     **/
    	function bodyInteractStart(e) {
    		keyboardActive = false;

    		if (focus && e.target !== slider && !slider.contains(e.target)) {
    			$$invalidate(24, focus = false);
    		}
    	}

    	/**
     * send the clientX through to handle the interaction
     * whenever the user moves acros screen while active
     * @param {event} e the event from browser
     **/
    	function bodyInteract(e) {
    		if (!disabled) {
    			if (handleActivated) {
    				handleInteract(normalisedClient(e));
    			}
    		}
    	}

    	/**
     * if user triggers mouseup on the body while
     * a handle is active (without moving) then we
     * trigger an interact event there
     * @param {event} e the event from browser
     **/
    	function bodyMouseUp(e) {
    		if (!disabled) {
    			const el = e.target;

    			// this only works if a handle is active, which can
    			// only happen if there was sliderInteractStart triggered
    			// on the slider, already
    			if (handleActivated) {
    				if (el === slider || slider.contains(el)) {
    					$$invalidate(24, focus = true);

    					// don't trigger interact if the target is a handle (no need) or
    					// if the target is a label (we want to move to that value from rangePips)
    					if (!targetIsHandle(el) && !el.matches(".pipVal")) {
    						handleInteract(normalisedClient(e));
    					}
    				}

    				// fire the stop event for mouse device
    				// when the body is triggered with an active handle
    				eStop();
    			}
    		}

    		handleActivated = false;
    		$$invalidate(25, handlePressed = false);
    	}

    	/**
     * if user triggers touchend on the body then we
     * defocus the slider completely
     * @param {event} e the event from browser
     **/
    	function bodyTouchEnd(e) {
    		handleActivated = false;
    		$$invalidate(25, handlePressed = false);
    	}

    	function bodyKeyDown(e) {
    		if (!disabled) {
    			if (e.target === slider || slider.contains(e.target)) {
    				keyboardActive = true;
    			}
    		}
    	}

    	function eStart() {
    		!disabled && dispatch("start", {
    			activeHandle,
    			value: startValue,
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	function eStop() {
    		!disabled && dispatch("stop", {
    			activeHandle,
    			startValue,
    			value: values[activeHandle],
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	function eChange() {
    		!disabled && dispatch("change", {
    			activeHandle,
    			startValue,
    			previousValue: typeof previousValue === "undefined"
    			? startValue
    			: previousValue,
    			value: values[activeHandle],
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	const writable_props = [
    		'slider',
    		'range',
    		'pushy',
    		'min',
    		'max',
    		'step',
    		'values',
    		'vertical',
    		'float',
    		'reversed',
    		'hoverable',
    		'disabled',
    		'pips',
    		'pipstep',
    		'all',
    		'first',
    		'last',
    		'rest',
    		'id',
    		'prefix',
    		'suffix',
    		'formatter',
    		'handleFormatter',
    		'precision',
    		'springValues'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<RangeSlider> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			slider = $$value;
    			$$invalidate(1, slider);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('slider' in $$props) $$invalidate(1, slider = $$props.slider);
    		if ('range' in $$props) $$invalidate(2, range = $$props.range);
    		if ('pushy' in $$props) $$invalidate(43, pushy = $$props.pushy);
    		if ('min' in $$props) $$invalidate(3, min = $$props.min);
    		if ('max' in $$props) $$invalidate(4, max = $$props.max);
    		if ('step' in $$props) $$invalidate(5, step = $$props.step);
    		if ('values' in $$props) $$invalidate(0, values = $$props.values);
    		if ('vertical' in $$props) $$invalidate(6, vertical = $$props.vertical);
    		if ('float' in $$props) $$invalidate(7, float = $$props.float);
    		if ('reversed' in $$props) $$invalidate(8, reversed = $$props.reversed);
    		if ('hoverable' in $$props) $$invalidate(9, hoverable = $$props.hoverable);
    		if ('disabled' in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ('pips' in $$props) $$invalidate(11, pips = $$props.pips);
    		if ('pipstep' in $$props) $$invalidate(12, pipstep = $$props.pipstep);
    		if ('all' in $$props) $$invalidate(13, all = $$props.all);
    		if ('first' in $$props) $$invalidate(14, first = $$props.first);
    		if ('last' in $$props) $$invalidate(15, last = $$props.last);
    		if ('rest' in $$props) $$invalidate(16, rest = $$props.rest);
    		if ('id' in $$props) $$invalidate(17, id = $$props.id);
    		if ('prefix' in $$props) $$invalidate(18, prefix = $$props.prefix);
    		if ('suffix' in $$props) $$invalidate(19, suffix = $$props.suffix);
    		if ('formatter' in $$props) $$invalidate(20, formatter = $$props.formatter);
    		if ('handleFormatter' in $$props) $$invalidate(21, handleFormatter = $$props.handleFormatter);
    		if ('precision' in $$props) $$invalidate(44, precision = $$props.precision);
    		if ('springValues' in $$props) $$invalidate(45, springValues = $$props.springValues);
    	};

    	$$self.$capture_state = () => ({
    		spring,
    		createEventDispatcher,
    		RangePips,
    		slider,
    		range,
    		pushy,
    		min,
    		max,
    		step,
    		values,
    		vertical,
    		float,
    		reversed,
    		hoverable,
    		disabled,
    		pips,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		id,
    		prefix,
    		suffix,
    		formatter,
    		handleFormatter,
    		precision,
    		springValues,
    		dispatch,
    		valueLength,
    		focus,
    		handleActivated,
    		handlePressed,
    		keyboardActive,
    		activeHandle,
    		startValue,
    		previousValue,
    		springPositions,
    		index,
    		normalisedClient,
    		targetIsHandle,
    		trimRange,
    		getSliderDimensions,
    		getClosestHandle,
    		handleInteract,
    		moveHandle,
    		rangeStart,
    		rangeEnd,
    		sliderBlurHandle,
    		sliderFocusHandle,
    		sliderKeydown,
    		sliderInteractStart,
    		sliderInteractEnd,
    		bodyInteractStart,
    		bodyInteract,
    		bodyMouseUp,
    		bodyTouchEnd,
    		bodyKeyDown,
    		eStart,
    		eStop,
    		eChange,
    		alignValueToStep,
    		orientationEnd,
    		orientationStart,
    		clampValue,
    		percentOf,
    		$springPositions
    	});

    	$$self.$inject_state = $$props => {
    		if ('slider' in $$props) $$invalidate(1, slider = $$props.slider);
    		if ('range' in $$props) $$invalidate(2, range = $$props.range);
    		if ('pushy' in $$props) $$invalidate(43, pushy = $$props.pushy);
    		if ('min' in $$props) $$invalidate(3, min = $$props.min);
    		if ('max' in $$props) $$invalidate(4, max = $$props.max);
    		if ('step' in $$props) $$invalidate(5, step = $$props.step);
    		if ('values' in $$props) $$invalidate(0, values = $$props.values);
    		if ('vertical' in $$props) $$invalidate(6, vertical = $$props.vertical);
    		if ('float' in $$props) $$invalidate(7, float = $$props.float);
    		if ('reversed' in $$props) $$invalidate(8, reversed = $$props.reversed);
    		if ('hoverable' in $$props) $$invalidate(9, hoverable = $$props.hoverable);
    		if ('disabled' in $$props) $$invalidate(10, disabled = $$props.disabled);
    		if ('pips' in $$props) $$invalidate(11, pips = $$props.pips);
    		if ('pipstep' in $$props) $$invalidate(12, pipstep = $$props.pipstep);
    		if ('all' in $$props) $$invalidate(13, all = $$props.all);
    		if ('first' in $$props) $$invalidate(14, first = $$props.first);
    		if ('last' in $$props) $$invalidate(15, last = $$props.last);
    		if ('rest' in $$props) $$invalidate(16, rest = $$props.rest);
    		if ('id' in $$props) $$invalidate(17, id = $$props.id);
    		if ('prefix' in $$props) $$invalidate(18, prefix = $$props.prefix);
    		if ('suffix' in $$props) $$invalidate(19, suffix = $$props.suffix);
    		if ('formatter' in $$props) $$invalidate(20, formatter = $$props.formatter);
    		if ('handleFormatter' in $$props) $$invalidate(21, handleFormatter = $$props.handleFormatter);
    		if ('precision' in $$props) $$invalidate(44, precision = $$props.precision);
    		if ('springValues' in $$props) $$invalidate(45, springValues = $$props.springValues);
    		if ('valueLength' in $$props) $$invalidate(46, valueLength = $$props.valueLength);
    		if ('focus' in $$props) $$invalidate(24, focus = $$props.focus);
    		if ('handleActivated' in $$props) handleActivated = $$props.handleActivated;
    		if ('handlePressed' in $$props) $$invalidate(25, handlePressed = $$props.handlePressed);
    		if ('keyboardActive' in $$props) keyboardActive = $$props.keyboardActive;
    		if ('activeHandle' in $$props) $$invalidate(26, activeHandle = $$props.activeHandle);
    		if ('startValue' in $$props) startValue = $$props.startValue;
    		if ('previousValue' in $$props) previousValue = $$props.previousValue;
    		if ('springPositions' in $$props) $$subscribe_springPositions($$invalidate(22, springPositions = $$props.springPositions));
    		if ('alignValueToStep' in $$props) $$invalidate(47, alignValueToStep = $$props.alignValueToStep);
    		if ('orientationEnd' in $$props) $$invalidate(27, orientationEnd = $$props.orientationEnd);
    		if ('orientationStart' in $$props) $$invalidate(28, orientationStart = $$props.orientationStart);
    		if ('clampValue' in $$props) $$invalidate(48, clampValue = $$props.clampValue);
    		if ('percentOf' in $$props) $$invalidate(23, percentOf = $$props.percentOf);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*min, max*/ 24) {
    			/**
     * clamp a value from the range so that it always
     * falls within the min/max values
     * @param {number} val the value to clamp
     * @return {number} the value after it's been clamped
     **/
    			$$invalidate(48, clampValue = function (val) {
    				// return the min/max if outside of that range
    				return val <= min ? min : val >= max ? max : val;
    			});
    		}

    		if ($$self.$$.dirty[0] & /*min, max, step*/ 56 | $$self.$$.dirty[1] & /*clampValue, precision*/ 139264) {
    			/**
     * align the value with the steps so that it
     * always sits on the closest (above/below) step
     * @param {number} val the value to align
     * @return {number} the value after it's been aligned
     **/
    			$$invalidate(47, alignValueToStep = function (val) {
    				// sanity check for performance
    				if (val <= min) {
    					return min;
    				} else if (val >= max) {
    					return max;
    				}

    				// find the middle-point between steps
    				// and see if the value is closer to the
    				// next step, or previous step
    				let remainder = (val - min) % step;

    				let aligned = val - remainder;

    				if (Math.abs(remainder) * 2 >= step) {
    					aligned += remainder > 0 ? step : -step;
    				}

    				// make sure the value is within acceptable limits
    				aligned = clampValue(aligned);

    				// make sure the returned value is set to the precision desired
    				// this is also because javascript often returns weird floats
    				// when dealing with odd numbers and percentages
    				return parseFloat(aligned.toFixed(precision));
    			});
    		}

    		if ($$self.$$.dirty[0] & /*min, max*/ 24 | $$self.$$.dirty[1] & /*precision*/ 8192) {
    			/**
     * take in a value, and then calculate that value's percentage
     * of the overall range (min-max);
     * @param {number} val the value we're getting percent for
     * @return {number} the percentage value
     **/
    			$$invalidate(23, percentOf = function (val) {
    				let perc = (val - min) / (max - min) * 100;

    				if (isNaN(perc) || perc <= 0) {
    					return 0;
    				} else if (perc >= 100) {
    					return 100;
    				} else {
    					return parseFloat(perc.toFixed(precision));
    				}
    			});
    		}

    		if ($$self.$$.dirty[0] & /*values, max, min, percentOf, springPositions*/ 12582937 | $$self.$$.dirty[1] & /*alignValueToStep, valueLength, springValues*/ 114688) {
    			{
    				// check that "values" is an array, or set it as array
    				// to prevent any errors in springs, or range trimming
    				if (!Array.isArray(values)) {
    					$$invalidate(0, values = [(max + min) / 2]);
    					console.error("'values' prop should be an Array (https://github.com/simeydotme/svelte-range-slider-pips#slider-props)");
    				}

    				// trim the range so it remains as a min/max (only 2 handles)
    				// and also align the handles to the steps
    				$$invalidate(0, values = trimRange(values.map(v => alignValueToStep(v))));

    				// check if the valueLength (length of values[]) has changed,
    				// because if so we need to re-seed the spring function with the
    				// new values array.
    				if (valueLength !== values.length) {
    					// set the initial spring values when the slider initialises,
    					// or when values array length has changed
    					$$subscribe_springPositions($$invalidate(22, springPositions = spring(values.map(v => percentOf(v)), springValues)));
    				} else {
    					// update the value of the spring function for animated handles
    					// whenever the values has updated
    					springPositions.set(values.map(v => percentOf(v)));
    				}

    				// set the valueLength for the next check
    				$$invalidate(46, valueLength = values.length);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*vertical, reversed*/ 320) {
    			/**
     * the orientation of the handles/pips based on the
     * input values of vertical and reversed
     **/
    			$$invalidate(28, orientationStart = vertical
    			? reversed ? 'top' : 'bottom'
    			: reversed ? 'right' : 'left');
    		}

    		if ($$self.$$.dirty[0] & /*vertical, reversed*/ 320) {
    			$$invalidate(27, orientationEnd = vertical
    			? reversed ? 'bottom' : 'top'
    			: reversed ? 'left' : 'right');
    		}
    	};

    	return [
    		values,
    		slider,
    		range,
    		min,
    		max,
    		step,
    		vertical,
    		float,
    		reversed,
    		hoverable,
    		disabled,
    		pips,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		id,
    		prefix,
    		suffix,
    		formatter,
    		handleFormatter,
    		springPositions,
    		percentOf,
    		focus,
    		handlePressed,
    		activeHandle,
    		orientationEnd,
    		orientationStart,
    		$springPositions,
    		moveHandle,
    		rangeStart,
    		rangeEnd,
    		sliderBlurHandle,
    		sliderFocusHandle,
    		sliderKeydown,
    		sliderInteractStart,
    		sliderInteractEnd,
    		bodyInteractStart,
    		bodyInteract,
    		bodyMouseUp,
    		bodyTouchEnd,
    		bodyKeyDown,
    		pushy,
    		precision,
    		springValues,
    		valueLength,
    		alignValueToStep,
    		clampValue,
    		div_binding
    	];
    }

    class RangeSlider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				slider: 1,
    				range: 2,
    				pushy: 43,
    				min: 3,
    				max: 4,
    				step: 5,
    				values: 0,
    				vertical: 6,
    				float: 7,
    				reversed: 8,
    				hoverable: 9,
    				disabled: 10,
    				pips: 11,
    				pipstep: 12,
    				all: 13,
    				first: 14,
    				last: 15,
    				rest: 16,
    				id: 17,
    				prefix: 18,
    				suffix: 19,
    				formatter: 20,
    				handleFormatter: 21,
    				precision: 44,
    				springValues: 45
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangeSlider",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*slider*/ ctx[1] === undefined && !('slider' in props)) {
    			console_1.warn("<RangeSlider> was created without expected prop 'slider'");
    		}
    	}

    	get slider() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slider(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get range() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pushy() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pushy(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get values() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get float() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set float(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reversed() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reversed(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoverable() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hoverable(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pips() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pips(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pipstep() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pipstep(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get first() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rest() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rest(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get suffix() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set suffix(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatter() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatter(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleFormatter() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleFormatter(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get precision() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set precision(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get springValues() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set springValues(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/settings/Style.svelte generated by Svelte v3.46.2 */
    const file$2 = "src/components/settings/Style.svelte";

    // (78:16) {#if buttonColorState === 'normal' }
    function create_if_block_1$1(ctx) {
    	let div0;
    	let h40;
    	let t1;
    	let input0;
    	let input0_value_value;
    	let t2;
    	let div1;
    	let h41;
    	let t4;
    	let input1;
    	let input1_value_value;
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
    			add_location(h40, file$2, 79, 24, 3062);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "buttonColor");
    			attr_dev(input0, "id", "buttonColor");
    			input0.value = input0_value_value = /*settings*/ ctx[0].buttonColor;
    			add_location(input0, file$2, 80, 24, 3128);
    			attr_dev(div0, "class", "normal-color-picker");
    			add_location(div0, file$2, 78, 20, 3004);
    			add_location(h41, file$2, 90, 24, 3543);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "buttonBgColor");
    			attr_dev(input1, "id", "buttonBgColor");
    			input1.value = input1_value_value = /*settings*/ ctx[0].buttonBgColor;
    			add_location(input1, file$2, 91, 24, 3614);
    			attr_dev(div1, "class", "normal-bgcolor-picker");
    			add_location(div1, file$2, 89, 20, 3483);
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
    					listen_dev(input0, "input", /*input_handler_2*/ ctx[8], false, false, false),
    					listen_dev(input1, "input", /*input_handler_3*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && input0_value_value !== (input0_value_value = /*settings*/ ctx[0].buttonColor)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*settings*/ 1 && input1_value_value !== (input1_value_value = /*settings*/ ctx[0].buttonBgColor)) {
    				prop_dev(input1, "value", input1_value_value);
    			}
    		},
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
    		source: "(78:16) {#if buttonColorState === 'normal' }",
    		ctx
    	});

    	return block;
    }

    // (101:16) {#if buttonColorState === 'hover' }
    function create_if_block$1(ctx) {
    	let div0;
    	let h40;
    	let t1;
    	let input0;
    	let input0_value_value;
    	let t2;
    	let div1;
    	let h41;
    	let t4;
    	let input1;
    	let input1_value_value;
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
    			add_location(h40, file$2, 102, 24, 4107);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "name", "buttonHoverColor");
    			attr_dev(input0, "id", "buttonHoverColor");
    			input0.value = input0_value_value = /*settings*/ ctx[0].buttonHoverColor;
    			add_location(input0, file$2, 103, 24, 4179);
    			attr_dev(div0, "class", "hover-color-picker");
    			add_location(div0, file$2, 101, 20, 4050);
    			add_location(h41, file$2, 113, 24, 4613);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "name", "buttonHoverBgColor");
    			attr_dev(input1, "id", "buttonHoverBgColor");
    			input1.value = input1_value_value = /*settings*/ ctx[0].buttonHoverBgColor;
    			add_location(input1, file$2, 114, 24, 4690);
    			attr_dev(div1, "class", "hover-bgcolor-picker");
    			add_location(div1, file$2, 112, 20, 4554);
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
    					listen_dev(input0, "input", /*input_handler_4*/ ctx[10], false, false, false),
    					listen_dev(input1, "input", /*input_handler_5*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settings*/ 1 && input0_value_value !== (input0_value_value = /*settings*/ ctx[0].buttonHoverColor)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*settings*/ 1 && input1_value_value !== (input1_value_value = /*settings*/ ctx[0].buttonHoverBgColor)) {
    				prop_dev(input1, "value", input1_value_value);
    			}
    		},
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
    		source: "(101:16) {#if buttonColorState === 'hover' }",
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
    	let input0_value_value;
    	let t2;
    	let rangeslider0;
    	let t3;
    	let div5;
    	let div3;
    	let h41;
    	let t5;
    	let div4;
    	let input1;
    	let input1_value_value;
    	let t6;
    	let rangeslider1;
    	let t7;
    	let div8;
    	let div6;
    	let h42;
    	let t9;
    	let div7;
    	let input2;
    	let input2_value_value;
    	let t10;
    	let div11;
    	let div9;
    	let h43;
    	let t12;
    	let div10;
    	let input3;
    	let input3_value_value;
    	let t13;
    	let div16;
    	let div12;
    	let h44;
    	let t15;
    	let div15;
    	let div13;
    	let button0;
    	let t17;
    	let button1;
    	let t19;
    	let div14;
    	let t20;
    	let t21;
    	let div19;
    	let div17;
    	let h45;
    	let t23;
    	let div18;
    	let input4;
    	let input4_value_value;
    	let current;
    	let mounted;
    	let dispose;

    	rangeslider0 = new RangeSlider({
    			props: {
    				values: [
    					/*settings*/ ctx[0].titleFontSize
    					? /*settings*/ ctx[0].titleFontSize
    					: 10
    				],
    				float: true,
    				min: 10,
    				max: 100
    			},
    			$$inline: true
    		});

    	rangeslider0.$on("stop", /*stop_handler*/ ctx[2]);

    	rangeslider1 = new RangeSlider({
    			props: {
    				values: [
    					/*settings*/ ctx[0].contentFontSize
    					? /*settings*/ ctx[0].contentFontSize
    					: 10
    				],
    				float: true,
    				min: 10,
    				max: 100
    			},
    			$$inline: true
    		});

    	rangeslider1.$on("stop", /*stop_handler_1*/ ctx[3]);
    	let if_block0 = /*buttonColorState*/ ctx[1] === 'normal' && create_if_block_1$1(ctx);
    	let if_block1 = /*buttonColorState*/ ctx[1] === 'hover' && create_if_block$1(ctx);

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
    			create_component(rangeslider0.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = `${translation('content-fontsize-label')}`;
    			t5 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t6 = space();
    			create_component(rangeslider1.$$.fragment);
    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			h42 = element("h4");
    			h42.textContent = `${translation('title-color-label')}`;
    			t9 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t10 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h43 = element("h4");
    			h43.textContent = `${translation('content-color-label')}`;
    			t12 = space();
    			div10 = element("div");
    			input3 = element("input");
    			t13 = space();
    			div16 = element("div");
    			div12 = element("div");
    			h44 = element("h4");
    			h44.textContent = `${translation('button-color-label')}`;
    			t15 = space();
    			div15 = element("div");
    			div13 = element("div");
    			button0 = element("button");
    			button0.textContent = `${translation('normal-label')}`;
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = `${translation('hover-label')}`;
    			t19 = space();
    			div14 = element("div");
    			if (if_block0) if_block0.c();
    			t20 = space();
    			if (if_block1) if_block1.c();
    			t21 = space();
    			div19 = element("div");
    			div17 = element("div");
    			h45 = element("h4");
    			h45.textContent = `${translation('popup-background-label')}`;
    			t23 = space();
    			div18 = element("div");
    			input4 = element("input");
    			add_location(h40, file$2, 10, 12, 290);
    			attr_dev(div0, "class", "discountx-settings-label");
    			add_location(div0, file$2, 9, 8, 239);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "titleFontSize");
    			attr_dev(input0, "id", "titleFontSize");
    			input0.value = input0_value_value = /*settings*/ ctx[0].titleFontSize;
    			add_location(input0, file$2, 13, 12, 417);
    			attr_dev(div1, "class", "discountx-settings-control");
    			add_location(div1, file$2, 12, 8, 364);
    			attr_dev(div2, "class", "discountx-settings-panel");
    			add_location(div2, file$2, 8, 4, 192);
    			add_location(h41, file$2, 24, 12, 882);
    			attr_dev(div3, "class", "discountx-settings-label");
    			add_location(div3, file$2, 23, 8, 831);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "contentFontSize");
    			attr_dev(input1, "id", "contentFontSize");
    			input1.value = input1_value_value = /*settings*/ ctx[0].contentFontSize;
    			add_location(input1, file$2, 27, 12, 1011);
    			attr_dev(div4, "class", "discountx-settings-control");
    			add_location(div4, file$2, 26, 8, 958);
    			attr_dev(div5, "class", "discountx-settings-panel");
    			add_location(div5, file$2, 22, 4, 784);
    			add_location(h42, file$2, 39, 12, 1490);
    			attr_dev(div6, "class", "discountx-settings-label");
    			add_location(div6, file$2, 38, 8, 1439);
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "name", "titleColor");
    			attr_dev(input2, "id", "titleColor");
    			input2.value = input2_value_value = /*settings*/ ctx[0].titleColor;
    			add_location(input2, file$2, 42, 12, 1614);
    			attr_dev(div7, "class", "discountx-settings-control");
    			add_location(div7, file$2, 41, 8, 1561);
    			attr_dev(div8, "class", "discountx-settings-panel");
    			add_location(div8, file$2, 37, 4, 1392);
    			add_location(h43, file$2, 54, 12, 1974);
    			attr_dev(div9, "class", "discountx-settings-label");
    			add_location(div9, file$2, 53, 8, 1923);
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "name", "contentColor");
    			attr_dev(input3, "id", "contentColor");
    			input3.value = input3_value_value = /*settings*/ ctx[0].contentColor;
    			add_location(input3, file$2, 57, 12, 2100);
    			attr_dev(div10, "class", "discountx-settings-control");
    			add_location(div10, file$2, 56, 8, 2047);
    			attr_dev(div11, "class", "discountx-settings-panel");
    			add_location(div11, file$2, 52, 4, 1876);
    			add_location(h44, file$2, 69, 12, 2468);
    			attr_dev(div12, "class", "discountx-settings-label");
    			add_location(div12, file$2, 68, 8, 2417);
    			attr_dev(button0, "class", "normal");
    			add_location(button0, file$2, 73, 16, 2633);
    			attr_dev(button1, "class", "hover");
    			add_location(button1, file$2, 74, 16, 2760);
    			attr_dev(div13, "class", "color-tab");
    			add_location(div13, file$2, 72, 12, 2593);
    			attr_dev(div14, "class", "color-tab-content");
    			add_location(div14, file$2, 76, 12, 2899);
    			attr_dev(div15, "class", "discountx-settings-control");
    			add_location(div15, file$2, 71, 8, 2540);
    			attr_dev(div16, "class", "discountx-settings-panel");
    			add_location(div16, file$2, 67, 4, 2370);
    			add_location(h45, file$2, 129, 12, 5222);
    			attr_dev(div17, "class", "discountx-settings-label");
    			add_location(div17, file$2, 128, 8, 5171);
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "name", "popupBgColor");
    			attr_dev(input4, "id", "popupBgColor");
    			input4.value = input4_value_value = /*settings*/ ctx[0].popupBgColor;
    			add_location(input4, file$2, 132, 12, 5351);
    			attr_dev(div18, "class", "discountx-settings-control");
    			add_location(div18, file$2, 131, 8, 5298);
    			attr_dev(div19, "class", "discountx-settings-panel");
    			add_location(div19, file$2, 127, 4, 5124);
    			add_location(div20, file$2, 7, 0, 182);
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
    			append_dev(div1, t2);
    			mount_component(rangeslider0, div1, null);
    			append_dev(div20, t3);
    			append_dev(div20, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h41);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			append_dev(div4, t6);
    			mount_component(rangeslider1, div4, null);
    			append_dev(div20, t7);
    			append_dev(div20, div8);
    			append_dev(div8, div6);
    			append_dev(div6, h42);
    			append_dev(div8, t9);
    			append_dev(div8, div7);
    			append_dev(div7, input2);
    			append_dev(div20, t10);
    			append_dev(div20, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h43);
    			append_dev(div11, t12);
    			append_dev(div11, div10);
    			append_dev(div10, input3);
    			append_dev(div20, t13);
    			append_dev(div20, div16);
    			append_dev(div16, div12);
    			append_dev(div12, h44);
    			append_dev(div16, t15);
    			append_dev(div16, div15);
    			append_dev(div15, div13);
    			append_dev(div13, button0);
    			append_dev(div13, t17);
    			append_dev(div13, button1);
    			append_dev(div15, t19);
    			append_dev(div15, div14);
    			if (if_block0) if_block0.m(div14, null);
    			append_dev(div14, t20);
    			if (if_block1) if_block1.m(div14, null);
    			append_dev(div20, t21);
    			append_dev(div20, div19);
    			append_dev(div19, div17);
    			append_dev(div17, h45);
    			append_dev(div19, t23);
    			append_dev(div19, div18);
    			append_dev(div18, input4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input2, "input", /*input_handler*/ ctx[4], false, false, false),
    					listen_dev(input3, "input", /*input_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false),
    					listen_dev(input4, "input", /*input_handler_6*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*settings*/ 1 && input0_value_value !== (input0_value_value = /*settings*/ ctx[0].titleFontSize)) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			const rangeslider0_changes = {};

    			if (dirty & /*settings*/ 1) rangeslider0_changes.values = [
    				/*settings*/ ctx[0].titleFontSize
    				? /*settings*/ ctx[0].titleFontSize
    				: 10
    			];

    			rangeslider0.$set(rangeslider0_changes);

    			if (!current || dirty & /*settings*/ 1 && input1_value_value !== (input1_value_value = /*settings*/ ctx[0].contentFontSize)) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			const rangeslider1_changes = {};

    			if (dirty & /*settings*/ 1) rangeslider1_changes.values = [
    				/*settings*/ ctx[0].contentFontSize
    				? /*settings*/ ctx[0].contentFontSize
    				: 10
    			];

    			rangeslider1.$set(rangeslider1_changes);

    			if (!current || dirty & /*settings*/ 1 && input2_value_value !== (input2_value_value = /*settings*/ ctx[0].titleColor)) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (!current || dirty & /*settings*/ 1 && input3_value_value !== (input3_value_value = /*settings*/ ctx[0].contentColor)) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (/*buttonColorState*/ ctx[1] === 'normal') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div14, t20);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*buttonColorState*/ ctx[1] === 'hover') {
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

    			if (!current || dirty & /*settings*/ 1 && input4_value_value !== (input4_value_value = /*settings*/ ctx[0].popupBgColor)) {
    				prop_dev(input4, "value", input4_value_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rangeslider0.$$.fragment, local);
    			transition_in(rangeslider1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rangeslider0.$$.fragment, local);
    			transition_out(rangeslider1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div20);
    			destroy_component(rangeslider0);
    			destroy_component(rangeslider1);
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
    	let { settings } = $$props;
    	const writable_props = ['settings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Style> was created with unknown prop '${key}'`);
    	});

    	const stop_handler = e => $$invalidate(0, settings.titleFontSize = e.detail.value, settings);
    	const stop_handler_1 = e => $$invalidate(0, settings.contentFontSize = e.detail.value, settings);
    	const input_handler = e => $$invalidate(0, settings.titleColor = e.target.value, settings);
    	const input_handler_1 = e => $$invalidate(0, settings.contentColor = e.target.value, settings);
    	const click_handler = () => $$invalidate(1, buttonColorState = 'normal');
    	const click_handler_1 = () => $$invalidate(1, buttonColorState = 'hover');
    	const input_handler_2 = e => $$invalidate(0, settings.buttonColor = e.target.value, settings);
    	const input_handler_3 = e => $$invalidate(0, settings.buttonBgColor = e.target.value, settings);
    	const input_handler_4 = e => $$invalidate(0, settings.buttonHoverColor = e.target.value, settings);
    	const input_handler_5 = e => $$invalidate(0, settings.buttonHoverBgColor = e.target.value, settings);
    	const input_handler_6 = e => $$invalidate(0, settings.popupBgColor = e.target.value, settings);

    	$$self.$$set = $$props => {
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	$$self.$capture_state = () => ({
    		RangeSlider,
    		translation,
    		buttonColorState,
    		settings
    	});

    	$$self.$inject_state = $$props => {
    		if ('buttonColorState' in $$props) $$invalidate(1, buttonColorState = $$props.buttonColorState);
    		if ('settings' in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		settings,
    		buttonColorState,
    		stop_handler,
    		stop_handler_1,
    		input_handler,
    		input_handler_1,
    		click_handler,
    		click_handler_1,
    		input_handler_2,
    		input_handler_3,
    		input_handler_4,
    		input_handler_5,
    		input_handler_6
    	];
    }

    class Style extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { settings: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Style",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*settings*/ ctx[0] === undefined && !('settings' in props)) {
    			console.warn("<Style> was created without expected prop 'settings'");
    		}
    	}

    	get settings() {
    		throw new Error("<Style>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settings(value) {
    		throw new Error("<Style>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Create.svelte generated by Svelte v3.46.2 */
    const file$1 = "src/components/Create.svelte";

    // (156:12) {#if currentTab === 'condition'}
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
    			add_location(div, file$1, 156, 16, 4467);
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
    		source: "(156:12) {#if currentTab === 'condition'}",
    		ctx
    	});

    	return block;
    }

    // (166:12) {#if currentTab === 'settings'}
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
    			add_location(div, file$1, 166, 16, 4842);
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
    		source: "(166:12) {#if currentTab === 'settings'}",
    		ctx
    	});

    	return block;
    }

    // (175:12) {#if currentTab === 'style'}
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
    			add_location(div, file$1, 175, 16, 5131);
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
    		source: "(175:12) {#if currentTab === 'style'}",
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
    	let span0;
    	let t10;
    	let span1;
    	let t12;
    	let span2;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let button1;
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
    			span0 = element("span");
    			span0.textContent = `${translation('condition-tab-label')}`;
    			t10 = space();
    			span1 = element("span");
    			span1.textContent = `${translation('settings-tab-label')}`;
    			t12 = space();
    			span2 = element("span");
    			span2.textContent = `${translation('style-tab-label')}`;
    			t14 = space();
    			if (if_block0) if_block0.c();
    			t15 = space();
    			if (if_block1) if_block1.c();
    			t16 = space();
    			if (if_block2) if_block2.c();
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = `${translation('save-button')}`;
    			add_location(h20, file$1, 131, 12, 3421);
    			add_location(p, file$1, 132, 12, 3476);
    			attr_dev(div0, "class", "discountx-rules-wrap-head");
    			add_location(div0, file$1, 130, 8, 3369);
    			add_location(h21, file$1, 136, 12, 3592);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "widefat regular-text");
    			attr_dev(input, "name", "name");
    			attr_dev(input, "id", "name");
    			add_location(input, file$1, 137, 12, 3646);
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file$1, 143, 12, 3824);
    			attr_dev(div1, "class", "discountx-popups-info");
    			add_location(div1, file$1, 135, 8, 3544);
    			attr_dev(div2, "class", "discountx-popups-box");
    			add_location(div2, file$1, 129, 4, 3326);
    			add_location(span0, file$1, 150, 16, 4066);
    			add_location(span1, file$1, 151, 16, 4180);
    			add_location(span2, file$1, 152, 16, 4292);
    			attr_dev(nav, "class", "discountx-tab-navbar svelte-1inllv2");
    			add_location(nav, file$1, 149, 12, 4015);
    			attr_dev(div3, "class", "discountx-rules-wrap-body");
    			add_location(div3, file$1, 148, 8, 3963);
    			attr_dev(button1, "type", "submit");
    			add_location(button1, file$1, 182, 8, 5291);
    			attr_dev(div4, "class", "discountx-popups-wrap");
    			add_location(div4, file$1, 147, 4, 3919);
    			add_location(form, file$1, 128, 0, 3279);
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
    			append_dev(nav, span0);
    			append_dev(nav, t10);
    			append_dev(nav, span1);
    			append_dev(nav, t12);
    			append_dev(nav, span2);
    			append_dev(div3, t14);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t15);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t16);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div4, t17);
    			append_dev(div4, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(span0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(span1, "click", /*click_handler_1*/ ctx[9], false, false, false),
    					listen_dev(span2, "click", /*click_handler_2*/ ctx[10], false, false, false),
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
    	let imageUrl = '';

    	onMount(async () => {
    		if (params?.id) {
    			const res = await fetch(getAjaxURL() + '?action=discountx_get_rule&id=' + params.id);
    			const json = await res.json();
    			result = json.data;
    			$$invalidate(0, settings = JSON.parse(result.settings));
    			$$invalidate(1, name = result.name);
    			imageUrl = result.image_url;
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
    			$$invalidate(0, settings.image_url = attachment.url, settings);
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
    		const savedSettings = JSON.parse(result.settings);
    		const newSettings = {};
    		const duplicates = ['action', 'nonce'];

    		for (let [key, value] of Array.from(data)) {
    			newSettings[key] = value;

    			if (!duplicates.includes(key)) {
    				data.delete(key);
    			}
    		}

    		const settingsToSave = { ...savedSettings, ...newSettings };
    		data.append('settings', JSON.stringify(settingsToSave));
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
    		imageUrl,
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
    		if ('imageUrl' in $$props) imageUrl = $$props.imageUrl;
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
