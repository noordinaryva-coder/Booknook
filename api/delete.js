// api/delete.js
//
// Deletes an uploaded PDF/EPUB from Vercel Blob when a book is removed
// from the shelf. Called with { url: "<the blob URL stored on the book>" }.
// Failing to delete the file isn't fatal — the book still comes off the
// shelf either way (see apiDeleteFile in index.html) — this just keeps
// the Blob store from accumulating orphaned files over time.

const { del } = require("@vercel/blob");

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const raw = await readRawBody(req);
    let body;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch (e) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    if (!body.url) {
      res.status(400).json({ error: "Missing url" });
      return;
    }

    await del(body.url);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("api/delete.js error:", err);
    // Not finding the blob (already gone) shouldn't be treated as a hard failure.
    res.status(200).json({ ok: true, note: "File may already have been removed" });
  }
};
