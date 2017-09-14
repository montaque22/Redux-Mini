
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

-   [Store](#store)
    -   [subscribe](#subscribe)
    -   [dispatch](#dispatch)
    -   [getExecutedActions](#getexecutedactions)
    -   [enableCaching](#enablecaching)
-   [Action](#action)
-   [store_prop](#store_prop)
-   [Store.registerReducer](#storeregisterreducer)
-   [Store.onBefore](#storeonbefore)
-   [Store.onAfter](#storeonafter)
-   [Store.shouldLoadFromCache](#storeshouldloadfromcache)

## Store

**Parameters**

-   `initialData`  data to initialize the store with
-   `options` **[store_prop](#store_prop)** see Store Options for more information

**Examples**

```javascript
// instantiates a new store prefilling it with {names:['kathyln']} and allows all data to be stored in
// session storage
let manager = new Store({names:['kathyln']}, {enableCaching: true});
```

### subscribe

Add listeners to respond to changes in the data store.

**Parameters**

-   `cb` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** runs whenever the changes to the data store are completed. This function
    contains one parameter called store, which is a copy of the current store data

**Examples**

```javascript
...
// instantiates a new store prefilling it with {names:['kathyln']} and allows all data to be stored in
// session storage
let manager = new Store({names:['kathyln']}, {enableCaching: true});

// the function will fire when manager.dispatch is called
manager.subscribe(function(store){
 // store contains the final copy of the store after it updates
 console.log(store)
})
```

### dispatch

Runs an action or an array of actions.

**Parameters**

-   `actions`  
-   `actions-null` **([Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Action](#action)> | [Action](#action))** runs the dispatch function or array of dispatch functions
    for the given

**Examples**

```javascript
...
// will trigger the reducer registered to 'ADD'
manager.dispatch({type:'ADD', name:'John'})

// will trigger the reducer registered to 'ADD' and 'DELETE'
manager.dispatch([{type:'ADD', name:'Kim'}, {type:'DELETE', index:0}])
```

### getExecutedActions

Returns all the actions that has been called.

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Action](#action)>** 

### enableCaching

Stores all of the actions in session storage.

**Parameters**

-   `shouldEnableCaching` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**  if true, it activates the session storage.

## Action

This is the redux action object. It contains a some kind of key for the reducer to know what operation to run
against the action object holds.
To understand more about Actions, visit this link: <http://redux.js.org/docs/basics/Actions.html>

Type: [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

**Properties**

-   `type` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** used to determine which reducer to run.

## store_prop

Type: [object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

**Properties**

-   `actionKey` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the key that the reducer should look at to determine which reducer should
    respond to the given action
-   `enableCaching` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** enables the use of session storage
-   `shouldLoadFromCache` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** loads the data from session storage on initialization

## Store.registerReducer

This will register a reducer. See <http://redux.js.org/docs/basics/Reducers.html> for details on Reducers.

The given reducer will fire only when the eventName matches a dispatched action's type (or
actionKey).  The result from the reducer will be saved in the data store under the given propertyPath.
Reducers must not mutate the data and should treat data as though it is immutable.
The Reduce callback has 2 parameters:

state - This is copy of the data at the propertyName given. It is advisable to give return a default state if
an action is not applicable.

action - action objects hold the the data the reducer needs to organize and manipulate. Typically, Action objects
contain a key(type) of some kind so the reducer knows how to handle it (see here for more info on actions:
<http://redux.js.org/docs/basics/Actions.html>). The reducers often have switch statements that matches the
type and returns some value. However, Redux-Mini uses the event name given
to the register match the actions so the reducer will only run when its type matches the eventName given.

**Parameters**

-   `propertyPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path in the data store to save the results from the reducer
-   `eventName` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)**  Custom(unique) event to associate with the action
-   `reducer` **reducer** callback function that returns a non-mutated result.

**Examples**

```javascript
// State is initialized to {}
// The function will only run when action.type === 'bar'
Store.registerReducer('foo', 'bar', function (state = {}, action){
 // If action.data is empty, this function will still return an empty object.
 // As a result the store the store will look like this: {foo:{}} instead of {foo: undefined} or {}
 return Object.assign({}, state, action.data)
})
```

## Store.onBefore

Callback function that will execute before the store is updated.
The first parameter is the name of the event that should trigger the callback.
The second parameter is a the callback function you want to trigger when the event is fired.
The callback has has three parameters:

Store - which is a copy of the store data at that point.

Action - the action object used to dispatch the event

Next - alerts the callback that it is complete and can run the next animation.

You must call next() to run the other callbacks, otherwise the other functions will hang.

**Parameters**

-   `event` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of event to attach the callback
-   `cb` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Callback Function that should be used to run animations.

## Store.onAfter

Callback function that will execute after the store is updated
The first parameter is the name of the event that should trigger the callback.
The second parameter is a the callback function you want to trigger when the event is fired.
The callback has has three parameters:

Store - which is a copy of the store data at that point.

Action - the action object used to dispatch the event

Next - alerts the callback that it is complete and can run the next animation.

You must call next() to run the other callbacks, otherwise the other functions will hang.

**Parameters**

-   `event` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of event to attach the callback
-   `cb` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** Callback Function that should be used to run animations.

## Store.shouldLoadFromCache

Uses the data from session storage to instantiate the store. Must have {enableCaching} set to true.

**Parameters**

-   `loadFromCache` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if true, the store will instantiate using the data stored from the session
    storage
