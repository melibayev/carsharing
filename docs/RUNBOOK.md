# Runbook

## Common Operations

### Start the stack
```bash
docker compose up --build
```

### Stop the stack (preserve data)
```bash
docker compose down
```

### Reset database and re-seed
```bash
./scripts/reset-db.sh
```

### View API logs
```bash
docker compose logs -f api
```

### View all logs
```bash
docker compose logs -f
```

### Run tests
```bash
./scripts/test.sh
```

### Access PostgreSQL directly
```bash
docker compose exec postgres psql -U CarSharing -d CarSharing
```

### Access Redis CLI
```bash
docker compose exec redis redis-cli
```

## Rotate JWT Secret

1. Generate a new secret (32+ characters)
2. Update `JWT_SECRET` in `.env`
3. Restart the API: `docker compose restart api`
4. All existing tokens are invalidated — users must log in again

## Common Errors

### "Connection refused" on first boot
PostgreSQL may not be ready yet. The API waits for the health check, but if it times out, restart: `docker compose restart api`

### Migration failure
Check the API logs: `docker compose logs api`. If a migration is corrupt, reset: `./scripts/reset-db.sh`

### Mailhog not receiving emails
Verify Mailhog is running: `docker compose ps mailhog`. Check SMTP settings in `.env`.
