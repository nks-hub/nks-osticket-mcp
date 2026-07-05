/**
 * Runtime configuration, loaded and validated from the environment.
 *
 * Required:
 *   NKS_OSTICKET_URL      Base URL of the NKS osTicket API entry,
 *                         e.g. https://support.example.com/api/nks-osticket.php
 *   NKS_OSTICKET_API_KEY  osTicket API key (bound to this client's source IP)
 *
 * Optional:
 *   NKS_OSTICKET_TIMEOUT_MS   Request timeout in ms (default 30000)
 *   NKS_OSTICKET_REJECT_UNAUTHORIZED  "false" to allow self-signed TLS (default true)
 */

export interface Config {
  readonly url: string;
  readonly apiKey: string;
  readonly timeoutMs: number;
  readonly rejectUnauthorized: boolean;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function loadConfig(): Config {
  const url = required("NKS_OSTICKET_URL");
  try {
    // Enforce a well-formed absolute URL early with a clear message.
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    throw new Error(`NKS_OSTICKET_URL is not a valid URL: ${url}`);
  }

  const timeoutRaw = process.env.NKS_OSTICKET_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Number.parseInt(timeoutRaw, 10) : 30_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`NKS_OSTICKET_TIMEOUT_MS must be a positive integer, got: ${timeoutRaw}`);
  }

  return {
    url,
    apiKey: required("NKS_OSTICKET_API_KEY"),
    timeoutMs,
    rejectUnauthorized: (process.env.NKS_OSTICKET_REJECT_UNAUTHORIZED ?? "true") !== "false",
  };
}
