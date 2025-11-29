# HK2 — Hackathon Workspace

## Architecture
- **API**: `minimal-api-dev-v7.0.0` (Next.js API routes) serving auditing, seeding, and SQL endpoints; data stored in SQLite (`data/bookkeeper.db`).
- **Frontends**: Starter templates in `Minimal_TypeScript_v7.5.0` (Next.js and Vite TS variants) for UI experimentation.
- **Data & Notebooks**: `notebooks/cord_dataset_exploration.ipynb` converts CORD v2 ground-truth JSON to receipts and vendors, exports to `minimal-api-dev-v7.0.0/data/cord_receipts.json`, and seeds the DB.
- **Docs**: Schema and specs in `docs/` and root `🚀 Hackathon 2 –Specs.md`.

- More details:
  - API overview: `minimal-api-dev-v7.0.0/README.md`
  - API setup: `minimal-api-dev-v7.0.0/SETUP.md`
  - Frontend templates: `Minimal_TypeScript_v7.5.0/README.md`
  - Database schema: `docs/DATABASE_SCHEMA.md`
  - License: `Minimal_TypeScript_v7.5.0/LICENSE.md`

## Setup Instructions
- **Install deps (API)**:
  ```powershell
  cd "c:\Users\ASUS\Documents\GitHub\HK2\minimal-api-dev-v7.0.0"
  npm install
  ```
- **Run API locally**:
  ```powershell
  npm run dev
  # Server listens on http://localhost:7272 (per project config)
  ```
- **Seed database (optional via notebook)**:
  - Open `notebooks/cord_dataset_exploration.ipynb` and run cells to generate `data/cord_receipts.json` and seed `data/bookkeeper.db`.
- **Quick auditor SQL example**:
  ```powershell
  $body = @{ message = "How many receipts paid by card?" } | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:7272/api/auditor/sql" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
  ```

- More setup references:
  - Detailed API setup and scripts: `minimal-api-dev-v7.0.0/SETUP.md`
  - Frontend usage and commands: `Minimal_TypeScript_v7.5.0/README.md`
  - Hackathon specs: `🚀 Hackathon 2 –Specs.md`

## Local AI Explained
- **Goal**: Enable natural-language auditing over receipts. You send a prompt (e.g., a question) to the local API and it translates to a SQL query against SQLite.
- **Flow**:
  - Data is pre-extracted from CORD v2 JSON (no heavy OCR) and stored in SQLite.
  - The auditor endpoint accepts NL prompts (like "flagged receipts" or "payment breakdown") and returns query results.
- **Benefits**: Fast, private, and deterministic on your local dataset; ideal for hackathon-quality analytics without cloud dependencies.

## Related Docs
- `docs/DATABASE_SCHEMA.md`: Table definitions and relationships.
- `minimal-api-dev-v7.0.0/README.md`: API capabilities and endpoints.
- `minimal-api-dev-v7.0.0/SETUP.md`: Environment, scripts, and seeding instructions.
- `Minimal_TypeScript_v7.5.0/README.md`: Next.js/Vite template guidance.
- `🚀 Hackathon 2 –Specs.md`: Project goals and requirements.
