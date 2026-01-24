import { query } from "../config/db.js";

// 1. GET: Ottieni tutte le candidature dell'utente
export const getJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    // Ordiniamo per data di creazione decrescente (i più recenti in alto)
    const text =
      "SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await query(text, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Errore recupero jobs:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};

// 2. POST: Aggiungi nuova candidatura
export const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    // IMPORTANTE: I nomi qui devono coincidere con quelli inviati dal Frontend (Jobs.jsx)
    const { company, position, job_link, status } = req.body;

    if (!company || !position) {
      return res
        .status(400)
        .json({ error: "Azienda e Posizione sono obbligatori" });
    }

    const text = `
      INSERT INTO job_applications (user_id, company, position, job_link, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    // Se job_link non c'è, mettiamo null. Se status non c'è, 'applied'.
    const values = [
      userId,
      company,
      position,
      job_link || null,
      status || "applied",
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Errore creazione job:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};

// 3. PATCH: Aggiorna solo lo stato (Sposta card nella Kanban)
export const updateJobStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const text =
      "UPDATE job_applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *";
    const result = await query(text, [status, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidatura non trovata" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erroreaggiornamento status" });
  }
};

// 4. DELETE: Elimina candidatura
export const deleteJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const text =
      "DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(text, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidatura non trovata" });
    }

    res.json({ message: "Candidatura eliminata con successo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione job" });
  }
};
