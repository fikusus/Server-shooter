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

const {
  addRooms,
  removeRoom,
  getRoom,
  rooms
} = require("./rooms");

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
    var rooming = io.sockets.adapter.rooms[room];


    if (!rooming) {
      await socket.emit("set-host");
      host = true;
      addRooms(room);
    }
    var userRoom = getRoom(room);
    let startPos
    if(userRoom.status === "Waiting"){
      startPos = await {
        id: socket.id,
        name: name,
        wait: "false",
        px: "10.5",
        py: "0",
        pz: "-15",
        rx: "0",
        ry: "0",
        rz: "0",
        rw: "0",
      };
    }else{
      startPos = await {
        id: socket.id,
        name: name,
        wait: "true",
        px: "-100",
        py: "0",
        pz: "-20",
        rx: "0",
        ry: "0",
        rz: "0",
        rw: "0",
      };
    }

    socket.emit("update-start-position",startPos);
    socket.broadcast.to(room).emit("enter-new-player", startPos);

    getUsersInRoom(room).forEach(async (element) => {
      jsonPos = element.position;
      jsonPos["name"] = element.name;
      jsonPos["health"] = element.health;
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
    //console.log(jsonObj)
    let curUser = getUser(socket.id);
    addObject(jsonObj["id"], curUser.room, jsonObj);

    io.to(curUser.room).emit("spawn-object", jsonObj);
  });
  
  socket.on("send-object-info", async (jsonObj) => {
    let curUser = getUser(socket.id);
    let curObj = getObject(jsonObj["id"]);
    //curObj.setNewParams(jsonObj);
   // console.log(curObj);
    io.to(curUser.room).emit("update-object-info", jsonObj);
  });


  /*socket.on("dieng", async (id) => {
    console.log(id);
    let curUser = getUser(socket.id);
    socket.broadcast.to(curUser.room).emit("die", id);
  });*/

  socket.on("taking-damage", async (jsonObj) => {
    //console.log(jsonObj);
    let curUser = getUser(socket.id);
    curUser.health = jsonObj["damage"]
    socket.broadcast.to(curUser.room).emit("update-taking-damage", jsonObj);
  });

  socket.on("respawn-player", async () => {
    console.log("Respawn");
    let curUser = getUser(socket.id);
    curUser.health = "80"
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
      var rooming = io.sockets.adapter.rooms[curUser.room];
      console.log(rooming);
      if (!rooming) {
        console.log("Clear");
        objects.length = 0;
        removeRoom(curUser.room);
      }
    }
  });

  socket.on("start-zombie-spawning", async (jsonObj) => {
    let curUser = getUser(socket.id);
    console.log(jsonObj);
    getRoom(curUser.room).params =  jsonObj;
    console.log(getRoom(curUser.room).params);
    //spawning(curUser.room,jsonObj)
    
  });

  socket.on("zombie-dieng", async()=>{
      console.log("Zombie DIE");
      let curUser = getUser(socket.id);
      let rooming =  getRoom(curUser.room);
      rooming.zombies--;
      if(rooming.zombies === 0 && rooming.status == "killing"){
        nextWave(rooming);
      }
  });

  socket.on("change-ready-status", async({ready})=>{
    let curUser = getUser(socket.id);
    curUser.isReady = ready;
    let usersInRoom = getUsersInRoom(curUser.room);
    let allReady = true;
    for(let i = 0; i < usersInRoom.length;i++){
      console.log(usersInRoom[i].isReady + "TEST")
      if(usersInRoom[i].isReady === "False"){
        allReady = false;
        break;
      }
    }
    if(allReady && getRoom(curUser.room).status === "Waiting"){
      nextWave( getRoom(curUser.room));
    }
});



  const nextWave = async(room) =>{
    room.status = "spawning";
    if(room.params["waves"] > room.curWave){
    var rooming = io.sockets.adapter.rooms[room.name];
    console.log( "Wave " + room.curWave);
    io.to(room.name).emit("change-wave",{text:"Wave " + room.curWave});
    for(let j = 0; j <room.params["count" + room.curWave] && rooming.length > 0;j++){
      await sleep(room.params["interval" + room.curWave]);
      let uuid = uuidv4();
      let zombieSpawnInfo = await {
          pos:getRandomInt(room.params["spawns"]),
          id:uuid
      };
      io.to(room.name).emit("spawn-zombie",zombieSpawnInfo);
      room.zombies++;
    }
    room.curWave++;
    room.status = "killing";
  }else{
    io.to(room.name).emit("change-wave",{text:"Win"});
    console.log( "Win");
  }

  }

 /* const spawning = async(room, params) => {
    var rooming = io.sockets.adapter.rooms[room];
    for(let i = 0; i < params["waves"];i++){
      console.log( "Wave " + i);
      io.to(room).emit("change-wave",{text:"Wave " + i});
      for(let j = 0; j < params["count" + i] && rooming.length > 0;j++){
        await sleep(params["interval" + i]);
        let uuid = uuidv4();
        let zombieSpawnInfo = await {
            pos:getRandomInt(params["spawns"]),
            id:uuid
        };
        io.to(room).emit("spawn-zombie",zombieSpawnInfo);
        getRoom(room).zombies++;
        console.log(getRoom(room).zombies);
      }
      while(getRoom(room).zombies !== 0);
    }
    io.to(room).emit("change-wave",{text:"Win"});
  };*/

  async function sleep  (ms){
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
