import { query } from "../config/db.js";

export const ProfileModel = {
  // --- ESPERIENZE ---
  addExperience: async ({
    userId,
    company,
    role,
    startDate,
    endDate,
    description,
  }) => {
    const text = `
      INSERT INTO experiences (user_id, company, role, start_date, end_date, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(text, [
      userId,
      company,
      role,
      startDate,
      endDate,
      description,
    ]);
    return result.rows[0];
  },

  deleteExperience: async (id, userId) => {
    const text =
      "DELETE FROM experiences WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(text, [id, userId]);
    return result.rows[0];
  },

  // --- ISTRUZIONE ---
  addEducation: async ({
    userId,
    school,
    degree,
    field,
    startDate,
    endDate,
  }) => {
    const text = `
      INSERT INTO educations (user_id, school, degree, field, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(text, [
      userId,
      school,
      degree,
      field,
      startDate,
      endDate,
    ]);
    return result.rows[0];
  },

  deleteEducation: async (id, userId) => {
    const text =
      "DELETE FROM educations WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(text, [id, userId]);
    return result.rows[0];
  },

  // --- SKILLS ---
  addSkill: async ({ userId, name, level }) => {
    const text = `
      INSERT INTO skills (user_id, name, level)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await query(text, [userId, name, level]);
    return result.rows[0];
  },

  deleteSkill: async (id, userId) => {
    const text =
      "DELETE FROM skills WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(text, [id, userId]);
    return result.rows[0];
  },

  // --- GET FULL PROFILE (Tutto insieme) ---
  getFullProfile: async (userId) => {
    const expQuery =
      "SELECT * FROM experiences WHERE user_id = $1 ORDER BY start_date DESC";
    const eduQuery =
      "SELECT * FROM educations WHERE user_id = $1 ORDER BY start_date DESC";
    const skillQuery =
      "SELECT * FROM skills WHERE user_id = $1 ORDER BY level DESC";

    // Eseguiamo le query in parallelo per velocità
    const [exp, edu, skills] = await Promise.all([
      query(expQuery, [userId]),
      query(eduQuery, [userId]),
      query(skillQuery, [userId]),
    ]);

    return {
      experiences: exp.rows,
      educations: edu.rows,
      skills: skills.rows,
    };
  },
};
