import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  // Recupera il token dall'header Authorization (Bearer <token>)
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Accesso negato. Token mancante." });
  }

  try {
    // Verifica il token usando la chiave segreta nel tuo .env
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Aggiunge i dati dell'utente alla richiesta (es. req.user.id)
    next(); // Passa al prossimo middleware o controller
  } catch (err) {
    res.status(403).json({ error: "Token non valido o scaduto." });
  }
};
