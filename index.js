// Server.js (упрощённый)
var cluster = require('cluster');

var rtg   = require("url").parse("redis://redistogo:57b9be5a47c379bb83372851baead95a@soapfish.redistogo.com:10827/");

var config = {
    numWorkers: require('os').cpus().length,
};
var server = require('http').createServer();
var io = require('socket.io').listen(server);

const redis = require('redis');
const redisAdapter = require('socket.io-redis');

const pubClient = redis.createClient(rtg.port, rtg.hostname, { auth_pass: "57b9be5a47c379bb83372851baead95a" });
const subClient = pubClient.duplicate();
io.adapter(redisAdapter({ pubClient, subClient }));



cluster.setupMaster({
    exec: "worker.js"
});
// Fork workers as needed.
for (var i = 0; i < config.numWorkers; i++)
    cluster.fork() 