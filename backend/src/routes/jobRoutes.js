import express from "express";
import { addJob, getMyJobs } from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tutte queste rotte richiedono il login (protect)
router.post("/", protect, addJob); // Crea candidatura
router.get("/", protect, getMyJobs); // Leggi lista

// ---> QUESTA È LA RIGA CHE MANCAVA O ERA SBAGLIATA <---
export default router;
