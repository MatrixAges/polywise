import type { CronStore, CronTask } from './types'

export default (store: CronStore, task: CronTask) => {
	const index = store.tasks.findIndex(item => item.name === task.name)

	if (index === -1) {
		store.tasks.push(task)

		return
	}

	store.tasks[index] = task
}
