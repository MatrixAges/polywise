import type { BashExecResult } from 'just-bash'

export default (v: BashExecResult) => {
	return {
		stdout: v.stdout || (v.exitCode === 0 ? 'Command completed successfully.' : ''),
		stderr: v.stderr || '',
		exitCode: v.exitCode
	}
}
