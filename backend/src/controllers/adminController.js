import { query } from "../config/db.js";

// 1. LISTA UTENTI (Con statistiche)
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
        COUNT(j.id) as total_jobs
      FROM users u
      LEFT JOIN job_applications j ON u.id = j.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore server admin" });
  }
};

// 2. ELIMINA UTENTE
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Cancelliamo prima i jobs collegati
    await query("DELETE FROM job_applications WHERE user_id = $1", [id]);
    await query("DELETE FROM cv_history WHERE user_id = $1", [id]); // Pulisce anche storico CV se esiste
    await query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Utente eliminato con successo." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione" });
  }
};

// 3. STATISTICHE GLOBALI
export const getSystemStats = async (req, res) => {
  try {
    const userCount = await query("SELECT COUNT(*) FROM users");
    const jobCount = await query("SELECT COUNT(*) FROM job_applications");

    res.json({
      users: parseInt(userCount.rows[0].count),
      jobs: parseInt(jobCount.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: "Errore stats" });
  }
};
