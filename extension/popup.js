document.addEventListener("DOMContentLoaded", async () => {
  // CONFIGURAZIONE
  const BACKEND_URL = "https://jobpilot-app-mr2e.onrender.com"; // Il tuo sito live

  // Elementi DOM
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");
  const tokenSection = document.getElementById("token-section");
  const mainForm = document.getElementById("main-form");
  const loginMsg = document.getElementById("login-msg");
  const tokenInput = document.getElementById("tokenInput");
  const loginLinkBtn = document.getElementById("loginLinkBtn"); // Assicurati di avere un bottone con questo ID nell'HTML se vuoi il redirect

  // Bottoni Settings
  const showSettingsBtn = document.getElementById("showSettingsBtn");
  const cancelSettings = document.getElementById("cancelSettings");
  const saveTokenBtn = document.getElementById("saveToken");
  const openSettings = document.getElementById("openSettings");

  // 1. CARICA TOKEN (Nota: usiamo 'authToken' come definito in sync-token.js)
  const stored = await chrome.storage.local.get(["authToken"]);
  let token = stored.authToken;

  // Gestione UI Iniziale
  if (token) {
    mainForm.style.display = "block";
    loginMsg.style.display = "none";
    tokenSection.style.display = "none";
  } else {
    mainForm.style.display = "none";
    loginMsg.style.display = "block";
  }

  // Listener per aprire il sito e fare login (Sync automatico)
  if (loginLinkBtn) {
    loginLinkBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${BACKEND_URL}/login` });
    });
  }

  // 2. SCRAPING DELLA PAGINA CORRENTE
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id) {
    try {
      chrome.tabs.sendMessage(tab.id, { action: "SCRAPE" }, (response) => {
        // Gestione errore se content script non risponde (es. pagina non ricaricata)
        if (chrome.runtime.lastError) {
          statusDiv.innerText =
            "Ricarica la pagina LinkedIn/Indeed per attivare l'estensione.";
          statusDiv.className = "status error";
          return;
        }

        if (response) {
          document.getElementById("company").value = response.company || "";
          document.getElementById("position").value = response.title || "";
          document.getElementById("description").value =
            response.description || "";
          document.getElementById("url").value = response.url || tab.url;
        }
      });
    } catch (e) {
      console.error("Errore scraping:", e);
      statusDiv.innerText = "Impossibile leggere la pagina.";
    }
  }

  // --- LOGICA GESTIONE MANUALE TOKEN (FALLBACK) ---

  const showTokenInput = () => {
    mainForm.style.display = "none";
    loginMsg.style.display = "none";
    tokenSection.style.display = "block";
    tokenInput.value = token || "";
  };

  if (showSettingsBtn)
    showSettingsBtn.addEventListener("click", showTokenInput);
  if (openSettings) openSettings.addEventListener("click", showTokenInput);

  cancelSettings.addEventListener("click", () => {
    tokenSection.style.display = "none";
    if (token) mainForm.style.display = "block";
    else loginMsg.style.display = "block";
  });

  saveTokenBtn.addEventListener("click", () => {
    const t = tokenInput.value.trim();
    if (t) {
      // Salviamo come 'authToken' per coerenza
      chrome.storage.local.set({ authToken: t }, () => {
        token = t;
        tokenSection.style.display = "none";
        mainForm.style.display = "block";
        statusDiv.innerText = "Token aggiornato manualmente!";
        statusDiv.className = "status success";
      });
    }
  });

  // --------------------------------------

  // 4. SALVA JOB NEL BACKEND (RENDER)
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.innerText = "Salvataggio...";
    statusDiv.innerText = "";

    const jobData = {
      company: document.getElementById("company").value,
      position: document.getElementById("position").value,
      job_link: document.getElementById("url").value,
      job_description: document.getElementById("description").value,
      status: "wishlist", // Stato iniziale di default
      notes: "Importato via JobPilot Clipper",
    };

    try {
      // CHIAMATA AL SERVER ONLINE
      const res = await fetch(`${BACKEND_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Header Auth Fondamentale
        },
        body: JSON.stringify(jobData),
      });

      if (res.ok) {
        statusDiv.innerText = "Salvato con successo! 🎉";
        statusDiv.className = "status success";
        setTimeout(() => window.close(), 1500);
      } else if (res.status === 401) {
        statusDiv.innerHTML = "Sessione scaduta. Fai login sul sito.";
        statusDiv.className = "status error";
        // Opzionale: pulire il token scaduto
        // chrome.storage.local.remove('authToken');
      } else {
        const errData = await res.json();
        statusDiv.innerText = `Errore: ${errData.message || "Riprova"}`;
        statusDiv.className = "status error";
      }
    } catch (error) {
      console.error(error);
      statusDiv.innerText = "Errore di connessione al server.";
      statusDiv.className = "status error";
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerText = "Salva in JobPilot";
    }
  });
});
