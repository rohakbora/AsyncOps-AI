#!/usr/bin/env bash
set -euo pipefail

: "${REPO_URL:?Set REPO_URL to your GitHub repository URL}"

TARGET_REVISION="${TARGET_REVISION:-main}"
SOURCE_MANIFEST="${SOURCE_MANIFEST:-infra-repo/argocd-application-oracle-single-node.yaml}"
TMP_MANIFEST="$(mktemp)"

cleanup() {
  rm -f "$TMP_MANIFEST"
}
trap cleanup EXIT

sed \
  -e "s#https://github.com/YOUR_USERNAME/YOUR_INFRA_REPO.git#${REPO_URL}#g" \
  -e "s#targetRevision: main#targetRevision: ${TARGET_REVISION}#g" \
  "$SOURCE_MANIFEST" > "$TMP_MANIFEST"

kubectl apply -f "$TMP_MANIFEST"

echo "Argo CD application applied."
echo "Repository: ${REPO_URL}"
echo "Revision: ${TARGET_REVISION}"
