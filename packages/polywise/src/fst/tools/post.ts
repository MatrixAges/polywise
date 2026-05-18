import { post_session, session as session_table } from '@core/db/schema'
import { setSession } from '@core/db/services'
import { getPostSessions } from '@core/db/services/externals'
import { saveArticle } from '@core/io'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import { boolean, enum as Enum, number, object, string } from 'zod'

import {
	getPostById,
	getPostSessionTitle,
	normalizePostForType,
	searchPostRelatedArticleSources
} from '../../rpc/post/utils'

import type Session from '../session'

type OutlineItem = {
	level: number
	text: string
}

type OutlineSection = OutlineItem & {
	body: string
	key: string
}

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

const normalizeHeadingText = (value: string) => value.replace(/\s+/g, ' ').trim()

const parseOutlineLines = (content: string) => {
	const lines = content.split('\n')
	const preamble_lines = [] as Array<string>
	const sections = [] as Array<OutlineSection>
	const heading_count = new Map<string, number>()
	let current_section:
		| (OutlineItem & {
				body_lines: Array<string>
				key: string
		  })
		| null = null

	for (const line of lines) {
		const heading_match = /^(#{1,6})\s+(.+)$/.exec(line.trim())

		if (heading_match) {
			if (current_section) {
				sections.push({
					level: current_section.level,
					text: current_section.text,
					body: current_section.body_lines.join('\n').trimEnd(),
					key: current_section.key
				})
			}

			const text = heading_match[2].trim()
			const normalized_text = normalizeHeadingText(text).toLowerCase()
			const next_count = (heading_count.get(normalized_text) ?? 0) + 1

			heading_count.set(normalized_text, next_count)
			current_section = {
				level: heading_match[1].length,
				text,
				body_lines: [],
				key: `${normalized_text}::${next_count}`
			}

			continue
		}

		if (current_section) {
			current_section.body_lines.push(line)
		} else {
			preamble_lines.push(line)
		}
	}

	if (current_section) {
		sections.push({
			level: current_section.level,
			text: current_section.text,
			body: current_section.body_lines.join('\n').trimEnd(),
			key: current_section.key
		})
	}

	return {
		preamble: preamble_lines.join('\n').trimEnd(),
		sections
	}
}

const buildOutlineMarkdown = (sections: Array<OutlineItem>) =>
	sections.map(item => `${'#'.repeat(item.level)} ${item.text}`).join('\n')

const parseRequestedOutline = (outline_markdown?: string) => {
	if (!outline_markdown?.trim()) {
		return {
			ok: false as const,
			error: 'outline_markdown is required for update_outline'
		}
	}

	const items = outline_markdown
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const match = /^(#{1,6})\s+(.+)$/.exec(line)

			if (!match) {
				return null
			}

			return {
				level: match[1].length,
				text: match[2].trim()
			}
		})

	if (items.some(item => !item)) {
		return {
			ok: false as const,
			error: 'outline_markdown must contain markdown headings only'
		}
	}

	if (items.length === 0) {
		return {
			ok: false as const,
			error: 'outline_markdown must contain at least one heading'
		}
	}

	return {
		ok: true as const,
		items: items as Array<OutlineItem>
	}
}

const rebuildContentFromOutline = (current_content: string, next_outline: Array<OutlineItem>) => {
	const parsed_current = parseOutlineLines(current_content)
	const exact_section_map = new Map(parsed_current.sections.map(section => [section.key, section]))
	const fallback_section_map = new Map<string, Array<OutlineSection>>()
	const next_title_count = new Map<string, number>()
	const used_keys = new Set<string>()

	for (const section of parsed_current.sections) {
		const title_key = normalizeHeadingText(section.text).toLowerCase()
		const queue = fallback_section_map.get(title_key) ?? []

		queue.push(section)
		fallback_section_map.set(title_key, queue)
	}

	const blocks = [] as Array<string>

	if (parsed_current.preamble.trim()) {
		blocks.push(parsed_current.preamble)
	}

	for (const item of next_outline) {
		const normalized_text = normalizeHeadingText(item.text).toLowerCase()
		const next_count = (next_title_count.get(normalized_text) ?? 0) + 1
		const exact_key = `${normalized_text}::${next_count}`
		const exact_match = exact_section_map.get(exact_key)
		let matched_section = exact_match && !used_keys.has(exact_key) ? exact_match : null

		if (!matched_section) {
			const fallback_queue = fallback_section_map.get(normalized_text) ?? []

			matched_section = fallback_queue.find(section => !used_keys.has(section.key)) ?? null
		}

		next_title_count.set(normalized_text, next_count)

		if (matched_section) {
			used_keys.add(matched_section.key)
		}

		const body = matched_section?.body?.trimEnd()

		blocks.push([`${'#'.repeat(item.level)} ${item.text}`, body].filter(Boolean).join('\n'))
	}

	return blocks.join('\n\n').trim()
}

export const createPostTool = (session: Session) =>
	tool({
		description: [
			'Operate on the current post linked to this session.',
			'Use get_post before editing when you need the latest content.',
			'Use search_related_articles first when drafting, revising, or fact-checking against the post-linked related articles.',
			'Use get_outline and update_outline when you need to inspect or change the markdown heading structure.',
			'Use replace_selection for targeted rewrites from the user-selected passage.',
			'Use update_post for broader title/content/for_type updates.'
		].join('\n'),
		inputSchema: object({
			action: Enum([
				'get_post',
				'search_related_articles',
				'get_outline',
				'update_outline',
				'update_post',
				'replace_selection'
			]),
			title: string().optional(),
			content: string().optional(),
			for_type: string().optional(),
			query: string().optional(),
			max_results: number().int().min(1).max(8).optional(),
			outline_markdown: string().optional(),
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
				case 'search_related_articles': {
					if (!input.query?.trim()) {
						return {
							ok: false,
							error: 'query is required for search_related_articles'
						}
					}

					const search_result = await searchPostRelatedArticleSources({
						post_id: current_post.id,
						query: input.query,
						max_results: input.max_results
					})

					return {
						ok: true,
						query: search_result.query,
						related_article_count: search_result.related_article_count,
						results: search_result.results
					}
				}
				case 'get_outline': {
					const outline = parseOutlineLines(current_post.content)

					return {
						ok: true,
						outline: outline.sections.map(section => ({
							level: section.level,
							text: section.text
						})),
						outline_markdown: buildOutlineMarkdown(outline.sections),
						has_preamble: Boolean(outline.preamble.trim())
					}
				}
				case 'update_outline': {
					const parsed_outline = parseRequestedOutline(input.outline_markdown)

					if (!parsed_outline.ok) {
						return {
							ok: false,
							error: parsed_outline.error
						}
					}

					const next_content = rebuildContentFromOutline(current_post.content, parsed_outline.items)

					await saveArticle({
						article_id: current_post.id,
						title: current_post.title,
						content: next_content,
						for: current_post.for_type,
						exec_pipeline: input.exec_pipeline
					})

					const updated_post = await getPostById(current_post.id)

					return {
						ok: true,
						post: updated_post,
						outline: parsed_outline.items,
						outline_markdown: buildOutlineMarkdown(parsed_outline.items)
					}
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
