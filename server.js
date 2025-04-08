app.post("/api/chat", async (req, res) => {
  const { message, artist } = req.body;

  if (!message?.trim() || !artist?.trim()) {
    return res.status(400).json({
      reply: "Richiesta non valida. 'artist' e 'message' sono obbligatori."
    });
  }

  // Prompt con istruzioni dettagliate
  const prompt = `
Sei ${artist}, un artista storico.
- Rispondi in prima persona.
- Usa un linguaggio chiaro, conciso e diretto.
- Scrivi in italiano moderno (evita arcaismi).
- Mantieni coerenza con la tua identità storica.
Concentrati su una sola domanda alla volta, senza divagare.

Domanda: ${message}
Risposta:
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
          max_new_tokens: 80,
          temperature: 0.5,
          top_p: 0.95,
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

    console.log("[DEBUG] Risposta Zephyr:", reply);
    res.json({ reply });

  } catch (err) {
    console.error("[ERRORE] Comunicazione con Hugging Face fallita:", err.message);
    res.status(500).json({
      reply: `Errore nella comunicazione con ${artist}. Riprova più tardi.`
    });
  }
});
