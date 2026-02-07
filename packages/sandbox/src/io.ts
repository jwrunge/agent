import { readFileSync } from "node:fs";

export const readJsonFile = (filePath: string, maxBytes = 64 * 1024): unknown => {
	const data = readFileSync(filePath);
	if (data.byteLength > maxBytes) {
		throw new Error(
			`Refusing to read ${filePath}: file too large (${data.byteLength} bytes)`,
		);
	}
	return JSON.parse(data.toString("utf8"));
};
