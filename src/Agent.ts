import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { AgentSession } from "npm:@mariozechner/pi-coding-agent@^0.51.6";
import envPaths from "npm:env-paths@^3.0.0";
import { APP_NAME, type SessionMode } from "./config/appConst.ts";

const envPath = envPaths(APP_NAME);

type NewAgentOptions = {
	name?: string;
	sessionsFilePath?: string;
	scheduleFilePath?: string;
	memoryFilePath?: string;
};

type SystemPrompts = {
        sysPrompts: string[];
    }
| {
        sysPromptPaths: string[];
    }

type NewSessionOptions = SystemPrompts & {
	mode: SessionMode;
};

export class Agent {
	name: string;
	sessions = new Map<string, AgentSession>();

	#id: string;
	#sessionsFilePath = resolve(envPath.config, "sessions");
	#scheduleFilePath = resolve(envPath.config, "schedule.json");
	#memoryFilePath = resolve(envPath.config, "memory.md");

	constructor({
		name,
		sessionsFilePath,
		scheduleFilePath,
		memoryFilePath,
	}: NewAgentOptions) {
		this.#id = crypto.randomUUID();
		this.name = name ?? `agent-${this.#id}`;
		if (sessionsFilePath) this.#sessionsFilePath = sessionsFilePath;
		if (scheduleFilePath) this.#scheduleFilePath = scheduleFilePath;
		if (memoryFilePath) this.#memoryFilePath = memoryFilePath;
	}

	spawnSession(sysPrompts: NewSessionOptions ) {}
}
