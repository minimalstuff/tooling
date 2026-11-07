import { describe, expect, it } from 'vitest';

import { buildLockfile } from '#check_release/lockfile_fixtures.ts';
import { parseLockfile } from '#check_release/parse_lockfile.ts';
import { E_LOCKFILE_INVALID } from '#check_release/release_check_error.ts';

describe('parseLockfile', () => {
	it('should return every document when the lockfile has an env document first', () => {
		expect(parseLockfile(buildLockfile(), 'pnpm-lock.yaml')).toHaveLength(2);
	});

	it('should throw an invalid lockfile error when the YAML is malformed', () => {
		expect(() => parseLockfile('a: [unclosed', 'pnpm-lock.yaml')).toThrow(
			expect.objectContaining({ code: E_LOCKFILE_INVALID })
		);
	});

	it('should throw an invalid lockfile error when a later document is malformed', () => {
		const raw = "lockfileVersion: '9.0'\n---\nb: [unclosed";

		expect(() => parseLockfile(raw, 'pnpm-lock.yaml')).toThrow(
			expect.objectContaining({ code: E_LOCKFILE_INVALID })
		);
	});

	it('should throw an invalid lockfile error when no document has a lockfileVersion', () => {
		expect(() => parseLockfile('name: app\n', 'pnpm-lock.yaml')).toThrow(
			expect.objectContaining({ code: E_LOCKFILE_INVALID })
		);
	});
});
