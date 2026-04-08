import type { CronStore } from './types'

export default (store: CronStore, name: string) => store.jobs.find(job => job.name === name)
