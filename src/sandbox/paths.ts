import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { resolve } from "node:path";

export const toAbsoluteRealPath = (inputPath: string): string => {
	const abs = resolve(process.cwd(), inputPath);
	try {
		return realpathSync.native(abs);
	} catch {
		// If it doesn't exist yet, we still normalize to an absolute path.
		return abs;
	}
};

export const ensureDirExists = (dirPath: string): void => {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
};
