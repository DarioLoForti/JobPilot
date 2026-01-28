import pg from "pg";
import dotenv from "dotenv";

// Carica le variabili d'ambiente
dotenv.config();

const { Pool } = pg;

// 🛠️ CONFIGURAZIONE DINAMICA (Locale vs Produzione)
// Se c'è DATABASE_URL (Render) usa quella, altrimenti usa le variabili singole (Locale)
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Obbligatorio per Render
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: String(process.env.DB_PASSWORD), // Forziamo a stringa per evitare l'errore SASL
      port: process.env.DB_PORT,
    };

const pool = new Pool(dbConfig);

const updateDatabaseAndMakeAdmin = async () => {
  // ⚠️ LA TUA EMAIL (Assicurati che sia corretta)
  const adminEmail = "workloforti@gmail.com";

  try {
    console.log("🔌 Connessione al database in corso...");

    // 1. SETUP ADMIN
    console.log("1️⃣  Verifica/Creazione colonna 'is_admin'...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    // 2. SETUP GOOGLE OAUTH
    console.log("2️⃣  Aggiornamento tabella per Google Login...");
    await pool.query(`
      ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
    `);

    // 3. PROMOZIONE UTENTE
    console.log(`3️⃣  Promozione utente ${adminEmail}...`);
    const result = await pool.query(
      `
      UPDATE users 
      SET is_admin = TRUE 
      WHERE email = $1 
      RETURNING id, first_name, email, is_admin;
    `,
      [adminEmail],
    );

    if (result.rows.length > 0) {
      console.log("✅ SUCCESSO! Database aggiornato e Admin attivo:");
      console.table(result.rows[0]);
    } else {
      console.error(
        `❌ ERRORE: L'utente '${adminEmail}' non esiste nel database locale.`,
      );
      console.log(
        "💡 SUGGERIMENTO: Registrati prima dal sito (localhost:5173), poi riesegui questo comando.",
      );
    }
  } catch (error) {
    console.error("❌ Errore SQL:", error.message);
  } finally {
    await pool.end();
    console.log("👋 Connessione chiusa.");
  }
};

updateDatabaseAndMakeAdmin();
