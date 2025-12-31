const socket = io();

/* ELEMENTS */
const loginScreen = document.getElementById("login-screen");
const app = document.getElementById("app");
const loginButtons = document.querySelectorAll(".login-box button");
const logoutBtn = document.getElementById("logout-btn");

const userList = document.getElementById("user-list");
const chatBox = document.getElementById("chat-box");
const chatTitle = document.getElementById("chat-title");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

/* STATE */
let currentUser = localStorage.getItem("veyon_user");
let currentChat = null;

/* LOGIN FLOW */
if (!currentUser) {
  loginScreen.classList.remove("hidden");
} else {
  startApp();
}

loginButtons.forEach(btn => {
  btn.onclick = () => {
    currentUser = btn.dataset.user;
    localStorage.setItem("veyon_user", currentUser);
    startApp();
  };
});

/* LOGOUT */
logoutBtn.onclick = () => {
  localStorage.removeItem("veyon_user");
  location.reload();
};

/* START APP */
function startApp() {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");

  socket.emit("login", currentUser);
}

/* USERS LIST */
socket.on("users", users => {
  userList.innerHTML = "";

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "user-card";
    div.innerText = u;
    div.onclick = () => openChat(u);
    userList.appendChild(div);
  });
});

/* OPEN CHAT */
function openChat(user) {
  currentChat = user;
  chatTitle.innerText = user;
  chatBox.innerHTML = "";

  socket.emit("loadMessages", { withUser: user }, msgs => {
    msgs.forEach(renderMessage);
  });
}

/* SEND MESSAGE */
sendBtn.onclick = sendMessage;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  if (!currentChat) return;

  const text = input.value.trim();
  if (!text) return;

  const msg = {
    from: currentUser,
    to: currentChat,
    text,
    time: Date.now()
  };

  socket.emit("sendMessage", msg);
  input.value = "";
}

/* RECEIVE MESSAGE */
socket.on("message", msg => {
  if (
    (msg.from === currentChat && msg.to === currentUser) ||
    (msg.from === currentUser && msg.to === currentChat)
  ) {
    renderMessage(msg);
  }
});

/* RENDER MESSAGE */
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "message" + (msg.from === currentUser ? " me" : "");
  div.innerText = msg.text;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
