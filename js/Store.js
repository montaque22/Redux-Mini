import "babel-polyfill";

/**
 * @author Michael Montaque
 * @version 0.1
 * @classdesc
 * Redux-Mini is a light weight Redux framework. It allows you to manage the state of your data utilizing the same
 * principles found on the Redux website.
 * To learn more about Redux and its principles visit: http://redux.js.org/docs/introduction/CoreConcepts.html
 *
 * See below for a Quick example of how Redux-Mini works,
 * otherwise check out the main.js file:
 *
 * @example
 * // Add reducers to the Store
 * // When the reducer runs it will add the return value to the internal store under the key of the first
 * // argument, which is <people>.
 * // This will only run when the action's type property matches the 2 argument in this function, which is 'ADD'
 * // Make sure you return the default state on the case when there is nothing in the state. In this example we init
 * // to an array
 *   Store.registerReducer('people', 'ADD',(state = [], actions) => {
 *       // The actions come from the dispatcher.
 *       // Since this only runs when it matches you do not have to check the action's type or create switch statements
 *       return [...state, actions.myData];
 *   });
 *
 *   Store.registerReducer(''people', 'DELETE',(state = [], actions) => {
 *       return [...state].filter((action, index) =>{
 *           return index != actions.index;
 *       });
 *   });
 *
 *
 *  // Create the store manager. You will be able to push changes to the store via Actions
 *  const manager  = new Store();
 *
 *
 *  // add a listener to the store to get updates every time a change is made.
 *  manager.subscribe(function(store){
 *       console.log(store)
 *   })
 *
 *
 *   // sends a message to the store to run the given event ('ADD' or 'DELETE') using myData
 *   // What you send is entirely up to you as well as what you want the event name (type) to be.
 *   manager.dispatch({type:'ADD', myData: {name: 'jerry'}});
 *   manager.dispatch({type:'ADD', myData: {name: 'michael'}});
 *   manager.dispatch({type:'ADD', myData: {name: 'kayla'}});
 *   manager.dispatch({type:'DELETE', index:1});
 *   // Ending value will be
 *   { people: [{name: 'jerry'}, {name: 'kayla'}] }
 */

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
     *
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
         * @param { update_callback } cb - runs whenever the changes to the data store are completed
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
     * The given reducer will fire only when the eventName matches a dispatched action type (or
     * actionKey).  The result from the reducer will be saved in the data store under the given propertyPath.
     * Note: Reducers still cannot mutate the data. Data should be immutable.
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
     * Callback function that will execute before the store is updated
     * @param {string} event - name of event to attach the callback
     * @param {onComplete} cb - name of event to attach the callback
     */
    Store.onBefore = callbackHelper(onBefore);

    /**
     * Callback function that will execute after the store is updated
     * @param {string} event - name of event to attach the callback
     * @param {onComplete} cb - name of event to attach the callback
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
 * @function
 * @callback onComplete
 * @description
 * Callback: Callback should be used to run animations. You must call next() to run the other callbacks (if there are any)
 * otherwise the other functions will hang.
 * @param {object} store - contains the data from the store at the event the callback was registered for.
 * @param {object} action - The action that is associated with the dispatch
 * @param {function} next - function to run the next callback
 */

/**
 * @function
 * @callback update_callback
 * @description
 * Callback: Use this to listen to store update changes
 * @param {object} store - contains the data from the store at the event the callback was registered for.
 */

/**
 * @function
 * @callback reducer
 * @description
 * Callback: Reducers are used organize data into the store. See http://redux.js.org/docs/basics/Reducers.html for details on Reducers.
 * @param {object} state - contains the data from the store at the event the callback was registered for.
 * @param {Action} action - contains the data and the event type (actionKey) used to add to the store.
 */

/**
 * @example
 * @typedef {object} Action
 * @property {string} type - used to determine which reducer to run.
 * @property {any} props - any other number of properties to send to the reducer.
 */
