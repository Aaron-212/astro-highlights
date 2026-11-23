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
          vite: {
            define: {
              __ASTRO_HIGHLIGHTS_LINE_NUMBERS__: JSON.stringify(options.lineNumbers ?? false),
              __ASTRO_HIGHLIGHTS_COPY_BUTTON__: JSON.stringify(options.copyButton ?? true),
            },
          },
          markdown: {
            syntaxHighlight: false,
            processor: satteri({
              ...processor.options,
              hastPlugins: [plugin, ...processor.options.hastPlugins],
            }),
          },
        });

        // Include CSS in each page's stylesheet metadata so ClientRouter can preserve it during navigation.
        injectScript("page-ssr", 'import "@aaron212/astro-highlights/styles.css";');
        // Use the same browser module URL as the standalone component to register the handlers once.
        injectScript(
          "page",
          'import astroHighlightsCopyUrl from "@aaron212/astro-highlights/copy?url&no-inline";\n' +
            "void import(/* @vite-ignore */ astroHighlightsCopyUrl);",
        );
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
