// api/upload.js
//
// Receives a raw PDF or EPUB file (sent as the request body, with the
// original filename in the X-Filename header) and stores it in Vercel
// Blob under "books/". Returns the public URL, which gets saved into
// the book's entry in the shared database (see api/data.js).

const { put } = require("@vercel/blob");

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
    const buffer = await readRawBody(req);
    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: "No file received" });
      return;
    }

    const rawName = req.headers["x-filename"] || "book";
    const filename = decodeURIComponent(rawName).replace(/[^\w.\-]+/g, "_");
    const contentType = req.headers["content-type"] || "application/octet-stream";

    const blob = await put("books/" + Date.now() + "-" + filename, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("api/upload.js error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};
