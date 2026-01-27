import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../config/db.js";
import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse-fork");

// Helper Errori Standardizzato
const handleAIError = (res, error, context) => {
  console.error(`Errore AI [${context}]:`, error);
  if (error.status === 429 || error.message?.includes("429")) {
    return res.status(429).json({
      error:
        "⚠️ Quota 'Gemini' esaurita o Limite API raggiunto. Riprova più tardi.",
    });
  }
  res.status(500).json({ error: `Errore durante ${context}` });
};

// ------------------------------------------------------------------
// 1. GENERATORE LETTERA
// ------------------------------------------------------------------
export const generateCoverLetter = async (req, res) => {
  const { company, position, tone, userName } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const userRes = await query(
      "SELECT hard_skills, soft_skills FROM users WHERE id = $1",
      [req.user.id],
    );
    const userSkills = userRes.rows[0]
      ? `${userRes.rows[0].hard_skills}, ${userRes.rows[0].soft_skills}`
      : "Generali";

    const prompt = `Agisci come un Career Advisor e Senior Recruiter AI.

====================
INPUT
====================
Candidato: ${userName}
Azienda: ${company}
Posizione: ${position}
Tono: ${tone}
Skills: ${userSkills}

====================
COMPITO
====================
Genera 3 varianti di lettera di presentazione (Formale, Neutro, Confidente).
Massimo 300 parole ciascuna.

====================
FORMATO JSON OBBLIGATORIO
====================
[
  { "type": "Formale", "letter": "..." },
  { "type": "Neutro", "letter": "..." },
  { "type": "Confidente", "letter": "..." }
]
`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let variants = [];
    try {
      variants = JSON.parse(text);
    } catch (e) {
      console.error("Errore parsing lettera:", e);
      variants = [{ type: tone || "Standard", letter: text }];
    }

    res.json({ variants });
  } catch (error) {
    handleAIError(res, error, "Generazione Lettera");
  }
};

// ------------------------------------------------------------------
// 2. UPLOAD CV
// ------------------------------------------------------------------
export const uploadCV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Nessun file caricato" });

    // Salviamo nel DB
    const result = await query(
      "UPDATE users SET cv_file = $1, cv_filename = $2 WHERE id = $3 RETURNING cv_filename",
      [req.file.buffer, req.file.originalname, req.user.id],
    );

    res.json({
      message: "CV Caricato con successo",
      filename: result.rows[0].cv_filename,
      preview_check: "File pronto per l'analisi.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore upload." });
  }
};

