import { defineConfig, triggers } from "cf/config";

export default defineConfig(({ isPreview }) => ({
  worker: {
    name: "astro-highlights-demo",
    compatibilityDate: "2026-11-23",
    workersDev: false,
    previewUrls: false,
    assets: {
      notFoundHandling: "404-page",
    },
    triggers: isPreview
      ? []
      : [
          triggers.fetch({ pattern: "demos.aaron212.com/astro-highlights", zone: "aaron212.com" }),
          triggers.fetch({ pattern: "demos.aaron212.com/astro-highlights/*", zone: "aaron212.com" }),
        ],
  },
}));
