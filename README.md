

[![Build Status](http://img.shields.io/travis/j-san/chaining.js/master.svg)](https://travis-ci.org/j-san/chaining.js)
[![Coverage](http://img.shields.io/codecov/c/github/j-san/chaining.js.svg)](https://codecov.io/github/j-san/chaining.js)
[![Version](http://img.shields.io/npm/v/chaining.svg)](https://www.npmjs.org/package/chaining)
[![Dependencies](http://img.shields.io/david/j-san/chaining.js.svg)](https://david-dm.org/j-san/chaining.js#info=dependencies)
[![Dev Dependencies](http://img.shields.io/david/dev/j-san/chaining.js.svg)](https://david-dm.org/j-san/chaining.js#info=devDependencies)
[![Coverage Graph](https://codecov.io/github/j-san/chaining.js/branch.svg?branch=master)](https://codecov.io/github/j-san/chaining.js)


Yet Another Javascript Chaining Library
---------------------------------------

Make callbacks simple, easy and readable.


Goals
-----

- Strong error handling, [keep Zalgo chained](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
- Deadly simple
- Complient with common deferred methods (node convention, promise standard and browser style)

Install
-------

`npm install chaining`

You also need a es6 Promise library:

With `when`

```
require('when/es6-shim/Promise');
```

With `Q`

```
var q = require('q');
global.Promise = function (callback) {
    var deferred = q.defer();
    callback(
        deferred.resolve.bind(deferred),
        deferred.reject.bind(deferred),
        eferred.progress.bind(deferred)
    )
    return deferred.promise;
}
global.Promise.all = q.all;
```

## Examples:

```javascript

var chain = new Chain();

chain.next(promiseForStuff());

chain.next(function (stuff) {
    return promiseSomethingElse(stuff);
});

chain.process().then(function () {
    console.log('end of process');
});

```

With parallelism and data flow:

```javascript

var chain = new Chain();

chain.next(function () {
    this.json = {};
}).fork([
    'file1.json',
    'file2.json',
    'file3.json'
]).next(function (file, done) {
    fs.readFile(file, done);
]).next(function (content) {
    _.extend(this.json, JSON.pase(content));
});

chain.process().then(function () {
    console.log('all files processed');
});
```

```javascript

var chain = new Chain(function (id) {
    return db.users.findOne({id: id});
})
.next(function (user) {
    this.user = user;
    return db.roles.find({user: this.user});

})
.next(function (roles) {
    this.roles = roles;

    if ('admin' in roles) {
        this.user.admin = true;
    }
    return this.user.save();
});

chain.process(123);
```

```
var manager = new PackageManager();

var installer = new Chain();


installer.fork(function (depndencies) {
    return this.depndencies;
})
.next(function (package) {
    this.package = package;
    return manager.preinstall(this.package);
})
.next(function () {
    return manager.install(this.package);
})
.next(function () {
    return manager.postinstall(this.package);
});

exports.install = function (depndencies) {

    installer.process(depndencies).then(function () {
        console.log('All installation completed');
    }, function (err) {
        console.error('Somethings went wrong...');
    }, function (dep) {
        console.log('Install ended for', dep.name);
    });
};
```

## API

### Constructor()

Make a new chain.

### .next(step)

Add a step to the sequence.
`step` can be:
- a function that return a value
- a function that retrun a promise
- an async function that take a `done` callback
- a value
- a promise (non sens ? promise can be resolve only once...)


### .fork(iterable)

Fork and continue the sequence in parallel for each iterable item.

### .join()

Wait for all forks and continue as a sigle sequence.

### .process(value)

Start the sequence of steps with `value` as initial value.
All steps are called in sequence after the previous step succeed and will share the same context (`this`).
The sequence will be suspend when `step` raise an exception or when `step` return an rejected promise.


TODO
----

- Run tests different promise implementation
- Make it works in browser and publish on Bower
- Limit concurent forks
- Progress for forks or steps ?
- Accept a node style callback for process
- Test fork with generators
- Error handling
