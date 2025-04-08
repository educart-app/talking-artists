const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const startChatBtn = document.getElementById("start-chat");
const artistInput = document.getElementById("artist-input");
const artistDropdown = document.getElementById("artist-dropdown");
const voiceToggle = document.getElementById("voice-toggle");
const downloadBtn = document.getElementById("download-btn");
const emailBtn = document.getElementById("email-btn");

let conversationHistory = [];
let selectedArtist = "";

// Avvio della conversazione
startChatBtn.addEventListener("click", () => {
  selectedArtist = artistInput.value.trim() || artistDropdown.value;
  if (!selectedArtist) {
    alert("Seleziona o scrivi il nome di un artista.");
    return;
  }

  document.getElementById("artist-selection").classList.add("hidden");
  document.getElementById("chat-section").classList.remove("hidden");

  const welcomeMessage = `Parli ora con ${selectedArtist}. Cosa vuoi chiedergli?`;
  addMessage(welcomeMessage, "bot");
  conversationHistory = [`Tu stai parlando con ${selectedArtist}.`];
});

// Invia messaggio
sendBtn.addEventListener("click", async () => {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";

  conversationHistory.push(`Utente: ${message}`);

  const loadingMsg = addMessage("...", "bot");

  const response = await queryHuggingFace(conversationHistory.join("\n"));

  loadingMsg.remove();

  if (response) {
    const finalResponse = `${selectedArtist}: ${response}`;
    conversationHistory.push(finalResponse);
    addMessage(response, "bot");

    if (voiceToggle.checked) {
      speak(response);
    }
  } else {
    addMessage("Errore nella comunicazione con l'artista. Riprova più tardi.", "bot");
  }
});

// Aggiunge messaggi alla chat
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Chiamata al backend proxy
async function queryHuggingFace(prompt) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    return data.reply || null;
  } catch (error) {
    console.error("Errore API (proxy):", error);
    return null;
  }
}

// Sintesi vocale (usata solo se voice.js è incluso)
function speak(text) {
  if (!'speechSynthesis' in window) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

// Esporta o condivide (verranno gestiti in utils.js)
downloadBtn?.addEventListener("click", () => {
  const blob = new Blob([conversationHistory.join("\n\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversazione_${selectedArtist.replace(/\s/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

emailBtn?.addEventListener("click", () => {
  const subject = `Conversazione con ${selectedArtist}`;
  const body = encodeURIComponent(conversationHistory.join("\n\n"));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
});
