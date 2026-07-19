# Judge Quickstart

You can run the complete fictional workflow in about one minute of setup.

## Requirements

- Node.js 20.19+ or a current Node.js LTS release
- npm
- A modern desktop browser

## Start

```bash
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## See the complete product

1. Select **Load Contest Demo** at the top of the app.
2. Use **Next** to follow **Lead → Review → Snapshot → Roadmap → Proposal → Send Kit**.
3. Select **Restart tour** if the guide was dismissed previously.
4. Select **Reset Contest Demo** to repeat the walkthrough; only fictional demo-linked records are restored.

The demo uses reserved `.example` contact details, does not access the network, and does not send messages.

## Production build

```bash
npm run lint
npm run build
npm run preview
```

The static deployment output is written to `dist/`.

For the narrated walkthrough, use [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
