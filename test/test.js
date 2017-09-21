var assert      = require('assert');
var chai        = require('chai');
var sinonChai   = require('sinon-chai');
var sinon       = require('sinon');
var Store       = require('../dist/redux.min').Store;
var should      = chai.should();
chai.use(sinonChai);

describe('#registerReducer', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When propertyPath is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.registerReducer(null, 'test', function(){})
            }, Error)
        });

    });

    context('When eventName is is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.registerReducer('foo', null, function(){})
            }, Error)
        });

    });

    context('When eventName does not exist', function(){

        it('should run without incident', function() {
            Store.registerReducer('foo', 'bar', function(){});
            let reducers =  Store.getRegisteredReducers();
            assert.equal(Object.keys(reducers).length, 1)
            assert.equal(reducers.bar.length, 1)
        });

    });

    context('When eventName exists', function(){


        it('should run without incident', function() {
            Store.registerReducer('foo', 'bar', function(){console.log(0)});
            Store.registerReducer('foo', 'bar', function(){console.log(1)});

            let reducers =  Store.getRegisteredReducers();
            assert.equal(Object.keys(reducers).length, 1);
            assert.equal(reducers.bar.length, 2)
        });

    });

    context('When reducer is not a function', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.registerReducer('foo', 'bar', 'foobar')
            }, Error)
        });

    })
});

describe('#onBefore', function() {
    beforeEach(() =>{
        Store.clearAll();
    });
    context('When event is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.onBefore(null, function(){})
            }, Error)
        });

    });

    context('When function is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.onBefore('foo')
            }, Error)
        });

    });

    context('When eventName does not exist', function(){

        it('should run without incident', function() {
            assert.doesNotThrow(() => {
                Store.onBefore('foo', function(){})
            },Error)

        });

    });

    context('When eventName exists', function(){

        it('should run without incident', function() {
            assert.doesNotThrow(() => {
                Store.onBefore('foo', function(){});
                Store.onBefore('foo', function(){});
            },Error)

        });

    });

});

describe('#onAfter', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When event is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.onAfter(null, function(){})
            }, Error)
        });

    });

    context('When function is undefined', function(){

        it('should throw an error', function() {
            assert.throws(() =>{
                Store.onAfter('foo')
            }, Error)
        });

    });

    context('When eventName does not exist', function(){

        it('should run without incident', function() {
            assert.doesNotThrow(() => {
                Store.onAfter('foo', function(){})
            },Error)

        });

    });

    context('When eventName exists', function(){

        it('should run without incident', function() {
            assert.doesNotThrow(() => {
                Store.onAfter('foo', function(){});
                Store.onAfter('foo', function(){});
            },Error)

        });

    });

});

describe('#enableCaching', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When store is given an empty object', function(){


        it('should store truthy', function() {
            let store = new Store();
            store.enableCaching({});
            assert.equal(store.isCachingEnabled(), true)
        });

    });

});

describe('#shouldLoadFromCache', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When store is given an empty object', function(){

        it('then willLoadFromCache will be  truthy', function() {
            Store.shouldLoadFromCache({});
            assert.equal(Store.willLoadFromCache(), true)
        });

    });

});

describe('#getExecutedActions', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When the store initialize', function(){

        it('it will return an array with one command', function() {
            let store = new Store();
            let commands = store.getExecutedActions();
            assert.equal(commands.length, 1)
        });

    });

    context('When an action {type:"Add"} is dispatched', function(){

        it('then the last item in the array should be {type:"Add"}', function() {
            let store = new Store();
            let action = {type:"Add"};
            store.dispatch(action);
            let commands = store.getExecutedActions();
            assert.equal(commands.pop(), action)
        });

    });

});

describe('#subscribe', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When a non-function is passed in', function(){

        it('it should return an error', function() {
            let store = new Store();
            assert.throws(() =>{
                store.subscribe()
            }, Error)
        });

    });

    context('When a function is passed in', function(){

        it('it should run the function returning the store as a parameter', function() {
            let data = {road:'House'};
            let store = new Store(data);
            store.subscribe((_data) =>{
                assert.deepEqual(_data, data)
            })
        });

        it('it should run when dispatch is called', function() {
            let data = {road:'House'};
            let store = new Store(data);
            let subscriber = sinon.spy();
            store.subscribe(subscriber);
            store.dispatch({type:'calling'});
            subscriber.should.have.been.calledTwice;
        });

    });

});

describe('#dispatch', function() {

    beforeEach(() =>{
        Store.clearAll();
    });

    context('When no action was given', function(){

        it('it should return an error', function() {
            let store = new Store();
            assert.throws(() =>{
                store.dispatch()
            }, Error)
        });

    });

    context('When number is given', function(){

        it('it should return an error', function() {
            let store = new Store();
            assert.throws(() =>{
                store.dispatch(3)
            }, Error)
        });

    });

    context('When an empty object is given', function(){

        it('the data should be unaltered', function() {
            let data = { rods:'axel' };
            let store = new Store(data);
            let spy     = sinon.spy();
            store.subscribe(spy);
            store.dispatch({});
            spy.should.have.been.calledWith(data);
        });

    });

    context('When an action that does not exist is given', function(){

        it('the data should be unaltered', function() {
            let data = { rods:'axel' };
            let store = new Store(data);
            let spy     = sinon.spy();

            Store.registerReducer('rods', 'Add', (state = 'rigid', data) => {
                return state + data.me
            });
            store.subscribe(spy);
            store.dispatch({type:'delete', me:'miss'});
            spy.should.not.have.been.calledWith({rods:'axelmiss'});
        });

    });

    context('When mixed array of existing and non-existing actions are given', function(){

        it('the data should reflect', function() {
            let data = { rods:'axel' };
            let store = new Store(data);
            let spy     = sinon.spy();

            Store.registerReducer('rods', 'Add', (state = 'rigid', data) => {
                return state + data.me
            });
            store.subscribe(spy);
            store.dispatch([{type:'delete', me:'miss'}, {type:'Add', me:'folly'}]);
            spy.should.not.have.been.calledWith({rods:'axelmiss'});
            spy.should.have.been.calledWith({rods:'axelfolly'});
        });

    });

    context('When given an array of non-functions', function(){

        it('it should throw an error', function() {
            let data = { rods:'axel' };
            let store = new Store(data);
            let spy     = sinon.spy();
            let dispatch = store.dispatch.bind(null, [1, true, 'three'])

            Store.registerReducer('rods', 'Add', (state = 'rigid', data) => {
                return state + data.me
            });

            store.subscribe(spy);

            should.Throw(dispatch)
        });

    });

});
