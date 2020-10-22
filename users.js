let users = [];

const addUser = ({ id, name, room, px, py, pz, host }) => {
  const user = {
    id,
    name,
    room,
    px,
    py,
    pz,
    rx: 0,
    ry: 0,
    rz: 0,
    animation: new Object(),
    host: false,
  };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id) => users.find((user) => user.id === id);

const setCords = (id, npx, npy, npz, nrx, nry, nrz) => {
  let curr = getUser(id);
  curr.px = npx;
  curr.py = npy;
  curr.pz = npz;

  curr.rx = nrx;
  curr.ry = nry;
  curr.rz = nrz;
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
