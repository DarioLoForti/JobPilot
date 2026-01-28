import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  googleAuth,
  googleAuthCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 DEBUG LOGGER: Questo ci dice se la richiesta entra in questo file
router.use((req, res, next) => {
  console.log(`🔔 AUTH ROUTE HIT: ${req.method} ${req.originalUrl}`);
  next();
});

// Autenticazione Classica
router.post("/register", registerUser);
router.post("/login", loginUser);

// Recupero Profilo (Richiede Login)
router.get("/profile", protect, getUserProfile);

// Autenticazione Google OAuth
// NOTA: server.js aggiunge "/api/auth", quindi qui usiamo solo "/google"
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
