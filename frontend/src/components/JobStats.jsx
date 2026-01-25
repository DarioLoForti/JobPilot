import { Paper, Typography, Grid, Avatar } from '@mui/material';
import { WorkOutline, CheckCircleOutline, HighlightOff, Send } from '@mui/icons-material';

export default function JobStats({ jobs }) {
  const stats = [
    { title: 'Totali', count: jobs.length, icon: <WorkOutline />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400', gradient: 'from-blue-500 to-blue-600' },
    { title: 'Inviate', count: jobs.filter(j => j.status === 'applied').length, icon: <Send />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
    { title: 'Colloqui', count: jobs.filter(j => j.status === 'interview').length, icon: <CheckCircleOutline />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400', gradient: 'from-purple-500 to-indigo-600' },
    { title: 'Rifiutate', count: jobs.filter(j => j.status === 'rejected').length, icon: <HighlightOff />, color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400', gradient: 'from-red-500 to-rose-600' },
  ];

  return (
    <Grid container spacing={3}> {/* Aumentato spacing */}
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={6} md={3} key={index}>
          {/* Uso la classe card-3d per lo stile base */}
          <Paper className="card-3d p-6 rounded-[2rem] flex flex-col items-center justify-center text-center h-full relative overflow-hidden group">
            
            {/* Sfondo gradiente che appare all'hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            
            <Avatar className={`${stat.color} mb-4 w-16 h-16 rounded-2xl shadow-inner-light group-hover:scale-110 transition-transform duration-300 font-bold`}>
              {stat.icon}
            </Avatar>
            
            <Typography variant="h3" className="font-black text-slate-800 dark:text-white mb-1 leading-none text-shadow-sm group-hover:scale-105 transition-transform">
              {stat.count}
            </Typography>
            
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
              {stat.title}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}