const socket = io();

let currentUser = null;
let activeChatUser = null;
let replyContext = null;

const isMobile = window.innerWidth <= 768;

/* ELEMENTS */
const authScreen = document.getElementById("auth-screen");
const chatScreen = document.getElementById("chat-screen");

const welcomeScreen = document.getElementById("welcome-screen");
const chatUI = document.getElementById("chat-ui");

const userInput = document.getElementById("auth-user");
const passInput = document.getElementById("auth-pass");
const loginBtn = document.getElementById("primary-btn");
const authMsg = document.getElementById("auth-msg");

const userList = document.getElementById("user-list");
const chatHeader = document.getElementById("chat-header");
const chatBox = document.getElementById("chat-box");

const chatForm = document.getElementById("chat-form");
const msgInput = document.getElementById("message");

const replyBar = document.getElementById("reply-bar");
const replyUser = document.getElementById("reply-user");
const replyText = document.getElementById("reply-text");
const cancelReply = document.getElementById("cancel-reply");

/* INIT */
authScreen.style.display = "flex";
chatScreen.style.display = "none";

/* LOGIN */
loginBtn.onclick = () => {
  socket.emit(
    "login",
    {
      username: userInput.value.trim(),
      password: passInput.value.trim()
    },
    res => {
      if (!res.ok) {
        authMsg.textContent = res.msg;
        return;
      }

      currentUser = userInput.value.trim();
      authScreen.style.display = "none";
      chatScreen.style.display = "flex";

      if (!isMobile) {
        welcomeScreen.style.display = "flex";
      }

      renderUserList(res.users);
    }
  );
};

/* USERS */
function renderUserList(users) {
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="chat-avatar">${u.charAt(0).toUpperCase()}</div>
      <div class="chat-name">${u}</div>
    `;
    li.onclick = () => openChat(u);
    userList.appendChild(li);
  });
}

/* OPEN CHAT */
function openChat(user) {
  activeChatUser = user;
  chatHeader.textContent = user;
  chatBox.innerHTML = "";
  clearReply();

  if (isMobile) {
    chatScreen.classList.add("mobile-chat-open");
    chatUI.style.display = "flex";

    // 👇 IMPORTANT: add history entry
    history.pushState({ chatOpen: true }, "");
  } else {
    welcomeScreen.style.display = "none";
    chatUI.style.display = "flex";
  }

  socket.emit("loadChat", { withUser: user }, res => {
    res.history.forEach(addMessage);
  });
}

/* BACK BUTTON HANDLING (MOBILE) */
window.addEventListener("popstate", () => {
  if (isMobile && chatScreen.classList.contains("mobile-chat-open")) {
    // Close chat instead of leaving site
    chatScreen.classList.remove("mobile-chat-open");
    chatUI.style.display = "none";
    activeChatUser = null;
  }
});

/* SEND */
chatForm.onsubmit = e => {
  e.preventDefault();
  if (!activeChatUser) return;

  socket.emit("privateMessage", {
    to: activeChatUser,
    message: {
      content: msgInput.value,
      replyTo: replyContext
    }
  });

  msgInput.value = "";
  clearReply();
};

/* RECEIVE */
socket.on("privateMessage", msg => {
  if (
    (msg.from === currentUser && msg.to === activeChatUser) ||
    (msg.from === activeChatUser && msg.to === currentUser)
  ) {
    addMessage(msg);
  }
});

/* REPLY */
cancelReply.onclick = clearReply;

function setReply(msg) {
  replyContext = { user: msg.from, content: msg.content };
  replyUser.textContent = msg.from === currentUser ? "Me" : msg.from;
  replyText.textContent = msg.content;
  replyBar.style.display = "flex";
}

function clearReply() {
  replyContext = null;
  replyBar.style.display = "none";
}

/* RENDER MESSAGE */
function addMessage(msg) {
  const isMe = msg.from === currentUser;
  const row = document.createElement("div");
  row.className = `message-row ${isMe ? "me" : "other"}`;

  let replyHtml = "";
  if (msg.replyTo) {
    replyHtml = `
      <div class="reply-preview">
        <strong>${msg.replyTo.user === currentUser ? "Me" : msg.replyTo.user}</strong><br>
        ${msg.replyTo.content}
      </div>
    `;
  }

  row.innerHTML = `
    <div class="bubble ${isMe ? "me" : "other"}">
      ${replyHtml}
      <div>${msg.content}</div>
    </div>
  `;

  row.querySelector(".bubble").onclick = () => setReply(msg);

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}
