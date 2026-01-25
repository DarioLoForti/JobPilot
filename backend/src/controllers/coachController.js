import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../config/db.js";

// Helper per gestire l'errore di quota (429) senza far crashare il server
const handleAIError = (res, error, context) => {
  console.error(`Errore AI [${context}]:`, error);
  if (error.status === 429 || error.message?.includes("429")) {
    return res.status(429).json({
      error:
        "⚠️ Quota 'Gemini 2.5 PRO' esaurita. Il modello Pro ha limiti più stretti. Riprova più tardi.",
    });
  }
  res.status(500).json({ error: `Errore durante ${context}` });
};

// =================================================================
// 1. IDENTITY LAB (Test di Personalità Dinamico)
// =================================================================

export const getPersonalityTest = async (req, res) => {
  const userId = req.user.id;

  try {
    // Recuperiamo contesto utente
    const userRes = await query(
      "SELECT hard_skills, soft_skills, personal_description FROM users WHERE id = $1",
      [userId],
    );
    const user = userRes.rows[0];

    const userContext = user
      ? `Skills: ${user.hard_skills}, ${user.soft_skills}. Bio: ${user.personal_description}`
      : "Professionista in cerca di crescita lavorativa.";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Sei un esperto Psicologo del Lavoro.
    Crea un test "Identity Lab" unico per questo candidato.
    PROFILO: ${userContext}

    Genera 5 domande situazionali/introspettive per valutare i tratti Big Five (OCEAN) e l'attitudine lavorativa.
    Rispondi SOLO con un array JSON puro:
    [
      { "id": 1, "text": "..." },
      ...
    ]`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);

    if (!jsonMatch) throw new Error("Formato risposta AI non valido");

    const questions = JSON.parse(jsonMatch[0]);
    const formattedQuestions = questions.map((q, index) => ({
      id: index + 1,
      text: q.text,
    }));

    res.json(formattedQuestions);
  } catch (error) {
    handleAIError(res, error, "Generazione Test Dinamico");
  }
};

export const submitPersonalityTest = async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Agisci come uno Psicologo del Lavoro.
    Analizza queste risposte: ${JSON.stringify(answers)}

    Crea un profilo professionale basato su:
    1. Archetipo (es: "Il Leader Empatico").
    2. Punti di Forza (3 punti).
    3. Ambiente Ideale.
    4. Soft Skills dominanti.

    Rispondi SOLO in JSON:
    {
      "archetype": "...",
      "description": "...",
      "strengths": ["...", "...", "..."],
      "ideal_environment": "...",
      "soft_skills": ["...", "..."]
    }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Sei un Senior Recruiter presso ${company} per il ruolo ${position}.
    Descrizione: ${description}.
    Genera una domanda di colloquio difficile specifica. Rispondi SOLO con il testo.`;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Sei un Recruiter. Domanda: "${question}". Risposta: "${answer}".
    Valuta (1-10) e dai feedback.
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Agisci come Hiring Manager (Protocollo U.C.A.F.).
    Ruolo: ${job.position} presso ${job.company}. Descrizione: ${job.job_description}.

    Genera 4 prove:
    1. CORE TECHNICAL (Work Sample realistico).
    2. COGNITIVE (Logica/Problem Solving).
    3. BEHAVIORAL (STAR method).
    4. VALUES (Fit Culturale).

    Rispondi SOLO in JSON:
    { "section_1_task": "...", "section_2_logic": "...", "section_3_behavioral": "...", "section_4_values": "..." }`;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Valutatore U.C.A.F.
    INPUT:
    1. Tech: "${questions.section_1_task}" -> "${answers.s1}"
    2. Cog: "${questions.section_2_logic}" -> "${answers.s2}"
    3. Beh: "${questions.section_3_behavioral}" -> "${answers.s3}"
    4. Val: "${questions.section_4_values}" -> "${answers.s4}"

    SCORING (1-5). Pesi: Tech 40%, Cog 20%, Beh 25%, Val 15%.
    Genera report Markdown.
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

// =================================================================
// 4. SKILL & LOGIC AUDIT (Test 50 Domande Massivo)
// =================================================================

export const generateQuizTest = async (req, res) => {
  const userId = req.user.id;

  try {
    const userRes = await query(
      "SELECT hard_skills, soft_skills, personal_description FROM users WHERE id = $1",
      [userId],
    );
    const user = userRes.rows[0];

    const userContext = user
      ? `Skills: ${user.hard_skills}. Bio: ${user.personal_description}`
      : "Professionista generico.";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // ✅ CONFIGURAZIONE JSON MODE: Questo evita errori di sintassi
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Sei un Senior Assessor. Crea un "Deep Audit Exam" di 30 DOMANDE a risposta multipla.
    PROFILO: ${userContext}

    REGOLE:
    1. Genera ESATTAMENTE 30 domande.
    2. Mix: 10 Hard Skills, 10 Situational/Soft, 10 Logica.
    3. 4 Opzioni per domanda.
    4. Usa chiavi JSON brevi per risparmiare spazio: 'id', 'q' (domanda), 'o' (opzioni).

    Rispondi SOLO con questo array JSON:
    [
      {"id":1, "q":"...", "o":["A","B","C","D"]},
      ...
    ]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const rawQuestions = JSON.parse(responseText);

    // Mappiamo le chiavi brevi ('q', 'o') a quelle lunghe che il frontend si aspetta ('question', 'options')
    const formattedQuestions = rawQuestions.map((item) => ({
      id: item.id,
      question: item.q,
      options: item.o,
    }));

    res.json(formattedQuestions);
  } catch (error) {
    handleAIError(res, error, "Generazione Quiz 30");
  }
};

export const evaluateQuizTest = async (req, res) => {
  const { questions, answers } = req.body;
  const userId = req.user.id;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Per risparmiare token nel prompt di valutazione, inviamo un sunto
    const prompt = `Correggi questo quiz di 50 domande.
    Risposte Utente (ID: Risposta): ${JSON.stringify(answers)}
    
    Calcola score (0-100).
    Rispondi SOLO in JSON:
    {
      "score": 0,
      "level": "Junior/Mid/Senior/Expert",
      "analysis": "Analisi discorsiva...",
      "top_skills": ["Skill A", "Skill B"],
      "areas_to_improve": ["Area 1", "Area 2"]
    }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch[0]);

    await query(
      "INSERT INTO assessments (user_id, type, results) VALUES ($1, 'quiz_audit', $2)",
      [userId, JSON.stringify(evaluation)],
    );

    res.json(evaluation);
  } catch (error) {
    handleAIError(res, error, "Valutazione Quiz");
  }
};
