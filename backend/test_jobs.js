async function testJobFlow() {
  console.log("1. 🔐 Effettuo il Login per prendere il token...");

  // 1. LOGIN
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "mario.rossi@example.com",
      password: "SuperPassword123!",
    }),
  });

  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    console.log("❌ Login fallito. Impossibile procedere.");
    return;
  }
  console.log("✅ Token ottenuto!");

  // 2. CREAZIONE JOB
  console.log("\n2. 📝 Provo a salvare una candidatura...");
  const jobRes = await fetch("http://localhost:3000/api/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // <--- Ecco il passpartout!
    },
    body: JSON.stringify({
      companyName: "Tech Corp",
      jobTitle: "Senior React Developer",
      status: "APPLIED",
      notes: "Ho mandato il CV via LinkedIn",
    }),
  });

  const jobData = await jobRes.json();
  console.log("Risposta Job:", jobRes.status); // Deve essere 201
  console.log(jobData);

  // 3. LETTURA JOBS
  console.log("\n3. 📚 Leggo la lista delle mie candidature...");
  const listRes = await fetch("http://localhost:3000/api/jobs", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  console.log("Jobs trovati:", listData.length);
  console.log(listData);
}

testJobFlow();
