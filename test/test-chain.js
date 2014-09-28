// require('es6-promise').polyfill();
require('when/es6-shim/Promise');

var Chain = require('../src/chain');
var expect = require('chai').expect;

var delay = function (delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, delay);
    });
};

describe('Chain', function () {

    it('should run in sequence', function (done) {
        var chain = new Chain(function (value) {
            expect(value).to.equal(1);
            return value + 1;
        });

        chain.next(function (value) {
            expect(value).to.equal(2);
            return value + 1;
        });

        chain.next(function (value) {
            expect(value).to.equal(3);
            return value + 1;
        });

        chain.process(1).then(function () {
            done();
        });
    });

    it('should wait end of delay', function (done) {
        var count = 0;
        var start = Date.now(), duration = 0;
        var chain = new Chain(function () {
            count++;
            return delay(100);
        });

        chain.next(function () {
            count++;
            return delay(100);
        });

        chain.next(function () {
            count++;
            duration = Date.now() - start;
        });

        chain.process([true]).then(function () {
            expect(count).to.equal(3);
            expect(duration).to.gte(200);
            done();
        });
    });


    it('should be processable multiple times', function (done) {
        var count = 0;
        var chain = new Chain();

        chain.next(function () {
            count++;
        });

        Promise.all([
            chain.process(),
            chain.process(),
            chain.process()
        ]).then(function () {
            expect(count).to.equal(3);
            done();
        });
    });

    it('should be process for each item in argument', function (done) {
        var count = 0;
        var chain = new Chain();

        chain.next(function () {
            count++;
        });

        chain.process([1, 2, 3]).then(function () {
            expect(count).to.equal(3);
            done();
        });
    });

    xit('should keep same "this"', function (done) {
        var chain = new Chain(function () {
            this.foo = "bar";
        });

        chain.next(function () {
            expect(this.foo).to.equal("bar");
        });

        chain.process().then(function () {
            done();
        });
    });

    xit('should be forkable', function () {
        var chain = new Chain();

        chain.fork().next(function () {
        });

        chain.process().then(function () {
            done();
        });
    });

    xit('should wait for forks', function () {
    });

    xit('should fork inside fork', function () {
    });

    xit('should respect the max concurrent number', function () {
    });
});