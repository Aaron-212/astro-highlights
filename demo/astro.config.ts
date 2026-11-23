import tailwindcss from "@tailwindcss/vite";
import highlights from "@aaron212/astro-highlights";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://demos.aaron212.com",
  base: "/astro-highlights",
  outDir: "./build/astro-highlights",
  output: "static",
  vite: { plugins: [tailwindcss()] },
  integrations: [highlights({ lineNumbers: true })],
});
