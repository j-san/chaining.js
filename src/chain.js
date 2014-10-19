
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

Chain.prototype.fork = function () {
    var chain = new Chain();
    this.steps.push(chain);
    return chain;
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
};

Chain.prototype.runWithCallback = function (step) {
    var self = this;
    return new Promise(function (resolve, reject) {
        step.call(self.context, function (value) {
            if (value instanceof Error) {
                reject(value);
            }
            resolve(value);
        });
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

module.exports = Chain;