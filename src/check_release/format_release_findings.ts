import type { ReleaseFinding } from '#check_release/release_finding.ts';

export function formatReleaseFinding(
	finding: Readonly<ReleaseFinding>
): string {
	return `${finding.kind}: ${finding.packageName} (${finding.location}). Fix: ${finding.hint}.`;
}

export function formatSummary(findingCount: number): string {
	const noun = findingCount === 1 ? 'finding' : 'findings';
	return `${findingCount} ${noun}: a release must not ship with patched or locally linked @minimalstuff/* packages.`;
}
