import getCronPrompt from '@core/consts/prompts/getCronPrompt'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import { getId } from 'stk/utils'

import { submit } from '../fst/utils'
import getJobPath from './getJobPath'

import type { CronJob } from './types'

export default async (job: CronJob) => {
	const id = getId()
	const job_path = getJobPath(job.name)
	const title = `job_${job.name}_${dayjs().format('HH_mm')}`

	const exists = await fs.pathExists(job_path)

	if (!exists) {
		throw new Error(`JOB.md not found for job "${job.name}"`)
	}

	const content = await fs.readFile(job_path, 'utf8')
	const prompt = getCronPrompt({ job_name: job.name, cron: job.cron, content })

	await submit({ id, is_cron: true, title }, prompt)
}
