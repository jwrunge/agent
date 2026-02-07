import { readFileSync } from "node:fs";

export const isWindows = () => process.platform === "win32";
export const isMac = () => process.platform === "darwin";
export const isLinux = () => process.platform === "linux";

export const isWsl = (): boolean => {
	if (process.platform !== "linux") return false;
	try {
		const v = readFileSync("/proc/version", "utf8");
		return /microsoft/i.test(v);
	} catch {
		return false;
	}
};
