import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js"; // <--- NEW: Importiamo le rotte

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- LE NOSTRE ROTTE ---
app.use("/api/auth", authRoutes); // <--- NEW: Tutte le rotte auth inizieranno con /api/auth
// Esempio finale: http://localhost:3000/api/auth/register

// Rotta Health Check
app.get("/", async (req, res) => {
  try {
    const dbResult = await query("SELECT NOW() as ora_attuale");
    res.json({
      message: "JobPilot API Backend è online!",
      database: "Connesso con successo ✅",
      db_time: dbResult.rows[0].ora_attuale,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore DB", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`-----------------------------------------`);
});
