import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token;

  // 1. Controlliamo se nell'header della richiesta c'è "Authorization: Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Prendiamo solo il codice del token (togliamo la parola "Bearer ")
      token = req.headers.authorization.split(" ")[1];

      // Decifriamo il token usando il nostro segreto
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "segreto_super_temporaneo",
      );

      // Aggiungiamo l'ID dell'utente alla richiesta, così i Controller successivi sanno chi è!
      req.user = decoded;

      next(); // Passa al prossimo step
    } catch (error) {
      console.error("Token non valido:", error);
      res
        .status(401)
        .json({ error: "Non autorizzato, token scaduto o non valido" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Non autorizzato, nessun token fornito" });
  }
};
