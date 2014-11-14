

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
- Complient with diverse deferred method


## Example:

```javascript

var chain = new Chain();

chain.next(promiseForStuff());

chain.next(function () {
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

chain.fork([
    'file1.json',
    'file2.json',
    'file3.json'
]).next(function (done) {
    var file = this.values.pop();
    return fs.readFile(file, done);
});

chain.process().then(function () {
    console.log('all files processed');
});
```

```
var installer = new Chain();

installer.fork(function () {
    this.manager = new Manager();

    this.depndencies = this.initial;
    return this.depndencies;
})
.next(function () {
    this.package = this.values.pop();

    return this.parent.manager.preinstall(this.package);
}).next(function () {
    return this.parent.manager.install(this.package);
}).next(function () {
    return this.parent.manager.postinstall(this.package);
}).next(function () {
    return installRequirejs();
});

exports.install = function (packages) {

    installer.process(packages).then(function () {
        console.log('All installation completed');
    }, function (err) {
        console.error('Somethings went wrong...');
        console.error(err.trace);
    }, function (dep) {
        console.log('Install ended for', dep.name);
    });
};


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
- an async function that take a `done` callback
- a value
- a promise


### .fork(iterator)

Fork and continue the sequence in parallel, the number of parallel sequence depend of the number of object contained in iterator.

### .process(value)

Start the sequence of steps with value as initial value.
All steps are called in sequence after the previous step succeed and will share the same context (this). The sequence will be suspend when `step` raise an exception or when `step` return an rejected promise.
