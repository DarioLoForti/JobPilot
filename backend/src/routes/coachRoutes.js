import express from "express";
import { auth } from "../middleware/auth.js";
import {
  // 1. Identity Lab
  getPersonalityTest,
  submitPersonalityTest,
  getAssessmentHistory,

  // 2. Interview Simulator
  startMockInterview,
  evaluateInterviewAnswer,

  // 3. U.C.A.F. Protocol
  generateUCAFAssessment,
  evaluateUCAFAssessment,

  // 4. Skill Quiz
  generateQuizTest,
  evaluateQuizTest,
} from "../controllers/coachController.js";

const router = express.Router();

// =================================================================
// ROTTE IDENTITY LAB (Test Personalità)
// =================================================================
router.get("/test", auth, getPersonalityTest); // Scarica le domande
router.post("/test/submit", auth, submitPersonalityTest); // Invia risposte e ottieni profilo
router.get("/history", auth, getAssessmentHistory); // Recupera ultimo risultato

// =================================================================
// ROTTE INTERVIEW SIMULATOR (Colloquio Singolo)
// =================================================================
router.post("/interview/start", auth, startMockInterview); // Genera domanda singola
router.post("/interview/evaluate", auth, evaluateInterviewAnswer); // Valuta risposta singola

// =================================================================
// ROTTE U.C.A.F. (Protocollo Universale)
// =================================================================
router.post("/ucaf/start", auth, generateUCAFAssessment); // Genera le 4 prove (Work Sample, Logic, STAR, Values)
router.post("/ucaf/evaluate", auth, evaluateUCAFAssessment); // Valuta tutto e genera Markdown Scorecard

// --- SKILL AUDIT
router.post("/quiz/start", auth, generateQuizTest);
router.post("/quiz/evaluate", auth, evaluateQuizTest);
export default router;
