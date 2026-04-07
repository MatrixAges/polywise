import type { BashExecResult } from 'just-bash'

export default (v: BashExecResult) => {
	if (v.stderr) return { stdout: '', stderr: v.stderr, exitCode: v.exitCode }

	return {
		stdout: v.stdout || (v.exitCode === 0 ? 'Command completed successfully.' : ''),
		stderr: '',
		exitCode: v.exitCode
	}
}
