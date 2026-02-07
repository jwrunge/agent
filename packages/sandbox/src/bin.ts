import { main } from "./cli.ts";

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
