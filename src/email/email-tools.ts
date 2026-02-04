import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import { type Static, Type } from "@sinclair/typebox";

import type { EmailClient } from "./email-client.js";

const listThreadsSchema = Type.Object({
	limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50 })),
});

const getThreadSchema = Type.Object({
	threadId: Type.String({ minLength: 1 }),
});

const createDraftSchema = Type.Object({
	threadId: Type.Optional(Type.String({ minLength: 1 })),
	to: Type.Array(Type.String({ minLength: 1 })),
	subject: Type.String({ minLength: 1 }),
	body: Type.String({ minLength: 1 }),
});

export const createEmailTools = (
	emailClient: EmailClient,
): ToolDefinition[] => [
	{
		name: "email.listThreads",
		label: "Email: List Threads",
		description: "List recent email threads (read-only).",
		parameters: listThreadsSchema,
		execute: async (
			toolCallId,
			params: Static<typeof listThreadsSchema>,
			_signal,
			_onUpdate,
			_ctx,
		) => {
			const limit = params.limit ?? 10;
			const threads = await emailClient.listThreads(limit);
			return {
				content: [{ type: "text", text: JSON.stringify(threads, null, 2) }],
				details: { toolCallId },
			};
		},
	},
	{
		name: "email.getThread",
		label: "Email: Get Thread",
		description: "Get full messages for a thread (read-only).",
		parameters: getThreadSchema,
		execute: async (
			toolCallId,
			params: Static<typeof getThreadSchema>,
			_signal,
			_onUpdate,
			_ctx,
		) => {
			const messages = await emailClient.getThread(params.threadId);
			return {
				content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
				details: { toolCallId },
			};
		},
	},
	{
		name: "email.createDraft",
		label: "Email: Create Draft",
		description:
			"Create a draft reply. This tool NEVER sends email. Human review required.",
		parameters: createDraftSchema,
		execute: async (
			toolCallId,
			params: Static<typeof createDraftSchema>,
			_signal,
			_onUpdate,
			_ctx,
		) => {
			const draft = await emailClient.createDraft(params);
			return {
				content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
				details: { toolCallId },
			};
		},
	},
];
