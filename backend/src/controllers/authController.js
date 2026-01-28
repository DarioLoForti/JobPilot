import { query } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

// Helper per generare Token (Ora include lo stato Admin)
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, is_admin: isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// =================================================================
// REGISTRAZIONE UTENTE (Email/Password)
// =================================================================
export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  try {
    // 1. Validazione Campi Obbligatori
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    // 2. Validazione Email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Inserisci un indirizzo email valido." });
    }

    // 3. Validazione Sicurezza Password
    if (password.length < 8)
      return res
        .status(400)
        .json({ error: "La password deve avere almeno 8 caratteri." });
    if (!/[A-Z]/.test(password))
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno una maiuscola." });
    if (!/[a-z]/.test(password))
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno una minuscola." });
    if (!/\d/.test(password))
      return res
        .status(400)
        .json({ error: "La password deve contenere almeno un numero." });
    if (!/[@$!%*?&.\-_#]/.test(password))
      return res
        .status(400)
        .json({ error: "La password deve contenere un carattere speciale." });

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
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email, is_admin",
      [first_name, last_name, email, hashedPassword],
    );

    const user = newUser.rows[0];

    // 7. Risposta con Token
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
    res
      .status(500)
      .json({ error: "Errore del server durante la registrazione" });
  }
};

// =================================================================
// LOGIN UTENTE (Email/Password)
// =================================================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cerca l'utente
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Email o password non validi" });
    }

    // 2. Controllo Utente Google (Senza Password)
    if (!user.password) {
      return res
        .status(400)
        .json({
          error:
            "Questo account usa Google Login. Clicca su 'Google' per accedere.",
        });
    }

    // 3. Verifica Password
    if (await bcrypt.compare(password, user.password)) {
      res.json({
        token: generateToken(user.id, user.is_admin),
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          is_admin: user.is_admin,
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

// =================================================================
// RECUPERO PROFILO (Context Reload)
// =================================================================
export const getUserProfile = async (req, res) => {
  try {
    const userRes = await query(
      "SELECT id, first_name, last_name, email, is_admin, cv_filename FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const user = userRes.rows[0];
    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      is_admin: user.is_admin,
      cv_uploaded: !!user.cv_filename, // true se ha caricato il CV
    });
  } catch (error) {
    console.error("Errore Profile:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// =================================================================
// 1. INIZIA LOGIN GOOGLE
// =================================================================
export const googleAuth = (req, res) => {
  const redirectUri = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${redirectUri}?${params.toString()}`);
};

// =================================================================
// 2. CALLBACK GOOGLE (Ritorno)
// =================================================================
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;

  // Fallback URL per il frontend (in produzione usa variabile d'ambiente)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    // A. Scambia il codice con il Token
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    });

    const { access_token } = data;

    // B. Ottieni i dati utente da Google
    const googleUserRes = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const googleUser = googleUserRes.data;

    // C. Cerca se l'utente esiste già nel DB
    const userExist = await query("SELECT * FROM users WHERE email = $1", [
      googleUser.email,
    ]);

    let user;

    if (userExist.rows.length > 0) {
      // UTENTE ESISTE: Lo logghiamo
      user = userExist.rows[0];

      // Aggiorniamo google_id e foto se non ci sono
      if (!user.google_id) {
        await query(
          "UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3",
          [googleUser.id, googleUser.picture, user.id],
        );
      }
    } else {
      // UTENTE NUOVO: Lo registriamo (password NULL)
      const newUser = await query(
        `INSERT INTO users (first_name, last_name, email, google_id, avatar, is_admin) 
           VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *`,
        [
          googleUser.given_name,
          googleUser.family_name,
          googleUser.email,
          googleUser.id,
          googleUser.picture,
        ],
      );
      user = newUser.rows[0];
    }

    // D. Genera il NOSTRO Token JWT
    const token = generateToken(user.id, user.is_admin);

    // E. Reindirizza al Frontend con il token nell'URL
    res.redirect(
      `${frontendUrl}/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  } catch (error) {
    console.error("Errore Google Auth:", error.response?.data || error.message);
    res.redirect(`${frontendUrl}/login?error=GoogleAuthFailed`);
  }
};
