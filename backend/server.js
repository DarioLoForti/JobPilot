import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import multer from "multer"; // Gestione file
import fs from "fs";
import { query } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import { protect } from "./src/middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- 1. RENDIAMO LA CARTELLA 'uploads' PUBBLICA ---
// Questo permette al frontend di vedere l'immagine tramite http://localhost:3000/uploads/nomefile.jpg
app.use("/uploads", express.static("uploads"));

// --- 2. CONFIGURAZIONE MULTER (Salvataggio File) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    // Se la cartella non esiste, creala
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Rinomina il file per evitare duplicati: id_timestamp.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- 3. ROTTA PER L'UPLOAD ---
app.post(
  "/api/users/upload-picture",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      // Creiamo l'URL completo dell'immagine
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      const userId = req.user.id;

      // Aggiorniamo il database
      const updateQuery = `
      UPDATE users 
      SET profile_picture = $1 
      WHERE id = $2 
      RETURNING id, first_name, last_name, email, profile_picture
    `;
      const result = await query(updateQuery, [imageUrl, userId]);

      res.json({
        message: "Foto aggiornata con successo! 📸",
        user: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errore durante l'upload" });
    }
  },
);

// --- ROTTE STANDARD ---
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);

// Health Check
app.get("/", async (req, res) => {
  res.json({ message: "JobPilot API è online e pronta per le foto!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
