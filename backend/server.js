import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Importiamo le rotte
import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import userRoutes from "./src/routes/userRoutes.js"; // Gestione Utente e Immagini DB
import aiRoutes from "./src/routes/aiRoutes.js"; // Gestione AI e CV
import coachRoutes from "./src/routes/coachRoutes.js";

dotenv.config();

const app = express();
// Impostiamo la porta 5000 come default (fondamentale per il frontend Vite)
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- DEFINIZIONE ROTTE ---

// Autenticazione (Login/Register)
app.use("/api/auth", authRoutes);

// Gestione Candidature (Job Board)
app.use("/api/jobs", jobRoutes);

// Gestione Profilo Utente (inclusa Immagine Profilo dal DB)
// Nota: Il frontend chiama /api/users/profile, quindi qui usiamo /api/users
app.use("/api/users", userRoutes);

// Gestione Intelligenza Artificiale (Generazione Lettere e Analisi CV)
app.use("/api/ai", aiRoutes);

// Gestione AI Coach
app.use("/api/coach", coachRoutes);

// Health Check (Rotta di base per testare se il server è vivo)
app.get("/", (req, res) => {
  res.json({ message: "JobPilot API è online e operativa! 🚀" });
});

// Avvio Server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
