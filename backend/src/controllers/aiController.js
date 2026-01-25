import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../config/db.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse-fork");

// Helper per gestire l'errore di quota (429) senza far crashare il server
const handleAIError = (res, error, context) => {
  console.error(`Errore AI [${context}]:`, error);
  if (error.status === 429 || error.message?.includes("429")) {
    return res.status(429).json({
      error:
        "⚠️ Quota 'Gemini 2.5 PRO' esaurita. Il modello Pro ha limiti stringenti. Riprova più tardi.",
    });
  }
  res.status(500).json({ error: `Errore durante ${context}` });
};

// 🤖 1. GENERATORE LETTERA DI PRESENTAZIONE
export const generateCoverLetter = async (req, res) => {
  const { company, position, tone, userName } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 💎 USO MODELLO PRO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Scrivi una lettera di presentazione per ${userName}. 
    Azienda: ${company}. Posizione: ${position}. Tono: ${tone}. 
    Sii convincente, scrivi in italiano e mantieni un formato professionale.`;

    const result = await model.generateContent(prompt);
    res.json({ letter: result.response.text() });
  } catch (error) {
    handleAIError(res, error, "Generazione Lettera");
  }
};

// 📁 2. UPLOAD CV
export const uploadCV = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file)
      return res.status(400).json({ error: "Nessun file caricato" });

    const text = `UPDATE users SET cv_file = $1, cv_filename = $2 WHERE id = $3 RETURNING cv_filename`;
    const result = await query(text, [
      req.file.buffer,
      req.file.originalname,
      userId,
    ]);

    res.json({
      message: "CV Caricato con successo",
      filename: result.rows[0].cv_filename,
    });
  } catch (error) {
    res.status(500).json({ error: "Errore durante il salvataggio del file." });
  }
};

// 🧪 3. ANALISI CV CON STORICO
export const analyzeCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      userId,
    ]);
    const fileBuffer = dbResult.rows[0]?.cv_file;

    if (!fileBuffer)
      return res
        .status(400)
        .json({ error: "Carica il PDF prima di analizzarlo." });

    const pdfData = await pdf(fileBuffer);
    const cvText = pdfData.text;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 💎 USO MODELLO PRO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Analizza questo CV e rispondi SOLO in JSON:
    Testo CV: ${cvText}
    JSON: { "score": 0-100, "summary": "...", "strengths": [], "improvements": [] }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysisData = JSON.parse(jsonMatch[0]);

    // Salvataggio nello storico
    await query("INSERT INTO cv_history (user_id, score) VALUES ($1, $2)", [
      userId,
      analysisData.score,
    ]);

    res.json(analysisData);
  } catch (error) {
    handleAIError(res, error, "Analisi CV");
  }
};

// 📉 4. RECUPERO STORICO
export const getScoreHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      "SELECT score, created_at as date FROM cv_history WHERE user_id = $1 ORDER BY created_at ASC",
      [userId],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dello storico." });
  }
};

// ✨ 5. MAGIC SCRAPE (BACCHETTA MAGICA)
export const scrapeJob = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL mancante" });

  try {
    const response = await fetch(url);
    const html = await response.text();

    const cleanContent = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, "")
      .substring(0, 15000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 💎 USO MODELLO PRO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Analizza questo annuncio di lavoro. Estrai Azienda, Ruolo e una sintesi dei Requisiti.
    Rispondi SOLO in JSON:
    { "company": "...", "position": "...", "job_description": "..." }
    Contenuto: ${cleanContent}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Dati non identificati");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    handleAIError(res, error, "Magic Scrape");
  }
};

// ⚖️ 6. AI COACH: MATCH ANALYSIS (Per il Kanban)
export const getJobMatch = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;

  try {
    const userRes = await query(
      "SELECT hard_skills, soft_skills, personal_description FROM users WHERE id = $1",
      [userId],
    );
    const jobRes = await query(
      "SELECT company, position, job_description FROM job_applications WHERE id = $1",
      [jobId],
    );

    if (userRes.rows.length === 0 || jobRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Dati non trovati per il confronto." });
    }

    const user = userRes.rows[0];
    const job = jobRes.rows[0];

    if (!job.job_description) {
      return res.status(400).json({ error: "Descrizione annuncio mancante." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 💎 USO MODELLO PRO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Confronta il profilo utente con l'annuncio.
    UTENTE: ${user.hard_skills}, ${user.soft_skills}, ${user.personal_description}
    ANNUNCIO: ${job.job_description}
    Rispondi SOLO in JSON:
    {
      "match_percentage": 0-100,
      "verdict": "...",
      "strengths": [],
      "missing_skills": [],
      "cv_advice": "..."
    }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    handleAIError(res, error, "Match Analysis");
  }
};

// 🪄 7. CV DATA EXTRACTION: Estrapola dati per il profilo
export const extractCVData = async (req, res) => {
  try {
    const userId = req.user.id;
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      userId,
    ]);
    const fileBuffer = dbResult.rows[0]?.cv_file;

    if (!fileBuffer)
      return res.status(400).json({ error: "Carica prima il PDF!" });

    const pdfData = await pdf(fileBuffer);
    const cvText = pdfData.text;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 💎 USO MODELLO PRO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Analizza questo CV ed estrai i dati per popolare un database.
    Rispondi ESCLUSIVAMENTE con un oggetto JSON con questa struttura esatta:
    {
      "first_name": "...",
      "last_name": "...",
      "phone": "...",
      "address": "...",
      "personal_description": "Breve bio professionale",
      "hard_skills": "lista separata da virgole",
      "soft_skills": "lista separata da virgole",
      "experiences": [{"role": "...", "company": "...", "dateStart": "...", "dateEnd": "...", "current": boolean, "desc": "..."}],
      "education": [{"degree": "...", "school": "...", "dateStart": "...", "dateEnd": "..."}]
    }
    Testo CV: ${cvText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const extractedData = JSON.parse(jsonMatch[0]);

    // UPDATE del database con i dati estratti
    const updateQuery = `
      UPDATE users 
      SET first_name = $1, last_name = $2, phone = $3, address = $4, 
          personal_description = $5, hard_skills = $6, soft_skills = $7,
          experiences = $8, education = $9
      WHERE id = $10 RETURNING *
    `;

    const values = [
      extractedData.first_name,
      extractedData.last_name,
      extractedData.phone,
      extractedData.address,
      extractedData.personal_description,
      extractedData.hard_skills,
      extractedData.soft_skills,
      JSON.stringify(extractedData.experiences),
      JSON.stringify(extractedData.education),
      userId,
    ];

    const updatedUser = await query(updateQuery, values);

    // Rimuoviamo il buffer del file dalla risposta per non appesantirla
    delete updatedUser.rows[0].cv_file;
    delete updatedUser.rows[0].profile_image;

    res.json({
      message: "Profilo aggiornato con i dati del CV! ✨",
      user: updatedUser.rows[0],
    });
  } catch (error) {
    handleAIError(res, error, "Estrazione Dati CV");
  }
};
