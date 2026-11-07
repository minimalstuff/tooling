const OVERRIDE_PARENT_SEPARATOR = '>';

/**
 * Returns the package name of a lockfile key such as `@scope/name@1.0.0`,
 * `@scope/name@^1` or `parent>@scope/name`.
 */
export function extractPackageName(key: string): string {
	const target = key.slice(key.lastIndexOf(OVERRIDE_PARENT_SEPARATOR) + 1);
	const versionSeparatorIndex = target.indexOf('@', 1);
	if (versionSeparatorIndex === -1) return target;

	return target.slice(0, versionSeparatorIndex);
}
