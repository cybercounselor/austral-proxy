const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/proxy", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

    const userMessage = req.body.messages?.[0]?.content || "";

    const geminiBody = {
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data).substring(0, 500));

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.error("Empty response from Gemini:", JSON.stringify(data));
      return res.status(500).json({ content: [{ type: "text", text: JSON.stringify(data) }] });
    }

    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy corriendo en puerto " + PORT));
