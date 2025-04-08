const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "tiiuae/falcon-7b-instruct";

if (!HF_API_KEY) {
  console.error("❌ Errore: HF_API_KEY non definita nel file .env");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Funzione di richiesta Hugging Face
async function fetchHuggingFaceResponse(prompt) {
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

    const output = response.data?.[0]?.generated_text?.trim();
    return output || null;

  } catch (err) {
    console.error("[ERRORE] Errore richiesta Hugging Face:", err.message);
    return null;
  }
}

// Endpoint /api/chat
app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!message?.trim() || !artist?.trim()) {
    return res.status(400).json({
      reply: "Richiesta non valida. 'artist' e 'message' sono obbligatori."
    });
  }

  const primaryPrompt = `Immagina di essere ${artist}. Rispondi alla seguente domanda come faresti tu:\n${message}`;
  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt 1:", primaryPrompt);

  let reply = await fetchHuggingFaceResponse(primaryPrompt);

  // Retry automatico se prima risposta è nulla o troppo corta
  if (!reply || reply.length < 10) {
    console.warn("[DEBUG] Prima risposta insufficiente. Ritento con prompt alternativo...");

    const retryPrompt = `Rispondi come se fossi ${artist}. Domanda: ${message}`;
    console.log("[DEBUG] Prompt 2 (retry):", retryPrompt);

    reply = await fetchHuggingFaceResponse(retryPrompt);
  }

  // Se ancora nulla, restituisci errore user-friendly
  if (!reply) {
    return res.status(502).json({
      reply: `Mi dispiace, ${artist} al momento non riesce a rispondere. Prova a riformulare la domanda.`
    });
  }

  console.log("[DEBUG] Risposta finale:", reply);
  res.json({ reply });
});

// Catch-all per SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server in ascolto su http://localhost:${PORT}`);
});
