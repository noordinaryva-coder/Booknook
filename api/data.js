// api/data.js
//
// BookNook's entire shared database — the book list, everyone's ratings,
// and every comment — lives in ONE JSON file on Vercel Blob, at the fixed
// path "data/database.json". No separate database service needed for
// 5 people with light traffic.
//
// GET  -> returns the current database (or an empty one if it doesn't exist yet)
// POST -> overwrites the database with the body sent

const { put, head } = require("@vercel/blob");

const DB_PATH = "data/database.json";
const EMPTY_DB = { books: [] };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      let blob;
      try {
        blob = await head(DB_PATH);
      } catch (e) {
        // Nothing saved yet — that's fine, the shelf just starts empty.
        res.status(200).json(EMPTY_DB);
        return;
      }
      const fetched = await fetch(blob.url);
      const json = await fetched.json();
      res.status(200).json(json);
      return;
    }

    if (req.method === "POST") {
      const raw = await readRawBody(req);
      let db;
      try {
        db = JSON.parse(raw.toString("utf8"));
      } catch (e) {
        res.status(400).json({ error: "Invalid JSON body" });
        return;
      }
      const blob = await put(DB_PATH, JSON.stringify(db), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      res.status(200).json({ ok: true, url: blob.url });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("api/data.js error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
