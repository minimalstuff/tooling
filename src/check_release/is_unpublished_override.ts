import { isUnpublishedSpecifier } from '#check_release/is_unpublished_specifier.ts';

const LINK_PREFIX = 'link:';
const ALLOWED_PROTOCOLS = ['npm:', 'workspace:'] as const;
const PROTOCOL_SEPARATOR = ':';

/**
 * Override values are user-written specifiers, so ranges are legitimate: only
 * a protocol other than `npm:` and `workspace:` is a problem, and a `link:`
 * inside the repository stays allowed.
 */
export function isUnpublishedOverride(
	value: string,
	repositoryRoot: string
): boolean {
	if (!value.includes(PROTOCOL_SEPARATOR)) return false;
	if (ALLOWED_PROTOCOLS.some((protocol) => value.startsWith(protocol))) {
		return false;
	}
	if (!value.startsWith(LINK_PREFIX)) return true;

	return isUnpublishedSpecifier(value, repositoryRoot, repositoryRoot);
}
