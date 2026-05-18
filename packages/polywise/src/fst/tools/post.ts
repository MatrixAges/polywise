import { post_session, session as session_table } from '@core/db/schema'
import { setSession } from '@core/db/services'
import { getPostSessions } from '@core/db/services/externals'
import { saveArticle } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { boolean, enum as Enum, object, string } from 'zod'

import { getPostById, getPostSessionTitle, normalizePostForType } from '../../rpc/post/utils'

import type Session from '../session'

const findSelectionIndex = (args: {
	content: string
	selection_text: string
	before_context?: string
	after_context?: string
}) => {
	const { content, selection_text, before_context = '', after_context = '' } = args
	const matches = [] as Array<number>
	let cursor = 0

	while (cursor <= content.length) {
		const index = content.indexOf(selection_text, cursor)

		if (index === -1) {
			break
		}

		matches.push(index)
		cursor = index + Math.max(1, selection_text.length)
	}

	if (matches.length === 0) {
		return -1
	}

	if (!before_context && !after_context) {
		return matches.length === 1 ? matches[0] : -2
	}

	const filtered_matches = matches.filter(index => {
		const before_ok = before_context
			? content.slice(Math.max(0, index - before_context.length), index).endsWith(before_context)
			: true
		const after_ok = after_context
			? content
					.slice(
						index + selection_text.length,
						index + selection_text.length + after_context.length
					)
					.startsWith(after_context)
			: true

		return before_ok && after_ok
	})

	if (filtered_matches.length !== 1) {
		return -2
	}

	return filtered_matches[0]
}

export const createPostTool = (session: Session) =>
	tool({
		description: [
			'Operate on the current post linked to this session.',
			'Use get_post before editing when you need the latest content.',
			'Use replace_selection for targeted rewrites from the user-selected passage.',
			'Use update_post for broader title/content/for_type updates.'
		].join('\n'),
		inputSchema: object({
			action: Enum(['get_post', 'update_post', 'replace_selection']),
			title: string().optional(),
			content: string().optional(),
			for_type: string().optional(),
			selection_text: string().optional(),
			replacement: string().optional(),
			before_context: string().optional(),
			after_context: string().optional(),
			exec_pipeline: boolean().optional()
		}),
		execute: async input => {
			const linked_post = await getPostSessions({
				where: eq(post_session.session_id, session.id)
			}).then(res => res[0])

			if (!linked_post) {
				return {
					ok: false,
					error: 'post_tool is only available in post sessions'
				}
			}

			const current_post = await getPostById(linked_post.article.id)

			if (!current_post) {
				return {
					ok: false,
					error: `Post not found: ${linked_post.article.id}`
				}
			}

			switch (input.action) {
				case 'get_post':
					return {
						ok: true,
						post: current_post
					}
				case 'update_post': {
					const next_title = input.title ?? current_post.title ?? ''
					const next_content = input.content ?? current_post.content
					const next_for_type = normalizePostForType(input.for_type ?? current_post.for_type)

					await saveArticle({
						article_id: current_post.id,
						title: next_title,
						content: next_content,
						for: next_for_type,
						exec_pipeline: input.exec_pipeline
					})
					await setSession(eq(session_table.id, session.id), {
						title: getPostSessionTitle({
							title: next_title || null,
							for_type: next_for_type
						})
					})

					const updated_post = await getPostById(current_post.id)

					return {
						ok: true,
						post: updated_post
					}
				}
				case 'replace_selection': {
					const selection_text = input.selection_text?.trim()
					const replacement = input.replacement

					if (!selection_text) {
						return {
							ok: false,
							error: 'selection_text is required for replace_selection'
						}
					}

					if (typeof replacement !== 'string') {
						return {
							ok: false,
							error: 'replacement is required for replace_selection'
						}
					}

					const match_index = findSelectionIndex({
						content: current_post.content,
						selection_text,
						before_context: input.before_context,
						after_context: input.after_context
					})

					if (match_index === -1) {
						return {
							ok: false,
							error: 'Could not find the selected text in the current post'
						}
					}

					if (match_index === -2) {
						return {
							ok: false,
							error: 'The selected text is ambiguous. Use before_context and after_context to disambiguate.'
						}
					}

					const next_content = [
						current_post.content.slice(0, match_index),
						replacement,
						current_post.content.slice(match_index + selection_text.length)
					].join('')

					await saveArticle({
						article_id: current_post.id,
						title: current_post.title,
						content: next_content,
						for: current_post.for_type
					})

					const updated_post = await getPostById(current_post.id)

					return {
						ok: true,
						post: updated_post
					}
				}
			}
		}
	})
