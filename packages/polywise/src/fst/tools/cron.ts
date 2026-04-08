import path from 'path'
import { app } from '@core/consts'
import { cron_path } from '@core/consts/app'
import { reloadJob, saveStore } from '@core/cron'
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
		'The action to perform. create: create cron task and TASK.md. list: list cron tasks. read: read TASK.md by name. update: update cron/content/enabled for existing task.'
	),
	name: string()
		.optional()
		.describe('[Required for create/read/update] Task name used as folder name under app.app_path/cron'),
	cron: string()
		.optional()
		.describe('[Required for create, optional for update] Cron expression used to validate task schedule'),
	content: string().optional().describe('[Required for create, optional for update] TASK.md content to write'),
	enabled: boolean().optional().describe('[Optional for update] Whether this task should be scheduled')
})

const cron_dir = path.resolve(app.app_path, 'cron')

const getTaskDir = (name: string) => {
	if (name.includes('..') || name.includes('/') || name.includes('\\')) {
		throw new Error('Invalid name: path traversal or separators are not allowed')
	}

	if (!name.trim()) {
		throw new Error('Invalid name: cannot be empty')
	}

	return path.resolve(cron_dir, name)
}

const getTaskFile = (name: string) => path.resolve(getTaskDir(name), 'TASK.md')

const validateCron = (cron: string) => {
	const job = new Cron(cron, { paused: true })

	job.stop()
}

export const createCronTool = (s: Session) => {
	return tool({
		description:
			'Create, update, and inspect cron task definitions. Metadata is stored in app.app_path/cron.json. Task docs are stored in app.app_path/cron/[name]/TASK.md.',
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

				const exists = env.cron.store.tasks.some(task => task.name === input.name)

				if (exists) {
					return { action: 'create', error: `Task "${input.name}" already exists` }
				}

				let task_file = ''

				try {
					task_file = getTaskFile(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'create', error: message }
				}

				const perm_error = await checkPermission(s, 'file', 'write', task_file)

				if (perm_error) {
					return { action: 'create', error: perm_error }
				}

				const store_perm_error = await checkPermission(s, 'file', 'write', cron_path)

				if (store_perm_error) {
					return { action: 'create', error: store_perm_error }
				}

				try {
					validateCron(input.cron)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid cron expression'

					return { action: 'create', error: message }
				}

				await fs.ensureDir(path.dirname(task_file))
				await fs.writeFile(task_file, input.content, 'utf8')

				const now = new Date().toISOString()

				env.cron.store.tasks.push({
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
					path: task_file
				}
			}

			if (input.action === 'list') {
				const perm_error = await checkPermission(s, 'file', 'read', cron_path)

				if (perm_error) {
					return { action: 'list', tasks: [], count: 0, error: perm_error }
				}

				const tasks = await Promise.all(
					env.cron.store.tasks.map(async task => {
						const task_md_path = path.resolve(cron_dir, task.name, 'TASK.md')
						const has_task_md = await fs.pathExists(task_md_path)

						return {
							name: task.name,
							cron: task.cron,
							enabled: task.enabled,
							last_run_at: task.last_run_at,
							last_status: task.last_status,
							last_error: task.last_error,
							has_task_md,
							path: task_md_path
						}
					})
				)

				return { action: 'list', tasks, count: tasks.length }
			}

			if (input.action === 'read') {
				if (!input.name) {
					return { action: 'read', error: 'name is required for read action' }
				}

				let task_file = ''

				try {
					task_file = getTaskFile(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'read', error: message }
				}

				const perm_error = await checkPermission(s, 'file', 'read', task_file)

				if (perm_error) {
					return { action: 'read', name: input.name, content: '', error: perm_error }
				}

				const exists = await fs.pathExists(task_file)

				if (!exists) {
					return {
						action: 'read',
						name: input.name,
						content: '',
						error: `TASK.md not found for task "${input.name}"`
					}
				}

				const content = await readFile(task_file, 'utf8')

				return {
					action: 'read',
					name: input.name,
					path: task_file,
					content
				}
			}

			if (input.action === 'update') {
				if (!input.name) {
					return { action: 'update', error: 'name is required for update action' }
				}

				const task = env.cron.store.tasks.find(item => item.name === input.name)

				if (!task) {
					return { action: 'update', error: `Task "${input.name}" not found` }
				}

				let task_file = ''

				try {
					task_file = getTaskFile(input.name)
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Invalid name'

					return { action: 'update', error: message }
				}

				const write_perm_error = await checkPermission(s, 'file', 'write', task_file)

				if (write_perm_error) {
					return { action: 'update', error: write_perm_error }
				}

				const store_perm_error = await checkPermission(s, 'file', 'write', cron_path)

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

					task.cron = input.cron
				}

				if (input.content !== undefined) {
					await fs.ensureDir(path.dirname(task_file))
					await fs.writeFile(task_file, input.content, 'utf8')
				}

				if (input.enabled !== undefined) {
					task.enabled = input.enabled
				}

				task.updated_at = new Date().toISOString()

				await saveStore(env.cron.store)
				await reloadJob(env.cron, input.name)

				return {
					action: 'update',
					name: task.name,
					cron: task.cron,
					enabled: task.enabled,
					path: task_file
				}
			}

			return { error: 'Unknown action' }
		}
	})
}
