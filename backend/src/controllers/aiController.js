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
      error: "⚠️ Quota 'Gemini 2.5 PRO' esaurita. Riprova più tardi.",
    });
  }
  res.status(500).json({ error: `Errore durante ${context}` });
};

// ------------------------------------------------------------------
// 1. GENERATORE LETTERA (Prompt Aggiornato + Parsing Varianti)
// ------------------------------------------------------------------
export const generateCoverLetter = async (req, res) => {
  const { company, position, tone, userName } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Recuperiamo skills per contesto extra (opzionale)
    const userRes = await query(
      "SELECT hard_skills, soft_skills FROM users WHERE id = $1",
      [req.user.id],
    );
    const userSkills = userRes.rows[0]
      ? `${userRes.rows[0].hard_skills}, ${userRes.rows[0].soft_skills}`
      : "Generali";

    const prompt = `Agisci come un Career Advisor e Senior Recruiter AI, esperto nella scrittura di lettere di presentazione persuasive e ottimizzate per ATS.

====================
INPUT
====================
Candidato: ${userName}
Azienda: ${company}
Posizione: ${position}
Tono richiesto: ${tone} (scegli tra Formale / Neutro / Confidente)
Skills principali e punti di forza: ${userSkills}

====================
COMPITO
====================
Genera **una lettera di presentazione professionale**, in italiano, che:
1. Introduca il candidato in modo chiaro e personale
2. Colleghi le competenze, esperienze e risultati del candidato alla posizione
3. Utilizzi le parole chiave rilevanti dell’annuncio (se disponibili)
4. Rispetti il tono scelto
5. Concluda con una call-to-action cortese e motivata

Crea **3 varianti distinte** della lettera, ciascuna con:
- tipo: Formale
- tipo: Neutro
- tipo: Confidente

====================
LINEE GUIDA IMPORTANTI
====================
- Mantieni massimo 300–400 parole per lettera
- Evita frasi generiche o vaghe
- Rispondi esclusivamente in JSON valido, senza markdown o testo extra

====================
FORMATO JSON OBBLIGATORIO
====================
[
  {
    "type": "Formale",
    "letter": "Testo completo..."
  },
  {
    "type": "Neutro",
    "letter": "Testo completo..."
  },
  {
    "type": "Confidente",
    "letter": "Testo completo..."
  }
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
      // Fallback robusto se l'AI non restituisce un array JSON
      console.error("Errore parsing lettera:", e);
      variants = [{ type: tone || "Standard", letter: text }];
    }

    res.json({ variants }); // Inviamo le varianti al frontend
  } catch (error) {
    handleAIError(res, error, "Generazione Lettera");
  }
};

// ------------------------------------------------------------------
// 2. UPLOAD CV (Prompt Aggiornato)
// ------------------------------------------------------------------
export const uploadCV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "Nessun file caricato" });

    // Estrazione testo preliminare per il prompt
    const pdfData = await pdf(req.file.buffer);
    const pdfText = pdfData.text.substring(0, 2000); // Primi 2000 caratteri per check veloce

    // Salviamo prima nel DB
    const result = await query(
      "UPDATE users SET cv_file = $1, cv_filename = $2 WHERE id = $3 RETURNING cv_filename",
      [req.file.buffer, req.file.originalname, req.user.id],
    );

    // Analisi rapida AI (Opzionale, solo per feedback immediato)
    // Nota: Il vero parsing avviene in 'extractCVData' o 'analyzeCV'

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
// 3. ANALISI CV (Scoring & Feedback)
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Agisci come un Senior Recruiter e Career Advisor esperto in valutazione CV.

====================
INPUT
====================
Testo CV estratto:
${pdfData.text.substring(0, 15000)}

====================
COMPITO
====================
Analizza il CV del candidato e fornisci:
1. **Score (0–100)**: completezza, chiarezza, ATS-friendly.
2. **Summary**: sintesi professionale (2–4 frasi).
3. **Strengths**: elenco punti di forza.
4. **Improvements**: suggerimenti concreti.
5. **Explainability**: breve spiegazione del punteggio.

Rispondi in ITALIANO e SOLO JSON valido.

====================
FORMATO JSON OBBLIGATORIO
====================
{
  "score": 0,
  "summary": "",
  "strengths": ["..."],
  "improvements": ["..."],
  "explainability": ""
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
// 5. SCRAPE URL (Magic Scrape)
// ------------------------------------------------------------------
export const scrapeJob = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL mancante" });
  try {
    // Nota: Scraping diretto di pagine complesse spesso fallisce senza puppeteer.
    // Qui assumiamo che fetch ritorni HTML leggibile.
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();

    const cleanContent = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/g, "")
      .replace(/<[^>]+>/g, " ") // Rimuove tag HTML rimanenti
      .substring(0, 15000);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent(
      `Agisci come un parser professionale di annunci di lavoro.
      
      Estrai le informazioni da questo testo grezzo (HTML pulito):
      ${cleanContent}

      Output JSON richiesto (in Italiano):
      {
        "company": "",
        "position": "",
        "job_description": "",
        "location": "",
        "employment_type": "",
        "seniority": "",
        "key_skills": [],
        "requirements": [],
        "benefits": []
      }
      `,
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Agisci come Senior Recruiter.
    
    Candidato:
    Hard Skills: ${userRes.rows[0].hard_skills}
    Soft Skills: ${userRes.rows[0].soft_skills}

    Job Description:
    ${jobRes.rows[0].job_description}

    Analizza il fit.
    Output JSON (Italiano):
    {
      "match_percentage": 0,
      "verdict": "Ottimo/Buono/Parziale/Scarso",
      "strengths": [],
      "missing_skills": [],
      "cv_advice": "Consiglio breve"
    }
    `;

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
// 7. EXTRACT CV DATA (Popolamento Profilo - SCHEMA CORRETTO PER IL FRONTEND)
export const extractCVData = async (req, res) => {
  try {
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (!dbResult.rows[0]?.cv_file)
      return res.status(400).json({ error: "Carica il PDF!" });

    const pdfData = await pdf(dbResult.rows[0].cv_file);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // 🔥 FIX: Schema JSON allineato esattamente con i campi di Profile.jsx
    const prompt = `Agisci come un Resume Parser per un sistema ATS. 
    Estrai i dati da questo CV in Italiano.
    
    TESTO CV:
    ${pdfData.text.substring(0, 25000)}

    ====================
    REGOLE DI ESTRAZIONE
    ====================
    1. Estrai SOLO ciò che è scritto. Non inventare.
    2. Per le date, cerca di usare il formato YYYY-MM-DD. Se c'è solo l'anno, usa YYYY-01-01.
    3. Se manca un dato, lascia stringa vuota "".

    ====================
    SCHEMA JSON OBBLIGATORIO (Rispetta le chiavi esatte)
    ====================
    Rispondi SOLO con un JSON valido:
    {
      "first_name": "Nome",
      "last_name": "Cognome",
      "phone": "Telefono",
      "address": "Città/Indirizzo",
      "email": "Email trovata nel cv (opzionale)",
      "personal_description": "Breve riassunto professionale (max 300 caratteri)",
      "hard_skills": "Lista skill tecniche separate da virgola",
      "soft_skills": "Lista skill soft separate da virgola",
      "socials": [
         { "platform": "LinkedIn", "url": "..." },
         { "platform": "GitHub", "url": "..." }
      ],
      "experiences": [
        { 
          "role": "Titolo Ruolo", 
          "company": "Nome Azienda", 
          "dateStart": "YYYY-MM-DD", 
          "dateEnd": "YYYY-MM-DD", 
          "current": false,
          "description": "Elenco responsabilità"
        }
      ],
      "education": [
        { 
          "degree": "Titolo (es. Diploma, Laurea Triennale)", 
          "school": "Nome Istituto o Università", 
          "city": "Città Istituto",
          "dateStart": "YYYY-MM-DD",
          "dateEnd": "YYYY-MM-DD", 
          "description": "Voto o dettagli tesi"
        }
      ],
      "certifications": [
        { "name": "Nome Certificazione", "year": "Anno (YYYY)" }
      ]
    }
    `;

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
      return res
        .status(500)
        .json({ error: "L'AI non ha generato un JSON valido. Riprova." });
    }

    // Aggiornamento nel DB
    const updated = await query(
      `UPDATE users SET 
        first_name=COALESCE($1, first_name), 
        last_name=COALESCE($2, last_name), 
        phone=COALESCE($3, phone), 
        address=COALESCE($4, address), 
        personal_description=COALESCE($5, personal_description), 
        hard_skills=COALESCE($6, hard_skills), 
        soft_skills=COALESCE($7, soft_skills), 
        experiences=$8, 
        education=$9,
        certifications=$10,
        socials=$11
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
        JSON.stringify(extractedData.education || []), // Ora le chiavi (school, degree) coincidono!
        JSON.stringify(extractedData.certifications || []),
        JSON.stringify(extractedData.socials || []),
        req.user.id,
      ],
    );

    delete updated.rows[0].cv_file;
    res.json({
      message: "Profilo aggiornato con successo!",
      user: updated.rows[0],
    });
  } catch (error) {
    handleAIError(res, error, "Estrazione Dati");
  }
};

// ------------------------------------------------------------------

// 8. JOB FINDER REALE (JSearch + Gemini Analysis)
// ------------------------------------------------------------------
export const searchJobs = async (req, res) => {
  const {
    query: searchTerms,
    location,
    remoteOnly,
    datePosted,
    jobType,
    experience,
  } = req.body;

  try {
    if (!process.env.RAPIDAPI_KEY)
      return res.status(500).json({ error: "Chiave API mancante." });

    // --- 1. Costruzione Query JSearch ---
    let experienceKeyword = "";
    if (experience === "entry") experienceKeyword = "Junior";
    if (experience === "mid") experienceKeyword = "Mid Level";
    if (experience === "senior") experienceKeyword = "Senior";

    let employmentTypeParam = undefined;
    if (jobType === "fulltime") employmentTypeParam = "FULLTIME";
    if (jobType === "parttime") employmentTypeParam = "PARTTIME";
    if (jobType === "contract") employmentTypeParam = "CONTRACTOR";
    if (jobType === "intern") employmentTypeParam = "INTERN";

    const finalQuery = `${experienceKeyword} ${searchTerms} in ${location}`;

    const options = {
      method: "GET",
      url: "https://jsearch.p.rapidapi.com/search",
      params: {
        query: finalQuery,
        page: "1",
        num_pages: "1",
        date_posted: datePosted || "month",
        country: "it",
        ...(employmentTypeParam && { employment_types: employmentTypeParam }),
        ...(remoteOnly && { remote_jobs_only: "true" }),
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    };

    console.log(`📡 JSearch: "${finalQuery}"`);
    const apiRes = await axios.request(options);
    const realJobs = apiRes.data.data;

    if (!realJobs || realJobs.length === 0) return res.json([]);

    // --- 2. ANALISI AI (Gemini 2.5) ---
    const jobsToAnalyze = realJobs.slice(0, 6);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const userRes = await query("SELECT hard_skills FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const userSkills = userRes.rows[0]?.hard_skills || "General Skills";

    // Prepariamo dati sintetici per l'AI per risparmiare token
    const jobsDataString = JSON.stringify(
      jobsToAnalyze.map((j) => ({
        id: j.job_id,
        title: j.job_title,
        desc: j.job_description?.substring(0, 400),
      })),
    );

    const prompt = `Agisci come Recruiter Senior.
    
    CANDIDATO SKILLS: ${userSkills}

    OFFERTE: ${jobsDataString}

    Per OGNI offerta, calcola Match Score (0-100) e analizza skills.
    
    Output JSON Array OBBLIGATORIO:
    [
      {
        "id": "job_id_copiato_da_input",
        "matchScore": 0,
        "hard_skills_found": ["A", "B"],
        "hard_skills_missing": ["C"],
        "soft_skills_found": ["D"],
        "soft_skills_missing": ["E"],
        "explainability": "Motivo del match in 1 frase"
      }
    ]
    `;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let aiAnalysis = [];
    try {
      aiAnalysis = JSON.parse(aiText);
    } catch (e) {
      console.error("Errore JSON AI Search", e);
    }

    // --- 3. MERGE DATI REALI + AI ---
    const finalResults = jobsToAnalyze.map((job) => {
      const analysis = aiAnalysis.find((a) => a.id === job.job_id) || {
        matchScore: 0,
        hard_skills_found: [],
        soft_skills_found: [],
        hard_skills_missing: [],
        soft_skills_missing: [],
        explainability: "Analisi non disponibile",
      };

      // Uniamo gli array per compatibilità col frontend
      const skillsFound = [
        ...(analysis.hard_skills_found || []),
        ...(analysis.soft_skills_found || []),
      ];
      const skillsMissing = [
        ...(analysis.hard_skills_missing || []),
        ...(analysis.soft_skills_missing || []),
      ];

      return {
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city
          ? `${job.job_city}, ${job.job_country}`
          : "Remoto",
        type: job.job_employment_type || "Full-time",
        logo: job.employer_logo || null,
        description: job.job_description,
        link: job.job_apply_link || job.job_google_link || "#",

        // Dati AI Arricchiti
        matchScore: analysis.matchScore,
        skills_found: skillsFound,
        skills_missing: skillsMissing,
        explainability: analysis.explainability,
      };
    });

    res.json(finalResults);
  } catch (error) {
    if (error.response) {
      // Gestione errori specifica API JSearch
      if (error.response.status === 429)
        return res.status(429).json({ error: "Limit API JSearch raggiunto." });
    }
    handleAIError(res, error, "Job Search");
  }
};

// ------------------------------------------------------------------
// 9. ICEBREAKER GENERATOR (Messaggi LinkedIn)
// ------------------------------------------------------------------
export const generateIcebreaker = async (req, res) => {
  const { company, position, keywords } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Genera 3 messaggi LinkedIn (max 300 char) per candidarsi.
    Ruolo: ${position} @ ${company}. Keywords: ${keywords}.
    
    Output JSON Array:
    [
      { "type": "Formale", "text": "..." },
      { "type": "Appassionato", "text": "..." },
      { "type": "Smart/Skill", "text": "..." }
    ]`;

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
// 10. AI RESUME TAILORING (Riscittura CV)
// ------------------------------------------------------------------
export const tailorCV = async (req, res) => {
  const { jobDescription } = req.body;
  try {
    const userId = req.user.id;
    const dbResult = await query("SELECT cv_file FROM users WHERE id = $1", [
      userId,
    ]);

    if (!dbResult.rows[0]?.cv_file) {
      return res.status(400).json({ error: "Carica prima il tuo CV!" });
    }

    const pdfData = await pdf(dbResult.rows[0].cv_file);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `CV Tailoring. Ottimizza il CV per l'offerta.
    
    CV: ${pdfData.text.substring(0, 5000)}
    OFFERTA: ${jobDescription.substring(0, 5000)}

    Output JSON (Italiano):
    {
      "optimized_summary": "Nuovo profilo professionale...",
      "key_skills_to_add": ["Skill 1", "Skill 2"],
      "experience_enhancements": [
        { "role": "Role Title", "suggestion": "Come migliorare i bullet points..." }
      ]
    }`;

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
// 11. SMART FOLLOW-UP EMAIL
// ------------------------------------------------------------------
export const generateFollowUp = async (req, res) => {
  const { company, position, daysAgo } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const timeContext = daysAgo ? `${daysAgo} giorni fa` : "recentemente";

    const prompt = `Scrivi 3 varianti di email di follow-up (Formale, Neutra, Confidente) per candidatura inviata ${timeContext}.
    Ruolo: ${position} @ ${company}.
    
    Restituisci un JSON Array:
    [{ "type": "Formale", "subject": "...", "body": "..." }, ...]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Gestione formato: Se l'AI risponde con JSON array, estraiamo testo formattato
    let variants = [];
    try {
      variants = JSON.parse(text);
      // Convertiamo in un'unica stringa leggibile per il frontend attuale
      const formattedText = variants
        .map(
          (v) =>
            `=== ${v.type.toUpperCase()} ===\nOggetto: ${v.subject}\n\n${v.body}`,
        )
        .join("\n\n-------------------\n\n");
      res.json({ email: formattedText });
    } catch (e) {
      // Fallback testo semplice
      res.json({ email: text });
    }
  } catch (error) {
    handleAIError(res, error, "Generazione Follow-up");
  }
};

// ------------------------------------------------------------------
// 12. INTERVIEW SIMULATOR (Nuovo con Scoring)
// ------------------------------------------------------------------
export const generateInterviewQuestions = async (req, res) => {
  const { company, position, jobDescription } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const context = jobDescription
      ? jobDescription.substring(0, 3000)
      : "Standard role requirements";

    const prompt = `Simula un colloquio per ${position} @ ${company}.
    Contesto: ${context}

    Genera 3 domande (Tecnica, Comportamentale, Situazionale).
    
    Output JSON Array OBBLIGATORIO:
    [
      {
        "type": "Tecnica",
        "question": "...",
        "follow_up_question": "...",
        "recruiter_intent": "...",
        "sample_answer": "...",
        "scoring_criteria": { "1": "Bad", "3": "Avg", "5": "Good" }
      },
      ...
    ]`;

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
