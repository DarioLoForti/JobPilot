import { query } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Helper per generare Token
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, is_admin: isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// =================================================================
// 🔥 CONFIGURAZIONE URL BLINDATA
// =================================================================
const getGoogleConfigs = () => {
  const isProd = process.env.NODE_ENV === "production";

  const callbackUrl = isProd
    ? "https://jobpilot-app-mr2e.onrender.com/api/auth/google/callback"
    : "http://localhost:5000/api/auth/google/callback";

  const frontendUrl = isProd
    ? "https://jobpilot-app-mr2e.onrender.com"
    : "http://localhost:5173";

  return { callbackUrl, frontendUrl };
};

// =================================================================
// 1. REGISTRAZIONE UTENTE
// =================================================================
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

// =================================================================
// 2. LOGIN UTENTE
// =================================================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Credenziali non valide" });
    if (!user.password)
      return res
        .status(400)
        .json({ error: "Usa il tasto Google per accedere." });

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

// =================================================================
// 3. USER PROFILE (ERA QUESTA CHE MANCAVA!)
// =================================================================
export const getUserProfile = async (req, res) => {
  try {
    // req.user viene popolato dal middleware 'protect'
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

// =================================================================
// 4. INIZIA LOGIN GOOGLE
// =================================================================
export const googleAuth = (req, res) => {
  const { callbackUrl } = getGoogleConfigs();
  console.log("🔵 Google Auth Start. Redirect URI:", callbackUrl);

  const redirectUri = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${redirectUri}?${params.toString()}`);
};

// =================================================================
// 5. CALLBACK GOOGLE
// =================================================================
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;
  const { callbackUrl, frontendUrl } = getGoogleConfigs();

  console.log("🟡 Callback ricevuta. Code:", !!code);

  try {
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    });

    const { access_token } = data;

    const googleUserRes = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const googleUser = googleUserRes.data;

    const userExist = await query("SELECT * FROM users WHERE email = $1", [
      googleUser.email,
    ]);
    let user;

    if (userExist.rows.length > 0) {
      user = userExist.rows[0];
      if (!user.google_id) {
        await query(
          "UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3",
          [googleUser.id, googleUser.picture, user.id],
        );
      }
    } else {
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

    const token = generateToken(user.id, user.is_admin);
    res.redirect(
      `${frontendUrl}/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
    );
  } catch (error) {
    console.error(
      "🔴 GOOGLE AUTH ERROR:",
      error.response?.data || error.message,
    );
    const errorMsg =
      error.response?.data?.error_description ||
      error.message ||
      "UnknownError";
    const errorCode = error.response?.data?.error || "Error";
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(errorCode)}&desc=${encodeURIComponent(errorMsg)}`,
    );
  }
};
