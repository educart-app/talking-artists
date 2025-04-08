let currentArtist = "";
let chatLog = [];
let speechEnabled = false;

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const askBtn = document.getElementById("askBtn");
  const userInput = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const speakToggle = document.getElementById("toggleSpeech");
  const downloadBtn = document.getElementById("downloadChat");
  const emailBtn = document.getElementById("emailChat");

  startBtn.addEventListener("click", () => {
    const artistSelect = document.getElementById("artistSelect");
    const artistInput = document.getElementById("artistInput");
    currentArtist = artistInput.value.trim() || artistSelect.value;

    if (!currentArtist) {
      alert("Scegli o inserisci un artista!");
      return;
    }

    document.getElementById("setup").style.display = "none";
    document.getElementById("chatSection").style.display = "block";

    appendMessage("Sistema", `Parli ora con ${currentArtist}. Cosa vuoi chiedergli?`);
  });

  askBtn.addEventListener("click", inviaDomanda);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") inviaDomanda();
  });

  speakToggle.addEventListener("click", () => {
    speechEnabled = !speechEnabled;
    speakToggle.textContent = speechEnabled ? "🔊 Voce ON" : "🔇 Voce OFF";
  });

  downloadBtn.addEventListener("click", scaricaConversazione);
  emailBtn.addEventListener("click", condividiViaEmail);
});

function appendMessage(sender, text) {
  const chatBox = document.getElementById("chatBox");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  chatLog.push(`${sender}: ${text}`);

  if (sender !== "Tu" && speechEnabled) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    speechSynthesis.speak(utterance);
  }
}

async function inviaDomanda() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("Tu", message);
  input.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, artist: currentArtist })
    });

    const data = await response.json();
    appendMessage(currentArtist, data.reply);
  } catch (error) {
    appendMessage("Sistema", "Errore nella comunicazione con l'artista. Riprova più tardi.");
    console.error("Errore fetch:", error);
  }
}

function scaricaConversazione() {
  const blob = new Blob([chatLog.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `conversazione_con_${currentArtist}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function condividiViaEmail() {
  const subject = `Conversazione con ${currentArtist}`;
  const body = encodeURIComponent(chatLog.join("\n"));
  const mailto = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}
