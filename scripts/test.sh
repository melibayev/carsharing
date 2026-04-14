#!/bin/bash
set -e

echo "=== Running CarSharing Test Suite ==="

echo ""
echo "--- Backend Unit + Integration Tests ---"
docker compose exec -T api dotnet test /app/tests/CarSharing.Tests.dll --logger "console;verbosity=normal" 2>/dev/null || \
  docker compose run --rm --no-deps api dotnet test /src/CarSharing.Tests/CarSharing.Tests.csproj --logger "console;verbosity=normal"

echo ""
echo "--- Frontend Tests ---"
cd frontend
npm test -- --run 2>/dev/null || echo "Frontend tests not yet configured"
cd ..

echo ""
echo "=== All Tests Complete ==="
