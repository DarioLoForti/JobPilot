import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../config/db.js";

// Helper per gestire l'errore di quota (429) senza far crashare il server
const handleAIError = (res, error, context) => {
  console.error(`Errore AI [${context}]:`, error);
  if (error.status === 429 || error.message?.includes("429")) {
    return res.status(429).json({
      error:
        "⚠️ Quota 'Gemini 2.5' esaurita per oggi. Riprova domani o attendi il reset.",
    });
  }
  res.status(500).json({ error: `Errore durante ${context}` });
};

// =================================================================
// 1. IDENTITY LAB (Test di Personalità & Soft Skills)
// =================================================================

export const getPersonalityTest = async (req, res) => {
  try {
    const questions = [
      {
        id: 1,
        text: "Quando inizi un nuovo progetto, preferisci avere un piano dettagliato o improvvisare man mano?",
      },
      {
        id: 2,
        text: "In una discussione accesa con un collega, tendi a mediare per la pace o a imporre la tua logica?",
      },
      {
        id: 3,
        text: "Dopo una giornata di lavoro intenso, ti ricarichi stando da solo o uscendo con altre persone?",
      },
      {
        id: 4,
        text: "Come reagisci se un cliente o un capo critica aspramente il tuo lavoro davanti agli altri?",
      },
      {
        id: 5,
        text: "Cosa ti motiva di più: raggiungere un obiettivo ambizioso o aiutare il team a crescere?",
      },
    ];
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero del test." });
  }
};

export const submitPersonalityTest = async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // ✅ MANTENUTO GEMINI 2.5 FLASH COME RICHIESTO
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Agisci come uno Psicologo del Lavoro esperto.
    Analizza queste risposte di un candidato:
    ${JSON.stringify(answers)}

    Crea un profilo professionale basato su:
    1. Archetipo (es: "Il Leader Empatico", "L'Analista Visionario").
    2. Punti di Forza (3 punti chiave).
    3. Ambiente Ideale (descrizione breve).
    4. Soft Skills dominanti.

    Rispondi ESCLUSIVAMENTE in JSON con questa struttura:
    {
      "archetype": "...",
      "description": "...",
      "strengths": ["...", "...", "..."],
      "ideal_environment": "...",
      "soft_skills": ["...", "..."]
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Errore nel parsing della risposta AI");

    const profile = JSON.parse(jsonMatch[0]);

    await query(
      "INSERT INTO assessments (user_id, type, results) VALUES ($1, 'personality', $2)",
      [userId, JSON.stringify(profile)],
    );

    res.json(profile);
  } catch (error) {
    handleAIError(res, error, "Analisi Personalità");
  }
};

export const getAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      "SELECT * FROM assessments WHERE user_id = $1 AND type = 'personality' ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    res.json(result.rows[0]?.results || null);
  } catch (error) {
    res.status(500).json({ error: "Errore recupero storico" });
  }
};

// =================================================================
// 2. INTERVIEW SIMULATOR (Colloquio Singolo)
// =================================================================

export const startMockInterview = async (req, res) => {
  const { company, position, description } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // ✅ MANTENUTO GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sei un Senior Recruiter presso ${company}. Stai assumendo un ${position}.
    Descrizione lavoro: ${description || "Standard per il ruolo"}.
    
    Genera una domanda di colloquio difficile (tecnica o comportamentale) specifica per questo ruolo.
    Rispondi SOLO con il testo della domanda.`;

    const result = await model.generateContent(prompt);
    res.json({ question: result.response.text() });
  } catch (error) {
    handleAIError(res, error, "Generazione Domanda");
  }
};

export const evaluateInterviewAnswer = async (req, res) => {
  const { question, answer } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // ✅ MANTENUTO GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sei un Recruiter. 
    Domanda: "${question}"
    Risposta Candidato: "${answer}"
    
    Valuta la risposta (Voto 1-10) e dai un consiglio per migliorarla.
    Rispondi SOLO in JSON: { "score": 0, "feedback": "...", "improved_version": "..." }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    handleAIError(res, error, "Valutazione Risposta");
  }
};

// =================================================================
// 3. U.C.A.F. PROTOCOL (Universal Competency Assessment Framework)
// =================================================================

export const generateUCAFAssessment = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.id;

  try {
    const jobRes = await query(
      "SELECT * FROM job_applications WHERE id = $1 AND user_id = $2",
      [jobId, userId],
    );
    if (jobRes.rows.length === 0)
      return res.status(404).json({ error: "Lavoro non trovato" });
    const job = jobRes.rows[0];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // ✅ MANTENUTO GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Agisci come un Hiring Manager che usa il protocollo U.C.A.F.
    Devi generare le prove per un candidato per il ruolo di: ${job.position} presso ${job.company}.
    Descrizione Job: ${job.job_description || "Ruolo standard"}.

    Genera 4 prove distinte secondo queste regole:
    1. CORE TECHNICAL (Work Sample): Una simulazione pratica realistica basata sulla descrizione.
    2. COGNITIVE: Una domanda di logica condizionale o problem solving astratto.
    3. BEHAVIORAL: Una domanda situazionale specifica (STAR method).
    4. VALUES: Una domanda per capire se i valori del candidato si allineano alla cultura aziendale.

    Rispondi SOLO in JSON:
    {
      "section_1_task": "...",
      "section_2_logic": "...",
      "section_3_behavioral": "...",
      "section_4_values": "..."
    }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    handleAIError(res, error, "Generazione UCAF");
  }
};

export const evaluateUCAFAssessment = async (req, res) => {
  const { jobId, questions, answers } = req.body;
  const userId = req.user.id;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // ✅ MANTENUTO GEMINI 2.5 FLASH
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Sei il Valutatore Ufficiale del protocollo U.C.A.F.
    Valuta le risposte del candidato.

    INPUT:
    1. Technical: "${questions.section_1_task}" -> "${answers.s1}"
    2. Cognitive: "${questions.section_2_logic}" -> "${answers.s2}"
    3. Behavioral: "${questions.section_3_behavioral}" -> "${answers.s3}"
    4. Values: "${questions.section_4_values}" -> "${answers.s4}"

    REGOLE DI SCORING (1-5):
    - 1: Inadeguato
    - 3: Adeguato
    - 5: Eccezionale

    PESI: Tech 40%, Cog 20%, Beh 25%, Val 15%.

    Genera il report "Universal Hiring Scorecard" in Markdown.
    Rispondi SOLO in JSON: { "score_total": 85, "markdown_report": "# REPORT..." }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch[0]);

    await query(
      "INSERT INTO assessments (user_id, job_id, type, results, markdown_report) VALUES ($1, $2, 'ucaf', $3, $4)",
      [userId, jobId, JSON.stringify(evaluation), evaluation.markdown_report],
    );

    res.json(evaluation);
  } catch (error) {
    handleAIError(res, error, "Valutazione UCAF");
  }
};
