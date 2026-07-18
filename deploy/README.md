# Deploying Vacu

The app is packaged as a Docker image and a Helm chart. **Only the app is
deployed** — Postgres, SMTP, and everything else are external services the app
reaches by connection string / config.

## 1. Image (CI)

`.github/workflows/release.yml` builds and pushes the image to GitHub Container
Registry when a **GitHub Release is published**:

```
ghcr.io/thang14/vato:<release-version>   # e.g. 1.4.0 and 1.4
ghcr.io/thang14/vato:latest
ghcr.io/thang14/vato:sha-<short>
```

To cut a release: tag `vX.Y.Z` and publish a Release on GitHub (the semver tags
above come from the tag). No registry secrets needed — it uses `GITHUB_TOKEN`.
You can also run the workflow manually (`workflow_dispatch`) to rebuild a tag.

Make the package public (or configure an image pull secret) so the cluster can
pull it — GHCR packages are private by default.

## 2. Helm chart (`deploy/helm/vacu`)

Deploys a Deployment (+ initContainer that runs `migrate`), Service, optional
Ingress, and a PVC for uploaded images. DB migrations run automatically on
start.

### Prerequisites

- An external Postgres reachable from the cluster → `DATABASE_URL`.
- `AUTH_SECRET` (32+ random chars: `openssl rand -base64 48`).

### Recommended: manage the Secret yourself

```bash
kubectl create secret generic vacu-env \
  --from-literal=DATABASE_URL='postgres://user:pass@db-host:5432/vacu' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 48)"

helm upgrade --install vacu deploy/helm/vacu \
  --set image.tag=1.4.0 \
  --set secret.existingSecret=vacu-env \
  --set config.APP_URL=https://vacu.example.com \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=vacu.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

### Quick start (chart creates the Secret from values)

```bash
helm upgrade --install vacu deploy/helm/vacu \
  --set image.tag=1.4.0 \
  --set secret.data.DATABASE_URL='postgres://user:pass@db-host:5432/vacu' \
  --set secret.data.AUTH_SECRET="$(openssl rand -base64 48)"
```

### First admin

The seed scripts are one-shots; create the first admin once:

```bash
kubectl exec deploy/vacu -- node scripts/seed-admin.mjs   # uses ADMIN_EMAIL / ADMIN_PASSWORD
# or seed demo content:  kubectl exec deploy/vacu -- node scripts/seed.mjs
```

### Notes

- `persistence` is a **ReadWriteOnce** PVC by default, so keep `replicaCount: 1`
  (the chart uses the `Recreate` strategy). To scale past 1, use a
  ReadWriteMany storage class or move uploads to object storage, and run
  migrations as a separate step instead of the initContainer.
- Probes hit `/api/health`, which also verifies the DB is reachable.
- Private image → set `imagePullSecrets`.
