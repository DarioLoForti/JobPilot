import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  googleAuth, // <--- Importa funzione Login Google
  googleAuthCallback, // <--- Importa funzione Callback Google
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Autenticazione Classica
router.post("/register", registerUser);
router.post("/login", loginUser);

// Recupero Profilo (Richiede Login)
router.get("/profile", protect, getUserProfile);

// Autenticazione Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

export default router;
