import path from 'path'
import { app } from '@core/consts'
import { getJobPath, reloadJob, saveStore } from '@core/cron'
import { env } from '@core/env'
import { tool } from 'ai'
import { readFile } from 'atomically'
import { Cron } from 'croner'
import fs from 'fs-extra'
import { boolean, enum as Enum, object, string } from 'zod'

import { checkPermission } from '../utils'

import type Session from '../session'

const inputSchema = object({
	action: Enum(['create', 'list', 'read', 'update']).describe(
		'The action to perform. create: create cron job and JOB.md. list: list cron jobs. read: read JOB.md by name. update: update cron/content/enabled for existing job.'
	),
	name: string()
		.optional()
		.describe('[Required for create/read/update] Job name used as folder name under app.app_path/cron'),
	cron: string()
		.optional()
		.describe('[Required for create, optional for update] Cron expression used to validate job schedule'),
	content: string().optional().describe('[Required for create, optional for update] JOB.md content to write'),
	enabled: boolean().optional().describe('[Optional for update] Whether this job should be scheduled')
})

const validateCron = (cron: string) => {
	const job = new Cron(cron, { paused: true })

	job.stop()
}

export const createCronTool = (s: Session) => {
	return tool({
		description:
			'Create, update, and inspect cron job definitions. Metadata is stored in app.app_path/cron.json. Job docs are stored in app.app_path/cron/[name]/JOB.md.',
		inputSchema,
		execute: async input => {
			if (input.action === 'create') {
				if (!input.name) {
					return { action: 'create', error: 'name is required for create action' }
				}

				if (!input.cron) {
					return { action: 'create', error: 'cron is required for create action' }
				}

				if (!input.content) {
					return { action: 'create', error: 'content is required for create action' }
				}

				const exists = env.cron.store.jobs.some(job => job.name === input.name)

				if (exists) {
					return { action: 'create', error: `Job "${input.name}" already exists` }
				}

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
				const perm_error = await checkPermission(s, 'file', 'read', app.cron_path)

				if (perm_error) {
					return { action: 'list', jobs: [], count: 0, error: perm_error }
				}

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
				if (!input.name) {
					return { action: 'read', error: 'name is required for read action' }
				}

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
				if (!input.name) {
					return { action: 'update', error: 'name is required for update action' }
				}

				const job = env.cron.store.jobs.find(item => item.name === input.name)

				if (!job) {
					return { action: 'update', error: `Job "${input.name}" not found` }
				}

				let job_file = ''

				try {
					job_file = getJobPath(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'update', error: message }
				}

				const write_perm_error = await checkPermission(s, 'file', 'write', job_file)

				if (write_perm_error) {
					return { action: 'update', error: write_perm_error }
				}

				const store_perm_error = await checkPermission(s, 'file', 'write', app.cron_path)

				if (store_perm_error) {
					return { action: 'update', error: store_perm_error }
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

				if (input.content !== undefined) {
					await fs.ensureDir(path.dirname(job_file))
					await fs.writeFile(job_file, input.content, 'utf8')
				}

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

			return { error: 'Unknown action' }
		}
	})
}
