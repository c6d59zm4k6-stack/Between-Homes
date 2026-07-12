import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest instead of the default generateSW: this lets our
      // own src/sw.ts add push / notificationclick handlers for check-in
      // reminders, while still precaching the app shell for offline use.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Between Homes",
        short_name: "Between Homes",
        description: "A quiet documentary director for your family's big move — capture the moments, get back the story.",
        theme_color: "#1B2333",
        background_color: "#FBF7EF",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      injectManifest: {
        // Photos/audio live in IndexedDB (Dexie), not the SW cache, so the
        // app shell stays small and installs fast even offline.
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
    }),
  ],
});
