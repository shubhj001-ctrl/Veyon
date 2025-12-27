const socket = io();

/* ---------- AUTH MODE ---------- */
let isLogin = true;

const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");

const authTitle = document.getElementById("auth-title");
const authSub = document.getElementById("auth-sub");
const authMsg = document.getElementById("auth-msg");

const userInput = document.getElementById("auth-user");
const passInput = document.getElementById("auth-pass");

const primaryBtn = document.getElementById("primary-btn");
const switchBtn = document.getElementById("switch-btn");

/* Toggle login/signup */
switchBtn.onclick = () => {
  isLogin = !isLogin;

  authTitle.textContent = isLogin ? "Welcome back 👋" : "Create account ✨";
  authSub.textContent = isLogin
    ? "Login to continue"
    : "Signup to get started";

  primaryBtn.textContent = isLogin ? "Login" : "Signup";
  switchBtn.textContent = isLogin
    ? "Don’t have an account? Signup"
    : "Already have an account? Login";

  authMsg.textContent = "";
};

/* Primary action */
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

    authScreen.classList.remove("active");
    chatScreen.classList.add("active");
  });
};

/* ---------- CHAT ---------- */
const chatBox = document.getElementById("chat-box");
const msgInput = document.getElementById("message");
const typingDiv = document.getElementById("typing");
const onlineCount = document.getElementById("online-count");

document.getElementById("chat-form").onsubmit = e => {
  e.preventDefault();
  if (!msgInput.value.trim()) return;

  socket.emit("chatMessage", msgInput.value, ack => {
    if (ack?.delivered) {
      const div = document.createElement("div");
      div.className = "message me delivered";
      div.textContent = msgInput.value;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  msgInput.value = "";
};

/* RECEIVE MESSAGE */
socket.on("chatMessage", data => {
  const div = document.createElement("div");
  div.className = "message other";

  div.innerHTML = `
    <div class="user">${data.user}</div>
    <div>${data.text}</div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ONLINE USERS */
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
