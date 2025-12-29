const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

/* USERS */
const USERS = ["boss", "weed", "shubh"];
const PASSWORD = "jaggibaba";

/* CHAT STORE (in-memory) */
const chats = {}; 
// chats[user][peer] = [{ from, to, text, time }]

function saveMessage(from, to, msg) {
  if (!chats[from]) chats[from] = {};
  if (!chats[from][to]) chats[from][to] = [];
  chats[from][to].push(msg);
}

/* SOCKET */
io.on("connection", socket => {

  socket.on("login", ({ username, password }, cb) => {
    if (!USERS.includes(username) || password !== PASSWORD) {
      cb({ ok: false, msg: "Invalid credentials" });
      return;
    }

    socket.username = username;
    cb({ ok: true, users: USERS.filter(u => u !== username) });
  });

  socket.on("loadChat", ({ withUser }, cb) => {
    const user = socket.username;
    const history = chats[user]?.[withUser] || [];
    cb({ history });
  });

  socket.on("sendMessage", ({ to, text }) => {
    const msg = {
      from: socket.username,
      to,               // ✅ FIX
      text,
      time: Date.now()
    };

    saveMessage(socket.username, to, msg);
    saveMessage(to, socket.username, msg);

    io.emit("message", msg);
  });
});
server.listen(PORT, () => {
  console.log(`Veyon running on http://localhost:${PORT}`);
});
