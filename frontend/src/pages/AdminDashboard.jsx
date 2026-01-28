import { useEffect, useState } from "react";
import { 
  Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, CircularProgress, 
  Box, Grid, Card, CardContent, Avatar, Tooltip 
} from "@mui/material";
import { Delete, SupervisorAccount, Work, Person, VerifiedUser } from "@mui/icons-material";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // 1. Fetch Users
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 2. Fetch Stats
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
      } else {
        toast.error("Accesso negato: Non sei Admin!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("Utente eliminato.");
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (error) {
      toast.error("Errore eliminazione.");
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><CircularProgress /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <SupervisorAccount fontSize="large" className="text-indigo-600" />
        <Typography variant="h3" className="font-black text-slate-800 dark:text-white">SuperAdmin Control</Typography>
      </div>

      {/* STATS CARDS */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12} md={6}>
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h2" className="font-bold">{stats.users}</Typography>
                <Typography className="opacity-80 font-bold">Utenti Registrati</Typography>
              </div>
              <Person style={{ fontSize: 60, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="h2" className="font-bold">{stats.jobs}</Typography>
                <Typography className="opacity-80 font-bold">Candidature Totali Gestite</Typography>
              </div>
              <Work style={{ fontSize: 60, opacity: 0.3 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* USERS TABLE */}
      <Paper className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-[#1e293b]">
        <TableContainer>
          <Table>
            <TableHead className="bg-slate-100 dark:bg-white/5">
              <TableRow>
                <TableCell className="font-bold">Utente</TableCell>
                <TableCell className="font-bold">Ruolo</TableCell>
                <TableCell className="font-bold">Iscritto il</TableCell>
                <TableCell className="font-bold text-center">Jobs Tracked</TableCell>
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
                      <Chip label="User" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell className="dark:text-slate-300">
                    {format(new Date(user.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={user.total_jobs} className={`${user.total_jobs == 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"} font-bold`} />
                  </TableCell>
                  <TableCell align="center">
                    {!user.is_admin && (
                      <Tooltip title="Elimina Utente">
                        <IconButton onClick={() => handleDelete(user.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}