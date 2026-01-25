import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Rotta per la registrazione
router.post("/register", registerUser);

// Rotta per il login
router.post("/login", loginUser);

export default router;
