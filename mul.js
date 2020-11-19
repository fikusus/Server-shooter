// Server.js (упрощённый)
var cluster = require('cluster');

var config = {
    numWorkers: require('os').cpus().length,
};

const io = require('socket.io')(3000);
const redis = require('socket.io-redis');
io.adapter(redis({ host: 'localhost', port: 6379 }));



cluster.setupMaster({
    exec: "index.js"
});
// Fork workers as needed.
for (var i = 0; i < config.numWorkers; i++){
    
    cluster.fork() 
}