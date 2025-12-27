const socket = io();

/* ---------- AUTH MODE ---------- */
let isLogin = true;
let currentUser = "";

const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");

const authTitle = document.getElementById("auth-title");
const authSub = document.getElementById("auth-sub");
const authMsg = document.getElementById("auth-msg");

const userInput = document.getElementById("auth-user");
const passInput = document.getElementById("auth-pass");

const primaryBtn = document.getElementById("primary-btn");
const switchBtn = document.getElementById("switch-btn");

switchBtn.onclick = () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? "Welcome back 👋" : "Create account ✨";
  authSub.textContent = isLogin ? "Login to continue" : "Signup to get started";
  primaryBtn.textContent = isLogin ? "Login" : "Signup";
  switchBtn.textContent = isLogin
    ? "Don’t have an account? Signup"
    : "Already have an account? Login";
  authMsg.textContent = "";
};

primaryBtn.onclick = () => {
  const username = userInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    authMsg.textContent = "⚠️ Fill all fields";
    authMsg.style.color = "orange";
    return;
  }

  socket.emit(isLogin ? "login" : "signup", { username, password }, res => {
    if (!res.ok) {
      authMsg.textContent = res.msg;
      authMsg.style.color = "red";
      return;
    }

    if (!isLogin) {
      authMsg.textContent = "✅ Signup done. Please login.";
      authMsg.style.color = "lightgreen";
      isLogin = true;
      switchBtn.click();
      return;
    }

    currentUser = username;
    authScreen.classList.remove("active");
    chatScreen.classList.add("active");
  });
};

/* ---------- CHAT ---------- */
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message");
const typingDiv = document.getElementById("typing");
const onlineCount = document.getElementById("online-count");

function timeNow() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

document.getElementById("chat-form").onsubmit = e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;

  const bubble = document.createElement("div");
  bubble.className = "message-row me";

  bubble.innerHTML = `
    <div class="bubble me">
      <div class="text">${text}</div>
      <div class="meta">
        <span class="time">${timeNow()}</span>
        <span class="tick">⏳</span>
      </div>
    </div>
    <div class="avatar me">${currentUser[0].toUpperCase()}</div>
  `;

  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  socket.emit("chatMessage", text, ack => {
    if (ack?.delivered) {
      bubble.querySelector(".tick").textContent = "✓";
    }
  });

  msgInput.value = "";
};

/* RECEIVE (IGNORE OWN MESSAGES) */
socket.on("chatMessage", data => {
  if (data.user === currentUser) return;

  const bubble = document.createElement("div");
  bubble.className = "message-row other";

  bubble.innerHTML = `
    <div class="avatar other">${data.user[0].toUpperCase()}</div>
    <div class="bubble other">
      <div class="user">${data.user}</div>
      <div class="text">${data.text}</div>
      <div class="meta">
        <span class="time">${timeNow()}</span>
      </div>
    </div>
  `;

  chatBox.appendChild(bubble);
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
