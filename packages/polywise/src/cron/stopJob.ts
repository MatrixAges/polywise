import type { CronRuntime } from './types'

export default (runtime: CronRuntime, name: string) => {
	const job = runtime.jobs.get(name)

	if (!job) return

	job.stop()

	runtime.jobs.delete(name)
}
