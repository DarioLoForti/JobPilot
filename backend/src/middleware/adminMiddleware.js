export const adminOnly = (req, res, next) => {
  // req.user è stato appena popolato dal Database nel middleware 'protect'

  if (req.user && req.user.is_admin === true) {
    next(); // È admin, prego
  } else {
    // Se entra qui, significa che req.user esiste ma is_admin è false
    res
      .status(403)
      .json({ error: "Accesso negato. Richiesti permessi SuperAdmin." });
  }
};
