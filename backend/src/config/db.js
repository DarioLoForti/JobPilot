import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// --- DIAGNOSTICA (Così vediamo nei log se Render passa i dati) ---
console.log("🔍 CONFIGURAZIONE DB AVVIATA");
console.log("1. Ambiente:", process.env.NODE_ENV);
console.log(
  "2. DATABASE_URL presente?",
  process.env.DATABASE_URL ? "SÌ ✅" : "NO ❌ (Userà localhost e fallirà)",
);

const isProduction = process.env.NODE_ENV === "production";

// Configurazione della connessione
const pool = new Pool({
  // Su Render usiamo la connectionString (tutto in uno)
  connectionString: process.env.DATABASE_URL,

  // SSL è OBBLIGATORIO su Render, ma va disattivato in locale se non lo usi
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Listener per errori globali
pool.on("error", (err) => {
  console.error("❌ Errore imprevisto nel client PostgreSQL", err);
  process.exit(-1);
});

// Test connessione immediato all'avvio
pool
  .connect()
  .then(() => console.log("✅ CONNESSIONE AL DATABASE RIUSCITA!"))
  .catch((err) => {
    console.error("❌ ERRORE FATALE CONNESSIONE DB:", err.message);
    if (err.message.includes("ECONNREFUSED")) {
      console.error(
        "👉 SUGGERIMENTO: Manca la variabile DATABASE_URL su Render o è sbagliata.",
      );
    }
  });

export const query = (text, params) => pool.query(text, params);
