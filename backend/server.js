import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // Sicurezza Header
import compression from "compression"; // Performance
import rateLimit from "express-rate-limit"; // Anti-DDoS/Brute Force
import path from "path";
import { fileURLToPath } from "url";

// Importiamo le rotte
import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import coachRoutes from "./src/routes/coachRoutes.js";

dotenv.config();

// Configurazione Path per ES Modules (necessario per servire il frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 🛡️ HARDENING & MIDDLEWARE (SICUREZZA)
// ==========================================

// 1. Compressione: Rende le risposte più leggere e veloci
app.use(compression());

// 2. Helmet: Imposta header HTTP sicuri per prevenire attacchi comuni
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabilitato temporaneamente per evitare conflitti con script/immagini
    crossOriginEmbedderPolicy: false,
  }),
);

// 3. Rate Limiting: Protegge le API da troppe richieste (DDoS / Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Limite di 100 richieste per IP ogni 15 minuti
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste da questo IP, riprova più tardi." },
});
app.use("/api", limiter); // Applica il limite solo alle rotte API

// 4. CORS: Configurazione dinamica (Sviluppo vs Produzione)
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL // Es: https://jobpilot.onrender.com (quando sarai online)
      : "http://localhost:5173", // Sviluppo locale
  credentials: true,
};
app.use(cors(corsOptions));

// 5. Body Parser: Aumentiamo il limite per permettere upload di PDF (CV)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==========================================
// 🔗 DEFINIZIONE ROTTE API
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/coach", coachRoutes);

// ==========================================
// 🚀 DEPLOYMENT FRONTEND (PRODUZIONE)
// ==========================================

// Se siamo in produzione, Express serve anche i file statici di React (Vite)
if (process.env.NODE_ENV === "production") {
  // Indica la cartella dove Vite costruisce il frontend (di solito ../frontend/dist)
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Qualsiasi richiesta che non sia un'API viene gestita da React (SPA)
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
  // Rotta di base per test in locale
  app.get("/", (req, res) => {
    res.json({ message: "JobPilot API è online in modalità Sviluppo! 🚀" });
  });
}

// ==========================================
// 🏁 AVVIO SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`
  🚀 Server avviato su http://localhost:${PORT}
  🌍 Modalità: ${process.env.NODE_ENV || "development"}
  🛡️ Sicurezza: Attiva
  `);
});
