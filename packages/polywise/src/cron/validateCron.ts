import { Cron } from 'croner'

export default (cron: string) => {
	const job = new Cron(cron, { paused: true })

	job.stop()
}
