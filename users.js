let users = [];
var mergeJSON = require("merge-json");

const addUser = ({ id, name, room }) => {
  const user = {
    id,
    name,
    room,
    position: new Object(),
    animation: new Object(),
    health:"80",
    isReady :"False",
    targetsEnemy:[]
  };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => users.find((user) => user.id === id);

/*const setCords = (id, npx, npy, npz, nrx, nry, nrz) => {
  let curr = getUser(id);
  curr.px = npx;
  curr.py = npy;
  curr.pz = npz;

  curr.rx = nrx;
  curr.ry = nry;
  curr.rz = nrz;
};*/

const setCords = (id, myJsonObj) => {
  let curr = getUser(id);
  var result = mergeJSON.merge(curr.position, myJsonObj);
  curr.position = result;
};

const setHeath = (id, new_health) => {
  let curr = getUser(id);
  curr.health = new_health;
};



const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  setCords,
  users,
};
