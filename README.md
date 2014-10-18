

Yet Another Javascript Chaining Library
---------------------------------------

Make chaining simple, easy and readable.

## Example:

```javascript

var chain = new Chain();

chain.next('do something',
function () {
    return promiseSomething();
});

chain.next('do something else',
function () {
    var stuff = this.values.pop();
    return promiseSomethingElse(stuff);
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

chain.next(function (filename) {
    return fs.get(filename);
});

chain.next(function (content) {
    return fs.put(content);
});

chain.process().then(function () {
    console.log('all files processed');
});

```

Statefull:

```javascript

var chain = new Chain(function (id) {

    this.id = id;
    return db.users.findOne({id: id});

}).next(function (user) {

    this.user = user;
    return db.roles.find({user: this.user});

}).next(function (roles) {

    if ('admin' in roles) {
        this.user.admin = true;
    }
    return this.user.save();
});

chain.process(['1', '2', '3']);

```


## API

### Constructor([fn])

Make a new chain. If fn is present, add fn to the sequence. (see `.next`)

### .next(fn)

Add `fn` to the sequence.
`fn` can retrun a promise or a value, `fn` is called after the previous `fn` succeed and its promise (if any) is fullfiled.
For each data to process, the previous returned or fullfiled value will give in parametre to `fn` and each `fn` will share the same context (this). The sequence will be suspend when `fn` raise an exception or when `fn` return an rejected promise.

### .fork()

Create a new chain and return it. When it will be processed, it will be in parrallel.

### .process(values)

If `values` is an array start the sequence for each values as the initial value in parallel.
If `values` is a vaule, use it as the initial value and start the sequence.