const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const users = {};
const onlineUsers = {};

io.on("connection", (socket) => {

  /* ---------- SIGNUP ---------- */
  socket.on("signup", ({ username, password }, cb) => {
    if (
      !username || 
      !password || 
      username.trim() === "" || 
      password.trim() === ""
    ) {
      return cb({ ok: false, msg: "Username and password required" });
    }

    if (users[username]) {
      return cb({ ok: false, msg: "User already exists" });
    }

    users[username] = password;
    cb({ ok: true, msg: "Signup successful. Please login." });
  });

  /* ---------- LOGIN ---------- */
  socket.on("login", ({ username, password }, cb) => {
    if (
      !username || 
      !password || 
      username.trim() === "" || 
      password.trim() === ""
    ) {
      return cb({ ok: false, msg: "Username and password required" });
    }

    if (users[username] !== password) {
      return cb({ ok: false, msg: "Invalid credentials" });
    }

    socket.username = username;
    onlineUsers[socket.id] = username;

    io.emit("onlineCount", Object.keys(onlineUsers).length);
    socket.broadcast.emit("systemMessage", `${username} joined`);

    cb({ ok: true });
  });

  /* ---------- MESSAGE ---------- */
  socket.on("chatMessage", (msg, cb) => {
    if (!socket.username || !msg || msg.trim() === "") return;

    io.emit("chatMessage", {
      user: socket.username,
      text: msg
    });

    cb({ delivered: true });
  });

  /* ---------- TYPING ---------- */
  socket.on("typing", (isTyping) => {
    if (!socket.username) return;
    socket.broadcast.emit("typing", {
      user: socket.username,
      isTyping
    });
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    if (socket.username) {
      delete onlineUsers[socket.id];
      io.emit("onlineCount", Object.keys(onlineUsers).length);
      socket.broadcast.emit("systemMessage", `${socket.username} left`);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
