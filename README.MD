
# HomeStock

HomeStock is a self-hosted media storage and delivery server for photos, videos, documents and other files.

Purpose
- Centralize and serve personal media from a private instance.

This project is currenty in an infantile steps, give it a bit of time and come back later to see what we made :) 


Prerequisites
- Java 21
- Gradle (wrapper included)
- PostgreSQL (docker-compose provided) (docker compose in backend)
- Node.js and npm/yarn (for the frontend)

Quick start

Backend
```bash
cd HomeStock-backend
./gradlew bootRun    # on Windows: gradlew.bat bootRun
```

Frontend (development)
```bash
cd HomeStock-frontend
npm install
npm run dev
```

Configuration
- Configuration files: `src/main/resources/application.yaml` and `application.dev.yaml`.
- Common environment variables: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

API & Documentation
- OpenAPI/Swagger UI is available when the backend is running (springdoc):
  - `/swagger-ui/index.html`
  - `/v3/api-docs`

Contributing
- Create feature or bugfix branches from the repository root.
- Respect the `.gitignore` files at the repository root and in `HomeStock-backend`.

License
- TBD


