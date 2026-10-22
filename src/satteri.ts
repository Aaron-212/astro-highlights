import { codeToTokens, isSupportedLanguage, type Lang, type Theme, type ThemeFamily } from "@pierre/highlights";
import pierreDark from "@pierre/highlights/themes/pierre-dark";
import pierreLight from "@pierre/highlights/themes/pierre-light";
import type { Element, ElementContent } from "hast";
import { defineHastPlugin, type HastPluginDefinition } from "satteri";

export interface HighlightsOptions {
  themes?: {
    light: Theme | ThemeFamily;
    dark: Theme | ThemeFamily;
  };
  langAlias?: Record<string, Lang>;
  /** Additional languages to leave untouched. Math and Mermaid are always excluded. */
  excludeLangs?: string[];
}

export function highlightsHast(options: HighlightsOptions = {}): HastPluginDefinition {
  const themes = options.themes ?? { light: pierreLight, dark: pierreDark };
  const excluded = new Set(["math", "mermaid", ...(options.excludeLangs ?? [])]);

  return defineHastPlugin({
    name: "astro-highlights-hast",
    element: {
      filter: ["pre"],
      visit(node, ctx) {
        if (node.children.length !== 1) return;
        const code = node.children[0];
        if (code.type !== "element" || code.tagName !== "code") return;
        const classes = Array.isArray(node.properties.className) ? node.properties.className : [];
        if (classes.includes("astro-highlights")) return;

        const languageClass = Array.isArray(code.properties.className)
          ? code.properties.className.find((value) => typeof value === "string" && value.startsWith("language-"))
          : undefined;
        const dataLanguage = code.data && "lang" in code.data ? code.data.lang : undefined;
        const language =
          typeof dataLanguage === "string" ? dataLanguage : (languageClass?.slice("language-".length) ?? "plaintext");
        if (excluded.has(language)) return;
        const alias = options.langAlias?.[language] ?? language;
        const lang = isSupportedLanguage(alias) ? alias : "plaintext";
        const result = codeToTokens(ctx.textContent(code), { lang, themes, defaultColor: false });
        const children: ElementContent[] = [];

        for (const [index, line] of result.tokens.entries()) {
          if (index > 0) children.push({ type: "text", value: "\n" });
          children.push({
            type: "element",
            tagName: "span",
            properties: { className: ["line"] },
            children: line.map((token): Element => ({
              type: "element",
              tagName: "span",
              properties: {
                style: Object.entries(token.htmlStyle ?? {})
                  .map(([property, value]) => `${property}:${value}`)
                  .join(";"),
              },
              children: [{ type: "text", value: token.content }],
            })),
          });
        }

        return {
          ...node,
          properties: {
            ...node.properties,
            className: [...classes, "astro-highlights"],
            tabIndex: node.properties.tabIndex ?? 0,
            style: [node.properties.style, result.rootStyle].filter(Boolean).join(";"),
          },
          children: [{ ...code, children }],
        };
      },
    },
  });
}
