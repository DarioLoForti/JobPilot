import express from "express";
import {
  getProfile,
  addExperience,
  addEducation,
  addSkill,
  deleteItem,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tutte le rotte sono protette
router.get("/", protect, getProfile);

router.post("/experience", protect, addExperience);
router.post("/education", protect, addEducation);
router.post("/skill", protect, addSkill);

// DELETE generica: /api/profile/:id?type=experience
router.delete("/:id", protect, deleteItem);

export default router;
