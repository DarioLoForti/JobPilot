import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa"; // <--- Importiamo il plugin PWA

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // CONFIGURAZIONE PWA
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "JobPilot AI",
        short_name: "JobPilot",
        description: "Il tuo assistente di carriera AI",
        theme_color: "#0f172a", // Colore della barra di stato (Blu scuro del tuo tema)
        background_color: "#0f172a", // Colore di sfondo allo splash screen
        display: "standalone", // <--- Questo nasconde la barra URL del browser!
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png", // Assicurati di mettere queste immagini in /public
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // Ogni volta che il frontend chiama "/api", Vite lo gira a localhost:5000
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
