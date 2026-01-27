import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

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
        theme_color: "#0f172a", // Colore della barra di stato
        background_color: "#0f172a", // Colore di sfondo splash screen
        display: "standalone", // Nasconde la barra URL
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png",
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
      // 🔥 FIX PER L'ERRORE DI BUILD SU RENDER
      // Alziamo il limite della cache a 5 MB (il default è 2 MB e il tuo file è 2.75 MB)
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  // Opzionale: Evita warning nel terminale per file grossi
  build: {
    chunkSizeWarningLimit: 3000, // 3000 kB (3 MB)
  },
  server: {
    proxy: {
      // Proxy per sviluppo locale
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
