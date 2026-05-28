import { post_session } from '@core/db/schema'
import { getPostSessions } from '@core/db/services/externals'
import { eq } from 'drizzle-orm'

import {
	createContentTool,
	createContextTool,
	createMessageTool,
	createPostTool,
	createQuestionTool,
	createWebFetchTool,
	createWebSearchTool
} from '../../../tools'

import type Session from '../../../session'
import type { ToolState } from '../../../session/core/types'

export default async (s: Session, state: ToolState) => {
	const linkedPost = await getPostSessions({
		where: eq(post_session.session_id, s.id)
	}).then(res => res[0])

	if (!linkedPost) {
		return state
	}

	state.linkedPost = linkedPost
	state.runtime = {
		tools: {
			context_tool: createContextTool(s),
			message_tool: createMessageTool(s),
			question_tool: createQuestionTool(s.id),
			content_tool: createContentTool(s),
			web_search_tool: createWebSearchTool(),
			web_fetch_tool: createWebFetchTool(),
			post_tool: createPostTool(s)
		},
		has_system_tool: false,
		system_tools_prompt: '',
		custom_tools_prompt: '',
		skill_prompt: ''
	}
	state.hasTitleTool = false

	return state
}
