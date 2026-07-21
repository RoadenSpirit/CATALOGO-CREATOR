# GEMINI.md - n8n Your Brand Project

## Project Overview
This project is an automation system for **Your Brand**, a business that blends fashion and technology. The core objective is to automate the generation of high-quality, branded product catalog images from raw photos and product data stored in Google Sheets.

### Key Technologies
- **n8n:** Workflow automation platform.
- **Node.js:** Core for scripts and custom node logic.
- **Puppeteer/Chromium:** Used for rendering HTML templates into product images.
- **Docker & Docker Compose:** Containerization for n8n and PostgreSQL.
- **PostgreSQL:** Persistent storage for n8n.

## Architecture & Directory Structure
- `flujos/`: Contains n8n workflow JSON files. These are the "source code" of the automations.
- `your-photos-folder/`: Organized by category, contains original product photos.
- `fotosProcesadas/`: Destination for generated images with brand overlays and pricing.
- `nodes/`: Contains custom n8n node definitions (specifically `n8n-nodes-html2image`).
- `scripts/`: Utility scripts for workflow management (`push-workflow.js`, `sync_workflows.js`) and asset processing.
- `generate.js`: A specialized script that programmatically builds/updates n8n workflows with specific HTML templates.
- `yourbrand_brand.md`: Official brand guidelines including colors (`#6d1e68`), logo placement, and pricing display rules (USD/CUP).

## Building and Running
The project is designed to run in a Docker environment.

### Prerequisites
- Docker and Docker Compose installed.
- `.env` file populated with necessary credentials (GCP, PostgreSQL, n8n encryption keys).

### Key Commands
- **Start the system:** `docker-compose up -d`
- **Build custom nodes/image:** `docker-compose build`
- **Update/Generate workflow:** `node generate.js` (generates `flujos/workflow-puppeteer.json`)
- **Sync workflows to n8n:** Use scripts in `scripts/`, e.g., `node scripts/push-workflow.js`.

## Development Conventions
- **Branding:** Always adhere to `yourbrand_brand.md`. Primary color is YourBrand Purple `#6d1e68`.
- **Pricing:** Every product must show dual pricing in USD and CUP.
- **Image Processing:** Products are matched to photos based on normalized names and categories.
- **Workflow Management:** Avoid editing workflows directly in the n8n UI for complex logic changes; prefer updating the JSON in `flujos/` and pushing via API.

## Workflow Management Policy (STRICT)
- **Physical Sovereignty:** n8n is the execution engine, but the `flujos/` directory is the **Source of Truth**.
- **Deep Cleaning:** No workflow JSON shall be committed with environment-specific metadata (`id`, `createdAt`, `updatedAt`, `shared`, `versionId`).
- **Immutable History:** Every commit MUST generate a unique sub-folder in `flujos/history/` containing the exact state of the workflows at that moment.
- **Automation:** Use `scripts/workflow-manager.js` for all sync operations. Manual exports from the n8n UI are forbidden for versioning.
- **Rollback Protocol:** A rollback in Git MUST be followed by a mandatory `push` to the n8n API using the cleaned JSONs from the restored commit.
