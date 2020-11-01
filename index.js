const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  setCords,
  users,
} = require("./users");

const {
  addObject,
  getObject,
  setNewParams,
  getObjectsInRoom,
  objects,
} = require("./objects");

const { Z_ASCII } = require("zlib");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { Console, clear } = require("console");
const { json } = require("express");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get("/", (req, res) => {
  res.send("<h1>Server started</h1>");
});

io.on("connection", (socket) => {
  socket.emit("connected");

  socket.on("join", async ({ name, room }) => {
    let host = false;
    console.log(name + " joined to " + room);

    if (users.length === 0) {
      await socket.emit("set-host");
      host = true;
    }

    let startPos = await {
      id: socket.id,
      name: name,
      px: "10.5",
      py: "0",
      pz: "-15",
      rx: "0",
      ry: "0",
      rz: "0",
      rw: "0",
    };

    socket.broadcast.to(room).emit("enter-new-player", startPos);

    getUsersInRoom(room).forEach(async (element) => {
      jsonPos = element.position;
      jsonPos["name"] = element.name;
      await socket.emit("enter-new-player", jsonPos);
      await socket.emit("update-other-player-animator", element.animation);
    });

    if (!host) {
      getObjectsInRoom(room).forEach(async (element) => {
        await socket.emit("spawn-object", element.parameters);
      });
    }

    socket.join(room);

    await addUser({
      id: socket.id,
      name,
      room: room,
      host,
    });

    if(host){
      socket.emit("get-scene-data");
    }

    setCords(socket.id, startPos);
    getUser(socket.id).animation["id"] = socket.id;
  });

  socket.on("update-user-animation", async (jsonObj) => {
    let curUser = getUser(socket.id);
    jsonObj["id"] = curUser.id;
    for (var attributename in jsonObj) {
      curUser.animation[attributename] = jsonObj[attributename];
    }
    socket.broadcast
      .to(curUser.room)
      .emit("update-other-player-animator", jsonObj);
  });

  socket.on("send-player-cords", async (jsonObj) => {
    let curUser = getUser(socket.id);
    setCords(socket.id, jsonObj);
    jsonObj["id"] = socket.id;
    socket.broadcast.to(curUser.room).emit("update-users-cords", jsonObj);
  });

  socket.on("send-spine-cords", async (jsonObj) => {
    let curUser = getUser(socket.id);
    jsonObj["id"] = socket.id;
    socket.broadcast.to(curUser.room).emit("update-spine-cords", jsonObj);
  });

  socket.on("spawn-new-object", async (jsonObj) => {
    let curUser = getUser(socket.id);
    let uuid = uuidv4();
    jsonObj["id"] = uuid;
    addObject(uuid, curUser.room, jsonObj);

    io.to(curUser.room).emit("spawn-object", jsonObj);
  });
  /*
  socket.on("send-object-info", async (jsonObj) => {
    let curUser = getUser(socket.id);
    let curObj = getObject(jsonObj["id"]);
    //curObj.setNewParams(jsonObj);
    console.log(curObj);
    socket.broadcast.to(curUser.room).emit("update-object-info", jsonObj);
  });
*/

  /*socket.on("dieng", async (id) => {
    console.log(id);
    let curUser = getUser(socket.id);
    socket.broadcast.to(curUser.room).emit("die", id);
  });*/

  socket.on("taking-damage", async (jsonObj) => {
    jsonObj["Who"] = socket.id;
    console.log(jsonObj);
    let curUser = getUser(socket.id);
    socket.broadcast.to(curUser.room).emit("update-taking-damage", jsonObj);
  });

  socket.on("respawn-player", async () => {
    console.log("Respawn");
    let curUser = getUser(socket.id);
    socket.broadcast
      .to(curUser.room)
      .emit("update-respawn-player", { id: curUser.id });
  });

  socket.on("player-shoot", async () => {
    let curUser = getUser(socket.id);
    socket.broadcast
      .to(curUser.room)
      .emit("update-player-shoot", { id: curUser.id });
  });
  socket.on("disconnect", async () => {
    let curUser = getUser(socket.id);
    if (curUser) {
      console.log(curUser.name + " leave the " + curUser.room);
      await socket.broadcast
        .to(curUser.room)
        .emit("disconnect-from-room", { id: socket.id });
      removeUser(socket.id);
      if (curUser.host === true && users != 0) {
        io.to(users[0].id).emit("set-host");
      }
      if (users.length === 0) {
        console.log("Clear");
        objects.length = 0;
      }
    }
  });

  socket.on("start-zombie-spawning", async (jsonObj) => {
    let curUser = getUser(socket.id);
    console.log(jsonObj);
      spawning(curUser.room,jsonObj["interval"], jsonObj["count"])
  });


  const spawning = async(room, interval, count) => {
    var rooming = io.sockets.adapter.rooms[room];

    while(true && rooming.length > 0){
      await sleep(interval);
      let zombieSpawnInfo = await {
          pos:getRandomInt(count)
      };
      io.to(room).emit("spawn-zombie",zombieSpawnInfo);
    }

  };

  function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })   
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
