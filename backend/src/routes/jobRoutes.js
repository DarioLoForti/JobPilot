import express from "express";
import {
  getJobs, // Prima era getMyJobs
  createJob, // Prima era addJob
  deleteJob,
  updateJobStatus,
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Ottieni lista lavori
router.get("/", protect, getJobs);

// 2. Crea nuovo lavoro
router.post("/", protect, createJob);

// 3. Aggiorna stato (Kanban)
router.patch("/:id/status", protect, updateJobStatus);

// 4. Elimina lavoro
router.delete("/:id", protect, deleteJob);

export default router;
