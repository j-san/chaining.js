
function Chain(fn) {
    this.sequence = [];
    if (fn) {
        this.sequence.push(fn);
    }
}

Chain.prototype.next = function (fn) {
    this.sequence.push(fn);
};

Chain.prototype.fork = function () {
    var chain = new Chain();
    this.sequence.push(chain);
    return chain;
};

Chain.prototype.process = function (values, maxConcurrent) {
    maxConcurrent = maxConcurrent || 1;
    var promises = [];
    var sequence = this.sequence;

    function run (index, value) {
        if (index >= sequence.length) {
            return;
        }
        var fn = sequence[index];
        var self = this;
        if (fn instanceof Chain) {
            // fork...
            fn.process(value);
        } else {
            return Promise.resolve(value).then(fn).then(function (result) {
                return run(index + 1, result);
            });
        }
    }

    if (values instanceof Array) {
        while (values.length) {
            promises.push(run(0, values.shift()));
        }
    } else {
        promises.push(run(0, values));
    }
    return Promise.all(promises);
};

module.exports = Chain;