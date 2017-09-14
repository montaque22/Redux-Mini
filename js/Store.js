import "babel-polyfill";

export const Store = (function () {
    const registeredReducers    = [];
    const onBefore              = {};
    const onComplete            = {};
    const CACHE_KEY             = 'redux-mini-cache';
    let cachedStore             = null;
    let enableCaching           = false;
    let shouldLoadFromCache     = false;


    /**
     * Creates a new data store. This is a singleton and will only create one store even if the constructor is
     * called more than once.
     * @example
     * // instantiates a new store prefilling it with {names:['kathyln']} and allows all data to be stored in
     * // session storage
     * let manager = new Store({names:['kathyln']}, {enableCaching: true});
     * @param initialData - data to initialize the store with
     * @param {store_prop} options - see Store Options for more information
     * @constructor
     */
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
        const {
                  actionKey = 'type',
                  enableCaching = enableCaching,
                  shouldLoadFromCache
              } = options;


        startup();



        /**
         * Add listeners to respond to changes in the data store.
         * @param { function } cb - runs whenever the changes to the data store are completed. This function
         * contains one parameter called store, which is a copy of the current store data
         */
        this.subscribe = (cb) =>{
            cb(data);
            subscribers.push(cb);
        };



        /**
         * Runs an action or an array of actions.
         * @param {Array.<Action> | Action} actions- runs the dispatch function or array of dispatch functions
         * for the given
         */
        this.dispatch = (actions)=>{
            reduce(actions);
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

                // Event from dispatch
                const event     = action[actionKey];

                // associated reducer for the given event
                const reducers  = registeredReducers[event] || [];

                // animation callback that runs before calculations
                const callbacks = onBefore[event] || [];

                // animation callback that runs after calculations
                const completed = onComplete[event] || [];

                // Store all the beforeEvents in the array first
                callbacks.forEach(cb =>{
                    allEvents.push(cb.bind(null, Object.assign({}, store), action));
                });

                // Run the reducers for the given event
                reducers.forEach(reducer =>{
                    // caches the result in the store copy
                    store[reducer.path] = reducer(store[reducer.path], action);
                });

                // Store all teh afterEvents in the array after calculations
                completed.forEach(cb => {
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

            if(enableCaching);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(commands))
        }

        function startup(){
            const cache = sessionStorage.getItem(CACHE_KEY);
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

        let reducers    = registeredReducers[eventName] || [];

        reducer.path = propertyPath;

        reducers.push(reducer);

        registeredReducers[eventName] =  reducers;
    };


    function callbackHelper(collection){

        return (event, cb) => {
            const callbacks = collection[event] || [];
            callbacks.push(cb)
            collection[event] = callbacks;
        };
    }

    /**
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
     * Callback function that will execute after the store is updated
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
    Store.onComplete = callbackHelper(onComplete);

    /**
     * Stores all of the actions in session storage.
     * @param {boolean} shouldEnableCaching -  if true, it activates the session storage.
     */
    Store.prototype.enableCaching = (shouldEnableCaching) =>{
        enableCaching = shouldEnableCaching;
    };

    /**
     * Uses the data from session storage to instantiate the store. Must have {enableCaching} set to true.
     * @param {boolean} loadFromCache - if true, the store will instantiate using the data stored from the session
     * storage
     */
    Store.shouldLoadFromCache = (loadFromCache) =>{
        shouldLoadFromCache = loadFromCache;
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
