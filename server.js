/**
 * ===============================
 * VibeChat Server (Complete)
 * ===============================
 */

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

/* ===============================
   APP + SERVER
================================ */
const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ===============================
   STATIC FILES
================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   USERS (TEMP / HARD-CODED)
================================ */
const USERS = {
  shubh: "jaggibaba",
  boss: "jaggibaba",
  weed: "jaggibaba"
};

/* ===============================
   IN-MEMORY STATE
================================ */
// username -> socket.id
const onlineUsers = {};

// chatKey -> [ messages ]
const chats = {};

/* ===============================
   HELPERS
================================ */
function getChatKey(a, b) {
  return [a, b].sort().join("|");
}

/* ===============================
   SOCKET.IO
================================ */
io.on("connection", socket => {
  let currentUser = null;

  /* ---------- LOGIN ---------- */
  socket.on("login", ({ username, password }, cb) => {
    if (!USERS[username] || USERS[username] !== password) {
      return cb({
        ok: false,
        msg: "Invalid username or password"
      });
    }

    currentUser = username;
    onlineUsers[username] = socket.id;

    cb({
      ok: true,
      users: Object.keys(USERS).filter(u => u !== username)
    });
  });

  /* ---------- LOAD CHAT ---------- */
  socket.on("loadChat", ({ withUser }, cb) => {
    if (!currentUser) return;

    const key = getChatKey(currentUser, withUser);
    cb({
      history: chats[key] || []
    });
  });

  /* ---------- PRIVATE MESSAGE ---------- */
  socket.on("privateMessage", ({ to, message }) => {
    if (!currentUser || !to || !message) return;

    const msg = {
      id: Date.now() + Math.random(),
      from: currentUser,
      to: to,
      content: message.content,
      replyTo: message.replyTo || null,
      timestamp: Date.now()
    };

    const key = getChatKey(currentUser, to);
    if (!chats[key]) chats[key] = [];
    chats[key].push(msg);

    // Send to receiver
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("privateMessage", msg);
    }

    // Send back to sender (important!)
    socket.emit("privateMessage", msg);
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    if (currentUser) {
      delete onlineUsers[currentUser];
    }
  });
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
