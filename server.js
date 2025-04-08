const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "tiiuae/falcon-7b-instruct"; // Modello compatibile con text generation

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!message || !artist) {
    return res.status(400).json({ reply: "Richiesta non valida. Artist e message sono obbligatori." });
  }

  const prompt = `Immagina di essere ${artist}. Rispondi alla seguente domanda come faresti tu:\n${message}`;

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:", prompt);
  console.log("[DEBUG] API Key:", HF_API_KEY ? "✅ Presente" : "❌ MANCANTE");

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
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

    console.log("[DEBUG] Risposta Hugging Face:", response.data);

    const generatedText = response.data?.[0]?.generated_text;

    if (!generatedText) {
      console.error("[DEBUG] Nessuna risposta generata dal modello.");
      throw new Error("Nessuna risposta generata dal modello.");
    }

    res.json({ reply: generatedText.trim() });

  } catch (err) {
    console.error("[ERRORE] Comunicazione fallita con Hugging Face:", err.message);
    res.status(500).json({
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
