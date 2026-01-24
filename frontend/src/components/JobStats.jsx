import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  const dataMap = {};
  jobs.forEach(job => { dataMap[job.status] = (dataMap[job.status] || 0) + 1; });
  const chartData = Object.keys(dataMap).map(status => ({
    name: STATUS_LABELS[status] || status,
    value: dataMap[status],
    color: COLORS[status] || '#ccc'
  }));

  // Mini componente per le Card dei numeri (KPI)
  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
      <div className={`text-4xl font-bold mb-2 ${colorClass}`}>{value}</div>
      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Candidature Totali" value={total} colorClass="text-blue-600 dark:text-blue-400" />
        <StatCard title="Colloqui Ottenuti" value={interviews} colorClass="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Offerte Ricevute" value={offers} colorClass="text-violet-600 dark:text-violet-400" />
      </div>

      {/* GRAFICO */}
      {total > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-96">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 text-center">Distribuzione Candidature</h3>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={chartData}
                 cx="50%"
                 cy="50%"
                 innerRadius={80} // Ciambella più moderna
                 outerRadius={110}
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
               <Legend wrapperStyle={{ paddingTop: '20px' }} />
             </PieChart>
           </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
            Non hai ancora dati. Inizia a candidarti!
        </div>
      )}
    </div>
  );
}