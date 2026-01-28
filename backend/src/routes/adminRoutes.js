import express from "express";
import {
  getAllUsers,
  deleteUser,
  getSystemStats,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Tutte queste rotte richiedono LOGIN (protect) + RUOLO ADMIN (adminOnly)
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/users/:id", protect, adminOnly, deleteUser);
router.get("/stats", protect, adminOnly, getSystemStats);

export default router;
