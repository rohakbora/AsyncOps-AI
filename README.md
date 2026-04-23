# AI Task Processing Platform (MERN + Python Worker)

This project implements:

- JWT authentication (register/login)
- Async task execution with Redis queue
- Task status tracking (`pending`, `running`, `success`, `failed`)
- Task logs and result storage
- Docker, Kubernetes manifests, Argo CD setup template, and CI/CD workflow

## Repository Structure

- `frontend/` React UI
- `backend/` Node.js + Express API
- `worker/` Python background worker
- `infra-repo/` Kubernetes manifests (to move to separate infra repo)
- `.github/workflows/` CI/CD
- `docs/` architecture document

## Supported Operations

- `uppercase`
- `lowercase`
- `reverse`
- `word_count`

## Local Setup (Docker Compose)

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` in `.env`.
3. Run:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Tasks (Bearer token required):

- `POST /api/tasks` create task
- `POST /api/tasks/:id/run` queue task
- `GET /api/tasks` list tasks
- `GET /api/tasks/:id` task detail

## Kubernetes Deployment (k3s compatible)

1. Ensure ingress controller exists (k3s includes Traefik by default, or install nginx ingress).
2. Update image names in `infra-repo/k8s/base/*.yaml`.
3. Apply manifests:

```bash
kubectl apply -k infra-repo/k8s/base
```

4. Add host mapping for local ingress testing:

```text
127.0.0.1 ai-task.local
```

## Argo CD (GitOps)

1. Create a separate infra repository and push `infra-repo/` contents there.
2. Update `repoURL` in `infra-repo/argocd-application.yaml`.
3. Install Argo CD.
4. Apply app manifest:

```bash
kubectl apply -f infra-repo/argocd-application.yaml
```

5. Verify app in Argo CD dashboard and capture screenshot for submission.

Important:

- GitOps does not happen inside Docker Compose.
- Docker Compose is only for local development/runtime testing.
- GitOps starts only after the manifests exist in Git, CI updates image tags in Git, and Argo CD syncs the cluster from that Git repo.

GitOps flow in this project:

1. Push application code to GitHub.
2. GitHub Actions builds and pushes multi-arch Docker images.
3. GitHub Actions updates `infra-repo/k8s/base/kustomization.yaml` with the new image tag.
4. Commit lands in Git.
5. Argo CD watches the infra repo path and syncs the cluster to match Git.

## Oracle Single-Node k3s Path

For Oracle Cloud Always Free on a single Ampere A1 VM, use the dedicated overlay:

- Kustomize path: `infra-repo/k8s/overlays/oracle-single-node`
- Argo CD app manifest: `infra-repo/argocd-application-oracle-single-node.yaml`

What this overlay changes:

- Reduces frontend/backend/worker to one replica each for a small single-node cluster
- Switches ingress to Traefik, which k3s includes by default
- Adds a PVC-backed MongoDB volume using the `local-path` storage class

Suggested VM size:

- `2-4` OCPU
- `8-12 GB` RAM
- Ubuntu on Oracle Ampere A1

Deploy manually with kubectl:

```bash
kubectl apply -k infra-repo/k8s/overlays/oracle-single-node
```

For GitOps:

```bash
kubectl apply -f infra-repo/argocd-application-oracle-single-node.yaml
```

Detailed VM setup guide:

- `docs/oracle-single-node-k3s.md`

Helper scripts:

- `scripts/oracle/install-k3s.sh`
- `scripts/oracle/install-helm.sh`
- `scripts/oracle/install-argocd.sh`
- `scripts/oracle/register-argocd-app.sh`

## CI/CD Setup

Workflow file: `.github/workflows/ci-cd.yaml`

It performs:

- Lint backend and frontend
- Build Docker images for `linux/amd64` and `linux/arm64`
- Push to Docker Hub
- Update image tag in `infra-repo/k8s/base/kustomization.yaml`

Required GitHub secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Assignment Submission Checklist

- Application repository: this repo
- Infrastructure repository: move `infra-repo/` to a separate repo
- Live URL: from ingress/load balancer
- Argo CD screenshot: from dashboard
- Architecture document: `docs/architecture.md`
- Setup guide: this README
