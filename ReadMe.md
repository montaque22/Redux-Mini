
# Redux-Mini

Redux-Mini is a light weight Redux framework. It allows you to manage the state of your data utilizing the same
principles found on the Redux website.
To learn more about Redux and its principles visit: http://redux.js.org/docs/introduction/CoreConcepts.html
 
See below for a Quick example of how Redux-Mini works,
otherwise check out the main.js file:
 
~~~~
// Add reducers to the Store
// When the reducer runs it will add the return value to the internal store under the key of the first
// argument, which is <people>.
// This will only run when the action's type property matches the 2 argument in this function, which is 'ADD'
// Make sure you return the default state on the case when there is nothing in the state. In this example we init
// to an array
  Store.registerReducer('people', 'ADD',(state = [], actions) => {
      // The actions come from the dispatcher.
      // Since this only runs when it matches you do not have to check the action's type or create switch statements
      return [...state, actions.myData];
  });
 
  Store.registerReducer('people', 'DELETE',(state = [], actions) => {
      return [...state].filter((action, index) =>{
          return index != actions.index;
      });
  });
 
 
 // Create the store manager. You will be able to push changes to the store via Actions
 const manager  = new Store();
 
 
 // add a listener to the store to get updates every time a change is made.
 manager.subscribe(function(store){
      console.log(store)
  })
 
 
  // sends a message to the store to run the given event ('ADD' or 'DELETE') using myData
  // What you send is entirely up to you as well as what you want the event name (type) to be.
  manager.dispatch({type:'ADD', myData: {name: 'jerry'}});
  manager.dispatch({type:'ADD', myData: {name: 'michael'}});
  manager.dispatch({type:'ADD', myData: {name: 'kayla'}});
  manager.dispatch({type:'DELETE', index:1});
  // Ending value will be
  { people: [{name: 'jerry'}, {name: 'kayla'}] }
 ~~~~

### Table of Contents

-   [Action](#action)
-   [reducer](#reducer)
-   [onComplete](#oncomplete)
-   [Store](#store)
    -   [subscribe](#subscribe)
    -   [dispatch](#dispatch)
    -   [getExecutedActions](#getexecutedactions)
    -   [enableCaching](#enablecaching)
    -   [registerReducer](#registerreducer)
    -   [onBefore](#onbefore)
    -   [onComplete](#oncomplete-1)
    -   [shouldLoadFromCache](#shouldloadfromcache)
-   [store_prop](#store_prop)

## Action

This is the redux action object. It contains a some kind of key for the reducer to know what operation to run
against the action object holds.
To understand more about Actions, visit this link: <http://redux.js.org/docs/basics/Actions.html>

Type: [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

**Properties**

-   `type` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** used to determine which reducer to run.

## reducer

Callback: Reducers are used organize data into the store.
See <http://redux.js.org/docs/basics/Reducers.html> for details on Reducers.

Type: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)

**Parameters**

-   `state` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** contains the data from the store at the event the callback was registered for.
-   `action` **[Action](#action)** contains the data and the event type (actionKey) used to add to the store.

## onComplete

Callback Function: Callback should be used to run animations. You must call next() to run the other callbacks (if
there are any) otherwise the other functions will hang.

Type: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)

**Parameters**

-   `store` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** contains the data from the store at the event the callback was registered for.
-   `action` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The action that is associated with the dispatch
-   `next` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** function to run the next callback

## Store

Creates a new data store. This is a singleton and will only create one store even if the constructor is
called more than once.

**Parameters**

-   `initialData`  data to initialize the store with
-   `options` **[store_prop](#store_prop)** see Store Options for more information

### subscribe

Add listeners to respond to changes in the data store.

**Parameters**

-   `cb` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** runs whenever the changes to the data store are completed. This function
    contains one parameter called store, which is a copy of the current store data

### dispatch

Runs an action or an array of actions.

**Parameters**

-   `actions`  
-   `actions-null` **([Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Action](#action)> | [Action](#action))** runs the dispatch function or array of dispatch functions
    for the given

### getExecutedActions

Returns all the actions that has been called.

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Action](#action)>** 

### enableCaching

Stores all of the actions in session storage.

**Parameters**

-   `shouldEnableCaching` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  if true, it activates the session storage.

### registerReducer

This will register a reducer. See <http://redux.js.org/docs/basics/Reducers.html> for details on Reducers.

The given reducer will fire only when the eventName matches a dispatched action type (or
actionKey).  The result from the reducer will be saved in the data store under the given propertyPath.
Note: Reducers still cannot mutate the data. Data should be immutable.

**Parameters**

-   `propertyPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path in the data store to save the results from the reducer
-   `eventName` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)**  Custom(unique) event to associate with the action
-   `reducer` **[reducer](#reducer)** callback function that returns a non-mutated result.

### onBefore

Callback function that will execute before the store is updated

**Parameters**

-   `event` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of event to attach the callback
-   `cb` **[onComplete](#oncomplete)** name of event to attach the callback

### onComplete

Callback function that will execute after the store is updated

**Parameters**

-   `event` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of event to attach the callback
-   `cb` **[onComplete](#oncomplete)** name of event to attach the callback

### shouldLoadFromCache

Uses the data from session storage to instantiate the store. Must have {enableCaching} set to true.

**Parameters**

-   `loadFromCache` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true, the store will instantiate using the data stored from the session
    storage

## store_prop

Type: [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

**Properties**

-   `actionKey` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the key that the reducer should look at to determine which reducer should
    respond to the given action
-   `enableCaching` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** enables the use of session storage
-   `shouldLoadFromCache` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** loads the data from session storage on initialization
