

[![Build Status](http://img.shields.io/travis/j-san/chaining.js/master.svg)](https://travis-ci.org/j-san/chaining.js)
[![Coverage](http://img.shields.io/codecov/c/github/j-san/chaining.js.svg)](https://codecov.io/github/j-san/chaining.js)
[![Version](http://img.shields.io/npm/v/chaining.svg)](https://www.npmjs.org/package/chaining)
[![Dependencies](http://img.shields.io/david/j-san/chaining.js.svg)](https://david-dm.org/j-san/chaining.js#info=dependencies)
[![Dev Dependencies](http://img.shields.io/david/dev/j-san/chaining.js.svg)](https://david-dm.org/j-san/chaining.js#info=devDependencies)
Yet Another Javascript Chaining Library
---------------------------------------

Make callbacks simple, easy and readable.

Goals
-----

- Error reporting and debugging
- Deadly simple
- Complient with different methode


## Example:

```javascript

var chain = new Chain();

chain.next(function doSomething() {
    return promiseSomething();
});

chain.next(function doSomethingElse() {
    this.stuff = this.values.pop();
    return promiseSomethingElse(this.stuff);
});

chain.process().then(function () {
    console.log('end of process');
});

```

With parallelism and data flow:

```javascript

var chain = new Chain();

chain.fork(function () {
    return [
        'file1.json',
        'file2.json',
        'file3.json'
    ];
}).next(function () {
    var file = this.values.pop();
    return doStuffInParallel(file);
});

chain.process().then(function () {
    console.log('all files processed');
});

```

Statefull:

```javascript

var chain = new Chain(function () {

    this.id = this.values.pop();
    return db.users.findOne({id: id});

}).next(function () {

    this.user = this.values.pop();
    return db.roles.find({user: this.user});

}).next(function () {
    this.roles = this.values.pop();

    if ('admin' in roles) {
        this.user.admin = true;
    }
    return this.user.save();
});

chain.process(1);

```


## API

### Constructor()

Make a new chain.

### .next(step)

Add a step to the sequence.
`step` can be:
- a function that return a value
- a function that retrun a promise
- a function that take a `done` callback in paramettre and call it
- a value
- a promise

All steps are called in sequence after the previous step succeed and will share the same context (this). The sequence will be suspend when `step` raise an exception or when `step` return an rejected promise.

### .fork()

Create a new chain and return it. When it will be processed, it will be in parrallel.

### .process(value)

Start the sequence of steps with value as initial value.
