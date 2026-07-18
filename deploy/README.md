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

## 3. Rancher Continuous Delivery (Fleet)

Rancher CD is Fleet — it watches this repo and deploys the chart via GitOps.
`deploy/helm/vacu/fleet.yaml` is the Fleet bundle (Fleet auto-detects the
`Chart.yaml` beside it and installs it as Helm).

### One-time setup

1. **Create the Secret** in the target cluster (Fleet must not carry secrets in
   git). In the `vacu` namespace of the downstream cluster:
   ```bash
   kubectl create namespace vacu
   kubectl -n vacu create secret generic vacu-env \
     --from-literal=DATABASE_URL='postgres://user:pass@db-host:5432/vacu' \
     --from-literal=AUTH_SECRET="$(openssl rand -base64 48)"
   ```
   (Or use a SealedSecret / external-secrets so it *can* live in git.)

2. **Register the repo** in Rancher → **Continuous Delivery → Git Repos → Create**:
   - Repository URL: `https://github.com/thang14/vato`
   - Branch: `main`
   - Paths: `deploy/helm/vacu`
   - Target: the cluster or cluster group to deploy to.

   Fleet reads `fleet.yaml`, installs the release `vacu` in namespace `vacu`, and
   re-syncs on every push. Edit the values in `fleet.yaml` (host, ingress class,
   storageClass, image tag) to match your cluster.

3. **Private image**: make the GHCR package public, or add
   `imagePullSecrets: [{ name: ghcr-creds }]` in `fleet.yaml` and create that
   secret in the namespace.

### Updating the deployed version

Fleet deploys exactly what's in git, so bump `image.tag` in `fleet.yaml` when you
release. Either:

- **Manual (simple):** edit `fleet.yaml` → `image.tag: "1.4.0"`, commit → Fleet
  rolls it out.
- **Automatic:** add a step to `release.yml` that rewrites the tag and commits
  back to `main` (needs `permissions: contents: write`):
  ```yaml
  - name: Bump Fleet image tag
    run: |
      V="${GITHUB_REF_NAME#v}"
      sed -i -E 's|^      tag: "[^"]*"|      tag: "'"$V"'"|' deploy/helm/vacu/fleet.yaml
      git config user.name  github-actions
      git config user.email github-actions@github.com
      git commit -am "chore: deploy $V via Fleet" && git push || true
  ```

### Notes

- `persistence` is a **ReadWriteOnce** PVC by default, so keep `replicaCount: 1`
  (the chart uses the `Recreate` strategy). To scale past 1, use a
  ReadWriteMany storage class or move uploads to object storage, and run
  migrations as a separate step instead of the initContainer.
- Probes hit `/api/health`, which also verifies the DB is reachable.
- Private image → set `imagePullSecrets`.
