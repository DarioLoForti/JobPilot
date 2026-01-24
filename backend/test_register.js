// Questo script simula un Frontend che invia dati
async function testRegistration() {
  console.log("⏳ Tentativo di registrazione in corso...");

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "mario.rossi@example.com",
        password: "SuperPassword123!",
        firstName: "Mario",
        lastName: "Rossi",
      }),
    });

    const data = await response.json();

    console.log("------------------------------------------------");
    console.log("Stato risposta:", response.status); // Dovrebbe essere 201
    console.log("Dati ricevuti:", data);
    console.log("------------------------------------------------");

    if (response.status === 201) {
      console.log("✅ SUCCESSO! Utente creato e token ricevuto.");
    } else {
      console.log("❌ ERRORE: Qualcosa non va.", data);
    }
  } catch (error) {
    console.error("Errore di connessione:", error);
  }
}

testRegistration();
