// Questo script viene iniettato SOLO quando sei sul tuo sito JobPilot.
// Serve a leggere il token dal LocalStorage del sito e passarlo all'estensione.

console.log("JobPilot Sync: Script di sincronizzazione attivo.");

const syncTokenToExtension = () => {
  try {
    // 1. Legge il token salvato dal tuo sito (Login.jsx usa "token")
    const siteToken = localStorage.getItem("token");

    if (siteToken) {
      // 2. Controlla se l'estensione ha già questo token (per evitare scritture inutili)
      chrome.storage.local.get(["authToken"], (result) => {
        // Se il token è diverso (es. nuovo login) o mancante, lo aggiorniamo
        if (result.authToken !== siteToken) {
          chrome.storage.local.set({ authToken: siteToken }, () => {
            console.log(
              "✅ JobPilot Extension: Token sincronizzato con successo!",
            );
          });
        }
      });
    } else {
      // Opzionale: Se l'utente fa logout dal sito, potremmo voler pulire l'estensione
      // Ma per ora lasciamo stare per evitare logout accidentali
      // console.log("Nessun token trovato sul sito.");
    }
  } catch (e) {
    console.error("Errore durante la sincronizzazione token:", e);
  }
};

// --- ESECUZIONE ---

// 1. Eseguiamo subito appena la pagina si carica
syncTokenToExtension();

// 2. Eseguiamo un controllo ogni secondo (Polling)
// Questo è FONDAMENTALE perché il tuo sito è in React.
// Quando fai login, la pagina non si ricarica davvero, quindi dobbiamo
// continuare a controllare se il token appare nel LocalStorage.
setInterval(syncTokenToExtension, 1000);
