# astro-highlights

Highlight Markdown and Sätteri-backed MDX code blocks in Astro 7 with `@pierre/highlights`. Highlighting runs on the server;
the browser receives HTML and CSS. Light and dark colors follow your device preferences.

## Use in Astro

Install the integration:

```sh
pnpm add @aaron212/astro-highlights
```

Add it to `astro.config.ts`:

```ts
import highlights from "@aaron212/astro-highlights";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [highlights()],
});
```

Astro 7 uses Sätteri by default. The integration adds its HAST plugin, loads its stylesheet, and sets
`markdown.syntaxHighlight: false` to disable Shiki. Existing Sätteri plugins and features are preserved. If another
integration replaces the processor, place `highlights()` after it.

Fenced and indented code blocks receive highlighting. Unknown languages render as plain text. Math and Mermaid blocks
remain untouched so other plugins can render them. Astro's built-in `<Code />` component is outside this integration's
scope.

## Configure highlighting

Pass Zed-compatible theme objects, language aliases, or additional languages to skip:

```ts
import highlights from "@aaron212/astro-highlights";
import githubDark from "@pierre/highlights/themes/github-dark";
import githubLight from "@pierre/highlights/themes/github-light";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    highlights({
      themes: { light: githubLight, dark: githubDark },
      langAlias: { customjs: "javascript" },
      excludeLangs: ["diagram"],
    }),
  ],
});
```

The default themes are Pierre Light and Pierre Dark. When providing `themes`, include both `light` and `dark`.
`excludeLangs` adds to the built-in `math` and `mermaid` exclusions and matches the original fence language before aliases.
Highlights supports its built-in lexers; this integration does not apply Shiki grammars, transformers, or fence metadata
such as highlighted-line ranges. Fence metadata remains available to downstream HAST plugins.

## Use with Sätteri directly

Add `highlightsHast()` to your Sätteri pipeline:

````ts
import { highlightsHast } from "@aaron212/astro-highlights/satteri";
import { markdownToHtml } from "satteri";

const result = await markdownToHtml("```ts\nconst answer = 42;\n```", {
  hastPlugins: [highlightsHast()],
});
````

Import the stylesheet in your site's entry point or layout:

```ts
import "@aaron212/astro-highlights/styles.css";
```

## Develop

Install the tools specified in `mise.toml` and the package dependencies:

```sh
mise install
mise exec -- pnpm install
```

Format, lint, and check types:

```sh
mise exec -- pnpm format
mise exec -- pnpm lint
mise exec -- pnpm check
```

Build JavaScript and type declarations into `dist/` before linking this package into another project:

```sh
mise exec -- pnpm build
```

## Release

The release workflow stages a public npm release when you push a `v*` tag. Configure npm trusted publishing for this
repository and its `npm` GitHub environment before releasing.

## License

MIT
