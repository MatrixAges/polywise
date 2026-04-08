import type { CronJob, CronStore } from './types'

export default (store: CronStore, job: CronJob) => {
	const index = store.jobs.findIndex(item => item.name === job.name)

	if (index === -1) {
		store.jobs.push(job)

		return
	}

	store.jobs[index] = job
}
