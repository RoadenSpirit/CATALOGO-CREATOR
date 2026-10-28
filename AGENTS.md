## 🌐 Contexto del VPS e Infraestructura Compartida
Este proyecto se ejecuta en el VPS (`your-vps-user`). La información de servicios, puertos y dependencias compartidas está unificada:

- **Skills globales del servidor:** Accedidos vía `.agents/skills` (apunta a `~/.config/opencode/skills/`). Utiliza la skill `vps-services-and-infrastructure` para consultar detalles de conectividad.
- **MCPs globales:** Centralizados exclusivamente en `~/.config/opencode/opencode.json`.
- **Servicios clave en localhost:**
  - **WhatsApp Baileys REST API:** `http://localhost:3000` (requiere header `x-api-key`). Usado por `whatsappAPI`, `ROBERTO` y flujos n8n.
  - **n8n Automation Engine:** `http://localhost:5678` (`https://your-n8n-domain`).
  - **AsereAI Core API (FastAPI + Playwright):** `http://localhost:8000` (`https://asere.your-n8n-domain`).
  - **OmniRoute Proxy LLM:** `http://localhost:20128` (`https://omni.your-n8n-domain`).
- **Guía completa de arquitectura y reglas:** Ver `/home/your-vps-user/proyectos/YOUR_CONVENTIONS_FILE.md`.

# AGENTS.md — n8nYourBrand

- **Servicios clave en localhost:**
