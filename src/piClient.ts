import dotenv from "dotenv";

export type JsonObject = Record<string, unknown>;

const envPath = new URL("../../.env", import.meta.url);

dotenv.config({
  path: envPath,
});

export class PiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  static fromEnv(): PiClient {
    const baseUrl = (process.env.PI_BASE_URL || "").replace(/\/$/, "");
    const apiKey = process.env.PI_API_KEY || "";

    if (!baseUrl || !apiKey) {
      throw new Error("Missing PI_BASE_URL or PI_API_KEY in environment.");
    }

    return new PiClient(baseUrl, apiKey);
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async post(path: string, payload: JsonObject): Promise<JsonObject> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.json() as Promise<JsonObject>;
  }

  async get(path: string): Promise<JsonObject> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.json() as Promise<JsonObject>;
  }

  async streamResponse(path: string, payload: JsonObject): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      result += decoder.decode(value, { stream: true });
    }

    return result ? result : null;
  }
}
