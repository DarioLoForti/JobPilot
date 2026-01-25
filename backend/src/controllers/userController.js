import { query } from "../config/db.js";
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo le immagini sono permesse!"), false);
    }
  },
});

// GET PROFILE
export const getUserProfile = async (req, res) => {
  try {
    // Nota: socials è stato aggiunto, linkedin_url e gli altri rimossi
    const text = `
      SELECT 
        id, first_name, last_name, email, phone, address, 
        socials, 
        personal_description, hard_skills, soft_skills,
        experiences, education, certifications,
        (profile_image IS NOT NULL) as has_image 
      FROM users 
      WHERE id = $1
    `;
    const result = await query(text, [req.user.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Utente non trovato" });

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

// GET IMAGE
export const getProfileImage = async (req, res) => {
  try {
    const text = "SELECT profile_image FROM users WHERE id = $1";
    const result = await query(text, [req.user.id]);
    const user = result.rows[0];
    if (!user || !user.profile_image)
      return res.status(404).send("Immagine non trovata");
    res.set("Content-Type", "image/jpeg");
    res.send(user.profile_image);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore recupero immagine" });
  }
};

// UPDATE PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      first_name,
      last_name,
      phone,
      address,
      socials, // <--- NUOVO CAMPO ARRAY
      personal_description,
      hard_skills,
      soft_skills,
      experiences,
      education,
      certifications,
    } = req.body;

    const imageBuffer = req.file ? req.file.buffer : null;
    let text, values;

    if (imageBuffer) {
      text = `
          UPDATE users 
          SET first_name=$1, last_name=$2, phone=$3, address=$4, 
              socials=$5::jsonb,
              personal_description=$6, hard_skills=$7, soft_skills=$8,
              experiences=$9::jsonb, education=$10::jsonb, certifications=$11::jsonb,
              profile_image=$12
          WHERE id = $13
          RETURNING *
        `;
      values = [
        first_name,
        last_name,
        phone,
        address,
        socials,
        personal_description,
        hard_skills,
        soft_skills,
        experiences,
        education,
        certifications,
        imageBuffer,
        userId,
      ];
    } else {
      text = `
          UPDATE users 
          SET first_name=$1, last_name=$2, phone=$3, address=$4, 
              socials=$5::jsonb,
              personal_description=$6, hard_skills=$7, soft_skills=$8,
              experiences=$9::jsonb, education=$10::jsonb, certifications=$11::jsonb
          WHERE id = $12
          RETURNING *
        `;
      values = [
        first_name,
        last_name,
        phone,
        address,
        socials,
        personal_description,
        hard_skills,
        soft_skills,
        experiences,
        education,
        certifications,
        userId,
      ];
    }

    const result = await query(text, values);
    const user = result.rows[0];
    user.has_image = !!user.profile_image;
    delete user.profile_image;
    delete user.cv_file;
    delete user.password;
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update Error" });
  }
};
