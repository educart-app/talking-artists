// Esporta una conversazione come file .txt
function downloadConversation(history, artist) {
    const blob = new Blob([history.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = `conversazione_${artist.replace(/\s/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  // Crea un'email con il contenuto della conversazione
  function emailConversation(history, artist) {
    const subject = `Conversazione con ${artist}`;
    const body = encodeURIComponent(history.join("\n\n"));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
  