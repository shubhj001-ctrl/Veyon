const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  dbName: "veyon",
  serverSelectionTimeoutMS: 30000, // ⏳ wait longer
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log("✅ MongoDB connected");
})
.catch(err => {
  console.error("❌ MongoDB connection error (will retry):", err.message);
  // ❌ DO NOT exit process
});

/* =========================
   SCHEMA
========================= */

const messageSchema = new mongoose.Schema({
  chatKey: String,
  from: String,
  to: String,
  text: String,
  media: {
    url: String,
    type: String
  },
  replyTo: Object,
  createdAt: {
    type: Number,
    default: Date.now
  }
});

const Message = mongoose.model("Message", messageSchema);

async function saveMessage(msg, chatKey) {
  return Message.create({
    chatKey,
    from: msg.from,
    to: msg.to,
    text: msg.text || null,
    media: msg.media || null,
    replyTo: msg.replyTo || null,
    createdAt: msg.createdAt || Date.now()
  });
}

async function loadMessages(chatKey) {
  return Message.find({ chatKey }).sort({ createdAt: 1 }).lean();
}

module.exports = { saveMessage, loadMessages };
