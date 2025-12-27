const socket = io();

/* AUTH */
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");

const userInput = document.getElementById("auth-user");
const passInput = document.getElementById("auth-pass");
const authMsg = document.getElementById("auth-msg");

document.getElementById("login-btn").onclick = () => auth("login");
document.getElementById("signup-btn").onclick = () => auth("signup");

function auth(type) {
  socket.emit(type, {
    username: userInput.value,
    password: passInput.value
  }, res => {
    if (!res.ok) return authMsg.textContent = res.msg || "Error";

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
  if (!msgInput.value) return;

  socket.emit("chatMessage", msgInput.value, (ack) => {
    if (ack.delivered) {
      const el = document.createElement("div");
      el.className = "message delivered me";
      el.textContent = msgInput.value;
      chatBox.appendChild(el);
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
});

/* ONLINE COUNT */
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
