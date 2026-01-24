import express from "express";
import {
  getJobs,
  createJob,
  deleteJob,
  updateJobStatus,
  updateJob, // <--- Importa la nuova funzione
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJobs);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob); // <--- NUOVA ROTTA PUT
router.delete("/:id", protect, deleteJob);
router.patch("/:id/status", protect, updateJobStatus);

export default router;
