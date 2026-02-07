import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const MountMode = Type.Union([Type.Literal("ro"), Type.Literal("rw")]);

const Mount = Type.Object(
	{
		source: Type.String({ minLength: 1 }),
		target: Type.String({ minLength: 1 }),
		mode: MountMode,
		createIfMissing: Type.Optional(Type.Boolean()),
	},
	{ additionalProperties: false },
);

const NetworkMode = Type.Union([
	Type.Literal("none"),
	Type.Literal("bridge"),
	Type.Literal("host"),
]);

const SandboxConfigSchema = Type.Object(
	{
		$schema: Type.Optional(Type.String()),
		version: Type.Literal(1),
		image: Type.Object(
			{
				name: Type.String({ minLength: 1 }),
				build: Type.Optional(
					Type.Object(
						{
							context: Type.String({ minLength: 1 }),
							dockerfile: Type.String({ minLength: 1 }),
							buildIfMissing: Type.Optional(Type.Boolean()),
						},
						{ additionalProperties: false },
					),
				),
			},
			{ additionalProperties: false },
		),
		container: Type.Object(
			{
				workdir: Type.Optional(Type.String()),
				readOnlyRootFs: Type.Optional(Type.Boolean()),
				interactive: Type.Optional(Type.Boolean()),
				tty: Type.Optional(Type.Boolean()),
				tmpfs: Type.Optional(Type.Array(Type.String())),
				resources: Type.Optional(
					Type.Object(
						{
							memory: Type.Optional(Type.String()),
							cpus: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
							pidsLimit: Type.Optional(Type.Integer({ minimum: 16 })),
						},
						{ additionalProperties: false },
					),
				),
				network: Type.Optional(
					Type.Object(
						{
							mode: Type.Optional(NetworkMode),
						},
						{ additionalProperties: false },
					),
				),
			},
			{ additionalProperties: false },
		),
		mounts: Type.Array(Mount, { minItems: 0 }),
		env: Type.Optional(
			Type.Object(
				{
					passThrough: Type.Optional(Type.Array(Type.String())),
					set: Type.Optional(Type.Record(Type.String(), Type.String())),
				},
				{ additionalProperties: false },
			),
		),
	},
	{ additionalProperties: false },
);

export type SandboxConfig = Static<typeof SandboxConfigSchema>;

export const parseSandboxConfig = (raw: unknown): SandboxConfig => {
	if (!Value.Check(SandboxConfigSchema, raw)) {
		const errors = [...Value.Errors(SandboxConfigSchema, raw)].map((e) => {
			const at = e.path || "(root)";
			return `${at}: ${e.message}`;
		});
		throw new Error(`Invalid sandbox config:\n${errors.join("\n")}`);
	}
	return raw;
};
