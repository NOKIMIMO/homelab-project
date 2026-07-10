# Homelab --- Modular Self-Hosted Service Orchestrator

**Homelab** is a fully modular platform for self-hosted services. A Kotlin/Spring Boot core handles authentication, storage, database and telemetry; independent modules --- plain folders declared by a `manifest.json` --- plug in without touching the core's code.

## Vision
Zero-code module creation: declare a `manifest.json` + an XML schema (+ an optional JSON UI page) and the core scans, builds the SQL table and exposes it. No recompilation needed.

## Architecture
- **homelab-backend**: Core API --- Kotlin / Spring Boot. Module scanning, JWT auth, per-module SQL schema generation, OSHI-based telemetry.
- **homelab-frontend**: Dashboard --- React / TypeScript / Vite, DaisyUI + Tailwind.
- **homelab-sdk**: Shared Kotlin types for module logic beyond the standard actions.
- **modules/**: Demo modules (Photos, Reader, Weather) --- see `docs/MODULE_CREATION_GUIDE.md`.
- **vitrine/**: Project showcase & documentation site (bilingual FR/EN), deployed separately.

## Tech Stack
- **Backend**: Kotlin 2.1 / Spring Boot
- **Frontend**: React 19 / TypeScript / Vite / DaisyUI
- **Deployment**: Docker (all-in-one image) & Docker Compose

## Documentation
- [Functional Description (French)](Descriptif_Fonctionnel.md) / [English](Descriptif_Fonctionnel_en.md) --- project overview, architecture and roadmap.
- [Module Creation Guide](docs/MODULE_CREATION_GUIDE.md) --- `manifest.json`, XML schema, UI JSON, action types.
- [Dev commands](dev.md) --- Docker Compose commands for local dev/prod.

## Getting Started

**All-in-one Docker image** (frontend + backend + Postgres), published on GitHub Container Registry:

```bash
docker pull ghcr.io/nokimimo/homelab-project:latest

docker run -d --name homelab \
  -p 80:80 \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=change-me \
  -v homelab-data:/var/lib/postgresql/data \
  -v ./modules:/app_root/modules:ro \
  ghcr.io/nokimimo/homelab-project:latest
```

`./modules` is the host folder scanned for modules (`HOMELAB_MODULES_SCAN_PATH=/app_root/modules`) --- drop a module's `manifest.json` + files there.

**Or with Docker Compose** (multi-container, hot-reload in dev):

```bash
# prod
docker compose up --build

# dev (hot reload)
docker compose -f docker-compose.dev.yml up --build
```

---

*This project is in active development.*
