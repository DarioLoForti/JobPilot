import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";

// --- REGISTRAZIONE ---
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email e password sono obbligatori" });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email già registrata" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create(
      email,
      passwordHash,
      firstName,
      lastName,
    );

    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || "segreto_super_temporaneo",
      { expiresIn: "1d" },
    );

    res.status(201).json({
      message: "Utente registrato con successo! 🚀",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Errore registrazione:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};

// --- LOGIN (NUOVA FUNZIONE) ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Cerchiamo l'utente
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Credenziali non valide" });
    }

    // 2. Confrontiamo la password inserita con quella criptata nel DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Credenziali non valide" });
    }

    // 3. Generiamo il token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "segreto_super_temporaneo",
      { expiresIn: "1d" },
    );

    // Rimuoviamo la password hashata prima di inviare i dati
    delete user.password_hash;

    res.json({
      message: "Login effettuato! 🔓",
      user,
      token,
    });
  } catch (error) {
    console.error("Errore login:", error);
    res.status(500).json({ error: "Errore del server" });
  }
};
