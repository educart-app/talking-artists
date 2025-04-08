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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Memoria contestuale breve per sessione (in memoria volatile)
const conversationHistory = new Map();

app.post("/api/chat", async (req, res) => {
  const { message, artist, sessionId } = req.body;

  if (!message?.trim() || !artist?.trim() || !sessionId) {
    return res.status(400).json({ reply: "Dati mancanti: 'artist', 'message' e 'sessionId' sono obbligatori." });
  }

  // System prompt: simula l'artista con linguaggio moderno e risposte concise
  const systemPrompt = `Sei ${artist}, un artista storico. Rispondi in prima persona, in modo chiaro, conciso e in italiano moderno, mantenendo la tua identità storica.`

  // Recupera o inizializza la memoria breve
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }

  const history = conversationHistory.get(sessionId);
  history.push({ role: "user", content: message });

  // Costruzione del prompt con contesto
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-3), // limita il contesto alle ultime 3 interazioni
  ];

  const prompt = messages.map(m => `${m.role === "system" ? "[SYSTEM]" : "[USER]"} ${m.content}`).join("\n");

  console.log("\n[DEBUG] Artista:", artist);
  console.log("[DEBUG] Messaggio:", message);
  console.log("[DEBUG] Prompt inviato al modello:\n", prompt);
  console.log("[DEBUG] API Key:", HF_API_KEY ? "✅ Presente" : "❌ MANCANTE");

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

    const reply = response.data?.[0]?.generated_text?.trim();

    if (!reply) {
      throw new Error("Nessuna risposta generata dal modello.");
    }

    console.log("[DEBUG] Risposta del modello:", reply);

    // Aggiungi risposta del modello alla conversazione
    history.push({ role: "assistant", content: reply });
    conversationHistory.set(sessionId, history);

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

// Avvio server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
