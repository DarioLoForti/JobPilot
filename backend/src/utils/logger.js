import { query } from "../config/db.js";

/**
 * Salva un errore nel Database (System Logs)
 * @param {string} source - Da dove viene l'errore (es. "Auth", "AI", "Database")
 * @param {string} message - Il messaggio di errore
 * @param {object} details - Dettagli tecnici (es. l'oggetto error completo)
 * @param {number|null} userId - ID dell'utente che ha causato l'errore (opzionale)
 */
export const logError = async (
  source,
  message,
  details = {},
  userId = null,
) => {
  try {
    // 1. Stampiamo comunque su Render per sicurezza
    console.error(`🔴 [${source}] ${message}`, details);

    // 2. Salviamo nel Database
    // Convertiamo i dettagli in stringa se sono un oggetto Error
    const safeDetails =
      details instanceof Error
        ? { message: details.message, stack: details.stack }
        : details;

    await query(
      "INSERT INTO system_logs (level, source, message, details, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["ERROR", source, message, JSON.stringify(safeDetails), userId],
    );
  } catch (err) {
    // Se fallisce il logger, stampiamo solo in console per non bloccare tutto
    console.error("⚠️ CRITICAL: Impossibile salvare il log nel DB:", err);
  }
};

/**
 * Salva un'azione importante (Info)
 */
export const logInfo = async (source, message, details = {}, userId = null) => {
  try {
    console.log(`🟢 [${source}] ${message}`);
    await query(
      "INSERT INTO system_logs (level, source, message, details, user_id) VALUES ($1, $2, $3, $4, $5)",
      ["INFO", source, message, JSON.stringify(details), userId],
    );
  } catch (err) {
    console.error("⚠️ Log Info Error:", err);
  }
};
