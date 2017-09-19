var assert = require('assert');
var Store =  require('../dist/redux.min').Store;

describe('#registerReducer', function() {
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
            assert.doesNotThrow(() => {
                Store.registerReducer('foo', 'bar', function(){})
            },Error)

        });

    });

    context('When eventName exists', function(){

        it('should run without incident', function() {
            assert.doesNotThrow(() => {
                Store.registerReducer('foo', 'bar', function(){console.log(0)});
                Store.registerReducer('foo', 'bar', function(){console.log(1)})
            },Error)

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
