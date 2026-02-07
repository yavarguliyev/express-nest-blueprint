# Secrets Directory

This directory contains `.env` templates for different environments. 

## Security Best Practices

1. **Never commit actual `.env` files** - they are gitignored
2. **Use templates** - copy `.env.{env}.template` to create your actual `.env` files
3. **Strong passwords** - use generated passwords, not simple ones
4. **Rotate secrets** - change passwords periodically
5. **Environment separation** - use different credentials for dev/prod

## Usage

### For Development:
```bash
cp .env.dev.template ../deployments/dev/.env
# Edit ../deployments/dev/.env with your actual values
```

### For Production:
```bash
cp .env.prod.template ../deployments/prod/.env
# Edit ../deployments/prod/.env with STRONG production credentials
```

## Jenkins Integration

Jenkins can inject these secrets automatically using:
- Jenkins Credentials Plugin
- Environment variables
- Kubernetes Secrets (for infra deployments)

The deployment scripts will automatically generate `.env` files from templates if they don't exist.
