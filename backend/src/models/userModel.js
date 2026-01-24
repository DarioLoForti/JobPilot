import { query } from "../config/db.js";

export const UserModel = {
  // 1. Cerca un utente tramite email (utile per il login o per evitare duplicati)
  findByEmail: async (email) => {
    const text = "SELECT * FROM users WHERE email = $1";
    const result = await query(text, [email]);
    return result.rows[0];
  },

  // 2. Crea un nuovo utente nel database
  create: async (email, passwordHash, firstName, lastName) => {
    const text = `
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name, created_at
    `;
    const values = [email, passwordHash, firstName, lastName];
    const result = await query(text, values);
    return result.rows[0];
  },
};
