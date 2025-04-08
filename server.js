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

  // Prompt ottimizzato per simulare il personaggio
  const prompt = `Immagina di essere ${artist}. Rispondi alla seguente domanda come faresti tu:\n${message}`;

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

    const generatedText = response.data?.generated_text;

    if (!generatedText) {
      throw new Error("Nessuna risposta generata dal modello.");
    }

    res.json({ reply: generatedText });

  } catch (err) {
    console.error("Errore nella richiesta HuggingFace:", err.message);
    res.status(500).json({ reply: "Errore nella comunicazione con l'artista. Riprova più tardi." });
  }
});

// Catch-all per gestire richieste client-side
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
