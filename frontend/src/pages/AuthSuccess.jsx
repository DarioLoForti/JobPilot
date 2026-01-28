import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      // 1. Salva Token e User
      localStorage.setItem("token", token);
      localStorage.setItem("user", userStr);

      // 2. Controllo se è Admin
      let isUserAdmin = false;
      try {
        const userObj = JSON.parse(userStr);
        isUserAdmin = userObj.is_admin;
      } catch (e) {
        console.error("Errore parsing user google", e);
      }

      // 3. Redirect alla pagina corretta
      setTimeout(() => {
        window.location.href = isUserAdmin ? "/admin" : "/dashboard";
      }, 500);
    } else {
      // Se qualcosa va storto, torna al login
      navigate("/login?error=AuthFailed");
    }
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      <CircularProgress className="mb-4" />
      <h2 className="text-xl font-bold text-slate-700 dark:text-white">Accesso in corso...</h2>
    </div>
  );
}