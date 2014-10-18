
function Chain() {
    this.steps = [];
    this.promises = [];
    this.context = {};
    this.context.values = [];
}

Chain.prototype.next = function (step) {
    this.steps.push(step);
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
    this.promises.push(this.run(0));

    return Promise.all(this.promises);
};

Chain.prototype.run = function (index) {
    var self = this, step;

    if (index >= this.steps.length) {
        return;
    }

    step = this.steps[index];
    if (step instanceof Chain) {
        // fork...
        step.process();
    } else if (step instanceof Function && step.length) {
        // step with arguments => giving a done callback
        return this.run_with_callback(step);
    } else if (step instanceof Function) {
        // step without arguments
        // assume it return a promise or a direct vaule
        var promiseOrValue = step.call(this.context);
        if (promiseOrValue instanceof Object && 'then' in promiseOrValue) {

            return promiseOrValue.then(function (result) {
                self.context.values.push(result);
                return self.run(index + 1);
            });
        } else {
            // step return a value, forward
            this.context.values.push(promiseOrValue);
            return this.run(index + 1);
        }
    } else if ('then' in step) {
        // step is a promise
        return step.then(function (result) {
            self.context.values.push(result);
            return self.run(index + 1);
        });
    } else {
        throw Error("Bad step " + step);
    }

    return this;
};

Chain.prototype.run_with_callback = function (step) {
        return new Promise(function done(resolve, reject) {
        step.call(this.context, function (value) {
            // test for error ???
            resolve(value);
        });
    });
};

module.exports = Chain;