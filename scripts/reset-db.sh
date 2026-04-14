#!/bin/bash
set -e

echo "=== Resetting CarSharing Database ==="
echo "This will destroy all data and re-seed from scratch."
echo ""

docker compose down -v
docker compose up --build -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "Database reset complete. The API will auto-migrate and seed on startup."
echo "Check progress: docker compose logs -f api"
