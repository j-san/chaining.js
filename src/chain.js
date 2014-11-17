
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

    return this.run(0, initial);
};

Chain.prototype.run = function (index, value) {
    var promise,
        self = this,
        step = this.steps[index];

    if (step instanceof Fork) {
        var chain = new Chain();
        chain.steps = this.steps.slice(index + 1);
        var promises = this.runFork(step, chain, value);
        promise = Promise.all(promises);

    } else if (step instanceof Chain) {
        promise = step.process(value);

    } else if (step) {
        // step instance
        promise = step.run(this.context, value).then(function (result) {
            self.context.values.push(result);
            if (index + 1 < self.steps.length) {
                return self.run(index + 1, result);
            }
            return result;
        });
    } else {
        promise = new Promise(function (resolve) {
            resolve(null);
        });
    }
    return promise;
};


Chain.prototype.runFork = function (fork, chain, value) {
    var result, promises = [];
    fork.initIterator(this.context, value);
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

Fork.prototype.initIterator = function (context, value) {
    if (this.step instanceof Function) {
        this.iterator = this.step.call(context, value);
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

Step.prototype.run = function (context, value) {
    var promise;

    if (this.step instanceof Function && this.step.length > 1) {
        // step with arguments => giving a done callback
        promise = this.runWithCallback(context, value);
    } else if (this.step instanceof Function) {
        // step without arguments
        // assume it return a promise or a direct vaule
        promise = this.runWithReturn(context, value);
    } else {
        // step is a promise or a value
        promise = this.handleValue(this.step);
    }

    return promise;
};

Step.prototype.runWithCallback = function (context, value) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.step.call(context, value, function (err, result) {
            if (err instanceof Error) {
                reject(err);
            }
            resolve(err || result);
        }, reject);
    });
};

Step.prototype.runWithReturn = function (context, value) {
    var result = this.step.call(context, value);
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