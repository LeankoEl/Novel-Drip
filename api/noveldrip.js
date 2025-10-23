// /api/noveldrip — Gemini proxy
const { config } = require("./config");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { model = config.gemini.model, payload = {} } = req.body || {};
    const apiKey = config.gemini.apiKey;

    // Build simple prompt routing
    const system = "You are Novel Drip, an assistant that writes outlines, characters, plots, and chapters.";
    let userPrompt = "";
    switch (payload.op) {
      case "outline":
        userPrompt = `Create a detailed novel outline. Genre: ${payload.genre}. Theme: ${payload.theme}. Logline: ${payload.logline}. Use acts -> beats -> scenes.`;
        break;
      case "character":
        userPrompt = `Create a character sheet. Name: ${payload.name}. Role: ${payload.role}. Notes: ${payload.notes}. Include backstory, goals, flaws, and arc.`;
        break;
      case "bridge":
        userPrompt = `Write a plot bridge that logically connects these beats: ${payload.beat}. Include stakes and conflict.`;
        break;
      case "chapter":
        userPrompt = `Draft a compelling chapter based on: ${payload.prompt}. 900-1200 words, vivid sensory detail, strong dialogue.`;
        break;
      default:
        userPrompt = `Assist with: ${JSON.stringify(payload)}`;
    }

    const gRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${system}\n\n${userPrompt}` }]}]
        })
      }
    );

    const data = await gRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    res.status(200).json({ text });
  } catch (err) {
    if (config.app.debug) console.error("noveldrip error:", err);
    res.status(500).json({ error: String(err) });
  }
};
