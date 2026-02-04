import { PiClient } from "./piClient.js";

async function main(): Promise<void> {
  const client = PiClient.fromEnv();

  const agentPayload = {
    name: "example-agent",
    instructions: "You are a helpful assistant that follows tool instructions.",
    model: "gpt-4.1", // replace with pi.dev-supported model if different
  };

  // TODO: Replace with the actual pi.dev endpoint for creating an agent
  const agent = await client.post("/v1/agents", agentPayload);

  const runPayload = {
    agent_id: (agent as { id?: string }).id ?? "replace-with-agent-id",
    input: "Summarize the project status and propose next steps.",
    metadata: { priority: "low" },
  };

  // TODO: Replace with the actual pi.dev endpoint for running an agent
  const runResult = await client.post("/v1/runs", runPayload);

  console.log("Agent:", agent);
  console.log("Run result:", runResult);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
