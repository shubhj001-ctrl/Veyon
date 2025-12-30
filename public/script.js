const socket = io();

let currentUser = localStorage.getItem("user");
let currentChat = null;
let replyTo = null;

/* ELEMENTS */
const loginView = document.getElementById("login-view");
const appView = document.getElementById("app-view");
const userList = document.getElementById("user-list");
const chatBox = document.getElementById("chat-box");
const chatTitle = document.getElementById("chat-title");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const replyPreview = document.getElementById("reply-preview");
const replyUser = document.getElementById("reply-user");
const replyText = document.getElementById("reply-text");
const cancelReply = document.getElementById("cancel-reply");

/* INIT */
loginView.style.display = "none";
appView.style.display = "none";

if (currentUser) {
  appView.style.display = "flex";
  socket.emit("login", { username: currentUser, password: "jaggibaba" }, res => {
    if (!res?.ok) logout();
    else renderUsers(res.users);
  });
} else {
  loginView.style.display = "flex";
}

/* LOGIN */
document.getElementById("login-btn").onclick = () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  socket.emit("login", { username, password }, res => {
    if (!res.ok) return alert("Invalid login");

    currentUser = username;
    localStorage.setItem("user", username);

    loginView.style.display = "none";
    appView.style.display = "flex";

    renderUsers(res.users);
  });
};

/* USERS */
function renderUsers(users) {
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${u}</span>`;
    li.onclick = () => openChat(u);
    userList.appendChild(li);
  });
}

/* CHAT */
function openChat(user) {
  currentChat = user;
  chatTitle.innerText = user;
  chatBox.innerHTML = "";

  socket.emit("loadMessages", { withUser: user }, msgs => {
    msgs.forEach(renderMessage);
  });
}

/* SEND */
sendBtn.onclick = sendMessage;
messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentChat) return;

  const msg = {
    from: currentUser,
    to: currentChat,
    text,
    time: Date.now(),
    replyTo
  };

  messageInput.value = "";
  clearReply();

  // send to server; rendering is handled when server emits "message"
  socket.emit("sendMessage", msg);
}

// render incoming messages (including those sent by this client)
socket.on("message", msg => {
  if (!currentChat) return;
  const relevant =
    (msg.from === currentChat && msg.to === currentUser) ||
    (msg.from === currentUser && msg.to === currentChat);
  if (relevant) renderMessage(msg);
});

/* RENDER */
function renderMessage(msg) {
  const wrap = document.createElement("div");
  wrap.className = msg.from === currentUser ? "msg-wrapper me" : "msg-wrapper";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  if (msg.replyTo) {
    const r = document.createElement("div");
    r.className = "reply-box";
    r.innerText =
      (msg.replyTo.user === currentUser ? "Me" : msg.replyTo.user) +
      ": " +
      msg.replyTo.text;
    bubble.appendChild(r);
  }

  bubble.appendChild(document.createTextNode(msg.text));
  wrap.appendChild(bubble);

  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* REPLY */
function setReply(msg) {
  replyTo = { user: msg.from, text: msg.text };
  replyUser.innerText = msg.from === currentUser ? "Me" : msg.from;
  replyText.innerText = msg.text;
  replyPreview.classList.remove("hidden");
}

cancelReply.onclick = clearReply;

function clearReply() {
  replyTo = null;
  replyPreview.classList.add("hidden");
}

/* LOGOUT */
function logout() {
  localStorage.removeItem("user");
  location.reload();
}
