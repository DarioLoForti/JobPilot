import { query } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const initDb = async () => {
  try {
    console.log(
      "🛠️ Inizio reset e inizializzazione Database (Modo: Sviluppo 2026)...",
    );

    // 1. Reset Totale (Scorched Earth Policy)
    // L'ordine è importante per via delle Foreign Keys: eliminiamo prima i figli, poi i padri.
    await query(`DROP TABLE IF EXISTS assessments CASCADE;`); // ✨ Tabella Coach
    await query(`DROP TABLE IF EXISTS cv_history CASCADE;`);
    await query(`DROP TABLE IF EXISTS job_applications CASCADE;`);
    await query(`DROP TABLE IF EXISTS users CASCADE;`);

    // 2. Crea tabella USERS
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        
        -- Descrizione Personale & AI Context
        personal_description TEXT,

        -- Liste JSONB (Ultra-flessibili nel 2026)
        socials JSONB DEFAULT '[]',       
        experiences JSONB DEFAULT '[]',   
        education JSONB DEFAULT '[]',     
        certifications JSONB DEFAULT '[]', 
        
        -- Skills
        hard_skills TEXT,
        soft_skills TEXT,

        -- Files (Gestione Buffer)
        profile_image BYTEA,
        cv_file BYTEA,
        cv_filename VARCHAR(255),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Crea tabella JOBS (Aggiornata per testi lunghi)
    await query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        
        -- 🔥 MODIFICA CRUCIALE: VARCHAR(500) -> TEXT per evitare errori di lunghezza
        job_link TEXT, 
        job_description TEXT, -- ✨ Fondamentale per il confronto AI
        
        status VARCHAR(50) DEFAULT 'applied',
        interview_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Crea tabella CV_HISTORY (Per il grafico dell'andamento)
    await query(`
      CREATE TABLE IF NOT EXISTS cv_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Crea tabella ASSESSMENTS (✨ AI COACH & U.C.A.F.)
    await query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        -- Link opzionale al Job (UCAF è legato a un job, il test personalità no)
        job_id UUID REFERENCES job_applications(id) ON DELETE CASCADE, 
        
        type VARCHAR(50) NOT NULL, -- 'personality', 'ucaf', 'interview'
        results JSONB NOT NULL,    -- Punteggi strutturati e dati grezzi
        markdown_report TEXT,      -- Report formattato per la visualizzazione
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(
      "✅ Database pronto: Tabelle ricreate con colonne TEXT (nessun limite di lunghezza).",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Errore inizializzazione DB:", error);
    process.exit(1);
  }
};

initDb();
