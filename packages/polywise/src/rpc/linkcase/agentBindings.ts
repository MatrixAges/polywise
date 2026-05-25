import { agent, agent_article, article, link_article } from '@core/db/schema'
import {
	assertAgentsWritableForKnowledge,
	assertAgentWritableForKnowledge,
	getAgent,
	getArticle
} from '@core/db/services'
import { addLinkArticle, getLinkArticles, removeLinkArticle } from '@core/db/services/externals'
import { env } from '@core/env'
import removeArticle from '@core/io/remove'
import { and, eq } from 'drizzle-orm'

import { cleanupPrivateAgentArticle, savePrivateAgentArticle } from '../agent/privateArticle'

const ensureAgentIdsExist = async (agent_ids: Array<string>) => {
	if (agent_ids.length === 0) {
		return
	}

	const existing_rows = await Promise.all(agent_ids.map(agent_id => getAgent(eq(agent.id, agent_id))))
	const invalid_agent_id = existing_rows.findIndex(item => !item)

	if (invalid_agent_id !== -1) {
		throw new Error(`Agent not found: ${agent_ids[invalid_agent_id]}`)
	}
}

const getCurrentLinkArticleRow = async (link_id: string) => {
	const rows = await getLinkArticles({
		where: eq(link_article.link_id, link_id),
		limit: 1
	})

	return rows[0] ?? null
}

const cleanupOrphanArticle = async (article_id: string) => {
	const target_article = await getArticle(eq(article.id, article_id))

	if (!target_article) {
		return
	}

	const [link_ref, agent_ref] = await Promise.all([
		env.db
			.select({ article_id: link_article.article_id })
			.from(link_article)
			.where(eq(link_article.article_id, article_id))
			.limit(1),
		env.db
			.select({ article_id: agent_article.article_id })
			.from(agent_article)
			.where(eq(agent_article.article_id, article_id))
			.limit(1)
	])

	if (link_ref.length > 0 || agent_ref.length > 0) {
		return
	}

	if (target_article.scope_type === 'agent' && target_article.scope_id) {
		await cleanupPrivateAgentArticle({
			agent_id: target_article.scope_id,
			article_id
		})
	}

	await removeArticle(article_id)
}

export const getLinkcaseAgentBindings = async (link_id: string) => {
	const current_row = await getCurrentLinkArticleRow(link_id)

	if (!current_row) {
		return {
			article_id: '',
			assigned_agent_id: '',
			related_agent_ids: []
		}
	}

	const current_article = current_row.article
	const related_rows =
		current_article.scope_type === 'global'
			? await env.db
					.select({ agent_id: agent_article.agent_id })
					.from(agent_article)
					.where(eq(agent_article.article_id, current_article.id))
			: []

	return {
		article_id: current_article.id,
		assigned_agent_id:
			current_article.scope_type === 'agent' && current_article.scope_id ? current_article.scope_id : '',
		related_agent_ids: related_rows.map(item => item.agent_id)
	}
}

export const updateLinkcaseAgentBindings = async (args: {
	link_id: string
	assigned_agent_id?: string
	related_agent_ids: Array<string>
}) => {
	const current_row = await getCurrentLinkArticleRow(args.link_id)

	if (!current_row) {
		throw new Error(`Linkcase article not found: ${args.link_id}`)
	}

	const current_article = current_row.article
	const assigned_agent_id = args.assigned_agent_id?.trim() || ''
	const related_agent_ids = Array.from(new Set(args.related_agent_ids.map(item => item.trim()).filter(Boolean)))

	if (current_article.scope_type === 'agent' && !assigned_agent_id) {
		throw new Error('Assigned linkcase article requires an agent.')
	}

	await ensureAgentIdsExist([...(assigned_agent_id ? [assigned_agent_id] : []), ...related_agent_ids])
	await assertAgentsWritableForKnowledge([...(assigned_agent_id ? [assigned_agent_id] : []), ...related_agent_ids])

	if (current_article.scope_type === 'agent' && current_article.scope_id) {
		await assertAgentWritableForKnowledge(current_article.scope_id)
	}

	if (assigned_agent_id) {
		if (current_article.scope_type === 'global') {
			await env.db.delete(agent_article).where(eq(agent_article.article_id, current_article.id))
		}

		if (current_article.scope_type === 'agent' && current_article.scope_id === assigned_agent_id) {
			return {
				article_id: current_article.id,
				assigned_agent_id,
				related_agent_ids: []
			}
		}

		const private_article = await savePrivateAgentArticle({
			agent_id: assigned_agent_id,
			for_type: 'linkcase',
			title: current_article.title,
			content: current_article.content
		})
		const current_link_article_where = and(
			eq(link_article.link_id, args.link_id),
			eq(link_article.article_id, current_article.id)
		)!

		await addLinkArticle(args.link_id, private_article.id)
		await removeLinkArticle(current_link_article_where)
		await cleanupOrphanArticle(current_article.id)

		return {
			article_id: private_article.id,
			assigned_agent_id,
			related_agent_ids: []
		}
	}

	await env.db.delete(agent_article).where(eq(agent_article.article_id, current_article.id))

	for (const agent_id of related_agent_ids) {
		await env.db
			.insert(agent_article)
			.values({ agent_id, article_id: current_article.id })
			.onConflictDoNothing()
	}

	return {
		article_id: current_article.id,
		assigned_agent_id: '',
		related_agent_ids
	}
}
