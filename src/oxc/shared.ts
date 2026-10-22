export const COMMON_IGNORE_PATTERNS: readonly string[] = [
	'**/node_modules/**',
	'**/dist/**',
	'**/build/**',
	'**/routeTree.gen.ts',
	'**/*.yml',
	'**/*.yaml',
];

export const ADONISJS_IGNORE_PATTERNS: readonly string[] = [
	'**/.adonisjs/**',
	'**/bin/*',
	'**/database/schema.ts',
];

export const FORMAT_ONLY_IGNORE_PATTERNS: readonly string[] = [
	'**/CHANGELOG.md',
];
