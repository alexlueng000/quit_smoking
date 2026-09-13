#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

backup_directory="${1:-./backups}"
mkdir -p "${backup_directory}"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_path="${backup_directory}/quit-smoking-${timestamp}.dump"
partial_path="${backup_path}.partial"
pg_dump_url="${DATABASE_URL%%\?schema=*}"
trap 'rm -f "${partial_path}"' EXIT

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --format=custom --no-owner --no-privileges --file="${partial_path}" "${pg_dump_url}"
elif command -v docker >/dev/null 2>&1; then
  postgres_container="${POSTGRES_CONTAINER:-quit-smoking-postgres}"
  if ! docker container inspect "${postgres_container}" >/dev/null 2>&1; then
    echo "pg_dump is unavailable and PostgreSQL container '${postgres_container}' is not running" >&2
    exit 1
  fi
  docker exec "${postgres_container}" pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    "${pg_dump_url}" >"${partial_path}"
else
  echo "Neither pg_dump nor Docker is available" >&2
  exit 1
fi
mv "${partial_path}" "${backup_path}"
trap - EXIT
echo "Backup created: ${backup_path}"
