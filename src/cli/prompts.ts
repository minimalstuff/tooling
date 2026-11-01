import { cancel, isCancel } from '@clack/prompts';

const CANCELLED_EXIT_CODE = 130;

export function exitWhenCancelled<Answer>(
	answer: Answer
): Exclude<Answer, symbol> {
	if (!isCancel(answer)) return answer as Exclude<Answer, symbol>;

	cancel('Cancelled');
	return process.exit(CANCELLED_EXIT_CODE);
}
