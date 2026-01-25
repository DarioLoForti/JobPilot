import express from "express";
import multer from "multer"; // Serve per gestire i file (PDF)
import {
  analyzeCV,
  generateCoverLetter,
  scrapeJob,
  getScoreHistory,
  getJobMatch,
  uploadCV,
  extractCVData,
} from "../controllers/aiController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Configurazione Multer per caricare il file in memoria (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ROTTE PROTETTE
router.post("/upload-cv", auth, upload.single("cv"), uploadCV); // <--- QUESTA ERA SPARITA
router.post("/analyze-cv", auth, analyzeCV);
router.post("/generate", auth, generateCoverLetter);
router.post("/scrape-job", auth, scrapeJob);
router.post("/extract-profile", auth, extractCVData);
router.get("/history", auth, getScoreHistory);
router.get("/match/:jobId", auth, getJobMatch);

export default router;
