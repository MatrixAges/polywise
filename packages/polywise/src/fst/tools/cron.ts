import path from 'path'
import { app } from '@core/consts'
import { getJobPath, reloadJob, saveStore, stopJob, validateCron } from '@core/cron'
import { env } from '@core/env'
import { audit } from '@core/fst/agents'
import { tool } from 'ai'
import { readFile } from 'atomically'
import fs from 'fs-extra'
import { boolean, enum as Enum, object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	action: Enum(['create', 'list', 'read', 'update', 'remove']).describe(
		'The action to perform. create: create cron job and JOB.md. list: list cron jobs. read: read JOB.md by name. update: update cron/content/enabled for existing job. remove: remove existing job and its directory.'
	),
	name: string()
		.optional()
		.describe('[Required for create/read/update/remove] Job name used as folder name under app.app_path/cron'),
	cron: string()
		.optional()
		.describe('[Required for create, optional for update] Cron expression used to validate job schedule'),
	content: string().optional().describe('[Required for create, optional for update] JOB.md content to write'),
	enabled: boolean().optional().describe('[Optional for update] Whether this job should be scheduled')
})

export const createCronTool = (s: Session) => {
	return tool({
		description:
			'Create, update, and inspect cron job definitions. Metadata is stored in app.app_path/cron.json. Job docs are stored in app.app_path/cron/[name]/JOB.md.',
		inputSchema,
		execute: async input => {
			if (input.action === 'create') {
				if (!input.name) return { action: 'create', error: 'name is required for create action' }
				if (!input.cron) return { action: 'create', error: 'cron is required for create action' }
				if (!input.content) return { action: 'create', error: 'content is required for create action' }

				if (input.content) {
					const approved = await audit(s, input.content)

					if (!approved) return { error: 'content is not allowed' }
				}

				const exists = env.cron.store.jobs.some(job => job.name === input.name)

				if (exists) return { action: 'create', error: `Job "${input.name}" already exists` }

				let job_file = ''

				try {
					job_file = getJobPath(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'create', error: message }
				}

				try {
					validateCron(input.cron)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid cron expression'

					return { action: 'create', error: message }
				}

				await fs.ensureDir(path.dirname(job_file))
				await fs.writeFile(job_file, input.content, 'utf8')

				const now = new Date().toISOString()

				env.cron.store.jobs.push({
					name: input.name,
					cron: input.cron,
					enabled: true,
					last_run_at: null,
					last_status: 'idle',
					last_error: null,
					created_at: now,
					updated_at: now
				})

				await saveStore(env.cron.store)
				await reloadJob(env.cron, input.name)

				return {
					action: 'create',
					name: input.name,
					cron: input.cron,
					path: job_file
				}
			}

			if (input.action === 'list') {
				const jobs = await Promise.all(
					env.cron.store.jobs.map(async job => {
						const job_md_path = path.resolve(app.cron_dir, job.name, 'JOB.md')
						const has_job_md = await fs.pathExists(job_md_path)

						return {
							name: job.name,
							cron: job.cron,
							enabled: job.enabled,
							last_run_at: job.last_run_at,
							last_status: job.last_status,
							last_error: job.last_error,
							has_job_md,
							path: job_md_path
						}
					})
				)

				return { action: 'list', jobs, count: jobs.length }
			}

			if (input.action === 'read') {
				if (!input.name) return { action: 'read', error: 'name is required for read action' }

				let job_file = ''

				try {
					job_file = getJobPath(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'read', error: message }
				}

				const exists = await fs.pathExists(job_file)

				if (!exists) {
					return {
						action: 'read',
						name: input.name,
						content: '',
						error: `JOB.md not found for job "${input.name}"`
					}
				}

				const content = await readFile(job_file, 'utf8')

				return {
					action: 'read',
					name: input.name,
					path: job_file,
					content
				}
			}

			if (input.action === 'update') {
				if (!input.name) return { action: 'update', error: 'name is required for update action' }
				if (!input.content) return { action: 'update', error: 'content is required for update action' }

				const job = env.cron.store.jobs.find(item => item.name === input.name)

				if (!job) return { action: 'update', error: `Job "${input.name}" not found` }

				let job_file = ''

				try {
					job_file = getJobPath(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'update', error: message }
				}

				if (input.cron) {
					try {
						validateCron(input.cron)
					} catch (err) {
						const message = err instanceof Error ? err.message : 'Invalid cron expression'

						return { action: 'update', error: message }
					}

					job.cron = input.cron
				}

				await fs.ensureDir(path.dirname(job_file))
				await fs.writeFile(job_file, input.content, 'utf8')

				if (input.enabled !== undefined) {
					job.enabled = input.enabled
				}

				job.updated_at = new Date().toISOString()

				await saveStore(env.cron.store)
				await reloadJob(env.cron, input.name)

				return {
					action: 'update',
					name: job.name,
					cron: job.cron,
					enabled: job.enabled,
					path: job_file
				}
			}

			if (input.action === 'remove') {
				if (!input.name) return { action: 'remove', error: 'name is required for remove action' }

				const index = env.cron.store.jobs.findIndex(item => item.name === input.name)

				if (index === -1) return { action: 'remove', error: `Job "${input.name}" not found` }

				let job_file = ''

				try {
					job_file = getJobPath(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'remove', error: message }
				}

				stopJob(env.cron, input.name)

				env.cron.store.jobs.splice(index, 1)

				await saveStore(env.cron.store)
				await fs.remove(path.dirname(job_file))

				return { action: 'remove', name: input.name, removed: true, path: path.dirname(job_file) }
			}

			return { error: 'Unknown action' }
		}
	})
}
