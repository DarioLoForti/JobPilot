document.addEventListener("DOMContentLoaded", async () => {
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");
  const tokenSection = document.getElementById("token-section");
  const mainForm = document.getElementById("main-form");
  const loginMsg = document.getElementById("login-msg");
  const tokenInput = document.getElementById("tokenInput");

  // Bottoni
  const showSettingsBtn = document.getElementById("showSettingsBtn");
  const cancelSettings = document.getElementById("cancelSettings");
  const saveTokenBtn = document.getElementById("saveToken");
  const openSettings = document.getElementById("openSettings");

  // 1. Carica Token
  const stored = await chrome.storage.local.get(["token"]);
  let token = stored.token;

  if (!token) {
    mainForm.style.display = "none";
    loginMsg.style.display = "block";
  }

  // 2. Chiedi dati alla pagina
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    chrome.tabs.sendMessage(tab.id, { action: "SCRAPE" }, (response) => {
      if (response) {
        document.getElementById("company").value = response.company || "";
        document.getElementById("position").value = response.title || "";
        document.getElementById("description").value =
          response.description || "";
        document.getElementById("url").value = response.url || "";
      }
    });
  } catch (e) {
    statusDiv.innerText = "Apri LinkedIn o Indeed per catturare i dati.";
  }

  // --- LOGICA GESTIONE TOKEN (NUOVA) ---

  // Mostra il campo token
  const showTokenInput = () => {
    mainForm.style.display = "none";
    loginMsg.style.display = "none";
    tokenSection.style.display = "block";
    tokenInput.value = token || ""; // Precompila se esiste
  };

  showSettingsBtn.addEventListener("click", showTokenInput);
  openSettings.addEventListener("click", showTokenInput);

  // Nascondi campo token
  cancelSettings.addEventListener("click", () => {
    tokenSection.style.display = "none";
    if (token) mainForm.style.display = "block";
    else loginMsg.style.display = "block";
  });

  // Salva il nuovo token
  saveTokenBtn.addEventListener("click", () => {
    const t = tokenInput.value.trim();
    if (t) {
      chrome.storage.local.set({ token: t }, () => {
        token = t;
        // Ricarica la vista
        tokenSection.style.display = "none";
        mainForm.style.display = "block";
        statusDiv.innerText = "Token aggiornato!";
        statusDiv.className = "status success";
      });
    }
  });

  // --------------------------------------

  // 4. Salva Job nel Backend
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.innerText = "Salvataggio...";

    const jobData = {
      company: document.getElementById("company").value,
      position: document.getElementById("position").value,
      job_link: document.getElementById("url").value,
      job_description: document.getElementById("description").value,
      status: "wishlist",
      notes: "Importato via JobPilot Clipper",
    };

    try {
      const res = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (res.ok) {
        statusDiv.innerText = "Salvato con successo! 🎉";
        statusDiv.className = "status success";
        setTimeout(() => window.close(), 1500);
      } else {
        // Se fallisce, suggeriamo di cambiare token
        statusDiv.innerHTML =
          "Errore. <u style='cursor:pointer' id='errUpdate'>Aggiorna Token</u>";
        statusDiv.className = "status error";
        document
          .getElementById("errUpdate")
          .addEventListener("click", showTokenInput);
      }
    } catch (error) {
      statusDiv.innerText = "Errore connessione server (localhost:5000).";
      statusDiv.className = "status error";
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerText = "Salva in JobPilot";
    }
  });
});
