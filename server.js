const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "HuggingFaceH4/zephyr-7b-alpha";

if (!HF_API_KEY) {
  console.error("❌ Errore: HF_API_KEY non definita nel file .env");
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

  const prompt = `Sei ${artist}, l'artista storico. Rispondi come faresti tu, in prima persona, con tono coerente con il tuo periodo storico.\n\nDomanda: ${message}\nRisposta:`;

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:", prompt);

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const generatedText = response.data?.[0]?.generated_text?.trim();

    if (!generatedText) {
      throw new Error("Nessuna risposta generata dal modello.");
    }

    console.log("[DEBUG] Risposta Hugging Face:", generatedText);
    res.json({ reply: generatedText });

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
