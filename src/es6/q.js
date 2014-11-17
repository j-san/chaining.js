
var q = require('q');

global.Promise = function (callback) {
    var deferred = q.defer();
    callback(
        deferred.resolve.bind(deferred),
        deferred.reject.bind(deferred),
        deferred.notify.bind(deferred)
    );
    return deferred.promise;
};
global.Promise.all = q.all;
