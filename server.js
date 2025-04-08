const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-3.5-turbo"; // puoi usare anche "gpt-4" se disponibile

if (!OPENAI_API_KEY) {
  console.error("❌ Errore: OPENAI_API_KEY non definita nel file .env");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!message?.trim() || !artist?.trim()) {
    return res.status(400).json({
      reply: "Richiesta non valida. 'artist' e 'message' sono obbligatori."
    });
  }

  const systemPrompt = `Sei ${artist}, l'artista storico. Rispondi come faresti tu, in prima persona, con tono coerente con il tuo periodo storico.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message }
  ];

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] System prompt:", systemPrompt);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error("Nessuna risposta generata da OpenAI.");
    }

    console.log("[DEBUG] Risposta OpenAI:", reply);
    res.json({ reply });

  } catch (err) {
    console.error("[ERRORE] Comunicazione con OpenAI fallita:", err.message);
    res.status(500).json({
      reply: `Errore nella comunicazione con ${artist}. Riprova più tardi.`
    });
  }
});

// Catch-all per SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
