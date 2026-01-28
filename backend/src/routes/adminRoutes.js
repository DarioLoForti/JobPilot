import express from "express";
import {
  getAllUsers,
  deleteUser,
  getSystemStats,
  getSystemLogs, // <--- NUOVO
  clearSystemLogs, // <--- NUOVO
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Tutte queste rotte richiedono LOGIN (protect) + RUOLO ADMIN (adminOnly)

// 📊 Statistiche Dashboard
router.get("/stats", protect, adminOnly, getSystemStats);

// 👥 Gestione Utenti
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/users/:id", protect, adminOnly, deleteUser);

// 🛠️ Gestione Errori (System Logs)
router.get("/logs", protect, adminOnly, getSystemLogs);
router.delete("/logs", protect, adminOnly, clearSystemLogs);

export default router;
