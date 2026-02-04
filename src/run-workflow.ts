import dotenv from "dotenv";
import { createAgentSession } from "@mariozechner/pi-coding-agent";

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

async function main(): Promise<void> {
  const { session } = await createAgentSession();

  session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  await session.prompt(
    "Summarize the project status and propose next steps for this repo."
  );

  process.stdout.write("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