// ------------------------------------------------------------------
// 3. ANALISI CV
// ------------------------------------------------------------------
export const analyzeCV = async (req, res) => {
  try {
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (!dbResult.rows[0]?.cv_file)
      return res.status(400).json({ error: "Carica il PDF prima!" });

    const pdfData = await pdf(dbResult.rows[0].cv_file);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analizza il CV.
    Testo: ${pdfData.text.substring(0, 15000)}

    Output JSON richiesto:
    {
      "score": 0,
      "summary": "...",
      "strengths": ["..."],
      "improvements": ["..."],
      "explainability": "..."
    }
    `;
    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const analysisData = JSON.parse(text);

    await query("INSERT INTO cv_history (user_id, score) VALUES ($1, $2)", [
      req.user.id,
      analysisData.score,
    ]);

    res.json(analysisData);
  } catch (error) {
    handleAIError(res, error, "Analisi CV");
  }
};

// ------------------------------------------------------------------
// 4. STORICO PUNTEGGI
// ------------------------------------------------------------------
export const getScoreHistory = async (req, res) => {
  try {
    const result = await query(
      "SELECT score, created_at as date FROM cv_history WHERE user_id = $1 ORDER BY created_at ASC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Errore storico." });
  }
};

// ------------------------------------------------------------------
// 5. SCRAPE URL (Helper per importare da link esterno)
// ------------------------------------------------------------------
export const scrapeJob = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL mancante" });
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();
    const cleanContent = html.replace(/<[^>]+>/g, " ").substring(0, 15000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      `Estrai dati annuncio da questo testo:
      ${cleanContent}

      Output JSON:
      {
        "company": "", "position": "", "job_description": "", "location": "",
        "employment_type": "", "seniority": "", "key_skills": [], "requirements": [], "benefits": []
      }`,
    );

    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    res.json(JSON.parse(text));
  } catch (error) {
    handleAIError(res, error, "Magic Scrape");
  }
};

// ------------------------------------------------------------------
// 6. MATCH ANALYSIS
// ------------------------------------------------------------------
export const getJobMatch = async (req, res) => {
  const { jobId } = req.params;
  try {
    const userRes = await query(
      "SELECT hard_skills, soft_skills FROM users WHERE id = $1",
      [req.user.id],
    );
    const jobRes = await query(
      "SELECT job_description FROM job_applications WHERE id = $1",
      [jobId],
    );

    if (!userRes.rows[0] || !jobRes.rows[0])
      return res.status(404).json({ error: "Dati mancanti" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analizza Fit Candidato vs Job.
    Skills: ${userRes.rows[0].hard_skills}, ${userRes.rows[0].soft_skills}
    Job: ${jobRes.rows[0].job_description}

    Output JSON:
    {
      "match_percentage": 0,
      "verdict": "Ottimo/Buono/Parziale/Scarso",
      "strengths": [],
      "missing_skills": [],
      "cv_advice": "..."
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    res.json(JSON.parse(text));
  } catch (error) {
    handleAIError(res, error, "Match Analysis");
  }
};

// ------------------------------------------------------------------
// 7. EXTRACT CV DATA (Popolamento Profilo)
// ------------------------------------------------------------------
export const extractCVData = async (req, res) => {
  try {
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (!dbResult.rows[0]?.cv_file)
      return res.status(400).json({ error: "Carica il PDF!" });

    const pdfData = await pdf(dbResult.rows[0].cv_file);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Estrai dati CV in JSON.
    Testo: ${pdfData.text.substring(0, 25000)}

    JSON OBBLIGATORIO:
    {
      "first_name": "", "last_name": "", "phone": "", "address": "", "email": "",
      "personal_description": "", "hard_skills": "", "soft_skills": "",
      "socials": [{ "platform": "", "url": "" }],
      "experiences": [{ "role": "", "company": "", "dateStart": "", "dateEnd": "", "current": false, "description": "" }],
      "education": [{ "degree": "", "school": "", "city": "", "dateStart": "", "dateEnd": "", "description": "" }],
      "certifications": [{ "name": "", "year": "" }]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let extractedData;
    try {
      extractedData = JSON.parse(text);
    } catch (e) {
      console.error("Errore parsing JSON AI:", e);
      return res.status(500).json({ error: "JSON invalido." });
    }

    const updated = await query(
      `UPDATE users SET 
        first_name=COALESCE($1, first_name), 
        last_name=COALESCE($2, last_name), 
        phone=COALESCE($3, phone), 
        address=COALESCE($4, address), 
        personal_description=COALESCE($5, personal_description), 
        hard_skills=COALESCE($6, hard_skills), 
        soft_skills=COALESCE($7, soft_skills), 
        experiences=$8, education=$9, certifications=$10, socials=$11
       WHERE id=$12 RETURNING *`,
      [
        extractedData.first_name,
        extractedData.last_name,
        extractedData.phone,
        extractedData.address,
        extractedData.personal_description,
        extractedData.hard_skills,
        extractedData.soft_skills,
        JSON.stringify(extractedData.experiences || []),
        JSON.stringify(extractedData.education || []),
        JSON.stringify(extractedData.certifications || []),
        JSON.stringify(extractedData.socials || []),
        req.user.id,
      ],
    );

    delete updated.rows[0].cv_file;
    res.json({ message: "Profilo aggiornato!", user: updated.rows[0] });
  } catch (error) {
    handleAIError(res, error, "Estrazione Dati");
  }
};

// ------------------------------------------------------------------
// 8. JOB FINDER REALE (CON JSEARCH RAPIDAPI)
// ------------------------------------------------------------------
export const searchJobs = async (req, res) => {
  // Supporto per parametri sia in Query String (GET) che nel Body (POST)
  const params = { ...req.query, ...req.body };

  const {
    query: searchTerms, // 'query' o 'q'
    q,
    location,
    remoteOnly,
    datePosted,
  } = params;

  // Usa 'q' se 'query' è vuoto
  const term = searchTerms || q;

  try {
    if (!process.env.RAPIDAPI_KEY) {
      console.error("RAPIDAPI_KEY mancante nel .env");
      return res
        .status(500)
        .json({
          error: "Configurazione Server incompleta (API Key mancante).",
        });
    }

    if (!term) {
      return res
        .status(400)
        .json({
          error: "Inserisci un termine di ricerca (es. React Developer).",
        });
    }

    // Costruzione query JSearch
    let finalQuery = term;
    if (location && location !== "undefined") {
      finalQuery += ` in ${location}`;
    }

    const options = {
      method: "GET",
      url: "https://jsearch.p.rapidapi.com/search",
      params: {
        query: finalQuery,
        page: "1",
        num_pages: "1",
        date_posted: datePosted || "month",
        country: "it",
        // Filtro remoto se richiesto
        ...(remoteOnly === "true" || remoteOnly === true
          ? { remote_jobs_only: "true" }
          : {}),
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    };

    console.log(`🔍 Cercando su JSearch: ${finalQuery}`);
    const apiRes = await axios.request(options);
    const realJobs = apiRes.data.data;

    if (!realJobs || realJobs.length === 0) {
      return res.json([]);
    }

    // --- AI ANALYSIS (Opzionale e limitata) ---
    // Analizziamo solo i primi 6 risultati per non saturare Gemini e rispondere veloci
    const jobsToAnalyze = realJobs.slice(0, 6);

    // Default: Nessuna analisi se Gemini fallisce
    let aiAnalysis = [];

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const jobsDataString = JSON.stringify(
        jobsToAnalyze.map((j) => ({
          id: j.job_id,
          title: j.job_title,
          desc: j.job_description ? j.job_description.substring(0, 200) : "N/A", // Breve snippet
        })),
      );

      const prompt = `Valuta brevemente questi lavori.
        Dati: ${jobsDataString}
        
        Output JSON Array (solo ID e score 0-100):
        [{ "id": "...", "matchScore": 85, "explainability": "breve motivo" }]`;

      const aiResult = await model.generateContent(prompt);
      const aiText = aiResult.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      aiAnalysis = JSON.parse(aiText);
    } catch (e) {
      console.warn(
        "⚠️ AI Analysis saltata per timeout o errore, restituisco solo i dati JSearch.",
      );
    }

    // Unione dati JSearch + AI
    const finalResults = jobsToAnalyze.map((job) => {
      const analysis = aiAnalysis.find((a) => a.id === job.job_id) || {};

      // LOGICA LINK: Cerca il link diretto, altrimenti usa link alternativi
      const validLink = job.job_apply_link || job.job_google_link || job.url;

      return {
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || "Remoto",
        type: job.job_employment_type,
        logo: job.employer_logo,
        description: job.job_description, // Testo completo
        link: validLink, // <--- Link funzionante
        matchScore: analysis.matchScore || 0, // 0 se AI ha fallito
        explainability: analysis.explainability || "Nuova opportunità trovata",
      };
    });

    res.json(finalResults);
  } catch (error) {
    console.error("Errore Search Jobs:", error.message);
    if (error.response?.status === 429) {
      return res
        .status(429)
        .json({ error: "Limite API Ricerca raggiunto. Riprova domani." });
    }
    handleAIError(res, error, "Job Search");
  }
};

// ------------------------------------------------------------------
// 9. ICEBREAKER
// ------------------------------------------------------------------
export const generateIcebreaker = async (req, res) => {
  const { company, position, keywords } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Genera 3 messaggi LinkedIn.
    Ruolo: ${position} @ ${company}. Keywords: ${keywords}.
    Output JSON: [{ "type": "", "text": "" }]`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    res.json(JSON.parse(text));
  } catch (error) {
    handleAIError(res, error, "Generazione Icebreaker");
  }
};

