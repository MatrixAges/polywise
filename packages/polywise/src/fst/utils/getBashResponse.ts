import type { BashExecResult } from 'just-bash'

export default (v: BashExecResult) => {
	if (v.stderr) return { stdout: '', stderr: v.stderr, exitCode: v.exitCode }

	return { stdout: v.stdout, stderr: '', exitCode: v.exitCode }
}
