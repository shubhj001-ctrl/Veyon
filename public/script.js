const socket = io();

const userList = document.getElementById("user-list");
const chatBox = document.getElementById("chat-box");
const chatTitle = document.getElementById("chat-title");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = "shubh"; // temp
let currentChat = null;

/* TEMP USERS FOR UI */
["boss", "weed", "alex", "sam"].forEach(u => {
  const div = document.createElement("div");
  div.className = "user-card";
  div.innerText = u;
  div.onclick = () => openChat(u);
  userList.appendChild(div);
});

function openChat(user) {
  currentChat = user;
  chatTitle.innerText = user;
  chatBox.innerHTML = "";
}

/* SEND MESSAGE WITH ANIMATION FEEL */
sendBtn.onclick = sendMessage;
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text || !currentChat) return;

  const msg = document.createElement("div");
  msg.className = "message me";
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  input.value = "";
}
