import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserProfileImage, // Nome corretto della funzione nel controller
  upload,
  deleteAccount, // <--- Funzione per eliminare l'account
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Profilo Utente (Lettura e Modifica)
router.get("/profile", protect, getUserProfile);
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateUserProfile,
);

// 2. Recupero Immagine Profilo
router.get("/profile/image", protect, getUserProfileImage);

// 3. 🛑 CANCELLAZIONE ACCOUNT (GDPR)
router.delete("/me", protect, deleteAccount);

export default router;
