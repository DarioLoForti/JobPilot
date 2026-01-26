import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// =================================================================
// REGISTRAZIONE UTENTE
// =================================================================
export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    // 1. Validazione Campi Obbligatori
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    // 2. Validazione Email (Regex Rigorosa)
    // Deve corrispondere alla validazione del Frontend per coerenza
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Inserisci un indirizzo email valido." });
    }

    // 3. Validazione Sicurezza Password (OWASP Standard)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "La password deve avere almeno 8 caratteri." });
    }
    if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno una maiuscola." });
    }
    if (!/[a-z]/.test(password)) {
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno una minuscola." });
    }
    if (!/\d/.test(password)) {
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno un numero." });
    }
    if (!/[@$!%*?&.\-_#]/.test(password)) {
      return res
        .status(400)
        .json({ error: "La password deve contenere un carattere speciale." });
    }

    // 4. Controllo Utente Esistente
    const userExists = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Questa email è già registrata." });
    }

    // 5. Hashing Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Creazione Utente nel DB
    const newUser = await query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email",
      [first_name, last_name, email, hashedPassword],
    );

    const user = newUser.rows[0];

    // 7. Risposta con Token (Formato standardizzato con Login)
    res.status(201).json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Errore Registrazione:", error);
    res
      .status(500)
      .json({ error: "Errore del server durante la registrazione" });
  }
};

// =================================================================
// LOGIN UTENTE
// =================================================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cerca l'utente
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    // 2. Verifica Password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user.id),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        },
      });
    } else {
      res.status(401).json({ error: "Email o password non validi" });
    }
  } catch (error) {
    console.error("Errore Login:", error);
    res.status(500).json({ error: "Errore del server durante il login" });
  }
};
