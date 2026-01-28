import { useEffect, useState } from "react";
import { 
  Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, CircularProgress, 
  Box, Grid, Card, CardContent, Avatar, Tooltip, Tabs, Tab, Button 
} from "@mui/material";
import { 
  Delete, SupervisorAccount, Work, Person, VerifiedUser, 
  Error as ErrorIcon, BugReport, Refresh, Login as LoginIcon 
} from "@mui/icons-material";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalJobs: 0, 
    totalCVs: 0, 
    recentErrors: 0 
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const logsRes = await fetch("/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
      } else {
        toast.error("Accesso negato: Non sei Admin!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Utente eliminato.");
        fetchData(); 
      }
    } catch (error) {
      toast.error("Errore eliminazione.");
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Vuoi cancellare tutto lo storico errori?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Logs svuotati");
      setLogs([]); 
      fetchData(); 
    } catch (error) {
      toast.error("Errore pulizia log");
    }
  };

  // 🔥 NUOVA FUNZIONE IMPERSONATE
  const handleImpersonate = async (userId) => {
    if (!window.confirm("Attenzione: Accederai come questo utente e verrai disconnesso dall'Admin.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(`Loggato come ${data.user.first_name}!`);
        window.location.href = "/dashboard"; // Refresh forzato
      } else {
        toast.error(data.error || "Errore accesso");
      }
    } catch (error) {
      toast.error("Errore server");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><CircularProgress /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <SupervisorAccount fontSize="large" className="text-indigo-600" />
          <div>
            <Typography variant="h4" className="font-black text-slate-800 dark:text-white">
                SuperAdmin
            </Typography>
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400">
                Pannello di controllo completo
            </Typography>
          </div>
        </div>
        <IconButton onClick={fetchData} className="bg-white dark:bg-slate-800 shadow-sm">
            <Refresh />
        </IconButton>
      </div>

      {/* STATS CARDS */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h3" className="font-bold">{stats.totalUsers || 0}</Typography>
                <Typography className="opacity-80 font-bold text-sm">Utenti Totali</Typography>
              </div>
              <Person style={{ fontSize: 50, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h3" className="font-bold">{stats.totalJobs || 0}</Typography>
                <Typography className="opacity-80 font-bold text-sm">Candidature</Typography>
              </div>
              <Work style={{ fontSize: 50, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white transform hover:scale-105 transition-transform">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h3" className="font-bold">{stats.totalCVs || 0}</Typography>
                <Typography className="opacity-80 font-bold text-sm">CV Caricati</Typography>
              </div>
              <VerifiedUser style={{ fontSize: 50, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={`rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform ${stats.recentErrors > 0 ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-slate-400'}`}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h3" className="font-bold">{stats.recentErrors || 0}</Typography>
                <Typography className="opacity-80 font-bold text-sm">Errori (24h)</Typography>
              </div>
              <BugReport style={{ fontSize: 50, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS MENU */}
      <Paper className="mb-6 rounded-xl overflow-hidden dark:bg-[#1e293b]">
        <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            centered
            indicatorColor="primary"
            textColor="primary"
        >
            <Tab icon={<Person />} label="Gestione Utenti" />
            <Tab icon={<ErrorIcon className={stats.recentErrors > 0 ? "text-red-500" : ""} />} label="System Logs" />
        </Tabs>
      </Paper>

      {/* TAB 0: TABELLA UTENTI */}
      {tabValue === 0 && (
        <Paper className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-[#1e293b]">
          <TableContainer>
            <Table>
              <TableHead className="bg-slate-100 dark:bg-white/5">
                <TableRow>
                  <TableCell className="font-bold">Utente</TableCell>
                  <TableCell className="font-bold">Ruolo</TableCell>
                  <TableCell className="font-bold">Iscritto il</TableCell>
                  <TableCell className="font-bold text-center">Jobs</TableCell>
                  <TableCell className="font-bold text-center">Google</TableCell>
                  <TableCell className="font-bold text-center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover className="dark:text-slate-300">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-indigo-100 text-indigo-700 font-bold">
                          {user.first_name ? user.first_name[0].toUpperCase() : "U"}
                        </Avatar>
                        <div>
                          <Typography className="font-bold dark:text-white">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="caption" className="text-slate-500 block">
                            {user.email}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Chip icon={<VerifiedUser className="text-white"/>} label="Admin" size="small" className="bg-indigo-600 text-white font-bold" />
                      ) : (
                        <Chip label="User" size="small" variant="outlined" className="dark:text-slate-300 dark:border-slate-600" />
                      )}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={user.total_jobs} className={`${user.total_jobs == 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"} font-bold`} />
                    </TableCell>
                    <TableCell align="center">
                        {user.google_id ? "✅" : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {!user.is_admin && (
                        <div className="flex justify-center gap-1">
                          {/* IMPERSONATE BUTTON */}
                          <Tooltip title="Entra come Utente">
                            <IconButton onClick={() => handleImpersonate(user.id)} className="text-blue-500">
                                <LoginIcon />
                            </IconButton>
                          </Tooltip>

                          {/* DELETE BUTTON */}
                          <Tooltip title="Elimina Utente">
                            <IconButton onClick={() => handleDeleteUser(user.id)} color="error">
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 1: SYSTEM LOGS */}
      {tabValue === 1 && (
        <Paper className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-[#1e293b] p-4">
             <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="dark:text-white font-bold">Registro Errori</Typography>
                <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleClearLogs}>
                    Svuota
                </Button>
            </div>
            <TableContainer>
                <Table size="small">
                    <TableHead className="bg-slate-100 dark:bg-white/5">
                        <TableRow>
                            <TableCell className="font-bold">Livello</TableCell>
                            <TableCell className="font-bold">Fonte</TableCell>
                            <TableCell className="font-bold">Messaggio</TableCell>
                            <TableCell className="font-bold">Utente</TableCell>
                            <TableCell className="font-bold text-right">Data</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography className="text-slate-400">Nessun errore rilevato ✅</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} hover className="dark:text-slate-300">
                                    <TableCell>
                                        <Chip 
                                            label={log.level} 
                                            size="small" 
                                            className={log.level === 'ERROR' ? "bg-red-100 text-red-700 font-bold" : "bg-blue-100 text-blue-700"} 
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{log.source}</TableCell>
                                    <TableCell>
                                        <span className="font-medium dark:text-white block">{log.message}</span>
                                        {log.details && (
                                            <details className="mt-1">
                                                <summary className="text-xs text-slate-400 cursor-pointer hover:text-indigo-500">Dettagli Tecnici</summary>
                                                <pre className="text-xs bg-slate-900 text-green-400 p-2 rounded mt-1 overflow-auto max-w-xl">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">{log.user_email || '-'}</TableCell>
                                    <TableCell align="right" className="text-xs text-slate-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
      )}

    </div>
  );
}