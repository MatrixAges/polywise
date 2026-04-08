import type { CronRuntime } from './types'

export default (runtime: CronRuntime) => {
	for (const [name, job] of runtime.jobs.entries()) {
		job.stop()
		runtime.jobs.delete(name)
	}
}
