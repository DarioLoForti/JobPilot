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
  searchJobs,
  generateIcebreaker,
  tailorCV,
  generateFollowUp,
  generateInterviewQuestions,
  suggestRoles, // 👈 IMPORT NUOVA FUNZIONE
} from "../controllers/aiController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Configurazione Multer per caricare il file in memoria (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ROTTE PROTETTE
router.post("/upload-cv", auth, upload.single("cv"), uploadCV);
router.post("/analyze-cv", auth, analyzeCV);
router.post("/generate", auth, generateCoverLetter);
router.post("/scrape-job", auth, scrapeJob);
router.post("/extract-profile", auth, extractCVData);
router.get("/history", auth, getScoreHistory);
router.get("/match/:jobId", auth, getJobMatch);
router.post("/job-search", auth, searchJobs);
router.post("/icebreaker", auth, generateIcebreaker);
router.post("/tailor-cv", auth, tailorCV);
router.post("/follow-up", auth, generateFollowUp);
router.post("/interview-prep", auth, generateInterviewQuestions);

// 🔥 NUOVA ROTTA SUGGERIMENTI
router.get("/suggest-roles", auth, suggestRoles);

export default router;
