const socket = io();

/* ELEMENTS */
const loginScreen = document.getElementById("login-screen");
const app = document.getElementById("app");
const loginBtn = document.getElementById("login-btn");
const loginMsg = document.getElementById("login-msg");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const userList = document.getElementById("user-list");
const chatTitle = document.getElementById("chat-title");
const chatWelcome = document.getElementById("chat-welcome");
const messages = document.getElementById("messages");

const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

/* STATE */
let currentUser = null;
let currentChat = null;
const unread = {};

/* LOGIN */
loginBtn.onclick = () => {
  socket.emit(
    "login",
    {
      username: usernameInput.value,
      password: passwordInput.value
    },
    res => {
      if (!res.ok) {
        loginMsg.innerText = res.msg;
        return;
      }

      currentUser = usernameInput.value;
      loginScreen.classList.add("hidden");
      app.classList.remove("hidden");

      renderUsers(res.users);
      showWelcome();
    }
  );
};

/* PRESENCE */
socket.on("presence", onlineUsers => {
  document.querySelectorAll(".status-dot").forEach(dot => {
    dot.classList.remove("online");
    if (onlineUsers.includes(dot.dataset.user)) {
      dot.classList.add("online");
    }
  });
});

/* USERS */
function renderUsers(users) {
  userList.innerHTML = "";

  users.forEach(user => {
    unread[user] = unread[user] || 0;

    const li = document.createElement("li");
    li.className = "user-item";

    const left = document.createElement("div");
    left.className = "user-left";

    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.dataset.user = user;

    const name = document.createElement("span");
    name.innerText = user;

    left.appendChild(dot);
    left.appendChild(name);

    const badge = document.createElement("span");
    badge.className = "unread";
    badge.innerText = unread[user];
    if (!unread[user]) badge.style.display = "none";

    li.appendChild(left);
    li.appendChild(badge);

    li.onclick = () => openChat(user, badge);

    userList.appendChild(li);
  });
}

/* CHAT */
function openChat(user, badge) {
  currentChat = user;
  chatTitle.innerText = user;

  unread[user] = 0;
  if (badge) badge.style.display = "none";

  showChatUI();

  socket.emit("loadChat", { withUser: user }, res => {
    messages.innerHTML = "";
    res.history.forEach(addMessage);
  });
}

/* SEND */
chatForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!messageInput.value || !currentChat) return;

  socket.emit("sendMessage", {
    to: currentChat,
    text: messageInput.value
  });

  messageInput.value = "";
});

/* RECEIVE */
socket.on("message", msg => {
  if (msg.from === currentChat || msg.from === currentUser) {
    addMessage(msg);
  } else {
    unread[msg.from] = (unread[msg.from] || 0) + 1;
    renderUsers(Object.keys(unread));
  }
});

/* UI */
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerText = `${msg.from}: ${msg.text}`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showWelcome() {
  chatWelcome.classList.remove("hidden");
  messages.classList.add("hidden");
  chatForm.classList.add("hidden");
}

function showChatUI() {
  chatWelcome.classList.add("hidden");
  messages.classList.remove("hidden");
  chatForm.classList.remove("hidden");
}
