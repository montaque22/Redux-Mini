import "babel-polyfill";

function deleteAllProps(obj){
    let keys = Object.keys(obj);
    for(let index in keys){
        const key = keys[index];
        delete obj[key]
    }
}
/**
 * @namespace Store
 * @description
 * Creates a new data store. This is a singleton and will only create one store even if the constructor is
 * called more than once.
 *
 * @example
 * // instantiates a new store prefilling it with {names:['kathyln']} and allows all data to be stored in
 * // session storage
 * let manager = new Store({names:['kathyln']}, {enableCaching: true});
 *
 * @param initialData - data to initialize the store with
 * @param {store_prop} options - see Store Options for more information
 * @constructor
 */
export const Store = (function () {
    const registeredReducers    = {};
    const onBefore              = {};
    const onAfter               = {};
    const CACHE_KEY             = 'redux-mini-cache';
    let cachedStore             = null;
    let enableCaching           = false;
    let shouldLoadFromCache     = false;

    function Store(initialData, options){
        options     = options || {};

        if(cachedStore)
            return cachedStore;

        let subscribers = options.subscribers || [];
        let data        = initialData || {};
        let commands    = [];
        let reduce      = _reduce.bind(this);
        let firstTime      = true;

        /**
         * @typedef {object} store_prop
         * @property {string} actionKey - the key that the reducer should look at to determine which reducer should
         * respond to the given action
         * @property {boolean} enableCaching - enables the use of session storage
         * @property {boolean} shouldLoadFromCache - loads the data from session storage on initialization
         */
        const { actionKey = 'type' } = options;


        startup();



        /**
         * Add listeners to respond to changes in the data store.
         * @example
         * ...
         * // instantiates a new store prefilling it with {names:['kathyln']} and allows all data to be stored in
         * // session storage
         * let manager = new Store({names:['kathyln']}, {enableCaching: true});
         *
         * // the function will fire when manager.dispatch is called
         * manager.subscribe(function(store){
         *  // store contains the final copy of the store after it updates
         *  console.log(store)
         * })
         * @param { function } cb - runs whenever the changes to the data store are completed. This function
         * contains one parameter called store, which is a copy of the current store data
         */
        this.subscribe = (cb) =>{
            if(typeof cb != 'function')
                throw new Error('the #subscribe function expected a function');

            cb(data);
            subscribers.push(cb);
        };



        /**
         * Runs an action or an array of actions.
         * @example
         * ...
         * // will trigger the reducer registered to 'ADD'
         * manager.dispatch({type:'ADD', name:'John'})
         *
         * // will trigger the reducer registered to 'ADD' and 'DELETE'
         * manager.dispatch([{type:'ADD', name:'Kim'}, {type:'DELETE', index:0}])
         *
         *
         * @param {Array.<Action> | Action} actions- runs the dispatch function or array of dispatch functions
         * for the given
         */
        this.dispatch = (actions)=>{
            if(Array.isArray(actions) || typeof actions === 'object')
                reduce(actions);
            else
                throw new Error('dispatch is expecting an array of actions or an action object')
        };

        /**
         * Returns all the actions that has been called.
         * @return {Array.<Action>}
         */
        this.getExecutedActions = () =>{
            return [...commands];
        };


        /*
            Reducer function:
            This will build the data store.
            This reducer will only run the reducers that are associated with the event
         */
        function _reduce(actions, done){

            // This is for all the callbacks
            const allEvents = [];

            // Create a copy of the store
            let store       = Object.assign({}, data);


            // Get array of actions
            actions = Array.isArray(actions) ? actions : [actions];

            // cycle through all the action
            actions.forEach(action =>{

                if(typeof action != 'object')
                    throw new Error('dispatch needs an Action Object or an array of Action Objects');

                // Event from dispatch
                const event     = action[actionKey];

                // associated reducer for the given event
                const reducers  = registeredReducers[event] || [];

                // animation callback that runs before calculations
                const before = onBefore[event] || [];

                // animation callback that runs after calculations
                const after = onAfter[event] || [];

                // Store all the beforeEvents in the array first
                before.forEach(cb =>{
                    allEvents.push(cb.bind(null, Object.assign({}, store), action));
                });

                // Run the reducers for the given event
                reducers.forEach(reducer =>{
                    // caches the result in the store copy
                    store[reducer.path] = reducer(store[reducer.path], action);
                });

                // Store all teh afterEvents in the array after calculations
                after.forEach(cb => {
                    allEvents.push(cb.bind(null, Object.assign({}, store), action));
                })

            });

            // Log the action
            logTheAction(actions);

            // Get the generator to run the callbacks
            const animationCallbackGenerator = animationGenerator(() =>{
                setTimeout(()=>{
                    // Go to the next callback from the generator
                    animationCallbackGenerator.next();
                },0)
            });

            // Start the process
            animationCallbackGenerator.next();

            // store the final data in the global (private) data object
            data = Object.assign({}, data, store);

            // Callback for all subscribers.
            // This can run before the animations are finished
            subscribers.forEach(subscriber => {
                subscriber(data)
            });

            // Internal callback for cleanup
            done && done(data);

            function* animationGenerator(next){
                for(const index in allEvents){
                    const cb = allEvents[index];
                    yield cb(next)
                }
            }

        }


        /**
         * @private
         * Keeps track of the events called.
         */
        function logTheAction(actions){
            // add the single actions array on firstTime = true
            // If the user is loading from cache then
            commands = [...commands, ...actions];

            if(enableCaching && sessionStorage);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(commands))
        }

        function startup(){
            const cache = !!sessionStorage && sessionStorage.getItem(CACHE_KEY);
            let data    = null;

            if(shouldLoadFromCache && cache)
                data    =JSON.parse(cache)

            else
                data    = {[actionKey]:'INIT'}

            reduce(data, () =>{
                firstTime = false;
            })
        }

        cachedStore = this;
    }


    /**
     * @static
     * @description
     * This will register a reducer. See http://redux.js.org/docs/basics/Reducers.html for details on Reducers.
     *
     * The given reducer will fire only when the eventName matches a dispatched action's type (or
     * actionKey).  The result from the reducer will be saved in the data store under the given propertyPath.
     * Reducers must not mutate the data and should treat data as though it is immutable.
     * The Reduce callback has 2 parameters:
     *
     * state - This is copy of the data at the propertyName given. It is advisable to give return a default state if
     * an action is not applicable.
     *
     * action - action objects hold the the data the reducer needs to organize and manipulate. Typically, Action objects
     * contain a key(type) of some kind so the reducer knows how to handle it (see here for more info on actions:
     * http://redux.js.org/docs/basics/Actions.html). The reducers often have switch statements that matches the
     * type and returns some value. However, Redux-Mini uses the event name given
     * to the register match the actions so the reducer will only run when its type matches the eventName given.
     *
     * @example
     * // State is initialized to {}
     * // The function will only run when action.type === 'bar'
     * Store.registerReducer('foo', 'bar', function (state = {}, action){
     *  // If action.data is empty, this function will still return an empty object.
     *  // As a result the store the store will look like this: {foo:{}} instead of {foo: undefined} or {}
     *  return Object.assign({}, state, action.data)
     * })
     *
     *
     *
     * @param {string} propertyPath - path in the data store to save the results from the reducer
     * @param {string} eventName -  Custom(unique) event to associate with the action
     * @param {reducer} reducer - callback function that returns a non-mutated result.
     */
    Store.registerReducer = (propertyPath, eventName, reducer)=>{

        if(!propertyPath || !eventName || typeof reducer != 'function')
            throw new Error('Parameters expect a string, string, function');

        let reducers    = registeredReducers[eventName] || [];

        reducer.path = propertyPath;

        reducers.push(reducer);

        registeredReducers[eventName] =  reducers;
    };


    function callbackHelper(collection){

        return (event, cb) => {
            if(typeof event != "string" || typeof cb != 'function')
                throw new Error('Expecting string, function');

            const callbacks = collection[event] || [];
            callbacks.push(cb)
            collection[event] = callbacks;
        };
    }

    /**
     * @static
     * Returns the reducers
     * @return {Array}
     */
    Store.getRegisteredReducers = () => {
        return registeredReducers;
    }

    /**
     * @static
     * @desc
     * Callback function that will execute before the store is updated.
     * The first parameter is the name of the event that should trigger the callback.
     * The second parameter is a the callback function you want to trigger when the event is fired.
     * The callback has has three parameters:
     *
     * Store - which is a copy of the store data at that point.
     *
     * Action - the action object used to dispatch the event
     *
     * Next - alerts the callback that it is complete and can run the next animation.
     *
     * You must call next() to run the other callbacks, otherwise the other functions will hang.
     * @param {string} event - name of event to attach the callback
     * @param {function} cb - Callback Function that should be used to run animations.
     */
    Store.onBefore = callbackHelper(onBefore);

    /**
     * @static
     * @description
     * Callback function that will execute after the store is updated
     * The first parameter is the name of the event that should trigger the callback.
     * The second parameter is a the callback function you want to trigger when the event is fired.
     * The callback has has three parameters:
     *
     * Store - which is a copy of the store data at that point.
     * Action - the action object used to dispatch the event
     * Next - alerts the callback that it is complete and can run the next animation.
     *
     * You must call next() to run the other callbacks, otherwise the other functions will hang.
     * @param {string} event - name of event to attach the callback
     * @param {function} cb - Callback Function that should be used to run animations.
     */
    Store.onAfter = callbackHelper(onAfter);

    /**
     * Stores all of the actions in session storage.
     * @param {boolean} shouldEnableCaching -  if true, it activates the session storage.
     */
    Store.prototype.enableCaching = (shouldEnableCaching) =>{
        enableCaching = !!shouldEnableCaching;
    };

    /**
     * Returns whether or not caching ability is enabled
     * @return {boolean}
     */
    Store.prototype.isCachingEnabled = () => {
        return enableCaching;
    };

    /**
     * @static
     * Returns whether or not the Store will load from cache
     * @return {boolean}
     */
    Store.willLoadFromCache = () => {
        return shouldLoadFromCache;
    }
    /**
     * @static
     * @desc
     * Uses the data from session storage to instantiate the store. Must have {enableCaching} set to true.
     * @param {boolean} loadFromCache - if true, the store will instantiate using the data stored from the session
     * storage
     */
    Store.shouldLoadFromCache = (loadFromCache) =>{
        shouldLoadFromCache = !!loadFromCache;
    };


    Store.clearAll = () =>{
        cachedStore             = null;
        enableCaching           = false;
        shouldLoadFromCache     = false;
        deleteAllProps(registeredReducers);
        deleteAllProps(onBefore);
        deleteAllProps(onAfter)

    };

    return Store;
})();


/**
 * @typedef {object} Action
 * @description
 * This is the redux action object. It contains a some kind of key for the reducer to know what operation to run
 * against the action object holds.
 * To understand more about Actions, visit this link: http://redux.js.org/docs/basics/Actions.html
 * @property {string} type - used to determine which reducer to run.
 * @property ...props - any other number of properties to send to the reducer.
 */

