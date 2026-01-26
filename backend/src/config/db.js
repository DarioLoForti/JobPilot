import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

// --- DIAGNOSTICA ---
console.log("🔍 CONFIGURAZIONE DB AVVIATA");
console.log(
  `🌍 Ambiente: ${isProduction ? "PRODUZIONE (Render)" : "SVILUPPO (Locale)"}`,
);

let poolConfig;

// LOGICA IBRIDA:
if (process.env.DATABASE_URL) {
  // CASO 1: SIAMO SU RENDER (o c'è una connection string)
  console.log("✅ Rilevata Connection String (Modalità Cloud)");
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Obbligatorio per Render
  };
} else {
  // CASO 2: SIAMO IN LOCALE (Usa le variabili vecchie)
  console.log("🏠 Nessuna Connection String rilevata (Modalità Locale)");
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false, // Niente SSL in locale
  };
}

const pool = new Pool(poolConfig);

// Listener errori
pool.on("error", (err) => {
  console.error("❌ Errore imprevisto client PG:", err);
  process.exit(-1);
});

// Test connessione
pool
  .connect()
  .then(() => console.log("✅ CONNESSIONE DATABASE RIUSCITA!"))
  .catch((err) => {
    console.error("❌ ERRORE CONNESSIONE DB:", err.message);
  });

export const query = (text, params) => pool.query(text, params);
