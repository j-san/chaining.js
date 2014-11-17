
var Chain = require('../src/chain'),
    Mocha = require('mocha'),
    mocha = new Mocha(),
    runner;

mocha.files = ['test/test-chain.js'];


require('../src/es6/when');
var chain = new Chain();

chain.next(function (initial, done) {
    console.log('=== Testing with When ===');
    runner = mocha.run(done);
});

chain.next(function (value, done) {
    console.log('=== Then with Q ===');
    require('../src/es6/q');

    runner = mocha.run(done);
});

chain.process().then(function () {
    console.log('=== Everything OK ===');
});