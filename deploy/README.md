# Deploying Vacu

The app is packaged as a Docker image and a Helm chart. **Only the app is
deployed** — Postgres, SMTP, and everything else are external services the app
reaches by connection string / config.

## 1. Image (CI)

`.github/workflows/release.yml` builds and pushes the image to GitHub Container
Registry when a **GitHub Release is published**:

```
ghcr.io/nph2001/vacu:<release-version>   # e.g. 1.4.0 and 1.4
ghcr.io/nph2001/vacu:latest
ghcr.io/nph2001/vacu:sha-<short>
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
  --set config.APP_URL=https://vacu.com.vn \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=vacu.com.vn \
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

Rancher CD is Fleet. It bundles **git content**, and this repo carries ~3.6 MB of
committed images under `public/` — bundling those blows past Kubernetes' 3 MiB
request limit (`Request entity too large: limit is 3145728`). So Fleet pulls the
chart **from GHCR as an OCI artifact** instead, and the bundle it builds from git
is only `deploy/fleet/fleet.yaml` (~1 KB).

### Publish the chart

`.github/workflows/publish-chart.yml` packages `deploy/helm/vacu` and pushes it to
`oci://ghcr.io/<owner>/charts/vacu` on a `chart-v<version>` tag:

```bash
git tag chart-v0.1.0 && git push origin chart-v0.1.0   # → oci://ghcr.io/nph2001/charts/vacu:0.1.0
```

Keep the tag, `Chart.yaml` `version`, and `fleet.yaml` `version` in sync. Make the
GHCR chart package **public** (or configure a pull secret — see below).

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
   - Repository URL: `https://github.com/NPH2001/Vacu`
   - Branch: `main`
   - Paths: `deploy/fleet`   ← the tiny bundle dir, NOT `deploy/helm/vacu`
   - Target: the cluster or cluster group to deploy to.

   Fleet reads `deploy/fleet/fleet.yaml`, pulls the chart from GHCR, installs the
   release `vacu` in namespace `vacu`, and re-syncs on every push. Edit the values
   in `fleet.yaml` (host, ingress class, storageClass, image tag) to match your
   cluster.

3. **Private packages**: make the GHCR chart package public, or set
   `helmSecretName` on the Rancher GitRepo to a Secret with a `read:packages`
   token. For a private **image**, also add `imagePullSecrets: [{ name: ghcr-creds }]`
   in `fleet.yaml` and create that secret in the namespace.

### Updating the deployed version

- **New app image:** publish a Release `vX.Y.Z`, then bump `image.tag` in
  `fleet.yaml` to `X.Y.Z` (no leading `v` — see the note in `fleet.yaml`), commit
  → Fleet rolls it out.
- **New chart:** bump `Chart.yaml` `version` + `fleet.yaml` `version`, push a
  matching `chart-v<version>` tag to republish, commit → Fleet pulls it.

### Notes

- `persistence` is a **ReadWriteOnce** PVC by default, so keep `replicaCount: 1`
  (the chart uses the `Recreate` strategy). To scale past 1, use a
  ReadWriteMany storage class or move uploads to object storage, and run
  migrations as a separate step instead of the initContainer.
- Probes hit `/api/health`, which also verifies the DB is reachable.
- Private image → set `imagePullSecrets`.
