#!/bin/sh
set -e

# Lu à chaque démarrage du conteneur - restart compris, pas seulement une recréation - pour que
# la limite de RAM choisie dans le panel admin (qui réécrit JAVA_XMX_GB dans ce même fichier, voir
# ResourceLimitsService) soit appliquée par le bouton "Redémarrer le projet" sans docker compose up -d.
ENV_FILE="${HOMELAB_ENV_FILE_PATH:-/app_root/.env}"
JAVA_XMX_GB="2"
if [ -f "$ENV_FILE" ]; then
    value=$(grep '^JAVA_XMX_GB=' "$ENV_FILE" | tail -n1 | cut -d= -f2)
    [ -n "$value" ] && JAVA_XMX_GB="$value"
fi

echo "[entrypoint] Démarrage du backend (Xmx=${JAVA_XMX_GB}g)..."
exec java $JAVA_OPTS -Xmx"${JAVA_XMX_GB}g" -jar /app/homelab.jar
