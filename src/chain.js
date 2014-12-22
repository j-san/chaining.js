
function Chain() {
    this.steps = [];
    this.promises = [];
    this.context = {};
    this.context.values = [];
}

Chain.prototype.next = function (step) {
    if (step instanceof Chain) {
        this.steps.push(step);
    } else {
        this.steps.push(new Step(step));
    }

    return this;
};

Chain.prototype.fork = function (func) {
    var fork = new Fork(func);
    this.steps.push(fork);

    return this;
};

Chain.prototype.process = Chain.prototype.start = function (initial) {
    if (initial) {
        this.context.values.push(initial);
    }

    return this.run(0, [initial] || []);
};

Chain.prototype.run = function (index, values) {
    var promise,
        self = this,
        step = this.steps[index];

    if (step instanceof Fork) {
        var chain = new Chain();
        chain.steps = this.steps.slice(index + 1);
        var promises = this.runFork(step, chain, values);
        promise = Promise.all(promises);

    } else if (step instanceof Chain) {
        promise = step.process(values);

    } else if (step) {
        // step instance
        promise = step.run(this.context, values);
    } else {
        promise = new Promise(function (resolve) {
            resolve(null);
        });
    }
    return promise.then(function (results) {
        if (!results) {
            results = [];
        }
        if (!(results instanceof Array)) {
            results = [results];
        }
        self.context.values.push(results);
        if (index + 1 < self.steps.length) {
            return self.run(index + 1, results);
        }
        return results;
    });
};


Chain.prototype.runFork = function (fork, chain, values) {
    var result, promises = [];
    fork.initIterator(this.context, values);
    do {
        result = fork.nextValue();
        if (result) {
            promises.push(chain.process(result));
        }
    } while(result);

    return promises;
};


function Fork(step) {
    this.step = step;
}

Fork.prototype.initIterator = function (context, values) {
    if (this.step instanceof Function) {
        this.iterator = this.step.apply(context, values);
    } else {
        this.iterator = this.step;
    }
    if(!this.iterator) {
        throw new Error('Invalid iterator for forking');
    }
};

Fork.prototype.nextValue = function () {
    if (this.iterator instanceof Function) {
        return this.iterator();
    }
    if ('next' in this.iterator) {
        return this.iterator.next();
    }
    if ('pop' in this.iterator) {
        return this.iterator.pop();
    }
};

function Step(step) {
    this.step = step;
}

Step.prototype.run = function (context, values) {
    var promise;

    if (this.step instanceof Function && this.step.length > values.length) {
        // step with arguments => giving a done callback
        promise = this.runWithCallback(context, values);
    } else if (this.step instanceof Function) {
        // step without arguments
        // assume it return a promise or a direct vaule
        promise = this.runWithReturn(context, values);
    } else {
        // step is a promise or a value
        promise = this.handleValue(this.step);
    }

    return promise;
};

Step.prototype.runWithCallback = function (context, values) {
    var self = this;
    return new Promise(function (resolve, reject) {
        values.push(function (err, result) {
            if (err instanceof Error) {
                reject(err);
            }
            resolve(err || result);
        });
        self.step.apply(context, values);
    });
};

Step.prototype.runWithReturn = function (context, values) {
    var result = this.step.apply(context, values);
    return this.handleValue(result);
};

Step.prototype.handleValue = function (value) {
    if (value instanceof Object && 'then' in value) {
        return value;
    } else {
        return new Promise(function(resolve) {
            resolve(value);
        });
    }
};

module.exports = Chain;