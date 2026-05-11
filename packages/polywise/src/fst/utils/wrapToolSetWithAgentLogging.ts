import { appendAgentToolLog } from '@core/rpc/agent/logs'

import getErrorPayload from './getErrorPayload'
import isAsyncIterable from './isAsyncIterable'

import type { ToolSet } from 'ai'
import type Index from '../session'

export default (s: Index, toolset: ToolSet) => {
	if (!s.owner_agent) {
		return toolset
	}

	return Object.fromEntries(
		Object.entries(toolset).map(([tool_name, target]) => {
			if (!target || typeof target !== 'object' || typeof target.execute !== 'function') {
				return [tool_name, target]
			}

			const execute = target.execute
			const wrapped_execute = async (input: unknown, options: unknown) => {
				try {
					const result = await execute(input, options as never)

					if (isAsyncIterable(result)) {
						return (async function* () {
							const chunks = [] as Array<unknown>

							try {
								for await (const chunk of result) {
									chunks.push(chunk)
									yield chunk
								}

								await appendAgentToolLog({
									agent_id: s.owner_agent?.id,
									input,
									output: {
										stream: true,
										chunk_count: chunks.length,
										chunks
									},
									session_id: s.id,
									status: 'success',
									tool_name
								})
							} catch (error) {
								await appendAgentToolLog({
									agent_id: s.owner_agent?.id,
									input,
									output: getErrorPayload(error),
									session_id: s.id,
									status: 'error',
									tool_name
								})
								throw error
							}
						})()
					}

					await appendAgentToolLog({
						agent_id: s.owner_agent?.id,
						input,
						output: result,
						session_id: s.id,
						status: 'success',
						tool_name
					})

					return result
				} catch (error) {
					await appendAgentToolLog({
						agent_id: s.owner_agent?.id,
						input,
						output: getErrorPayload(error),
						session_id: s.id,
						status: 'error',
						tool_name
					})
					throw error
				}
			}

			return [
				tool_name,
				new Proxy(target, {
					get(current_target, prop, receiver) {
						if (prop === 'execute') {
							return wrapped_execute
						}

						try {
							return Reflect.get(current_target, prop, receiver)
						} catch {
							return (current_target as Record<PropertyKey, unknown>)[prop]
						}
					}
				})
			]
		})
	) as ToolSet
}
