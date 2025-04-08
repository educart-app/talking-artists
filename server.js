const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const HF_API_KEY = process.env.HF_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const data = await response.json();

    if (data.generated_text) {
      return res.json({ reply: data.generated_text.replace(prompt, "").trim() });
    }

    if (Array.isArray(data) && data[0]?.generated_text) {
      return res.json({ reply: data[0].generated_text.replace(prompt, "").trim() });
    }

    return res.status(500).json({ error: "Risposta non valida da Hugging Face." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Errore nella richiesta API." });
  }
});

app.listen(port, () => {
  console.log(`Server in esecuzione su porta ${port}`);
});
