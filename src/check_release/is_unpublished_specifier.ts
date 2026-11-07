import { isAbsolute, relative, resolve, sep } from 'node:path';

const LINK_PREFIX = 'link:';
const PARENT_SEGMENT = '..';
const REGISTRY_VERSION_PATTERN = /^\d/;

function isInsideRepository(
	linkSpecifier: string,
	repositoryRoot: string,
	baseDirectory: string
): boolean {
	const target = resolve(
		baseDirectory,
		linkSpecifier.slice(LINK_PREFIX.length)
	);
	const pathFromRoot = relative(repositoryRoot, target);
	return !(
		pathFromRoot === PARENT_SEGMENT ||
		pathFromRoot.startsWith(PARENT_SEGMENT + sep) ||
		isAbsolute(pathFromRoot)
	);
}

/**
 * Only a registry version (starting with a digit, possibly followed by a
 * peer or patch suffix) and a `link:` inside the repository (an internal
 * workspace) are releasable. Anything else (`file:`, `link:` outside, git,
 * tarball URL, `github:`) is not.
 */
export function isUnpublishedSpecifier(
	specifier: string,
	repositoryRoot: string,
	baseDirectory: string
): boolean {
	if (REGISTRY_VERSION_PATTERN.test(specifier)) return false;
	if (!specifier.startsWith(LINK_PREFIX)) return true;

	return !isInsideRepository(specifier, repositoryRoot, baseDirectory);
}
