/** HTTP seam shared by provider strategies (owned adapter, injectable for tests). */
export type HttpJson = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<unknown>;

/** Default seam using the global fetch; never called directly from tests. */
export const nodeFetchJson: HttpJson = async (url, init) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`OAuth upstream returned HTTP ${res.status}`);
  }
  return (await res.json()) as unknown;
};

export interface OAuthTokenResponse {
  readonly access_token?: string;
}

/** Extract and strictly validate the access_token an upstream returned. */
export function extractAccessToken(raw: unknown): string {
  const token = (raw as OAuthTokenResponse | null)?.access_token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('OAuth token exchange did not return an access_token');
  }
  return token;
}