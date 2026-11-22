import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

import { isRecord } from '#check_release/is_record.ts';

const RELEASE_WORKFLOW_URL = new URL(
	'../../.github/workflows/release.yml',
	import.meta.url
);
const VERIFY_STEP_ID = 'verify';

function findPublishSteps(workflow: unknown): readonly unknown[] {
	if (!isRecord(workflow) || !isRecord(workflow['jobs'])) return [];
	const publishJob = workflow['jobs']['publish'];
	if (!isRecord(publishJob) || !Array.isArray(publishJob['steps'])) return [];
	return publishJob['steps'];
}

/**
 * Returns the bash script of the `publish` job step that verifies the release
 * bundle, as written in the reusable release workflow.
 */
export function readVerificationScript(): string {
	const workflow: unknown = parse(readFileSync(RELEASE_WORKFLOW_URL, 'utf8'));
	for (const step of findPublishSteps(workflow)) {
		if (!isRecord(step) || step['id'] !== VERIFY_STEP_ID) continue;
		if (typeof step['run'] === 'string') return step['run'];
	}
	throw new Error('release.yml has no publish step with id "verify"');
}
