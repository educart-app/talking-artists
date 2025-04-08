const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  // Prompt ottimizzato
  const prompt = `Immagina di essere ${artist}. Rispondi alla seguente domanda come faresti tu:\n${message}`;
  
  /// log!
  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:", prompt);
  console.log("[DEBUG] API Key:", HF_API_KEY ? "✅ Presente" : "❌ MANCANTE");

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
      {
        inputs: {
          text: prompt
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`
        }
      }
    );

    console.log("[DEBUG] Risposta Hugging Face:", response.data);

    const generatedText = response.data?.generated_text;

    if (!generatedText) {
      console.error("[DEBUG] Nessuna risposta generata dal modello.");
      throw new Error("Nessuna risposta generata dal modello.");
    }

    res.json({ reply: generatedText });

  } catch (err) {
    console.error("[ERRORE] Comunicazione fallita con Hugging Face:", err.message);
    res.status(500).json({
      reply: "Errore nella comunicazione con l'artista. Riprova più tardi."
    });
  }
});

// Catch-all per Single Page App
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n✅ Server in ascolto su http://localhost:${PORT}`);
});
