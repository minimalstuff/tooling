export const RELEASE_FINDING_KIND = {
	patch: 'patch',
	localDependency: 'local dependency',
	override: 'override',
} as const;

export type ReleaseFinding = {
	kind: (typeof RELEASE_FINDING_KIND)[keyof typeof RELEASE_FINDING_KIND];
	packageName: string;
	location: string;
	hint: string;
};
