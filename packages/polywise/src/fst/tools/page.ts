import { renderPageHelp } from '@core/cli/page/map'
import { buildRoutePath, page_map, page_map_by_id } from '@core/cli/page/registry'
import {
	enqueuePageRuntimeCommand,
	getPageRuntimeSnapshot,
	getPageRuntimeStatus,
	waitForPageRuntimeAck
} from '@core/cli/page/runtime'
import { tool } from 'ai'
import { array, object, record, string, enum as zod_enum } from 'zod'

const inputSchema = object({
	action: zod_enum(['help', 'list', 'current', 'inspect', 'navigate', 'back']).default('help'),
	path: array(string()).optional().describe('Optional help path segments like ["route"] or ["panel"].'),
	target: string().optional().describe('Page target id like "session", "post.detail", or "panel.notification".'),
	params: record(string(), string()).optional().describe('Optional route params for dynamic targets.')
})

export const createPageTool = () =>
	tool({
		description: [
			'Inspect global app pages and the current panel session through a progressive page index.',
			'Use action "help" first, then "current" or "inspect".',
			'Use action "navigate" only with a concrete route or panel target.'
		].join('\n'),
		inputSchema,
		execute: async input => {
			if (input.action === 'help') {
				return renderPageHelp(input.path || [])
			}

			if (input.action === 'list') {
				return {
					count: page_map.length,
					items: page_map.map(item => ({
						id: item.id,
						kind: item.kind,
						summary: item.summary,
						route_path: item.route_path || null,
						panel_tab: item.panel_tab || null
					}))
				}
			}

			if (input.action === 'current') {
				return getPageRuntimeStatus()
			}

			if (input.action === 'inspect') {
				const snapshot = getPageRuntimeSnapshot()

				if (!snapshot) {
					return {
						error: 'No page runtime snapshot has been reported by the app bridge yet.'
					}
				}

				if (!input.target) {
					return snapshot
				}

				const target = page_map_by_id.get(input.target)

				return {
					target: target || null,
					snapshot,
					matches_current_page: snapshot.page_id === input.target,
					section:
						snapshot.visible_sections.find(section => section.id === input.target) ||
						snapshot.visible_sections.find(section => section.title === input.target) ||
						null
				}
			}

			if (input.action === 'back') {
				const command = enqueuePageRuntimeCommand({ type: 'back' })

				await waitForPageRuntimeAck(command.seq)

				return {
					queued: true,
					command
				}
			}

			if (!input.target) {
				throw new Error('target is required for navigate action')
			}

			const target = page_map_by_id.get(input.target)

			if (!target) {
				throw new Error(`Page target not found: ${input.target}`)
			}

			const command =
				target.kind === 'panel'
					? enqueuePageRuntimeCommand({ type: 'panel', target: target.panel_tab! })
					: (() => {
							const route_target =
								buildRoutePath(target.id, input.params) || target.route_path!

							if (/:([A-Za-z0-9_]+)/.test(route_target)) {
								throw new Error(`Missing required route params for ${target.id}`)
							}

							return enqueuePageRuntimeCommand({
								type: 'navigate',
								target: route_target,
								params: input.params
							})
						})()

			await waitForPageRuntimeAck(command.seq)

			return {
				queued: true,
				command,
				current: getPageRuntimeStatus()
			}
		}
	})
