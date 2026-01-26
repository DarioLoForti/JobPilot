import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // Sicurezza Header
import compression from "compression"; // Performance
import rateLimit from "express-rate-limit"; // Anti-DDoS/Brute Force
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./src/config/db.js"; // Importiamo query per il setup DB

// Importiamo le rotte
import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import coachRoutes from "./src/routes/coachRoutes.js";

dotenv.config();

// Configurazione Path per ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔥 FIX PER RENDER: Indispensabile per far funzionare Rate Limit dietro un proxy
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// ==========================================
// 🛡️ HARDENING & MIDDLEWARE (SICUREZZA)
// ==========================================

// 1. Compressione
app.use(compression());

// 2. Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste da questo IP, riprova più tardi." },
});
app.use("/api", limiter);

// 4. CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL // Es: https://jobpilot-app.onrender.com
      : "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// 5. Body Parser
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
// 🛠️ SETUP DATABASE (SOLO PER PRIMO AVVIO)
// ==========================================
// Visita questa rotta una volta deployato per creare le tabelle!
app.get("/setup-db", async (req, res) => {
  try {
    // 1. Tabella Utenti
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address VARCHAR(255),
        personal_description TEXT,
        hard_skills TEXT,
        soft_skills TEXT,
        socials JSONB DEFAULT '[]',
        experiences JSONB DEFAULT '[]',
        education JSONB DEFAULT '[]',
        certifications JSONB DEFAULT '[]',
        cv_filename VARCHAR(255),
        cv_file BYTEA,
        profile_image BYTEA,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabella Job Applications
    await query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company VARCHAR(150) NOT NULL,
        position VARCHAR(150) NOT NULL,
        job_description TEXT,
        status VARCHAR(50) DEFAULT 'WISH',
        match_score INTEGER,
        analysis_results JSONB,
        generated_cover_letter TEXT,
        date_applied DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabella Assessments
    await query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        results JSONB NOT NULL,
        markdown_report TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.send(
      "✅ Database configurato con successo! Tabelle create (se non esistevano).",
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Errore creazione tabelle: " + error.message);
  }
});

// ==========================================
// 🚀 DEPLOYMENT FRONTEND (PRODUZIONE)
// ==========================================

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
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
