/* jshint expr: true */

require('when/es6-shim/Promise');

var Chain = require('../src/chain');
var expect = require('chai').expect;


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
            return promiseDelay(100);
        });

        chain.next(function () {
            duration = Date.now() - start;
            expect(duration).to.be.closeTo(100, 30);

            return promiseDelay(100);
        });

        chain.process().then(function () {
            duration = Date.now() - start;
            expect(duration).to.be.closeTo(200, 30);

            done();
        });
    });


    it('should be processable multiple times', function (done) {
        var count = 0;

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

    it('should process even without next', function (done) {
        chain.process().then(function () {
            done();
        });
    });

    it('should be chainnable', function (done) {
        var count = 0;
        var otherChain = new Chain();

        otherChain.next(function () {
            count++;
            expect(count).to.equal(2);
        });

        chain.next(function () {
            count++;
            expect(count).to.equal(1);
        });

        chain.next(otherChain);

        chain.next(function () {
            count++;
            expect(count).to.equal(3);
        });

        chain.process().then(function () {
            done();
        });
    });

    describe('fork', function () {
        it('should fork with next function', function (done) {
            // chain.fork(function* () {
            //     yeld 1;
            //     yeld 2;
            //     yeld 3;
            // });
            var values = [1, 2, 3];
            chain.fork(function () {
                return function next() {
                    return values.pop();
                };
            });

            chain.process().then(function () {
                expect(values).to.be.empty;
                done();
            });
        });

        it('should fork for array in param', function (done) {
            var count = 0;

            chain.fork([1, 2]);
            chain.next(function () {
                count++;
            });

            chain.process().then(function () {
                expect(count).to.equal(2);
                done();
            });
        });

        it('should fork for callback returning an array', function (done) {
            var count = 0;

            chain.fork(function () {
                return [1, 2];
            });
            chain.next(function () {
                count++;
            });

            chain.process().then(function () {
                expect(count).to.equal(2);
                done();
            });
        });

        it('should call next in parallel', function (done) {
            var chain = new Chain(),
                count = 0, start = Date.now();

            chain.fork([1, 2]);
            chain.next(function () {
                count++;
                return promiseDelay(100);
            });


            chain.process().then(function () {
                var duration = Date.now() - start;
                expect(duration).to.be.closeTo(100, 30);
                expect(count).to.equal(2);
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
            chain.next(promiseDelay(100));
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
                return promiseDelay(100);
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

        it('should store the resolved value', function (done) {
            chain.next(function (done) {
                done('hello');
            });
            chain.next(function () {
                expect(this.values.pop()).to.equal('hello');
            });
            chain.process().then(done);
        });

        describe('callback', function () {
            it('should polyfill node style on success', function (done) {
                chain.next(nodeStyleFunc);

                chain.next(function () {
                    expect(this.values.pop()).to.equal('success');
                });
                chain.process().then(function () {
                    done();
                });
            });

            it('should polyfill node style on error', function (done) {
                chain.next(nodeStyleFail);
                chain.process().catch(function () {
                    done();
                });
            });

            it('should polyfill browser style', function (done) {
                chain.next(browserStyleFunc);
                chain.process().then(function () {
                    done();
                });
            });

            it('should polyfill browser error', function (done) {
                chain.next(browserStyleFail);
                chain.process().catch(function () {
                    done();
                });
            });

            it('should promise resolved', function (done) {
                chain.next(promiseFunc);
                chain.process().then(done);
            });

            it('should promise rejected', function (done) {
                chain.next(promiseFail);
                chain.process().catch(function () {
                    done();
                });
            });
        });
    });

});

function promiseDelay(delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, delay);
    });
}

function promiseFunc() {
    return new Promise(function (resolve) {
        resolve();
    });
}

function promiseFail() {
    return new Promise(function (resolve, reject) {
        reject();
    });
}

function nodeStyleFunc(callback) {
    callback(null, 'success');
}

function nodeStyleFail(callback) {
    callback(new Error('Fail'));
}

function browserStyleFunc(callback) {
    callback('success');
}

function browserStyleFail(callback, fallback) {
    fallback(new Error('Fail'));
}
