# Capybara Go Index

Standalone public item Index extracted from the private Capybara Go research app.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The generated static website is written to `dist/`.

## Refresh public data

Pass the private app's `catalog.seed.json` to the included exporter:

```bash
npm run build:data -- /path/to/catalog.seed.json
```

## Data boundaries

- Public-facing Index data only.
- The Changelog tab is a static public update log for Index-facing changes.
- No PvP loadouts, observations, simulation tools, or private research evidence.
- Mount rarity is marked internally as a strong inference.
- Mythic Treasure equipment-effect descriptions are confirmed from game language tables.
