/**
 * Thin HTTP client for the NKS osTicket JSON API.
 *
 * Every call is a POST of `{ action, params }` with the API key header; the
 * server replies with `{ ok: true, data }` or `{ ok: false, error }`. This
 * client unwraps that envelope and turns failures into typed errors.
 */

import { Agent } from "node:https";
import type { Config } from "./config.js";

export class OsticketApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "OsticketApiError";
  }
}

interface Envelope {
  ok: boolean;
  data?: unknown;
  error?: { code?: number; message?: string; [k: string]: unknown };
}

export class OsticketClient {
  private readonly agent?: Agent;

  constructor(private readonly config: Config) {
    // Only needed to permit self-signed TLS in local/dev setups.
    if (!config.rejectUnauthorized && config.url.startsWith("https:")) {
      this.agent = new Agent({ rejectUnauthorized: false });
    }
  }

  /**
   * Invoke an API action and return its `data` payload.
   * Throws OsticketApiError on transport failure or an `ok:false` response.
   */
  async call<T = unknown>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(this.config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.config.apiKey,
          Accept: "application/json",
        },
        body: JSON.stringify({ action, params }),
        signal: controller.signal,
        // @ts-expect-error Node's fetch accepts a dispatcher/agent at runtime.
        agent: this.agent,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      if (reason.includes("aborted")) {
        throw new OsticketApiError(`Request timed out after ${this.config.timeoutMs}ms`, 504);
      }
      throw new OsticketApiError(`Network error: ${reason}`, 502);
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let envelope: Envelope;
    try {
      envelope = JSON.parse(text) as Envelope;
    } catch {
      throw new OsticketApiError(
        `Non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`,
        response.status,
      );
    }

    if (!envelope.ok) {
      const code = envelope.error?.code ?? response.status;
      const message = envelope.error?.message ?? "Unknown API error";
      const { code: _c, message: _m, ...extra } = envelope.error ?? {};
      throw new OsticketApiError(message, code, Object.keys(extra).length ? extra : undefined);
    }

    return envelope.data as T;
  }
}
