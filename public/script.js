const socket = io();

/* SCREENS */
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");

/* AUTH INPUTS */
const userInput = document.getElementById("auth-user");
const passInput = document.getElementById("auth-pass");
const authMsg = document.getElementById("auth-msg");

document.getElementById("login-btn").onclick = () => login();
document.getElementById("signup-btn").onclick = () => signup();

/* ---------- SIGNUP ---------- */
function signup() {
  const username = userInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    authMsg.textContent = "⚠️ Enter username and password";
    authMsg.style.color = "orange";
    return;
  }

  socket.emit("signup", { username, password }, res => {
    if (!res.ok) {
      authMsg.textContent = res.msg;
      authMsg.style.color = "red";
      return;
    }

    authMsg.textContent = "✅ Signup successful. Please login.";
    authMsg.style.color = "lightgreen";
  });
}

/* ---------- LOGIN ---------- */
function login() {
  const username = userInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    authMsg.textContent = "⚠️ Enter username and password";
    authMsg.style.color = "orange";
    return;
  }

  socket.emit("login", { username, password }, res => {
    if (!res.ok) {
      authMsg.textContent = res.msg;
      authMsg.style.color = "red";
      return;
    }

    authScreen.classList.remove("active");
    chatScreen.classList.add("active");
  });
}

/* CHAT */
const chatBox = document.getElementById("chat-box");
const typingDiv = document.getElementById("typing");
const onlineCount = document.getElementById("online-count");
const msgInput = document.getElementById("message");

document.getElementById("chat-form").onsubmit = (e) => {
  e.preventDefault();
  if (!msgInput.value.trim()) return;

  socket.emit("chatMessage", msgInput.value, (ack) => {
    if (ack?.delivered) {
      const el = document.createElement("div");
      el.className = "message delivered me";
      el.textContent = msgInput.value;
      chatBox.appendChild(el);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  msgInput.value = "";
};

/* RECEIVE */
socket.on("chatMessage", data => {
  const el = document.createElement("div");
  el.className = "message other";
  el.textContent = `${data.user}: ${data.text}`;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ONLINE */
socket.on("onlineCount", n => {
  onlineCount.textContent = `🟢 ${n} online`;
});

/* TYPING */
let typingTimeout;
msgInput.oninput = () => {
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 800);
};

socket.on("typing", data => {
  typingDiv.textContent = data.isTyping ? `${data.user} is typing…` : "";
});
