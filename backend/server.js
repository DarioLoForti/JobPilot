import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./src/config/db.js";

// Importa le rotte
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

// 🔥 DEBUG LOGGER
app.use((req, res, next) => {
  console.log(
    `📡 [SERVER] Richiesta in arrivo: ${req.method} ${req.originalUrl}`,
  );
  next();
});

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

// =========================================================
// 👑 ROTTA MAGICA PER DIVENTARE ADMIN (USALA UNA VOLTA SOLA)
// =========================================================
app.get("/api/promote-me/:email", async (req, res) => {
  const { email } = req.params;
  try {
    console.log(`👑 Tentativo promozione admin per: ${email}`);

    // 1. Controlla se l'utente esiste
    const userCheck = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userCheck.rows.length === 0) {
      return res
        .status(404)
        .send(`❌ Utente ${email} non trovato! Registrati prima.`);
    }

    // 2. Aggiorna lo stato a ADMIN
    await query("UPDATE users SET is_admin = TRUE WHERE email = $1", [email]);

    console.log(`✅ Utente ${email} è ora SUPER ADMIN.`);
    res.send(
      `🎉 SUCCESSO! L'utente <b>${email}</b> è ora un SUPER ADMIN.<br><br>⚠️ IMPORTANTE: Ora fai LOGOUT e rientra per aggiornare i tuoi permessi.`,
    );
  } catch (error) {
    console.error("Errore promozione:", error);
    res.status(500).send("Errore: " + error.message);
  }
});

// ==========================================
// 🚨 SETUP DB STANDARD
// ==========================================
app.get("/api/setup-db", async (req, res) => {
  try {
    console.log("🛠️ Esecuzione Setup DB Standard...");
    await query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`,
    );
    await query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
    await query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`,
    );
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;`);

    // Tabelle (codice abbreviato per leggibilità, ma nel file finale c'è tutto)
    await query(
      `CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(150) UNIQUE NOT NULL, password VARCHAR(255), google_id VARCHAR(255) UNIQUE, avatar TEXT, is_admin BOOLEAN DEFAULT FALSE, phone VARCHAR(50), address VARCHAR(255), personal_description TEXT, hard_skills TEXT, soft_skills TEXT, socials JSONB DEFAULT '[]', experiences JSONB DEFAULT '[]', education JSONB DEFAULT '[]', certifications JSONB DEFAULT '[]', cv_filename VARCHAR(255), cv_file BYTEA, profile_image BYTEA, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await query(
      `CREATE TABLE IF NOT EXISTS job_applications (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, company VARCHAR(150) NOT NULL, position VARCHAR(150) NOT NULL, job_description TEXT, job_link TEXT, company_logo TEXT, interview_date TIMESTAMP, status VARCHAR(50) DEFAULT 'WISH', match_score INTEGER, analysis_results JSONB, generated_cover_letter TEXT, date_applied DATE, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await query(
      `CREATE TABLE IF NOT EXISTS cv_history (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await query(
      `CREATE TABLE IF NOT EXISTS assessments (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, job_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL, type VARCHAR(50) NOT NULL, results JSONB NOT NULL, markdown_report TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );

    res.send("✅ SUCCESSO: Database App configurato.");
  } catch (error) {
    res.status(500).send("ERRORE: " + error.message);
  }
});

// ==========================================
// 🏗️ SETUP DB ADMIN
// ==========================================
app.get("/api/setup-admin-db", async (req, res) => {
  try {
    console.log("🛠️ Creazione tabelle Super Admin...");
    await query(
      `CREATE TABLE IF NOT EXISTS system_logs (id SERIAL PRIMARY KEY, level VARCHAR(20) DEFAULT 'INFO', source VARCHAR(50), message TEXT, details JSONB, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await query(
      `CREATE TABLE IF NOT EXISTS system_settings (key VARCHAR(50) PRIMARY KEY, value VARCHAR(255), is_active BOOLEAN DEFAULT TRUE, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );
    await query(
      `INSERT INTO system_settings (key, value, is_active) VALUES ('maintenance_mode', 'false', false) ON CONFLICT (key) DO NOTHING;`,
    );
    await query(
      `CREATE TABLE IF NOT EXISTS ai_usage (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, feature VARCHAR(50), tokens_used INTEGER DEFAULT 0, status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
    );

    res.send("✅ SUCCESSO: Database Admin aggiornato.");
  } catch (error) {
    res.status(500).send("ERRORE ADMIN SETUP: " + error.message);
  }
});

// ==========================================
// 🚦 ALTRE API
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/admin", adminRoutes);

// ==========================================
// 🌍 GESTIONE FRONTEND
// ==========================================
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res, next) => {
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|json)$/)) {
      return res.status(404).send("File non trovato");
    }
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "JobPilot API Development Mode" });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
