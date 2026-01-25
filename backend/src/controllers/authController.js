import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    // 1. Validazione Campi
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    // 2. Validazione Password (minimo 6 caratteri)
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La password deve avere almeno 6 caratteri" });
    }

    // 3. Validazione Email (controllo base)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Inserisci un indirizzo email valido" });
    }

    // 4. Controllo Utente Esistente
    const userExists = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Utente già registrato con questa email" });
    }

    // 5. Hashing Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Creazione Utente
    const newUser = await query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email",
      [first_name, last_name, email, hashedPassword],
    );

    const user = newUser.rows[0];

    res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Errore del server durante la registrazione" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ error: "Email o password non validi" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore del server durante il login" });
  }
};
