export type AgentMode = "chat" | "coding" | "planning";

export interface AgentState {
	mode: AgentMode;
}

const modePrompts: Record<AgentMode, string> = {
	chat: "You are in chat mode. Be concise and helpful.",
	coding:
		"You are in coding mode. Prefer concrete steps, patches, and code-oriented guidance.",
	planning:
		"You are in planning mode. Provide structured plans before implementation.",
};

export const createStateMachine = (initialMode: AgentMode = "chat") => {
	let state: AgentState = { mode: initialMode };

	const getState = (): AgentState => state;

	const setMode = (mode: AgentMode): AgentState => {
		state = { ...state, mode };
		return state;
	};

	const getModePrompt = (mode: AgentMode): string => modePrompts[mode];

	const buildPrompt = (input: string): string => {
		const mode = state.mode;
		return `Mode: ${mode}. ${getModePrompt(mode)}\n\n${input}`;
	};

	return {
		getState,
		setMode,
		getModePrompt,
		buildPrompt,
	};
};
