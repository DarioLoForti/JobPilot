# ✈️ JobPilot - Smart Job Application Tracker

**JobPilot** è un'applicazione Full-Stack moderna progettata per semplificare e organizzare il processo di ricerca lavoro. Permette agli utenti di tracciare le candidature tramite una Kanban Board intuitiva, gestire scadenze di colloqui, salvare note personali e generare CV in PDF.

## 🌟 Funzionalità Principali

- **📊 Dashboard Interattiva:** Panoramica visiva con statistiche, grafici e widget per i prossimi colloqui.
- **📋 Kanban Board Drag & Drop:** Gestione dello stato delle candidature (Da inviare, Inviato, Colloquio, Offerta, Rifiutato) tramite trascinamento fluido.
- **🔎 Ricerca & Filtri:** Barra di ricerca istantanea per trovare rapidamente aziende o posizioni.
- **📅 Gestione Colloqui:** Evidenziazione automatica dei prossimi appuntamenti con data e ora.
- **🌙 Dark Mode:** Interfaccia moderna con supporto nativo al tema scuro/chiaro.
- **✏️ Note & Dettagli:** Possibilità di modificare candidature e aggiungere note personali per ogni application.
- **📄 PDF Generator:** Creazione automatica di un CV in formato PDF basato sui dati del profilo.
- **🔔 Feedback Utente:** Notifiche "Toast" animate per ogni azione (Salvataggio, Errori, Conferme).
- **📱 Responsive Design:** Ottimizzato per Desktop, Tablet e Mobile.

## 🛠️ Tech Stack

### Frontend

- **React (Vite):** Framework principale per un'esperienza SPA veloce.
- **Tailwind CSS:** Per il layout responsive e lo styling moderno (Glassmorphism).
- **Material UI (MUI):** Componenti complessi (Modali, Input, Datepicker).
- **@hello-pangea/dnd:** Per la logica Drag & Drop della Kanban Board.
- **Recharts:** Per la visualizzazione dati (Grafici a torta).
- **React Hot Toast:** Per le notifiche utente eleganti.

### Backend

- **Node.js & Express:** Server RESTful API robusto e scalabile.
- **PostgreSQL:** Database relazionale per la persistenza dei dati.
- **JWT (JSON Web Token):** Sistema di autenticazione sicuro e protetto.
- **Bcrypt:** Hashing delle password per la sicurezza degli utenti.

## 🚀 Installazione e Avvio Locale

Segui questi passaggi per eseguire il progetto sul tuo computer.

### Prerequisiti

- Node.js installato.
- PostgreSQL installato e attivo.

### 1. Clone del Repository

```bash
git clone [https://github.com/IL_TUO_USERNAME/JobPilot.git](https://github.com/IL_TUO_USERNAME/JobPilot.git)
cd JobPilot
```

2. Configurazione Backend
   Bash
   cd backend
   npm install

# Crea un file .env nella cartella backend con le tue variabili DB e JWT

# Esegui lo script per inizializzare il Database

node src/db/initDb.js

# Avvia il server

npm run dev
Il server partirà su http://localhost:5000

3. Configurazione Frontend
   Apri un nuovo terminale:

Bash
cd frontend
npm install

# Avvia il client

npm run dev
L'app sarà accessibile su http://localhost:5173

🔮 Prossimi Sviluppi (Roadmap)
[ ] Integrazione OpenAI per generazione automatica lettere di presentazione.

[ ] Upload file per allegare il CV originale alla card.

[ ] Integrazione con Google Calendar per i colloqui.

Realizzato con ❤️ per il Portfolio Developer.
