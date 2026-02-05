import { createAgentSession, type AgentSession } from "@mariozechner/pi-coding-agent";
import envPaths from "env-paths";
import { APP_NAME, type SessionMode } from "./config/appConst.ts";

const resolvePath = (base: string, target: string) => {
	const trimmedBase = base.replace(/[\\/]+$/, "");
	const trimmedTarget = target.replace(/^[\\/]+/, "");
	return `${trimmedBase}/${trimmedTarget}`;
};

const envPath = envPaths(APP_NAME);

type NewAgentOptions = {
	name?: string;
	sessionsFilePath?: string;
	scheduleFilePath?: string;
	memoryFilePath?: string;
};

type NewSessionOptions = {
	mode: SessionMode;
	sysPrompts: string[];
	sysPromptPaths: string[];
};

export class Agent {
	name: string;
	sessions = new Set<AgentSession>();

	#id: string;
	#sessionsFilePath = resolvePath(envPath.config, "sessions");
	#scheduleFilePath = resolvePath(envPath.config, "schedule.json");
	#memoryFilePath = resolvePath(envPath.config, "memory.md");

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

	async spawnSession({ mode, sysPrompts, sysPromptPaths }: NewSessionOptions ) {
		const id = crypto.randomUUID();
		const { session } = await createAgentSession({
			
		});

		this.sessions.add(session);
		return session;
	}
}
