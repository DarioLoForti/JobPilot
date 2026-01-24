import { query } from "../config/db.js";

// GET
export const getJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const text =
      "SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await query(text, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

// POST (Create)
export const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    // Estraiamo anche 'notes' dal corpo della richiesta
    const { company, position, job_link, status, interview_date, notes } =
      req.body;

    if (!company || !position)
      return res.status(400).json({ error: "Dati mancanti" });

    const text = `
      INSERT INTO job_applications (user_id, company, position, job_link, status, interview_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      userId,
      company,
      position,
      job_link || null,
      status || "applied",
      interview_date || null,
      notes || "", // Se non c'è nota, salviamo stringa vuota
    ];

    const result = await query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

// PUT (Update Completo)
export const updateJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Estraiamo anche 'notes' qui
    const { company, position, job_link, status, interview_date, notes } =
      req.body;

    const text = `
      UPDATE job_applications 
      SET company = $1, position = $2, job_link = $3, status = $4, interview_date = $5, notes = $6
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;
    const values = [
      company,
      position,
      job_link,
      status,
      interview_date || null,
      notes || "",
      id,
      userId,
    ];

    const result = await query(text, values);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Job non trovato" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update Error" });
  }
};

// PATCH (Status Only)
export const updateJobStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const text =
      "UPDATE job_applications SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *";
    const result = await query(text, [status, id, userId]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Status Error" });
  }
};

// DELETE
export const deleteJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const text =
      "DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(text, [id, userId]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Delete Error" });
  }
};
