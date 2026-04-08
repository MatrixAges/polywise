import { connectSession } from '@core/utils'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import { getId } from 'stk/utils'

import getJobPath from './getJobPath'

import type { CronJob } from './types'

const getJobPrompt = (job: CronJob, content: string) => {
	return [
		'[CRON EXECUTION CONTEXT]',
		`Job Name: ${job.name}`,
		`Cron: ${job.cron}`,
		'This is an automatically triggered cron execution. Execute the task described below and use available tools as needed.',
		'',
		'[JOB SPEC]',
		content
	].join('\n')
}

export default async (job: CronJob) => {
	const id = getId()
	const job_path = getJobPath(job.name)
	const title = `job_${job.name}_${dayjs().format('HH_mm')}`
	const session = await connectSession({ id, is_cron: true, title })

	const exists = await fs.pathExists(job_path)

	if (!exists) {
		throw new Error(`JOB.md not found for job "${job.name}"`)
	}

	const content = await fs.readFile(job_path, 'utf8')
	const prompt = getJobPrompt(job, content)

	await session.getStream({ id: getId(), role: 'user', parts: [{ type: 'text', text: prompt }] })
}
