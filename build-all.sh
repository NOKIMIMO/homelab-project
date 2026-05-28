set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Vérification de Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker n'est pas installé ou n'est pas dans le PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker ne semble pas être lancé. Veuillez démarrer Docker Desktop ou le service Docker." >&2
  exit 1
fi

echo "Docker est lancé."

echo "Vérification de Node..."
if ! command -v node >/dev/null 2>&1; then
  echo "Node n'est pas installé ou n'est pas dans le PATH." >&2
  exit 1
fi
NODE_VERSION=$(node --version | sed 's/^v//')
IFS='.' read -r NODE_MAJOR NODE_MINOR NODE_PATCH _ <<< "$NODE_VERSION"
if [[ -z "$NODE_MAJOR" || -z "$NODE_MINOR" ]]; then
  echo "Impossible de parser la version de Node : $NODE_VERSION." >&2
  exit 1
fi
if (( NODE_MAJOR < 22 )) || { (( NODE_MAJOR == 22 )) && (( NODE_MINOR < 12 )); }; then
  echo "Version de Node invalide : $NODE_VERSION. Le script requiert Node 22.12.x ou plus." >&2
  exit 1
fi

echo "Node $NODE_VERSION est OK."

echo "\n=== Backend ==="
cd "$ROOT/homelab-backend"
echo "Lancement de docker compose up -d..."
docker compose up -d

echo "Lancement de gradlew bootRun..."
./gradlew bootRun

echo "\n=== Frontend ==="
cd "$ROOT/homelab-frontend"
echo "Installation des dépendances npm..."
npm install

echo "Lancement de npm run dev..."
npm run dev
