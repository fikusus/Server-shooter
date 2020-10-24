var mergeJSON = require("merge-json");

var objects = [];

const addObject = (id, room, JSON) => {
  const objectiv = { id: id, room: room, parameters: JSON };
  objects.push(objectiv);
  return { objectiv };
};

/*const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) return users.splice(index, 1)[0];
};*/

const getObject = (id) => objects.find((objectiv) => objectiv.id === id);

const setNewParams = (myJsonObj) => {
  let curr = getUser(id);
  var result = mergeJSON.merge(curr.parameters, myJsonObj);
  curr.parameters = result;
};

const getObjectsInRoom = (room) => {
  console.log(objects);
  console.log(room);
  return objects.filter((objectiv) => objectiv.room === room);
};

module.exports = {
  addObject,
  getObject,
  setNewParams,
  getObjectsInRoom,
  objects,
};
