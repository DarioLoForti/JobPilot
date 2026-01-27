# ✈️ JobPilot - AI-Powered Job Application Tracker

![JobPilot Banner](https://via.placeholder.com/1200x400?text=JobPilot+Dashboard+Preview)

**JobPilot** è un'applicazione Full-Stack moderna progettata per rivoluzionare il processo di ricerca lavoro. Non è solo un tracker: è un assistente intelligente che sfrutta l'**Intelligenza Artificiale** per analizzare le offerte, ottimizzare il CV, generare lettere di presentazione e simulare colloqui.

Permette agli utenti di tracciare le candidature tramite una Kanban Board intuitiva, gestire scadenze e sincronizzare i dati direttamente da LinkedIn tramite estensione Chrome.

## 🌟 Funzionalità Principali

### 🧠 Intelligenza Artificiale (AI Suite)

- **🤖 Match Analysis:** Analizza la compatibilità tra il tuo CV e la Job Description con punteggio percentuale e consigli strategici.
- **✍️ AI Ghostwriter:** Genera lettere di presentazione personalizzate (formale, moderna, audace) in pochi secondi.
- **🎨 Resume Tailoring:** Riscrive e ottimizza il tuo CV per superare i filtri ATS basandosi sull'annuncio specifico.
- **🎤 Interview Simulator:** Simula un colloquio tecnico/comportamentale e ricevi feedback immediato.
- **📧 Smart Follow-up:** Genera email di follow-up professionali per le candidature senza risposta.

### 💼 Gestione & Organizzazione

- **📊 Dashboard Interattiva:** Panoramica visiva con statistiche, grafici e widget per i prossimi colloqui.
- **📋 Kanban Board Drag & Drop:** Gestione fluida dello stato (Da inviare, Inviato, Colloquio, Offerta, Rifiutato).
- **🧩 Chrome Extension:** Salva le offerte direttamente da **LinkedIn** e **Indeed** con un click, senza dover copiare/incollare manualmente.
- **🔎 Ricerca & Filtri:** Barra di ricerca istantanea e filtri avanzati.
- **📅 Gestione Colloqui:** Evidenziazione automatica dei prossimi appuntamenti.

### ⚙️ Esperienza Utente

- **🌙 Dark Mode:** Interfaccia moderna con supporto nativo al tema scuro/chiaro.
- **📱 PWA (Progressive Web App):** Installabile su smartphone come app nativa (senza barra del browser).
- **🔔 Feedback Utente:** Notifiche "Toast" animate per ogni azione.
- **📄 PDF Generator:** Creazione automatica del CV in formato PDF.

## 🛠️ Tech Stack

### Frontend

- **React (Vite):** Framework principale per un'esperienza SPA ultra-veloce.
- **Tailwind CSS:** Styling moderno e responsivo.
- **Material UI (MUI):** Componenti UI complessi (Modali, Datepicker).
- **@hello-pangea/dnd:** Logica Drag & Drop per la Kanban.
- **Vite PWA Plugin:** Per rendere l'app installabile su mobile.
- **Recharts:** Visualizzazione dati e grafici.

### Backend

- **Node.js & Express:** Server RESTful API scalabile.
- **PostgreSQL:** Database relazionale robusto.
- **Google Gemini API:** Motore di intelligenza artificiale per l'analisi e la generazione testi.
- **JWT & Bcrypt:** Autenticazione sicura e hashing delle password.

### Chrome Extension

- **Manifest V3:** Standard moderno per le estensioni browser.
- **Scripting API:** Per lo scraping sicuro dei dati da siti terzi.

## 🚀 Installazione e Avvio Locale

### Prerequisiti

- Node.js (v18+)
- PostgreSQL installato e attivo

### 1. Clone del Repository

```bash
git clone [https://github.com/IL_TUO_USERNAME/JobPilot.git](https://github.com/IL_TUO_USERNAME/JobPilot.git)
cd JobPilot
```

2. Configurazione Backend
   Bash
   cd backend
   npm install
   Crea un file .env nella cartella backend con le seguenti variabili:

Snippet di codice
PORT=5000
DATABASE_URL=postgres://utente:password@localhost:5432/jobpilot
JWT_SECRET=la_tua_super_chiave_segreta
GEMINI_API_KEY=la_tua_api_key_google_ai
FRONTEND_URL=http://localhost:5173
Inizializza il Database (creazione tabelle):

Bash

# Puoi visitare http://localhost:5000/setup-db una volta avviato il server, oppure usare uno script se presente

node src/db/initDb.js
Avvia il server:

Bash
npm run dev

# Il server partirà su http://localhost:5000

3. Configurazione Frontend
   Apri un nuovo terminale:

Bash
cd frontend
npm install
npm run dev

# L'app sarà accessibile su http://localhost:5173

🔮 Prossimi Sviluppi (Roadmap)
[ ] Integrazione Google Calendar: Sincronizzazione automatica delle date dei colloqui.

[ ] Gamification: Badge e livelli basati sul numero di candidature inviate.

[ ] Community: Condivisione anonima di stipendi e feedback sui colloqui.

[ ] Multi-Language: Supporto completo per Inglese e altre lingue.

Realizzato da Dario Lo Forti - 2026
