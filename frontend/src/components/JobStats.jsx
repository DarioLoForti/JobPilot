import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import EventIcon from '@mui/icons-material/Event';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const COLORS = {
  wishlist: '#3b82f6', // blue-500
  applied: '#f59e0b',  // amber-500
  interview: '#10b981', // emerald-500
  offer: '#8b5cf6',    // violet-500
  rejected: '#ef4444'  // red-500
};

const STATUS_LABELS = {
  wishlist: 'Da Inviare',
  applied: 'Inviate',
  interview: 'Colloqui',
  offer: 'Offerte',
  rejected: 'Rifiutate'
};

export default function JobStats({ jobs }) {
  const total = jobs.length;
  const interviews = jobs.filter(j => j.status === 'interview').length;
  const offers = jobs.filter(j => j.status === 'offer').length;

  // Dati per il Grafico a Torta
  const dataMap = {};
  jobs.forEach(job => { dataMap[job.status] = (dataMap[job.status] || 0) + 1; });
  const chartData = Object.keys(dataMap).map(status => ({
    name: STATUS_LABELS[status] || status,
    value: dataMap[status],
    color: COLORS[status] || '#ccc'
  }));

  // Logica per i PROSSIMI COLLOQUI
  // Filtriamo i job che hanno una data futura
  const upcomingInterviews = jobs
    .filter(job => job.interview_date && new Date(job.interview_date) > new Date())
    .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date)) // Ordine cronologico
    .slice(0, 3); // Prendiamo solo i prossimi 3

  // Mini componente Card KPI
  const StatCard = ({ title, value, colorClass, bgClass }) => (
    <div className={`p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 bg-white dark:bg-slate-800`}>
      <div className={`text-4xl font-bold mb-2 ${colorClass}`}>{value}</div>
      <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. ROW KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Candidature Totali" value={total} colorClass="text-blue-600 dark:text-blue-400" />
        <StatCard title="Colloqui Attivi" value={interviews} colorClass="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Offerte Ricevute" value={offers} colorClass="text-violet-600 dark:text-violet-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. PROSSIMI APPUNTAMENTI */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <EventIcon className="text-blue-500" /> Prossimi Colloqui
            </h3>
            
            <div className="space-y-3">
                {upcomingInterviews.length > 0 ? (
                    upcomingInterviews.map(job => (
                        <div key={job.id} className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                            {/* Data Box */}
                            <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-2 rounded-lg text-center min-w-[60px] shadow-sm">
                                <div className="text-xs text-slate-400 uppercase font-bold">{new Date(job.interview_date).toLocaleString('it-IT', { month: 'short' })}</div>
                                <div className="text-xl font-bold text-slate-800 dark:text-blue-400">{new Date(job.interview_date).getDate()}</div>
                            </div>
                            
                            {/* Dettagli */}
                            <div className="ml-4 flex-1">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{job.company}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <WorkIcon style={{ fontSize: 12 }} /> {job.position}
                                </p>
                            </div>

                            {/* Orario */}
                            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                                <AccessTimeIcon style={{ fontSize: 12 }} />
                                {new Date(job.interview_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic">
                        Nessun colloquio programmato. <br/> Continua a candidarti! 🚀
                    </div>
                )}
            </div>
        </div>

        {/* 3. GRAFICO */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-80">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Panoramica Status</h3>
           {total > 0 ? (
             <ResponsiveContainer width="100%" height="90%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }} 
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
           ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
                Nessun dato disponibile
            </div>
           )}
        </div>

      </div>
    </div>
  );
}