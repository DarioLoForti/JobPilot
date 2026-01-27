import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Stepper, Step, StepLabel, StepContent,
  Paper
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Extension as ExtensionIcon, 
  Settings as SettingsIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function ExtensionInstallModal({ open, onClose }) {

  const handleCopyLink = () => {
    navigator.clipboard.writeText('chrome://extensions');
    toast.success("Link copiato! Incollalo nella barra degli indirizzi.");
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{ 
        className: 'glass-panel bg-white dark:!bg-[#0f172a] border border-slate-200 dark:border-white/10',
        sx: { borderRadius: '24px' }
      }}
    >
      <DialogTitle className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ExtensionIcon fontSize="large" />
          </div>
          <div>
            <Typography variant="h5" className="font-bold text-slate-900 dark:text-white">
              Installa JobPilot Clipper
            </Typography>
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
              Modalità Sviluppatore (Developer Preview)
            </Typography>
          </div>
        </div>
        <Button onClick={onClose} sx={{ minWidth: 0, p: 1 }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent className="p-0">
        <div className="flex flex-col md:flex-row h-full">
          
          {/* COLONNA SINISTRA: DOWNLOAD */}
          <div className="w-full md:w-1/3 p-8 bg-slate-50 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
            <img src="/pwa-192x192.png" alt="Logo" className="w-24 h-24 mb-6 rounded-2xl shadow-lg" onError={(e) => e.target.style.display='none'} />
            
            <Typography variant="h6" className="font-bold mb-2 text-slate-800 dark:text-white">
              Passo 1
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Scarica il pacchetto dell'estensione sul tuo computer.
            </Typography>

            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              href="/jobpilot-extension.zip" 
              download="jobpilot-extension.zip"
              startIcon={<DownloadIcon />}
              className="btn-neon w-full rounded-xl font-bold py-3 animate-pulse"
            >
              Scarica .ZIP
            </Button>
            
            <Typography variant="caption" className="mt-4 text-slate-400">
              Versione 1.0.0 • 150 KB
            </Typography>
          </div>

          {/* COLONNA DESTRA: ISTRUZIONI */}
          <div className="w-full md:w-2/3 p-8">
            <Typography variant="h6" className="font-bold mb-6 text-slate-800 dark:text-white">
              Guida all'installazione
            </Typography>
            
            <Stepper orientation="vertical">
              
              <Step active={true}>
                <StepLabel icon={<span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">2</span>}>
                  <Typography className="font-bold dark:text-slate-200">Estrai lo ZIP</Typography>
                </StepLabel>
                <StepContent>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                    Apri il file scaricato ed estrai la cartella in un posto sicuro (es. Documenti).
                  </Typography>
                </StepContent>
              </Step>

              <Step active={true}>
                <StepLabel icon={<span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">3</span>}>
                  <Typography className="font-bold dark:text-slate-200">Apri Gestione Estensioni</Typography>
                </StepLabel>
                <StepContent>
                  <Box className="ml-2 mb-2 p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <code className="text-xs font-mono text-slate-600 dark:text-slate-300">chrome://extensions</code>
                    <Button size="small" onClick={handleCopyLink} startIcon={<ContentCopyIcon fontSize="small"/>} className="text-xs">Copia</Button>
                  </Box>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                    Copia il link qui sopra e incollalo in una nuova scheda di Chrome.
                  </Typography>
                </StepContent>
              </Step>

              <Step active={true}>
                <StepLabel icon={<span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">4</span>}>
                  <Typography className="font-bold dark:text-slate-200">Attiva "Modalità Sviluppatore"</Typography>
                </StepLabel>
                <StepContent>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400 ml-2 flex items-center gap-2">
                    In alto a destra nella pagina estensioni, accendi la levetta: 
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded text-xs font-bold">Developer mode</span>
                  </Typography>
                </StepContent>
              </Step>

              <Step active={true}>
                <StepLabel icon={<span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">5</span>}>
                  <Typography className="font-bold dark:text-slate-200">Carica Estensione</Typography>
                </StepLabel>
                <StepContent>
                  <Typography className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                    Clicca su <b>"Carica non pacchettizzata"</b> (Load unpacked) e seleziona la cartella che hai estratto prima. Fatto! 🎉
                  </Typography>
                </StepContent>
              </Step>

            </Stepper>
          </div>
        </div>
      </DialogContent>
      
      <DialogActions className="p-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10">
        <Button onClick={onClose} className="text-slate-500 hover:text-slate-700">Chiudi</Button>
        <Button onClick={onClose} variant="contained" className="bg-slate-900 text-white rounded-lg">Ho capito</Button>
      </DialogActions>
    </Dialog>
  );
}