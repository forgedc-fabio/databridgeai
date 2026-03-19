"use server";

import { execSync } from "node:child_process";
import { GoogleAuth, Impersonated } from "google-auth-library";

const SA_EMAIL =
  process.env.COGNEE_SA_EMAIL ??
  "databridgeai-nextjs@forgedc-databridgeai.iam.gserviceaccount.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Get a Google Cloud ID token for authenticating to the Cognee Cloud Run service.
 *
 * Strategy:
 * 1. Try ADC + service account impersonation (production / CI)
 * 2. Fall back to gcloud CLI impersonation (local dev)
 */
export async function getCogneeIdToken(): Promise<string> {
  const audience = process.env.COGNEE_API_URL;
  if (!audience) {
    throw new Error("COGNEE_API_URL not configured");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  let token: string;

  try {
    token = await getTokenViaADC(audience);
  } catch {
    token = getTokenViaGcloud(audience);
  }

  cachedToken = {
    value: token,
    expiresAt: Date.now() + 3600_000,
  };

  return token;
}

/** ADC path — works when GOOGLE_APPLICATION_CREDENTIALS is set or on GCP. */
async function getTokenViaADC(audience: string): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const sourceClient = await auth.getClient();

  const impersonated = new Impersonated({
    sourceClient,
    targetPrincipal: SA_EMAIL,
    targetScopes: [],
    delegates: [],
    lifetime: 3600,
  });

  return impersonated.fetchIdToken(audience);
}

/** gcloud CLI fallback — works when `gcloud auth login` has been run. */
function getTokenViaGcloud(audience: string): string {
  try {
    const token = execSync(
      `gcloud auth print-identity-token --impersonate-service-account=${SA_EMAIL} --audiences=${audience}`,
      { encoding: "utf-8", timeout: 10_000, stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!token || token.startsWith("ERROR")) {
      throw new Error(`gcloud returned invalid token: ${token.slice(0, 100)}`);
    }

    return token;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not obtain Cognee ID token. Run 'gcloud auth login' or configure ADC. Detail: ${message}`
    );
  }
}
