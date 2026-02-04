import { resolve } from "node:path";
import type { AgentSession } from "@mariozechner/pi-coding-agent";
import envPaths from "env-paths";
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
