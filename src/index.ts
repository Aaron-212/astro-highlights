import { isSatteriProcessor, satteri } from "@astrojs/markdown-satteri";
import type { AstroIntegration } from "astro";
import { highlightsHast, type HighlightsOptions } from "./satteri.js";

export type { HighlightsOptions } from "./satteri.js";

export default function highlights(options: HighlightsOptions = {}): AstroIntegration {
  const plugin = highlightsHast(options);

  return {
    name: "astro-highlights",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectScript }) => {
        const processor = config.markdown.processor;
        if (!isSatteriProcessor(processor)) {
          throw new Error("astro-highlights requires Astro's Sätteri Markdown processor.");
        }

        updateConfig({
          markdown: {
            syntaxHighlight: false,
            processor: satteri({
              ...processor.options,
              hastPlugins: [plugin, ...processor.options.hastPlugins],
            }),
          },
        });

        injectScript("page", 'import "@aaron212/astro-highlights/styles.css";');
      },
      "astro:config:done": ({ config }) => {
        const processor = config.markdown.processor;
        if (!isSatteriProcessor(processor) || !processor.options.hastPlugins.includes(plugin)) {
          throw new Error(
            "Another integration removed astro-highlights. Place astro-highlights after integrations " +
              "that configure markdown.processor.",
          );
        }
        if (config.markdown.syntaxHighlight !== false) {
          throw new Error("astro-highlights requires markdown.syntaxHighlight to remain disabled.");
        }
      },
    },
  };
}
