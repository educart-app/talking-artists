const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;

if (!HF_API_KEY) {
  console.error("❌ API Key Hugging Face mancante. Imposta HF_API_KEY nel file .env");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!artist || !message) {
    return res.status(400).json({ reply: "Dati mancanti. Specifica artista e messaggio." });
  }

  const prompt = `Immagina di essere ${artist}. Rispondi alla seguente domanda come faresti tu:\n${message}`;

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:", prompt);
  console.log("[DEBUG] API Key:", HF_API_KEY ? "✅ Presente" : "❌ MANCANTE");

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
      {
        inputs: prompt, // CORRETTO: non serve { text: ... }
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
      }
    );

    const generatedText = response.data.generated_text;

    if (!generatedText) {
      console.error("[DEBUG] Nessuna risposta generata dal modello.");
      return res.status(502).json({ reply: "Il modello non ha generato alcuna risposta." });
    }

    console.log("[DEBUG] Risposta generata:", generatedText);
    res.json({ reply: generatedText });

  } catch (err) {
    console.error("[ERRORE] Comunicazione fallita con Hugging Face:", err.message);
    if (err.response) {
      console.error("[DEBUG] Stato:", err.response.status);
      console.error("[DEBUG] Risposta:", err.response.data);
    }
    res.status(503).json({
      reply: "Errore nella comunicazione con l'artista. Riprova più tardi."
    });
  }
});

// Catch-all per SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n✅ Server in ascolto su http://localhost:${PORT}`);
});
