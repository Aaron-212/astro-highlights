# Astro Highlights demo

From the repository root, install the demo dependencies and start the Astro development server.

```sh
mise install
mise exec -- pnpm --dir demo install --frozen-lockfile
mise exec -- pnpm --dir demo dev
```

Open the `/astro-highlights/` path on the local URL printed by Astro. The demo links to the parent package and compiles it
before starting Astro.
