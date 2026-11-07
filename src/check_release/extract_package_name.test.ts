import { describe, expect, it } from 'vitest';

import { extractPackageName } from '#check_release/extract_package_name.ts';

describe('extractPackageName', () => {
	it('should return the scoped name when the key has an exact version', () => {
		expect(extractPackageName('@minimalstuff/ui@5.2.0')).toBe(
			'@minimalstuff/ui'
		);
	});

	it('should return the scoped name when the key has no version', () => {
		expect(extractPackageName('@minimalstuff/ui')).toBe('@minimalstuff/ui');
	});

	it('should return the scoped name when the key has a version range', () => {
		expect(extractPackageName('@minimalstuff/ui@^5.0.0')).toBe(
			'@minimalstuff/ui'
		);
	});

	it('should return the unscoped name when the key has a version', () => {
		expect(extractPackageName('left-pad@1.3.0')).toBe('left-pad');
	});

	it('should return the target name when the key has a parent selector', () => {
		expect(extractPackageName('app>@minimalstuff/ui@5')).toBe(
			'@minimalstuff/ui'
		);
	});
});
