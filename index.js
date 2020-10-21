const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  setCords,
  users,
} = require("./users");
const { Z_ASCII } = require("zlib");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get("/", (req, res) => {
  res.send("<h1>Server started</h1>");
});

io.on("connection", (socket) => {
  socket.on("join", async ({ name, room }) => {
    console.log(name + " joined to " + room);

    let x = Math.random() * 10;
    socket.emit("display-room", {
      posx: x.toString(),
    });
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

    socket.join(room);
    addUser({ id: socket.id, name, room: room, px: x, py: 0, pz: -29 });
    getUser(socket.id).animation["id"] = socket.id; 
  });

  socket.on("update-user-animation", async (jsonObj) => {
    let curUser = getUser(socket.id);
    jsonObj["id"] = curUser.id;
    for(var attributename in jsonObj){
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

  socket.on("send-spine-cords", async ({x, y, z, w }) => {
    let curUser = getUser(socket.id);
    console.log(x + " " + y + " " + z + " " + w);
    socket.broadcast.to(curUser.room).emit("update-spine-cords", {
      id: socket.id,
      rotx: x.toString(),
      roty: y.toString(),
      rotz: z.toString(),
      rotw: w.toString()
    });
  });


  socket.on("disconnect", async () => {
    let curUser = getUser(socket.id);
    console.log(curUser.name + " leave the " + curUser.room);
    await socket.broadcast
      .to(curUser.room)
      .emit("disconnect-from-room", { id: socket.id });
    removeUser(socket.id);
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
