export class ReleaseCheckError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = 'ReleaseCheckError';
		this.code = code;
	}
}

export const E_LOCKFILE_MISSING = 'E_LOCKFILE_MISSING';
export const E_LOCKFILE_UNREADABLE = 'E_LOCKFILE_UNREADABLE';
export const E_LOCKFILE_INVALID = 'E_LOCKFILE_INVALID';