// ------------------------------------------------------------------
// 10. CV TAILORING
// ------------------------------------------------------------------
export const tailorCV = async (req, res) => {
  const { jobDescription } = req.body;
  try {
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (!dbResult.rows[0]?.cv_file)
      return res.status(400).json({ error: "Carica CV!" });

    const pdfData = await pdf(dbResult.rows[0].cv_file);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Tailoring CV.
    CV: ${pdfData.text.substring(0, 5000)}
    Job: ${jobDescription.substring(0, 5000)}
    Output JSON: { "optimized_summary": "...", "key_skills_to_add": [], "experience_enhancements": [] }`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    res.json(JSON.parse(text));
  } catch (error) {
    handleAIError(res, error, "CV Tailoring");
  }
};

// ------------------------------------------------------------------
// 11. FOLLOW-UP EMAIL
// ------------------------------------------------------------------
export const generateFollowUp = async (req, res) => {
  const { company, position, daysAgo } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Email Follow-up (Formale, Neutra, Confidente).
    ${position} @ ${company}, ${daysAgo} giorni fa.
    JSON: [{ "type": "", "subject": "", "body": "" }]`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const variants = JSON.parse(text);
      const formatted = variants
        .map(
          (v) =>
            `=== ${v.type.toUpperCase()} ===\nOggetto: ${v.subject}\n\n${v.body}`,
        )
        .join("\n\n---\n\n");
      res.json({ email: formatted });
    } catch (e) {
      res.json({ email: text });
    }
  } catch (error) {
    handleAIError(res, error, "Generazione Follow-up");
  }
};

// ------------------------------------------------------------------
// 12. INTERVIEW SIMULATOR
// ------------------------------------------------------------------
export const generateInterviewQuestions = async (req, res) => {
  const { company, position, jobDescription } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Simula colloquio ${position} @ ${company}.
    Output JSON: [{ "type": "", "question": "", "follow_up_question": "", "recruiter_intent": "", "sample_answer": "", "scoring_criteria": {} }]`;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    res.json(JSON.parse(text));
  } catch (error) {
    handleAIError(res, error, "Simulatore Colloquio");
  }
};
