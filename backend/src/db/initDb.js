import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../config/db.js"; // Importiamo la nostra connessione

// Trucco per ottenere __dirname nei moduli ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDb = async () => {
  try {
    // 1. Legge il file SQL
    const sqlPath = path.join(__dirname, "schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    console.log("🔄 Inizio creazione tabelle...");

    // 2. Esegue il codice SQL nel database
    await query(sqlContent);

    console.log("✅ Tabelle create con successo!");
    process.exit(0); // Esce con successo
  } catch (error) {
    console.error("❌ Errore durante la creazione delle tabelle:", error);
    process.exit(1); // Esce con errore
  }
};

initDb();
