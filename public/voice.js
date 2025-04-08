function speak(text) {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis non supportata nel browser.");
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; // lingua italiana
    utterance.rate = 1;       // velocità normale
    utterance.pitch = 1;      // tono normale
  
    // Stop eventuali voci precedenti in esecuzione
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
  