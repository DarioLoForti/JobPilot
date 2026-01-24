import { query } from "../config/db.js";

export const JobModel = {
  // 1. Crea una nuova candidatura
  create: async ({ userId, companyName, jobTitle, jobUrl, status, notes }) => {
    const text = `
      INSERT INTO job_applications (user_id, company_name, job_title, job_url, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      userId,
      companyName,
      jobTitle,
      jobUrl,
      status || "APPLIED",
      notes,
    ];
    const result = await query(text, values);
    return result.rows[0];
  },

  // 2. Trova tutte le candidature di un CERTO utente
  findAllByUserId: async (userId) => {
    const text = `
      SELECT * FROM job_applications 
      WHERE user_id = $1 
      ORDER BY applied_date DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
  },
};
