import { createInterface } from "node:readline";

export const promptYesNo = async (question: string): Promise<boolean> => {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await new Promise<string>((resolve) => rl.question(question, resolve));
	rl.close();
	return /^y(es)?$/i.test(answer.trim());
};
