#!/usr/bin/env bash
# Deploy Cognee backend to Cloud Run (europe-west1)
# Prerequisites:
#   - gcloud CLI authenticated with forgedc-databridgeai project
#   - Secrets created in GCP Secret Manager: ANTHROPIC_API_KEY, OPENAI_API_KEY
#   - Cloud Run service account has Secret Manager Secret Accessor role
set -euo pipefail

PROJECT_ID="forgedc-databridgeai"
REGION="europe-west1"
SERVICE_NAME="databridgeai-cognee"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "Building and pushing container image..."
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}" ./backend

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --set-secrets "LLM_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-secrets "EMBEDDING_API_KEY=OPENAI_API_KEY:latest" \
  --set-env-vars "LLM_PROVIDER=anthropic,LLM_MODEL=claude-sonnet-4-20250514,GRAPH_DATABASE_PROVIDER=networkx,EMBEDDING_PROVIDER=openai,EMBEDDING_MODEL=openai/text-embedding-3-large,REQUIRE_AUTHENTICATION=false,LOG_LEVEL=INFO" \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 2 \
  --allow-unauthenticated

echo "Deployment complete. Fetching service URL..."
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format "value(status.url)"
