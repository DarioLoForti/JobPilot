import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getProfileImage, // <--- Importiamo la nuova funzione
  upload,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateUserProfile,
);

// Nuova rotta per vedere l'immagine: /api/users/profile/image
router.get("/profile/image", protect, getProfileImage);

export default router;
