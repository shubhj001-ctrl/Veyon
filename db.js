const Database = require("better-sqlite3");
const db = new Database("chat.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    text TEXT,
    mediaUrl TEXT,
    mediaType TEXT,
    timestamp INTEGER
  )
`).run();

module.exports = db;
