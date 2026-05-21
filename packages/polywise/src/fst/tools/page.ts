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
				const routes = page_map
					.filter(item => item.kind === 'route')
					.sort((a, b) => a.id.localeCompare(b.id))
				const panels = page_map
					.filter(item => item.kind === 'panel')
					.sort((a, b) => a.id.localeCompare(b.id))

				return {
					count: page_map.length,
					routes: routes.map(item => ({
						id: item.id,
						summary: item.summary,
						route_path: item.route_path || null
					})),
					panels: panels.map(item => ({
						id: item.id,
						summary: item.summary,
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

				const target =
					page_map_by_id.get(input.target) ||
					Array.from(page_map_by_id.values()).find(
						item => item.kind === 'panel' && item.panel_tab === input.target
					)
				const resolved_target_id = target?.id || input.target

				return {
					target: target || null,
					current_route_page: snapshot.route_page_id,
					current_panel_page: snapshot.panel.page_id,
					current_snapshot: snapshot,
					matches_current_page:
						snapshot.route_page_id === resolved_target_id ||
						snapshot.panel.page_id === resolved_target_id,
					section:
						snapshot.visible_sections.find(section => section.id === input.target) ||
						snapshot.visible_sections.find(section => section.title === input.target) ||
						null
				}
			}

			if (input.action === 'back') {
				const command = enqueuePageRuntimeCommand({ type: 'back' })
				const acked = await waitForPageRuntimeAck(command.seq)

				return {
					queued: true,
					acked,
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
					? enqueuePageRuntimeCommand({
							type: 'panel',
							target: target.panel_tab!,
							expected_panel_page_id: target.id
						})
					: (() => {
							const route_target =
								buildRoutePath(target.id, input.params) || target.route_path!

							if (/:([A-Za-z0-9_]+)/.test(route_target)) {
								throw new Error(`Missing required route params for ${target.id}`)
							}

							return enqueuePageRuntimeCommand({
								type: 'navigate',
								target: route_target,
								params: input.params,
								expected_route_pathname: route_target,
								expected_route_page_id: target.id
							})
						})()

			const acked = await waitForPageRuntimeAck(command.seq)

			return {
				queued: true,
				acked,
				command,
				current: getPageRuntimeStatus()
			}
		}
	})
