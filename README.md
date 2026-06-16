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
