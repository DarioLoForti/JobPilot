import pg from "pg";
import dotenv from "dotenv";

// Carica le variabili .env
dotenv.config();

const { Pool } = pg;

// Creiamo il "pool" di connessioni
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Listener per errori globali del database
pool.on("error", (err) => {
  console.error("Errore imprevisto nel client PostgreSQL", err);
  process.exit(-1);
});

// Esportiamo una funzione per fare query in modo semplice
export const query = (text, params) => pool.query(text, params);
