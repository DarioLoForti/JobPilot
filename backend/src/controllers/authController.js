import { query } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Helper Token
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, is_admin: isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 1. REGISTRAZIONE
export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const userExists = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0)
      return res.status(400).json({ error: "Email già registrata." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, is_admin",
      [first_name, last_name, email, hashedPassword],
    );

    const user = newUser.rows[0];

    res.status(201).json({
      token: generateToken(user.id, user.is_admin),
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Errore Registrazione:", error);
    res.status(500).json({ error: "Errore server" });
  }
};

// 2. LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Credenziali non valide" });

    // Se è un utente vecchio di Google senza password, bloccalo
    if (!user.password)
      return res
        .status(400)
        .json({
          error: "Questo account era Google. Registrati di nuovo con password.",
        });

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        token: generateToken(user.id, user.is_admin),
        user: {
          id: user.id,
          first_name: user.first_name,
          email: user.email,
          is_admin: user.is_admin,
        },
      });
    } else {
      res.status(401).json({ error: "Credenziali non valide" });
    }
  } catch (error) {
    console.error("Errore Login:", error);
    res.status(500).json({ error: "Errore server" });
  }
};

// 3. PROFILO
export const getUserProfile = async (req, res) => {
  try {
    const userRes = await query(
      "SELECT id, first_name, last_name, email, is_admin, cv_filename FROM users WHERE id = $1",
      [req.user.id],
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "Utente non trovato" });

    const user = userRes.rows[0];
    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_admin: user.is_admin,
      cv_uploaded: !!user.cv_filename,
    });
  } catch (error) {
    console.error("Errore Profile:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
