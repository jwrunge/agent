export interface EmailThread {
	id: string;
	subject: string;
	from: string;
	snippet: string;
	updatedAt: string;
}

export interface EmailMessage {
	id: string;
	threadId: string;
	from: string;
	to: string[];
	subject: string;
	body: string;
	receivedAt: string;
}

export interface DraftEmail {
	id: string;
	threadId?: string;
	to: string[];
	subject: string;
	body: string;
	createdAt: string;
}

export interface EmailClient {
	listThreads(limit: number): Promise<EmailThread[]>;
	getThread(threadId: string): Promise<EmailMessage[]>;
	createDraft(input: {
		threadId?: string;
		to: string[];
		subject: string;
		body: string;
	}): Promise<DraftEmail>;
}

export const createInMemoryEmailClient = (): EmailClient => {
	const threads: EmailThread[] = [
		{
			id: "thread-1",
			subject: "Welcome to pi-coding-agent",
			from: "team@pi.dev",
			snippet: "Thanks for trying the SDK...",
			updatedAt: new Date().toISOString(),
		},
	];

	const messages: EmailMessage[] = [
		{
			id: "msg-1",
			threadId: "thread-1",
			from: "team@pi.dev",
			to: ["you@example.com"],
			subject: "Welcome to pi-coding-agent",
			body: "Thanks for trying the SDK. Let us know if you need anything.",
			receivedAt: new Date().toISOString(),
		},
	];

	const drafts: DraftEmail[] = [];

	return {
		async listThreads(limit: number): Promise<EmailThread[]> {
			return threads.slice(0, limit);
		},
		async getThread(threadId: string): Promise<EmailMessage[]> {
			return messages.filter((msg) => msg.threadId === threadId);
		},
		async createDraft(input): Promise<DraftEmail> {
			const draft: DraftEmail = {
				id: `draft-${drafts.length + 1}`,
				threadId: input.threadId,
				to: input.to,
				subject: input.subject,
				body: input.body,
				createdAt: new Date().toISOString(),
			};
			drafts.push(draft);
			return draft;
		},
	};
};
