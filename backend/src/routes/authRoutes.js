import express from "express";
// Importiamo sia register che login
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // <--- NUOVA ROTTA

export default router;
