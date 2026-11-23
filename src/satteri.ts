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
  /** Display line numbers by default. Defaults to false. */
  lineNumbers?: boolean;
  /** Display the Copy button by default. Defaults to true. */
  copyButton?: boolean;
  /** Additional languages to leave untouched. Math and Mermaid are always excluded. */
  excludeLangs?: string[];
}

function getFenceOptions(meta: unknown) {
  let title: string | undefined;
  let lineNumbers: boolean | undefined;
  let copyButton: boolean | undefined;
  if (typeof meta !== "string") return { title, lineNumbers, copyButton };

  // Read whole metadata tokens so a quoted value cannot contain a separate option.
  const tokens = meta.matchAll(/(?:[^\s"']|"[^"]*(?:"|$)|'[^']*(?:'|$))+/g);
  for (const [token] of tokens) {
    if (token === "lineNumbers=true" || token === "lineNumbers=false") {
      lineNumbers = token === "lineNumbers=true";
    } else if (token === "copyButton=true" || token === "copyButton=false") {
      copyButton = token === "copyButton=true";
    } else if (title === undefined) {
      const match = /^title=(?:"([^"]*)"|'([^']*)')$/.exec(token);
      if (match) title = (match[1] ?? match[2]).trim();
    }
  }
  return { title, lineNumbers, copyButton };
}

export function highlightsHast(options: HighlightsOptions = {}): HastPluginDefinition {
  const themes = options.themes ?? { light: pierreLight, dark: pierreDark };
  const defaultLineNumbers = options.lineNumbers ?? false;
  const defaultCopyButton = options.copyButton ?? true;
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
        const supported = isSupportedLanguage(alias);
        if (!supported) {
          console.warn(`[astro-highlights] Unsupported language ${JSON.stringify(alias)}. Rendering as plain text.`);
        }
        const lang = supported ? alias : "plaintext";
        const fenceOptions = getFenceOptions(code.data && "meta" in code.data ? code.data.meta : undefined);
        const { title } = fenceOptions;
        const lineNumbers = fenceOptions.lineNumbers ?? defaultLineNumbers;
        const copyButton = fenceOptions.copyButton ?? defaultCopyButton;
        const result = codeToTokens(ctx.textContent(code), { lang, themes, defaultColor: false });
        // Pierre emits an empty final token row for an empty source or a trailing newline.
        const lineCount = result.tokens.length - (result.tokens.at(-1)?.length === 0 ? 1 : 0);
        const children: ElementContent[] = [];

        for (const [index, line] of result.tokens.entries()) {
          const lineChildren = line.map((token): Element => ({
            type: "element",
            tagName: "span",
            properties: {
              style: Object.entries(token.htmlStyle ?? {})
                .map(([property, value]) => `${property}:${value}`)
                .join(";"),
            },
            children: [{ type: "text", value: token.content }],
          }));
          if (lineNumbers && index < lineCount) {
            lineChildren.unshift({
              type: "element",
              tagName: "span",
              properties: {
                className: ["astro-highlights-line-number"],
                ariaHidden: "true",
                dataLineNumber: index + 1,
              },
              children: [],
            });
          }
          if (index > 0) children.push({ type: "text", value: "\n" });
          children.push({
            type: "element",
            tagName: "span",
            properties: { className: ["line"] },
            children: lineChildren,
          });
        }

        const codeProperties = lineNumbers
          ? {
              ...code.properties,
              style: [code.properties.style, `--astro-highlights-gutter-width:${String(lineCount).length}ch`]
                .filter(Boolean)
                .join(";"),
            }
          : code.properties;
        const pre: Element = {
          ...node,
          properties: {
            ...node.properties,
            className: [...classes, "astro-highlights"],
            tabIndex: node.properties.tabIndex ?? 0,
            style: [node.properties.style, result.rootStyle].filter(Boolean).join(";"),
          },
          children: [{ ...code, properties: codeProperties, children }],
        };
        if (!title && !copyButton) return pre;

        const headerChildren: ElementContent[] = [];
        if (title) {
          pre.properties.role ??= "region";
          if (pre.properties.ariaLabelledBy == null) pre.properties.ariaLabel ??= title;
          headerChildren.push({
            type: "element",
            tagName: "span",
            properties: { className: ["astro-highlights-title"] },
            children: [{ type: "text", value: title }],
          });
        }
        if (copyButton) {
          headerChildren.push({
            type: "element",
            tagName: "span",
            properties: { className: ["astro-highlights-copy-controls"] },
            children: [
              {
                type: "element",
                tagName: "button",
                properties: {
                  type: "button",
                  dataAstroHighlightsCopy: "",
                  ariaLabel: title ? `Copy code from ${title}` : "Copy code",
                  hidden: true,
                },
                children: [],
              },
              {
                type: "element",
                tagName: "span",
                properties: { className: ["astro-highlights-copy-status"], role: "status" },
                children: [],
              },
            ],
          });
        }

        return {
          type: "element",
          tagName: title ? "figure" : "div",
          properties: { className: ["astro-highlights-frame"] },
          children: [
            {
              type: "element",
              tagName: title ? "figcaption" : "div",
              properties: { className: ["astro-highlights-header"], hidden: !title },
              children: headerChildren,
            },
            pre,
          ],
        };
      },
    },
  });
}
