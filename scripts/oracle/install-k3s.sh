#!/usr/bin/env bash
set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required"
  exit 1
fi

echo "Installing k3s on this node..."
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--write-kubeconfig-mode 644" sh -

echo "Waiting for node readiness..."
sudo k3s kubectl wait --for=condition=Ready node --all --timeout=180s

echo "k3s installed successfully."
echo "kubectl now uses: /etc/rancher/k3s/k3s.yaml"
