import { query } from "../config/db.js";
import multer from "multer";

// Configurazione Multer per salvare l'immagine in memoria (Buffer)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
});

// 1. Ottieni Profilo
export const getUserProfile = async (req, res) => {
  try {
    // Non restituiamo la password, né i buffer dei file pesanti (cv_file, profile_image) in questa chiamata
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

// 2. Aggiorna Profilo (inclusa immagine)
export const updateUserProfile = async (req, res) => {
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
    let queryText = `
      UPDATE users 
      SET first_name = $1, last_name = $2, phone = $3, address = $4, 
          personal_description = $5, socials = $6, hard_skills = $7, 
          soft_skills = $8, experiences = $9, education = $10, certifications = $11
    `;

    let queryParams = [
      first_name,
      last_name,
      phone,
      address,
      personal_description,
      socials ? JSON.parse(socials) : [], // Gestione FormData che invia stringhe
      hard_skills,
      soft_skills,
      experiences ? JSON.parse(experiences) : [],
      education ? JSON.parse(education) : [],
      certifications ? JSON.parse(certifications) : [],
    ];

    // Se c'è un'immagine, la aggiungiamo alla query
    if (req.file) {
      queryText += `, profile_image = $12`;
      queryParams.push(req.file.buffer);
    }

    queryText += ` WHERE id = $${queryParams.length + (req.file ? 1 : 1)} RETURNING id, first_name, last_name, email, (profile_image IS NOT NULL) as has_image`;

    // Fix indice parametro ID (l'ultimo)
    const idParamIndex = req.file ? 13 : 12;
    // Ricalcoliamo la query corretta per l'ID finale
    if (req.file) {
      // La queryText sopra era generica, la riscrivo pulita per evitare errori di indice
      const updateWithImage = `
            UPDATE users 
            SET first_name=$1, last_name=$2, phone=$3, address=$4, 
                personal_description=$5, socials=$6, hard_skills=$7, 
                soft_skills=$8, experiences=$9, education=$10, certifications=$11,
                profile_image=$12
            WHERE id=$13 
            RETURNING id, first_name, last_name, email, (profile_image IS NOT NULL) as has_image
        `;
      const result = await query(updateWithImage, [
        ...queryParams,
        req.user.id,
      ]);
      return res.json(result.rows[0]);
    } else {
      const updateNoImage = `
            UPDATE users 
            SET first_name=$1, last_name=$2, phone=$3, address=$4, 
                personal_description=$5, socials=$6, hard_skills=$7, 
                soft_skills=$8, experiences=$9, education=$10, certifications=$11
            WHERE id=$12 
            RETURNING id, first_name, last_name, email, (profile_image IS NOT NULL) as has_image
        `;
      const result = await query(updateNoImage, [...queryParams, req.user.id]);
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error("Errore aggiornamento:", error);
    res.status(500).json({ error: "Errore aggiornamento profilo" });
  }
};

// 3. Ottieni Immagine Profilo (Serve per visualizzare l'avatar)
export const getUserProfileImage = async (req, res) => {
  try {
    const result = await query(
      "SELECT profile_image FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length > 0 && result.rows[0].profile_image) {
      res.setHeader("Content-Type", "image/jpeg"); // O image/png, il browser capisce spesso da solo
      res.send(result.rows[0].profile_image);
    } else {
      res.status(404).send("Nessuna immagine");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore server");
  }
};

// 4. Elimina Account (GDPR)
export const deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    // Eliminiamo l'utente. Grazie a ON DELETE CASCADE nel DB,
    // verranno eliminati anche i job, le cv_history e gli assessment collegati.
    await query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({
      message: "Account eliminato definitivamente. Ci mancherai! 👋",
    });
  } catch (error) {
    console.error("Errore cancellazione account:", error);
    res.status(500).json({ error: "Errore durante la cancellazione." });
  }
};
