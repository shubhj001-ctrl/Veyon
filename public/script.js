const socket = io();

let currentUser = localStorage.getItem("user");
let currentChat = null;
let onlineSet = new Set();
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

/* INITIAL STATE */
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
    li.innerHTML = `<span class="status-dot" data-user="${u}"></span><span>${u}</span>`;
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
messageInput.onkeydown = e => e.key === "Enter" && sendMessage();

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

  socket.emit("sendMessage", msg, () => renderMessage(msg));
}

/* RENDER MESSAGE */
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

  const text = document.createElement("div");
  text.innerText = msg.text;
  bubble.appendChild(text);

  const time = document.createElement("div");
  time.className = "msg-time";
  time.innerText = new Date(msg.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const replyBtn = document.createElement("div");
  replyBtn.className = "reply-btn";
  replyBtn.innerText = "↩";
  replyBtn.onclick = () => setReply(msg);

  wrap.appendChild(replyBtn);
  wrap.appendChild(bubble);
  wrap.appendChild(time);

  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* REPLY HANDLING */
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

/* PRESENCE */
socket.on("presence", users => {
  onlineSet = new Set(users);
  document.querySelectorAll(".status-dot").forEach(dot => {
    dot.classList.toggle("online", onlineSet.has(dot.dataset.user));
  });
});

function logout() {
  localStorage.removeItem("user");
  location.reload();
}
