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

    const prompt = `Agisci come uno Psicologo del Lavoro senior specializzato in assessment professionale e orientamento di carriera.

Stai creando un test proprietario chiamato **"Identity Lab"**, progettato per valutare:
- i tratti di personalità secondo il modello Big Five (OCEAN)
- l’attitudine lavorativa
- il comportamento decisionale in contesti professionali reali

====================
PROFILO CANDIDATO
====================
${userContext}

====================
COMPITO
====================
Genera **5 domande situazionali e introspettive**, formulate in modo chiaro e realistico, che permettano di osservare:
- Apertura mentale (Openness)
- Coscienziosità (Conscientiousness)
- Estroversione (Extraversion)
- Stabilità emotiva (Neuroticism inverso)
- Collaborazione e empatia (Agreeableness)

Le domande devono:
- essere ambientate in contesti lavorativi concreti
- stimolare una risposta riflessiva, non “giusta o sbagliata”
- evitare formulazioni cliniche o accademiche
- essere comprensibili a qualsiasi profilo professionale

====================
REGOLE OBBLIGATORIE
====================
- NON inserire spiegazioni, commenti o testo extra
- NON usare markdown
- NON includere analisi o scoring
- Restituisci **ESCLUSIVAMENTE** un array JSON valido
- Ogni domanda deve avere solo: id e text

====================
FORMATO DI RISPOSTA (OBBLIGATORIO)
====================
[
  { "id": 1, "text": "..." },
  { "id": 2, "text": "..." },
  { "id": 3, "text": "..." },
  { "id": 4, "text": "..." },
  { "id": 5, "text": "..." }
]
`;

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

    const prompt = `Agisci come un Senior Recruiter esperto e selettivo che sta conducendo un colloquio reale.

====================
CONTESTO
====================
Azienda: ${company}
Ruolo: ${position}

Descrizione del ruolo / annuncio:
${description}

====================
COMPITO
====================
Genera UNA sola domanda di colloquio **ad alta difficoltà**, specifica per questo ruolo, che:
- metta alla prova il pensiero critico del candidato
- richieda ragionamento, esperienza o capacità decisionale
- non abbia una risposta ovvia o teorica
- sia tipica di un colloquio reale per posizioni qualificate

La domanda può essere:
- tecnica avanzata
- situazionale complessa
- basata su trade-off, priorità o problemi reali di lavoro

====================
REGOLE OBBLIGATORIE
====================
- NON fornire spiegazioni
- NON fornire risposte o suggerimenti
- NON usare markdown
- NON aggiungere testo extra
- Restituisci ESCLUSIVAMENTE il testo della domanda, in italiano professionale
`;

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

    const prompt = `Agisci come un Recruiter senior esperto in selezione e valutazione dei candidati.

Stai valutando una risposta fornita durante una mock interview reale.

====================
DOMANDA DI COLLOQUIO
====================
"${question}"

====================
RISPOSTA DEL CANDIDATO
====================
"${answer}"

====================
CRITERI DI VALUTAZIONE (USO INTERNO)
====================
Valuta la risposta considerando:
- chiarezza e struttura del ragionamento
- pertinenza rispetto alla domanda
- profondità dell’esperienza dimostrata
- capacità decisionale e problem solving
- comunicazione professionale

====================
COMPITO
====================
1. Assegna un punteggio da 1 a 10 (numero intero).
2. Fornisci un feedback costruttivo, concreto e orientato al miglioramento.
3. Proponi una versione migliorata della risposta che:
   - mantenga l’intento originale del candidato
   - sia più efficace in un colloquio reale
   - non introduca competenze non citate dal candidato

====================
REGOLE OBBLIGATORIE
====================
- NON usare markdown
- NON aggiungere testo fuori dal JSON
- NON ripetere la domanda
- NON fornire giudizi personali o assoluti
- Linguaggio professionale, realistico e da colloquio vero

====================
FORMATO DI RISPOSTA (OBBLIGATORIO)
====================
{
  "score": 0,
  "feedback": "...",
  "improved_version": "..."
}
`;

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

    const prompt = `Agisci come un Hiring Manager senior che utilizza il Protocollo di valutazione U.C.A.F. (Unified Candidate Assessment Framework).

Stai progettando un assessment strutturato per valutare un candidato in modo completo, realistico e orientato al lavoro reale.

====================
CONTESTO POSIZIONE
====================
Ruolo: ${job.position}
Azienda: ${job.company}

Descrizione del ruolo / annuncio:
${job.job_description}

====================
OBIETTIVO
====================
Generare 4 prove distinte che simulino un processo di selezione avanzato, valutando:
- competenze tecniche applicate
- capacità cognitive e di problem solving
- comportamento passato in contesti lavorativi
- allineamento ai valori e alla cultura aziendale

Le prove devono essere:
- realistiche e coerenti con il ruolo
- adatte a un processo di selezione serio
- formulate in modo chiaro e non ambiguo
- prive di risposte predefinite

====================
STRUTTURA DELLE PROVE
====================
1. CORE TECHNICAL  
   Un work sample realistico o task pratico che il candidato potrebbe svolgere realmente nel ruolo.

2. COGNITIVE  
   Un esercizio o scenario che richieda logica, ragionamento o problem solving (non nozionistico).

3. BEHAVIORAL  
   Una domanda comportamentale strutturata secondo il metodo STAR, basata su esperienze lavorative passate.

4. VALUES  
   Una domanda o scenario per valutare il fit culturale, i valori professionali e il modo di prendere decisioni etiche o organizzative.

====================
REGOLE OBBLIGATORIE
====================
- NON usare markdown
- NON aggiungere spiegazioni o testo extra
- NON includere risposte o criteri di valutazione
- Linguaggio professionale, da assessment reale
- Restituisci ESCLUSIVAMENTE un JSON valido

====================
FORMATO DI RISPOSTA (OBBLIGATORIO)
====================
{
  "section_1_task": "...",
  "section_2_logic": "...",
  "section_3_behavioral": "...",
  "section_4_values": "..."
}
`;

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

    const prompt = `Agisci come un Valutatore senior che applica il protocollo U.C.A.F. (Unified Candidate Assessment Framework).

Stai valutando un candidato che ha completato un assessment strutturato per una specifica posizione lavorativa.

====================
INPUT VALUTAZIONE
====================

1. CORE TECHNICAL  
Domanda:
"${questions.section_1_task}"
Risposta:
"${answers.s1}"

2. COGNITIVE  
Domanda:
"${questions.section_2_logic}"
Risposta:
"${answers.s2}"

3. BEHAVIORAL  
Domanda:
"${questions.section_3_behavioral}"
Risposta:
"${answers.s3}"

4. VALUES  
Domanda:
"${questions.section_4_values}"
Risposta:
"${answers.s4}"

====================
CRITERI DI SCORING
====================
Assegna un punteggio da 1 a 5 per ciascuna sezione, valutando:

- CORE TECHNICAL (40%)
  Competenza applicata, qualità della soluzione, aderenza al ruolo

- COGNITIVE (20%)
  Logica, problem solving, chiarezza del ragionamento

- BEHAVIORAL (25%)
  Qualità dell’esperienza descritta, metodo STAR, autoconsapevolezza

- VALUES (15%)
  Allineamento valoriale, maturità professionale, coerenza decisionale

====================
COMPITO
====================
1. Calcola uno score totale ponderato (0–100).
2. Genera un report chiaro, strutturato e professionale che:
   - analizzi ogni sezione separatamente
   - evidenzi punti di forza e aree di miglioramento
   - mantenga un tono oggettivo e orientato alla selezione reale

====================
REGOLE OBBLIGATORIE
====================
- Il report DEVE essere in formato Markdown
- NON includere giudizi personali o assoluti
- NON usare markdown fuori dal campo markdown_report
- NON aggiungere testo fuori dal JSON
- Output immediatamente parsabile

====================
FORMATO DI RISPOSTA (OBBLIGATORIO)
====================
{
  "score_total": 85,
  "markdown_report": "# REPORT U.C.A.F.\n\n..."
}
`;

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

    const prompt = `
Sei un Senior Assessor specializzato in selezione del personale, valutazione delle competenze e test psico-attitudinali.
Il tuo compito è progettare un "Deep Audit Exam" altamente professionale e coerente con il profilo fornito.

PROFILO CANDIDATO:
${userContext}

OBIETTIVO DEL TEST:
Valutare in modo bilanciato competenze tecniche, comportamentali e capacità logico-analitiche di un professionista.

STRUTTURA DEL TEST (OBBLIGATORIA):
1. Genera ESATTAMENTE 30 domande totali.
2. Suddivisione obbligatoria:
   - 10 domande Hard Skills (tecniche, professionali, specifiche di ruolo)
   - 10 domande Situational / Soft Skills (decision making, comunicazione, leadership, problem solving)
   - 10 domande di Logica e Ragionamento (deduttivo, analitico, numerico o verbale)
3. Ogni domanda deve avere ESATTAMENTE 4 opzioni di risposta.
4. Le opzioni devono essere plausibili e ben differenziate (evita risposte ovvie o ridondanti).
5. Linguaggio chiaro, professionale, neutro e adatto a un contesto di selezione HR.
6. Non numerare le opzioni con lettere (A, B, C, D): usa solo stringhe testuali.

FORMATO DI OUTPUT (RIGIDAMENTE OBBLIGATORIO):
- Rispondi ESCLUSIVAMENTE con un array JSON valido.
- Usa SOLO le seguenti chiavi per ogni oggetto:
  - 'id' → numero progressivo da 1 a 30
  - 'q' → testo della domanda
  - 'o' → array di 4 stringhe (opzioni di risposta)

ESEMPIO DI STRUTTURA (NON RIUTILIZZARE IL CONTENUTO):
[
  { "id": 1, "q": "...", "o": ["...", "...", "...", "..."] }
]

IMPORTANTE:
- Non includere spiegazioni, commenti, testo extra o markdown.
- Non includere risposte corrette.
- L'output deve essere immediatamente parsabile come JSON valido.`;

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
    const prompt = `
Sei un Senior Assessor HR specializzato in valutazione delle competenze professionali, test attitudinali e audit di carriera.
Il tuo compito è correggere e valutare un quiz di 50 domande a risposta multipla già somministrato.

DATI DISPONIBILI:
- Risposte fornite dall’utente nel formato: ID_domanda → Risposta selezionata
${JSON.stringify(answers)}

OBIETTIVO DELLA VALUTAZIONE:
1. Stimare il livello complessivo di competenza del candidato.
2. Identificare punti di forza e aree di miglioramento.
3. Fornire un’analisi chiara, utile e orientata allo sviluppo professionale.

REGOLE DI VALUTAZIONE:
- Calcola uno score complessivo su scala 0–100.
- Determina il livello in base allo score complessivo:
  - Junior
  - Mid
  - Senior
  - Expert
- L’analisi deve essere discorsiva, professionale e comprensibile a un candidato finale.
- Evidenzia competenze chiave dimostrate e principali gap emersi.
- Evita riferimenti tecnici al sistema, al modello AI o a dati mancanti.
- Non inventare domande o risposte non presenti.

FORMATO DI OUTPUT (OBBLIGATORIO):
Rispondi ESCLUSIVAMENTE con un JSON valido, senza testo aggiuntivo, seguendo esattamente questa struttura:

{
  "score": 0,
  "level": "Junior/Mid/Senior/Expert",
  "analysis": "Analisi discorsiva complessiva della performance.",
  "top_skills": ["Skill A", "Skill B"],
  "areas_to_improve": ["Area 1", "Area 2"]
}

IMPORTANTE:
- Non aggiungere campi extra.
- Non usare markdown.
- Il JSON deve essere immediatamente parsabile.`;

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
