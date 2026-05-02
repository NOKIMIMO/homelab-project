# Homelab - Universal Service Orchestrator

**Homelab** is a solution for orchestrating and centralizing self-hosted services. It acts as a smart wrapper and proxy for various tools (media servers, file storage, monitoring, etc.), providing a unified, secure, and monitored interface.

## Vision
Simplify the management of a home server ecosystem by delegating shared concerns (Authentication, Storage abstraction, Monitoring) to a central Core, while allowing specialized Modules to handle the business logic.

## Architecture
- **homelab-core**: The central gateway (Backend: Kotlin/Spring Boot, Frontend: React/Vite/TS).
- **Modules**: Independent services (e.g., `photo-module`) communicating with the Core via dedicated SDKs.
- **SDKs**: Standardization for Authentication and File System access.

## Tech Stack
- **Backend**: Kotlin / Spring Boot
- **Frontend**: React / TypeScript / Vite
- **Deployment**: Docker & Docker Compose

## Documentation
- [Functional Description (French)](Descriptif_Fonctionnel.md) - Detailed project overview and roadmap.
- [Project Vision (Draft)](Project.md) - Initial project concepts.

## Getting Started
1. **Clone the repository.**
2. **Environment Setup**: Configure `.env.dev` or `.env.production`.
3. **Run with Docker**:
   ```bash
   docker-compose up -d
   ```

---

*This project is currently in the development phase.*