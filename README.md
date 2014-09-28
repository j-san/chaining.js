

Yet Another Promise Library
---------------------------

ya-chain use ES6 Promise (not included) and try to make chaining simple, easy and readable.

## Example:

´´´javascript

var chain = new Chain();

chain.fork().next(function () {
    return doStuffInParallel();
});

chain.next(function (filename) {
    return doSomethingsElse();
});

chain.process().then(function () {
    console.log('all are processed');
});

´´´


´´´javascript

var chain = new Chain();

chain.fork().next(function () {
    return doStuff();
});

chain.next(function (filename) {
    return fs.get(filename);
});

chain.next(JSON.parse);

chain.next(function (content) {
    return fs.put(content);
});

chain.concurent(2).process([
    'file1.json',
    'file2.json',
    'file3.json'
]).then(function () {
    console.log('all files processed');
});

´´´


## API

### Constructor([fn])

Make a new chain. If fn is present, add fn to the sequence. (see ´.next´)

### .next(fn)

Add fn to the sequence.

### .fork()

Create a new chain and return it. When it will be processed, it will be in parrallel.

### .process(values)

If ´values´ is an array start the sequence for each values as the initial value in parallel.
If ´values´ is a vaule, use it as the initial value and start the sequence.