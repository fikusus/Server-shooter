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

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get("/", (req, res) => {
  res.send("<h1>Server started</h1>");
});

io.on("connection", (socket) => {
  socket.on("join", async ({ name, room }) => {
    let host = false;
    console.log(name + " joined to " + room);

    if (users.length === 0) {
      await socket.emit("set-host");
      host = true;
    }
    let x = Math.random() * 10;
    socket.broadcast.to(room).emit("enter-new-player", {
      id: socket.id,
      posx: x.toString(),
    });

    getUsersInRoom(room).forEach((element) => {
      socket.emit("enter-new-player", {
        id: element.id,
        posx: element.px.toString(),
      });
      socket.emit("update-other-player-animator", element.animation);
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
      px: 10.5,
      py: 0,
      pz: -15,
      host,
    });

    socket.emit("display-room", {
      posx: x.toString(),
    });

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

  socket.on("send-player-cords", async ({ px, py, pz, rx, ry, rz }) => {
    let curUser = getUser(socket.id);
    setCords(socket.id, px, py, pz, rx, ry, rz);
    socket.broadcast.to(curUser.room).emit("update-users-cords", {
      id: socket.id,
      posx: px.toString(),
      posy: py.toString(),
      posz: pz.toString(),
      rotx: rx.toString(),
      roty: ry.toString(),
      rotz: rz.toString(),
    });
  });

  socket.on("send-spine-cords", async (jsonObj) => {
    let curUser = getUser(socket.id);
    jsonObj["id"] = socket.id;
    console.log(jsonObj);
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
  socket.on("disconnect", async () => {
    let curUser = getUser(socket.id);
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
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
