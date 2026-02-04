import dotenv from "dotenv";
import process from "node:process";

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

const baseUrl = (process.env.PI_BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.PI_API_KEY || "";

if (!baseUrl || !apiKey) {
  throw new Error("Missing PI_BASE_URL or PI_API_KEY in environment.");
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};

async function post(path: string, payload: object) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  const agentPayload = {
    name: "example-agent",
    instructions: "You are a helpful assistant that follows tool instructions.",
    model: "gpt-4.1", // replace with pi.dev-supported model if different
  };

  // TODO: Replace with the actual pi.dev endpoint for creating an agent
  const agent = await post("/v1/agents", agentPayload);

  const runPayload = {
    agent_id: agent.id || "replace-with-agent-id",
    input: "Summarize the project status and propose next steps.",
    metadata: { priority: "low" },
  };

  // TODO: Replace with the actual pi.dev endpoint for running an agent
  const runResult = await post("/v1/runs", runPayload);

  console.log("Agent:", agent);
  console.log("Run result:", runResult);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
