const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const USERS = {
  shubh: "jaggibaba",
  boss: "jaggibaba",
  weed: "jaggibaba"
};

let onlineUsers = new Set();
let messages = {}; // key: userA|userB

function chatKey(a, b) {
  return [a, b].sort().join("|");
}

io.on("connection", socket => {

  socket.on("login", ({ username, password }, cb) => {
    if (USERS[username] !== password) {
      return cb({ ok: false });
    }

    socket.username = username;
    onlineUsers.add(username);

    io.emit("presence", [...onlineUsers]);

    cb({ ok: true, users: Object.keys(USERS).filter(u => u !== username) });
  });

  socket.on("loadMessages", ({ withUser }, cb) => {
    const key = chatKey(socket.username, withUser);
    cb(messages[key] || []);
  });

  socket.on("sendMessage", msg => {
    const key = chatKey(msg.from, msg.to);
    if (!messages[key]) messages[key] = [];
    messages[key].push(msg);

    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit("presence", [...onlineUsers]);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
