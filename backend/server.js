import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import coachRoutes from "./src/routes/coachRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste da questo IP, riprova più tardi." },
});
app.use("/api", limiter);

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// 🛠️ FIX DATABASE (AGGIORNAMENTO SCHEMA)
// ==========================================
app.get("/fix-db", async (req, res) => {
  try {
    console.log("🛠️ Inizio aggiornamento schema database...");

    // 1. Colonna per il link (Estensione)
    await query(
      "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS job_link TEXT",
    );

    // 2. Colonna per il logo (Estetica)
    await query(
      "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS company_logo TEXT",
    );

    // 3. 🔥 COLONNA MANCANTE (Fix attuale)
    await query(
      "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP",
    );

    // 4. Tabella CV History
    await query(`
      CREATE TABLE IF NOT EXISTS cv_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database aggiornato con successo.");
    res.send(
      "✅ Database fixato! Aggiunte colonne: job_link, company_logo, interview_date.",
    );
  } catch (error) {
    console.error("❌ Errore fix db:", error);
    res.status(500).send("Errore fix db: " + error.message);
  }
});

// ==========================================
// 🛠️ SETUP DATABASE (SOLO NUOVI UTENTI)
// ==========================================
app.get("/setup-db", async (req, res) => {
  try {
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

    // Aggiornata con tutte le colonne nuove
    await query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company VARCHAR(150) NOT NULL,
        position VARCHAR(150) NOT NULL,
        job_description TEXT,
        job_link TEXT,
        company_logo TEXT,
        interview_date TIMESTAMP,  -- Eccola qui per i nuovi DB
        status VARCHAR(50) DEFAULT 'WISH',
        match_score INTEGER,
        analysis_results JSONB,
        generated_cover_letter TEXT,
        date_applied DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await query(`
      CREATE TABLE IF NOT EXISTS cv_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    res.send(
      "✅ Database configurato con successo! Tutte le tabelle complete.",
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Errore creazione tabelle: " + error.message);
  }
});

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

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
