const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

if (!HF_API_KEY) {
  console.error("❌ Errore: HF_API_KEY non definita nel file .env");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Memoria breve per ogni artista
const memory = {}; // { [artist]: [pastMessages] }

app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!message?.trim() || !artist?.trim()) {
    return res.status(400).json({
      reply: "Richiesta non valida. 'artist' e 'message' sono obbligatori."
    });
  }

  // Memorizza brevemente lo scambio per contesto (max 3 turni)
  if (!memory[artist]) memory[artist] = [];
  memory[artist].push(`Utente: ${message}`);
  if (memory[artist].length > 6) memory[artist] = memory[artist].slice(-6);

  const context = memory[artist].join("\n");

  const prompt = `
ISTRUZIONI PER IL MODELLO:
- Rispondi come se fossi ${artist}, in prima persona.
- Rispondi in italiano moderno e comprensibile.
- Sii sintetico e preciso. Non divagare. Non continuare con nuove domande o argomenti.
- Rispondi solo alla domanda dell'utente. Non ripetere o correggere la domanda.
- Mantieni il tuo tono coerente con il tuo periodo storico.

Contesto recente della conversazione:
${context}

${artist}:
`.trim();

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato:\n", prompt);

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 120,
          temperature: 0.4,
          top_p: 0.9,
          return_full_text: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const rawOutput = response.data?.[0]?.generated_text || "";
    const reply = rawOutput.split(`${artist}:`).pop().trim();

    if (!reply || reply.length < 5) {
      throw new Error("Risposta troppo breve o vuota");
    }

    console.log("[DEBUG] Risposta Mistral:", reply);
    memory[artist].push(`${artist}: ${reply}`);

    res.json({ reply });

  } catch (err) {
    console.error("[ERRORE] Comunicazione con Hugging Face fallita:", err.message);
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
