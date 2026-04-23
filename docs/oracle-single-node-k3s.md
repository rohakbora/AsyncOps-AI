# Oracle Single-Node k3s Deployment

This guide is the fastest way to deploy the project on Oracle Cloud Always Free using:

- 1 Oracle Ampere A1 VM
- k3s
- Argo CD installed with Helm
- the `oracle-single-node` Kustomize overlay

This repo can work as a monorepo for GitOps. That means Argo CD can watch this same GitHub repository as long as the `infra-repo/` folder stays inside it.

## 1. Oracle VM Shape

Recommended:

- Shape: `VM.Standard.A1.Flex`
- OCPU: `2` to `4`
- Memory: `8 GB` to `12 GB`
- OS: Ubuntu 22.04 or 24.04
- Boot volume: `50 GB` or more

## 2. Open OCI Ingress Rules

Add ingress rules in your subnet security list or network security group for:

- `22/tcp` for SSH
- `80/tcp` for the app
- `443/tcp` if you later add TLS

Optional for temporary Argo CD access:

- `8081/tcp` only if you expose Argo CD that way yourself

## 3. Push This Repo To GitHub

GitOps starts only after the repo is in Git.

Current working model:

- GitHub Actions builds and pushes images
- GitHub Actions updates `infra-repo/k8s/base/kustomization.yaml`
- Argo CD watches the same repository and syncs `infra-repo/k8s/overlays/oracle-single-node`

If you later split app and infra into two repos, you must update:

- the GitHub Actions workflow
- the Argo CD `repoURL`

## 4. Replace Placeholders Before Deploying

Update these files:

- `infra-repo/k8s/base/backend.yaml`
- `infra-repo/k8s/base/frontend.yaml`
- `infra-repo/k8s/base/worker.yaml`
- `infra-repo/k8s/base/kustomization.yaml`
- `infra-repo/argocd-application-oracle-single-node.yaml`

Replace or rotate as needed:

- `JWT_SECRET` in `infra-repo/k8s/base/secret.yaml`

For monorepo GitOps, `repoURL` should be the GitHub URL of this same repo.

Example:

```yaml
repoURL: https://github.com/rohakbora/AsyncOps-AI.git
```

## 5. Configure GitHub Secrets

In GitHub repository settings, add:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Then push to `main` once so CI can publish multi-arch images for both `amd64` and `arm64`.

If the repo will be public, rotate the JWT secret before sharing or move it out of Git.

## 6. Bootstrap The VM

SSH into the Oracle VM and run:

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates
```

Clone the repo:

```bash
git clone https://github.com/rohakbora/AsyncOps-AI.git
cd AsyncOps-AI
```

Install k3s:

```bash
chmod +x scripts/oracle/install-k3s.sh
./scripts/oracle/install-k3s.sh
```

Install Helm:

```bash
chmod +x scripts/oracle/install-helm.sh
./scripts/oracle/install-helm.sh
```

Install Argo CD with Helm:

```bash
chmod +x scripts/oracle/install-argocd.sh
./scripts/oracle/install-argocd.sh
```

## 7. Access Argo CD

Get the initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

Port-forward Argo CD from your laptop:

```bash
ssh -L 8081:127.0.0.1:8081 ubuntu@YOUR_VM_PUBLIC_IP
```

Then on the VM:

```bash
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

Open:

```text
https://localhost:8081
```

Username:

```text
admin
```

## 8. Register The App In Argo CD

After you have updated `repoURL` in `infra-repo/argocd-application-oracle-single-node.yaml`, apply:

```bash
kubectl apply -f infra-repo/argocd-application-oracle-single-node.yaml
```

Or use the helper script:

```bash
chmod +x scripts/oracle/register-argocd-app.sh
REPO_URL=https://github.com/rohakbora/AsyncOps-AI.git \
./scripts/oracle/register-argocd-app.sh
```

## 9. Verify The App

Watch pods:

```bash
kubectl get pods -n ai-task-platform -w
```

Check ingress:

```bash
kubectl get ingress -n ai-task-platform
```

Check services:

```bash
kubectl get svc -n ai-task-platform
```

## 10. Expose The App Publicly

k3s includes Traefik by default, and the Oracle overlay is already set to use Traefik.

To use the VM public IP directly, patch the ingress host handling as needed or leave it hostless.

If you want a domain:

1. Point an `A` record to the Oracle VM public IP.
2. Add the host in the ingress manifest.
3. Optionally add TLS later.

## 11. If You Need A Fast Manual Fallback

If Argo CD is not ready yet, you can still deploy the same Oracle overlay directly:

```bash
kubectl apply -k infra-repo/k8s/overlays/oracle-single-node
```

This is not the GitOps path, but it is useful for first-cluster debugging.
