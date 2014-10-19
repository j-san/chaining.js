require('when/es6-shim/Promise');

var Chain = require('../src/chain');
var expect = require('chai').expect;

var delay = function (delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, delay);
    });
};

describe('Chain', function () {
    var chain;
    beforeEach(function() {
        chain = new Chain();
    });

    it('should run steps in sequence', function (done) {
        chain.next(function () {
            var value = this.values.pop();
            expect(value).to.equal(1);
            return value + 1;
        });

        chain.next(function () {
            var value = this.values.pop();
            expect(value).to.equal(2);
            return value + 1;
        });

        chain.next(function () {
            var value = this.values.pop();
            expect(value).to.equal(3);
            return value + 1;
        });

        chain.process(1).then(function (value) {
            expect(value).to.equal(4);
            done();
        });
    });

    it('should wait resolution of promise', function (done) {
        var start = Date.now(),
            duration = 0;

        chain.next(function () {
            return delay(100);
        });

        chain.next(function () {
            duration = Date.now() - start;
            expect(duration).to.be.closeTo(100, 30);

            return delay(100);
        });

        chain.process().then(function () {
            duration = Date.now() - start;
            expect(duration).to.be.closeTo(200, 30);

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

    it('should keep have a context with `this`', function (done) {
        chain.next(function () {
            this.foo = "bar";
        });

        chain.next(function () {
            expect(this.foo).to.equal("bar");
        });

        chain.process().then(function () {
            done();
        });
    });

    describe('fork', function () {
        it.skip('should exec in parallel for generator', function (done) {
            var chain = new Chain();

            // chain.fork(function* () {
            //     yeld 1;
            //     yeld 2;
            //     yeld 3;
            // });

            chain.process().then(function () {
                done();
            });
        });

        it.skip('should exec in parallel', function (done) {
            var chain = new Chain();

            chain.fork().next(function () {
            });

            chain.process().then(function () {
                done();
            });
        });

        it.skip('should be process for each item in array', function (done) {
            var count = 0, items = [1, 2, 3];

            chain.next(function () {
                expect(this.values.pop()).to.equal(items[count]);

                count++;
            });

            chain.process([1, 2, 3]).then(function () {
                expect(count).to.equal(3);
                done();
            });
        });

        it.skip('should wait for all forks', function () {
        });

        it.skip('should fork inside fork', function () {
        });
    });

    it.skip('should respect the max concurrent number', function () {
        chain.limitConcurent(2);
    });

    describe('error', function() {
        it.skip('should have trace', function () {
        });

        it.skip('should contains step name', function () {
        });
    });


    describe('step', function() {
        it('should handle value', function (done) {
            chain.next(1);
            chain.process().then(function (value) {
                expect(value).to.equal(1);
                done();
            });
        });

        it('should handle promise', function (done) {
            var start = Date.now();
            chain.next(delay(100));
            chain.process().then(function () {
                expect(Date.now() - start).to.be.closeTo(100, 30);
                done();
            });
        });

        it('should handle function returning value', function (done) {
            chain.next(function () {
                return 1;
            });
            chain.process().then(function (value) {
                expect(value).to.equal(1);
                done();
            });
        });

        it('should handle function returning promise', function (done) {
            var start = Date.now();
            chain.next(function () {
                return delay(100);
            });
            chain.process().then(function () {
                expect(Date.now() - start).to.be.closeTo(100, 30);
                done();
            });
        });

        it('should handle function with callback', function (done) {
            chain.next(function (done) {
                setTimeout(function () {
                    done(123);
                }, 100);
            });
            chain.process().then(function (value) {
                expect(value).to.be.equal(123);
                done();
            });
        });

        it('should be named', function () {
            chain.next(function doingSomethings() {});

            expect(chain.steps[0].name).to.equal('doingSomethings');
        });

        it.skip('should store the resolved value', function () {
            chain.next(function (done) {
                done('hello');
            });
            chain.next(function (done) {
                this.values.pop();
                done();
            });
            chain.process();
        });

        it.skip('should be runnable from index', function () {
            chain.next(function (done) {
                done('hello');
            });
        });

        describe('callback', function () {
            it.skip('should polyfill node style on success', function () {
                chain.next(function node () {
                });
            });
            it.skip('should polyfill node style on error', function () {
                chain.next(function node () {
                });
            });

            it.skip('should polyfill browser style', function () {
                chain.next(function browser () {
                });
            });
            it.skip('should ', function () {
            });
        });
    });

});