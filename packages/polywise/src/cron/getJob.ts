import type { CronStore } from './types'

export default (store: CronStore, name: string) => store.tasks.find(task => task.name === name)
