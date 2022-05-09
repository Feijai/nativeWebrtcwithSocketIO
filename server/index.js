const express = require('express');
const app = express();
const fs = require('fs');
const open = require('open');
const options = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem'),
};
const serverPort = process.env.PORT || 4443;
const https = require('https');
const http = require('http');
let server;
if (process.env.LOCAL) {
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}
const io = require('socket.io')(server);

/* ==============================
 Middleware
 ================================ */
app.use(express.static(__dirname + '/public'));
app.get('/', getCallback);
io.on('connection', ioCallback);
server.listen(serverPort, listenCallback);

/* ==============================
 Middleware Functions
 ================================ */
function getCallback(req, res) {
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
}

function listenCallback() {
  console.log('server up and running at %s port', serverPort);
  if (process.env.LOCAL) {
    open('https://localhost:' + serverPort);
  }
}

function ioCallback(socket) {
  console.log(`Socket id: ${socket.id}`);

  socket.on('join', (roomID, callback) => {
    console.log('join', roomID);

    let socketIds = socketIdsInRoom(roomID);
    console.log('===socketIdsInRoom(roomID)===', socketIds);

    callback(socketIds);
    console.log('===roomID===', roomID);
    socket.join(roomID);
    socket.room = roomID;
  });

  socket.on('exchange', data => {
    data.from = socket.id;
    let to = io.sockets.connected[data.to];
    console.log('--in exchange to---', data.to);
    to.emit('exchange', data);
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);

    if (socket.room) {
      let room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);

      console.log('leave');
    }
  });

  // socket.on('list-server', function (data, callback) {
  //   callback(roomList);
  // });
}

/* ==============================
 Socket Functions
 ================================ */
function socketIdsInRoom(roomID) {
  console.log('===io.nsps[' / '].adapter.rooms===', io.nsps['/'].adapter.rooms);
  let socketIds = io.nsps['/'].adapter.rooms[roomID];
  if (socketIds) {
    let collection = [];
    for (let key in socketIds.sockets) {
      collection.push(key);
    }
    console.log('===collection===', collection);
    return collection;
  } else {
    return [];
  }
}
