// Server.js (упрощённый)
var cluster = require('cluster');

var config = {
    numWorkers: require('os').cpus().length,
};

cluster.setupMaster({
    exec: "worker.js"
});

// Fork workers as needed.
for (var i = 0; i < config.numWorkers; i++)
    cluster.fork()