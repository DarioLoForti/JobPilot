export const adminOnly = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next(); // È admin, prego entri pure
  } else {
    res
      .status(403)
      .json({ error: "Accesso negato. Area riservata ai SuperAdmin." });
  }
};
