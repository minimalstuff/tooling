import { cancel, isCancel } from '@clack/prompts';

export function exitWhenCancelled<Answer>(
	answer: Answer
): Exclude<Answer, symbol> {
	if (!isCancel(answer)) return answer as Exclude<Answer, symbol>;

	cancel('Cancelled');
	return process.exit(0);
}
