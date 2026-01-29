import jwt from "jsonwebtoken";
import { query } from "../config/db.js"; // 👈 FONDAMENTALE: Dobbiamo interrogare il DB

export const protect = async (req, res, next) => {
  let token;

  // 1. Controlliamo se c'è il token nell'header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Prendiamo il token
      token = req.headers.authorization.split(" ")[1];

      // 3. Decifriamo il token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "segreto_super_temporaneo",
      );

      // 4. 🔥 LA SOLUZIONE: Interroghiamo il DB per avere i dati FRESCHI
      // Non ci fidiamo solo del token (che potrebbe essere vecchio),
      // andiamo a vedere se nel frattempo sei diventato Admin.
      const result = await query(
        "SELECT id, first_name, last_name, email, is_admin FROM users WHERE id = $1",
        [decoded.id],
      );

      // Se l'utente è stato cancellato dal DB nel frattempo
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Utente non più esistente." });
      }

      // 5. Attacchiamo l'utente REALE e AGGIORNATO alla richiesta
      req.user = result.rows[0];

      next(); // Passa al prossimo step
    } catch (error) {
      console.error("Errore Auth:", error.message);
      res.status(401).json({ error: "Non autorizzato, token non valido" });
    }
  } else {
    res.status(401).json({ error: "Non autorizzato, nessun token fornito" });
  }
};
