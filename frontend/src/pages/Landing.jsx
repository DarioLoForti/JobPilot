import { useNavigate } from 'react-router-dom';
import { Typography, Button, Box, Grid, Paper, Container, Avatar } from '@mui/material';
import { 
  AutoAwesome, Dashboard, PictureAsPdf, RocketLaunch, 
  Psychology, Speed, Security, CheckCircle 
} from '@mui/icons-material';

export default function Landing() {
  const navigate = useNavigate();

  return (
    // FIX: Sfondo Grigio Chiaro (slate-100) per Light Mode
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 overflow-hidden bg-slate-100 dark:bg-[#0f172a] transition-colors duration-300">
      
      {/* Sfondo Aurora (Visibile solo in Dark Mode) */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <Container maxWidth="xl" sx={{ px: { xs: 3, md: 8 }, py: 4 }}>
        
        {/* HERO SECTION */}
        <Grid container alignItems="center" justifyContent="center" sx={{ minHeight: '60vh', mb: 10, mt: { xs: 4, md: 8 } }}>
            <Grid item xs={12} md={10} lg={8} sx={{ textAlign: 'center' }}>
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 mb-8 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-sm">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 dark:bg-cyan-500"></span>
                    </span>
                    <Typography variant="caption" className="font-bold text-blue-600 dark:text-cyan-300 tracking-wider uppercase">
                        AI-Powered Career Manager
                    </Typography>
                </div>

                {/* Titolo */}
                <Typography variant="h1" sx={{ 
                    fontWeight: 900, 
                    mb: 4, 
                    lineHeight: 1.1, 
                    fontSize: { xs: '2.5rem', md: '4.5rem', lg: '5.5rem' } 
                }} className="text-slate-900 dark:text-white">
                    Il tuo co-pilota per il <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-purple-500">
                        successo professionale.
                    </span>
                </Typography>
                
                {/* Sottotitolo */}
                <Typography variant="h5" sx={{ mb: 6, maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }} className="text-slate-600 dark:text-slate-400">
                    Smetti di usare fogli Excel disordinati. Organizza candidature, genera CV su misura e preparati ai colloqui con l'Intelligenza Artificiale.
                </Typography>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Button 
                        variant="contained" 
                        size="large" 
                        onClick={() => navigate('/register')}
                        sx={{ 
                            px: 5, py: 2, 
                            borderRadius: '50px', 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.5)',
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Inizia Gratis Ora
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="large" 
                        onClick={() => navigate('/login')}
                        sx={{ 
                            px: 5, py: 2, 
                            borderRadius: '50px', 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            borderWidth: '2px'
                        }}
                        className="border-slate-300 text-slate-700 hover:border-slate-400 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                    >
                        Accedi
                    </Button>
                </div>
            </Grid>
        </Grid>

        {/* FEATURES GRID */}
        <Box id="features" sx={{ mt: 10 }}>
          <Typography variant="h3" align="center" sx={{ fontWeight: 900, mb: 2 }} className="text-slate-900 dark:text-white">
              Tutto ciò che ti serve.
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 8, maxWidth: '600px', mx: 'auto' }} className="text-slate-600 dark:text-slate-400">
              Una suite completa di strumenti potenziati dall'AI.
          </Typography>

          <Grid container spacing={3}>
            {[
                { title: 'Kanban Board', desc: 'Visualizza il flusso delle tue candidature.', icon: <Dashboard fontSize="large" className="text-white" />, color: '#2563eb', cols: 7 },
                { title: 'AI Coach', desc: 'Simulazioni di colloquio con feedback.', icon: <Psychology fontSize="large" className="text-white" />, color: '#7c3aed', cols: 5 },
                { title: 'CV Builder', desc: 'PDF professionali in un click.', icon: <PictureAsPdf fontSize="large" className="text-white" />, color: '#ef4444', cols: 4 },
                { title: 'Ghostwriter', desc: 'Lettere di presentazione AI.', icon: <AutoAwesome fontSize="large" className="text-white" />, color: '#f59e0b', cols: 4 },
                { title: 'Magic Import', desc: 'Importa da LinkedIn.', icon: <Speed fontSize="large" className="text-white" />, color: '#10b981', cols: 4 },
            ].map((feature, idx) => (
                <Grid item xs={12} md={feature.cols} key={idx}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 4, height: '300px', borderRadius: '32px', 
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'translateY(-5px)' }
                        }}
                        className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 dark:bg-slate-800/50 dark:border-white/5 dark:shadow-none dark:backdrop-blur-md"
                    >   
                        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '150px', height: '150px', backgroundColor: feature.color, filter: 'blur(80px)', opacity: 0.2 }}></div>

                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: feature.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 10px 20px -5px ${feature.color}80` }}>
                            {feature.icon}
                        </div>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }} className="text-slate-900 dark:text-white">{feature.title}</Typography>
                        <Typography className="text-slate-600 dark:text-slate-300" sx={{ fontSize: '1.1rem' }}>{feature.desc}</Typography>
                    </Paper>
                </Grid>
            ))}
          </Grid>
        </Box>

        {/* FOOTER */}
        <Box sx={{ mt: 20, textAlign: 'center', pb: 10 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 4 }} className="text-slate-900 dark:text-white">Pronto a decollare?</Typography>
          <Button 
            onClick={() => navigate('/register')}
            sx={{ px: 6, py: 2.5, borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'none' }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30"
          >
            Crea Account Gratuito
          </Button>
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span className="flex items-center gap-2"><Security fontSize="small"/> Dati Criptati</span>
            <span className="flex items-center gap-2"><CheckCircle fontSize="small"/> Nessuna Carta</span>
          </div>
        </Box>

      </Container>
    </div>
  );
}