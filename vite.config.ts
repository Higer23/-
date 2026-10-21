import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import twConfig from "./tailwind.config.js";

// Kaynak: app/ klasörü. Derleme çıktısı depo köküne yazılır (GitHub Pages kökten sunar).
export default defineConfig({
  root: "app",
  base: "./",
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss(twConfig), autoprefixer()] } },
  build: { outDir: "..", emptyOutDir: false, assetsDir: "assets", sourcemap: false },
});
