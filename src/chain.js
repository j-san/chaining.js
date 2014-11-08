
function Chain() {
    this.steps = [];
    this.promises = [];
    this.context = {};
    this.context.values = [];
}

Chain.prototype.next = function (step) {
    this.steps.push(step);
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

    return this.run(0);
};

Chain.prototype.run = function (index) {
    var promise,
        self = this,
        step = this.steps[index];

    if (step instanceof Fork) {
        var chain = new Chain();
        chain.steps = this.steps.slice(index + 1);
        var promises = this.runFork(step, chain);
        return Promise.all(promises);
    } else {
        if (step instanceof Chain) {
            promise = step.process();
        } else if (step instanceof Function && step.length) {
            // step with arguments => giving a done callback
            promise = this.runWithCallback(step);
        } else if (step instanceof Function) {
            // step without arguments
            // assume it return a promise or a direct vaule
            promise = this.runWithReturn(step);
        } else {
            // step is a promise or a value
            promise = this.handleValue(step);
        }

        return promise.then(function (result) {
            self.context.values.push(result);
            if (index + 1 < self.steps.length) {
                return self.run(index + 1);
            }
            return result;
        });
    }
};

Chain.prototype.runWithCallback = function (step) {
    var self = this;
    return new Promise(function (resolve, reject) {
        step.call(self.context, function (err, value) {
            if (err instanceof Error) {
                reject(err);
            }
            resolve(err || value);
        }, reject);
    });
};

Chain.prototype.runWithReturn = function (step) {
    var result = step.call(this.context);
    return this.handleValue(result);
};

Chain.prototype.handleValue = function (value) {
    if (value instanceof Object && 'then' in value) {
        return value;
    } else {
        return new Promise(function(resolve) {
            resolve(value);
        });
    }
};

Chain.prototype.runFork = function (fork, chain) {
    var value, promises = [];
    fork.initIterator(this.context);
    do {
        value = fork.nextValue();
        if (value) {
            promises.push(chain.process(value));
        }
    } while(value);

    return promises;
};


function Fork (step) {
    this.step = step;
}

Fork.prototype.initIterator = function (context) {
    if (this.step instanceof Function) {
        this.iterator = this.step.call(context);
    } else {
        this.iterator = this.step;
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

module.exports = Chain;