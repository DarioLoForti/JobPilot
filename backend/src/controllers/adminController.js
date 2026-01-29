import { query } from "../config/db.js";
import { logError, logInfo } from "../utils/logger.js";
import jwt from "jsonwebtoken";

// Helper per generare Token
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, is_admin: isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

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
        u.google_id, 
        COUNT(j.id) as total_jobs
      FROM users u
      LEFT JOIN job_applications j ON u.id = j.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (error) {
    await logError("Admin", "Errore recupero lista utenti", error, req.user.id);
    res.status(500).json({ error: "Errore server admin" });
  }
};

// 2. ELIMINA UTENTE
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM job_applications WHERE user_id = $1", [id]);
    await query("DELETE FROM cv_history WHERE user_id = $1", [id]);
    await query("DELETE FROM ai_usage WHERE user_id = $1", [id]);
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

// 3. STATISTICHE GLOBALI
export const getSystemStats = async (req, res) => {
  try {
    const userCountPromise = query("SELECT COUNT(*) FROM users");
    const jobCountPromise = query("SELECT COUNT(*) FROM job_applications");
    const cvCountPromise = query(
      "SELECT COUNT(*) FROM users WHERE cv_filename IS NOT NULL",
    );
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

// 4. VISUALIZZA LOG DI SISTEMA
export const getSystemLogs = async (req, res) => {
  try {
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
    console.error("Logger Error:", error);
    res.status(500).json({ error: "Impossibile leggere i log" });
  }
};

// 5. SVUOTA LOG
export const clearSystemLogs = async (req, res) => {
  try {
    await query("DELETE FROM system_logs");
    res.json({ message: "Tutti i log sono stati cancellati." });
  } catch (error) {
    await logError("Admin", "Errore pulizia log", error, req.user.id);
    res.status(500).json({ error: "Errore pulizia log" });
  }
};

// 6. 🔥 IMPERSONIFICA UTENTE (GOD MODE)
export const impersonateUser = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Trova l'utente target
    const userRes = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "Utente non trovato" });

    const targetUser = userRes.rows[0];

    // 2. Genera un token valido per LUI
    const token = generateToken(targetUser.id, targetUser.is_admin);

    // 3. Logga l'azione come INFO (non errore!)
    await logInfo(
      "Admin", // Fonte
      `Admin ha impersonato l'utente ${targetUser.email}`, // Messaggio
      { admin_id: req.user.id, target_id: targetUser.id }, // Dettagli
      req.user.id, // ID Admin che ha fatto l'azione
    );

    res.json({
      token,
      user: {
        id: targetUser.id,
        first_name: targetUser.first_name,
        email: targetUser.email,
        is_admin: targetUser.is_admin,
      },
    });
  } catch (error) {
    // Se qualcosa si rompe nel codice, questo RIMANE un errore rosso
    await logError("Admin", "Errore impersonificazione", error, req.user.id);
    res.status(500).json({ error: "Errore impersonificazione" });
  }
};
