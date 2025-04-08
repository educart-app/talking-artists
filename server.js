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

  const prompt = `Tu sei ${artist}, un grande artista del passato. Rispondi alla seguente domanda nel tuo stile, come se fossi in vita nel presente:\nDomanda: ${message}\nRisposta:`;

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:", prompt);
  console.log("[DEBUG] API Key:", HF_API_KEY ? "✅ Presente" : "❌ MANCANTE");

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.8,
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

    const hfOutput = response.data;

    console.log("[DEBUG] Risposta Hugging Face:", hfOutput);

    const generatedText = hfOutput?.[0]?.generated_text?.trim();

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

// Catch-all per SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server in ascolto su http://localhost:${PORT}`);
});
