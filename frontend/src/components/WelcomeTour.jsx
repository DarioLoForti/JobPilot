import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTheme } from '@mui/material';

export default function WelcomeTour() {
  const [run, setRun] = useState(false);
  const theme = useTheme();

  // I PASSI DEL TUTORIAL
  const steps = [
    {
      target: 'body', // Primo step: generico al centro
      content: (
        <div>
          <h3 style={{fontWeight: 'bold', fontSize: '18px', marginBottom: '10px'}}>Benvenuto in JobPilot! 🚀</h3>
          <p>Il tuo assistente di carriera potenziato dall'AI.</p>
          <p>Facciamo un rapido giro per mostrarti i superpoteri di questa app.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#stats-section', // Le card in alto
      content: 'Qui hai una panoramica immediata delle tue candidature, colloqui e obiettivi settimanali.',
    },
    {
      target: '#add-job-btn', // Bottone Nuova Candidatura
      content: 'Clicca qui per aggiungere manualmente una candidatura. Ma aspetta... c\'è un modo più veloce!',
    },
    {
      target: '#extension-btn', // Bottone scarica estensione
      content: (
        <div>
          <strong>🔥 JobPilot Clipper</strong>
          <br/>
          Scarica la nostra estensione per salvare offerte da LinkedIn con un solo click. Niente più copia-incolla!
        </div>
      ),
    },
    {
      target: '#cv-upload-btn', // Bottone Carica CV
      content: 'Carica il tuo CV qui. La nostra AI lo analizzerà per darti consigli personalizzati e prepararti ai colloqui.',
    },
    {
      target: '#ai-coach-widget', // Widget AI Coach
      content: 'Questo è il tuo Coach AI personale. Cliccaci per ricevere consigli strategici sulla tua carriera.',
    },
    {
      target: 'body',
      content: 'Sei pronto! Inizia a tracciare il tuo successo. 🍀',
      placement: 'center',
    }
  ];

  useEffect(() => {
    // Controlla se l'utente ha già visto il tour
    const tourSeen = localStorage.getItem('jobpilot_tour_completed');
    
    // Se NON l'ha visto, avvia il tour dopo 1 secondo (per dare tempo alla UI di caricare)
    if (!tourSeen) {
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    // Se il tour è finito o l'utente lo ha saltato, salviamo nel localStorage
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('jobpilot_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5', // Indigo-600
          textColor: '#334155',
          backgroundColor: '#fff',
          arrowColor: '#fff',
        },
        buttonNext: {
            backgroundColor: '#4f46e5',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '10px 20px'
        },
        buttonBack: {
            color: '#64748b',
            marginRight: 10
        }
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Iniziamo!',
        next: 'Avanti',
        skip: 'Salta',
      }}
    />
  );
}