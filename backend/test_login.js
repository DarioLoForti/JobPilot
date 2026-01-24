async function testLogin() {
  console.log("⏳ Tentativo di LOGIN in corso...");

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "mario.rossi@example.com", // Stessa email usata prima
        password: "SuperPassword123!", // Stessa password
      }),
    });

    const data = await response.json();

    console.log("------------------------------------------------");
    console.log("Stato risposta:", response.status); // Deve essere 200
    if (response.status === 200) {
      console.log("✅ SUCCESSO! Login valido.");
      console.log("Token ricevuto:", data.token.substring(0, 20) + "...");
    } else {
      console.log("❌ ERRORE:", data);
    }
    console.log("------------------------------------------------");
  } catch (error) {
    console.error("Errore:", error);
  }
}

testLogin();
