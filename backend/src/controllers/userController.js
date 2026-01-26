import { query } from "../config/db.js";
import multer from "multer";

// Configurazione Multer (Memoria)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
});

//Helper per pulire i JSON e prevenire crash (Fix errore 22P02)
const parseJsonField = (field) => {
  if (!field) return "[]"; // Se è vuoto, ritorna array JSON vuoto
  if (typeof field === "object") return JSON.stringify(field); // Se è già oggetto, stringificalo per il DB
  try {
    // Se è una stringa, prova a parsificarla e poi ristringificarla
    // Questo assicura che il formato sia valido per Postgres
    const parsed = JSON.parse(field);
    return JSON.stringify(parsed);
  } catch (e) {
    console.warn("Errore parsing campo JSON:", e.message);
    return "[]"; // Fallback sicuro
  }
};

// 1. Ottieni Profilo
export const getUserProfile = async (req, res) => {
  try {
    const user = await query(
      "SELECT id, first_name, last_name, email, phone, address, personal_description, socials, hard_skills, soft_skills, experiences, education, certifications, cv_filename, (profile_image IS NOT NULL) as has_image FROM users WHERE id = $1",
      [req.user.id],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore server" });
  }
};

// 2. Aggiorna Profilo (Fix per JSON e Immagini)
export const updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    first_name,
    last_name,
    phone,
    address,
    personal_description,
    socials,
    hard_skills,
    soft_skills,
    experiences,
    education,
    certifications,
  } = req.body;

  try {
    // 🛡️ SANIFICAZIONE DATI JSON
    // Usiamo l'helper per garantire che Postgres riceva JSON valido
    const socialsJson = parseJsonField(socials);
    const experiencesJson = parseJsonField(experiences);
    const educationJson = parseJsonField(education);
    const certificationsJson = parseJsonField(certifications);

    // Preparazione Query Dinamica
    // Usiamo COALESCE per non sovrascrivere dati esistenti con null se non vengono inviati
    let queryText = `
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        personal_description = COALESCE($5, personal_description),
        hard_skills = COALESCE($6, hard_skills),
        soft_skills = COALESCE($7, soft_skills),
        socials = $8::jsonb,
        experiences = $9::jsonb,
        education = $10::jsonb,
        certifications = $11::jsonb
    `;

    const queryParams = [
      first_name,
      last_name,
      phone,
      address,
      personal_description,
      hard_skills,
      soft_skills,
      socialsJson,
      experiencesJson,
      educationJson,
      certificationsJson,
    ];

    // Gestione Immagine (se presente)
    if (req.file) {
      queryText += `, profile_image = $${queryParams.length + 1}`;
      queryParams.push(req.file.buffer);
    }

    // Clausola WHERE e RETURNING
    queryText += ` WHERE id = $${queryParams.length + 1} RETURNING id, first_name, last_name, email, phone, address, personal_description, hard_skills, soft_skills, socials, experiences, education, certifications, (profile_image IS NOT NULL) as has_image`;
    queryParams.push(userId);

    const result = await query(queryText, queryParams);

    res.json({
      message: "Profilo aggiornato con successo!",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Errore aggiornamento profilo:", error);
    res.status(500).json({ error: "Errore aggiornamento: " + error.message });
  }
};

// 3. Ottieni Immagine Profilo
export const getUserProfileImage = async (req, res) => {
  try {
    const result = await query(
      "SELECT profile_image FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length > 0 && result.rows[0].profile_image) {
      res.setHeader("Content-Type", "image/jpeg");
      // Cache control per performance (l'immagine viene cachata per 1 ora)
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(result.rows[0].profile_image);
    } else {
      res.status(404).send("Nessuna immagine");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore server");
  }
};

// 4. Elimina Account
export const deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    await query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ message: "Account eliminato definitivamente." });
  } catch (error) {
    console.error("Errore cancellazione account:", error);
    res.status(500).json({ error: "Errore durante la cancellazione." });
  }
};
