#!/bin/sh
set -e

: "${POSTGRES_USER:?POSTGRES_USER doit être défini}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD doit être défini}"
: "${POSTGRES_DB:?POSTGRES_DB doit être défini}"

# Le backend et Postgres tournent dans le même conteneur.
export DB_URL="localhost:5432"
export HOMELAB_MODULES_SCAN_PATH="${HOMELAB_MODULES_SCAN_PATH:-/app_root/modules}"

JAVA_PID=""
NGINX_PID=""

shutdown() {
    # A signal-killed child makes `wait` return 128+signal, which set -e
    # would treat as fatal and abort this handler before Postgres stops.
    set +e
    echo "[entrypoint] Arrêt en cours..."
    if [ -n "$NGINX_PID" ]; then
        kill -TERM "$NGINX_PID" 2>/dev/null
        wait "$NGINX_PID" 2>/dev/null
    fi
    if [ -n "$JAVA_PID" ]; then
        kill -TERM "$JAVA_PID" 2>/dev/null
        wait "$JAVA_PID" 2>/dev/null
    fi
    su-exec postgres pg_ctl -D "$PGDATA" -m fast stop
    exit 0
}
trap shutdown TERM INT

mkdir -p /run/postgresql
chown -R postgres:postgres /var/lib/postgresql /run/postgresql

if [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
    echo "[entrypoint] Initialisation de la base Postgres..."
    printf '%s' "$POSTGRES_PASSWORD" > /tmp/pgpass
    su-exec postgres initdb -D "$PGDATA" -U "$POSTGRES_USER" --pwfile=/tmp/pgpass -E UTF8
    rm -f /tmp/pgpass
    echo "listen_addresses = 'localhost'" >> "$PGDATA/postgresql.conf"
fi

echo "[entrypoint] Démarrage de Postgres..."
su-exec postgres pg_ctl -D "$PGDATA" -l /var/log/postgresql/postgresql.log -w start

if ! su-exec postgres psql -U "$POSTGRES_USER" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1; then
    echo "[entrypoint] Création de la base ${POSTGRES_DB}..."
    su-exec postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
fi

echo "[entrypoint] Démarrage du backend..."
java $JAVA_OPTS -jar /app/homelab.jar &
JAVA_PID=$!

echo "[entrypoint] Attente du backend sur le port 8080..."
until nc -z localhost 8080 2>/dev/null; do
    sleep 1
done

echo "[entrypoint] Démarrage de nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# busybox ash's `wait` has no `-n` flag, so poll instead of blocking on either PID.
while kill -0 "$JAVA_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
    sleep 2
done
shutdown
