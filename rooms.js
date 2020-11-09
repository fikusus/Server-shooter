var rooms = [];

const addRooms = (name) => {
  const room = { name: name, zombies: 0, params:null, curWave:-1, status:"Waiting" , freeSpawnPoint:[]};
  rooms.push(room);
  return { room };
};

const removeRoom = (name) => {
  const index = rooms.findIndex((room) => room.name === name);

  if (index !== -1) return rooms.splice(index, 1)[0];
};

const getRoom = (name) => rooms.find((room) => room.name === name);


module.exports = {
    addRooms,
    removeRoom,
    getRoom
};
