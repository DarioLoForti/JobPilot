import { query } from "../config/db.js";
import { logError } from "../utils/logger.js"; // 👈 Importante: Importiamo il logger

// 1. LISTA UTENTI (Con statistiche Job)
export const getAllUsers = async (req, res) => {
  try {
    const text = `
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.created_at,
        u.is_admin,
        u.google_id, -- Aggiunto per vedere chi usa Google
        COUNT(j.id) as total_jobs
      FROM users u
      LEFT JOIN job_applications j ON u.id = j.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (error) {
    // Salviamo l'errore nel DB per vederlo nella dashboard
    await logError("Admin", "Errore recupero lista utenti", error, req.user.id);
    res.status(500).json({ error: "Errore server admin" });
  }
};

// 2. ELIMINA UTENTE
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Cancelliamo prima i dati collegati (pulizia manuale per sicurezza)
    await query("DELETE FROM job_applications WHERE user_id = $1", [id]);
    await query("DELETE FROM cv_history WHERE user_id = $1", [id]);
    await query("DELETE FROM ai_usage WHERE user_id = $1", [id]); // Pulisce uso AI
    await query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Utente eliminato con successo." });
  } catch (error) {
    await logError(
      "Admin",
      `Errore eliminazione utente ID: ${id}`,
      error,
      req.user.id,
    );
    res.status(500).json({ error: "Errore eliminazione" });
  }
};

// 3. STATISTICHE GLOBALI (Potenziate)
export const getSystemStats = async (req, res) => {
  try {
    // Query parallele per velocità
    const userCountPromise = query("SELECT COUNT(*) FROM users");
    const jobCountPromise = query("SELECT COUNT(*) FROM job_applications");
    const cvCountPromise = query(
      "SELECT COUNT(*) FROM users WHERE cv_filename IS NOT NULL",
    );

    // Conta errori nelle ultime 24 ore
    const errorCountPromise = query(
      "SELECT COUNT(*) FROM system_logs WHERE level = 'ERROR' AND created_at > NOW() - INTERVAL '24 hours'",
    );

    const [userRes, jobRes, cvRes, errorRes] = await Promise.all([
      userCountPromise,
      jobCountPromise,
      cvCountPromise,
      errorCountPromise,
    ]);

    res.json({
      totalUsers: parseInt(userRes.rows[0].count),
      totalJobs: parseInt(jobRes.rows[0].count),
      totalCVs: parseInt(cvRes.rows[0].count),
      recentErrors: parseInt(errorRes.rows[0].count),
    });
  } catch (error) {
    await logError("Admin", "Errore calcolo statistiche", error, req.user.id);
    res.status(500).json({ error: "Errore stats" });
  }
};

// 4. 🔥 NUOVO: VISUALIZZA LOG DI SISTEMA
export const getSystemLogs = async (req, res) => {
  try {
    // Prende gli ultimi 50 log, unendo l'email dell'utente se disponibile
    const text = `
      SELECT sl.*, u.email as user_email 
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC 
      LIMIT 50
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (error) {
    console.error("Logger Error:", error); // Fallback console
    res.status(500).json({ error: "Impossibile leggere i log" });
  }
};

// 5. 🔥 NUOVO: SVUOTA LOG
export const clearSystemLogs = async (req, res) => {
  try {
    await query("DELETE FROM system_logs");
    res.json({ message: "Tutti i log sono stati cancellati." });
  } catch (error) {
    await logError("Admin", "Errore pulizia log", error, req.user.id);
    res.status(500).json({ error: "Errore pulizia log" });
  }
};
