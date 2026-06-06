import { article } from '@core/db/schema'
import { getArticles } from '@core/db/services'
import { fullTextSearch, saveArticle } from '@core/io'
import { savePrivateAgentArticle } from '@core/rpc/agent/privateArticle'
import { and, desc, eq, inArray } from 'drizzle-orm'

import type { Article } from '@core/db/types'
import type { PthinkGeneratedArticle } from './types'

interface ScopeArgs {
	scope_type: 'global' | 'agent'
	scope_id: string | null
}

interface CandidateScore {
	article: Article
	score: number
}

interface SavedReviewArticle {
	action: 'create' | 'update'
	article_id: string
	target_match: CandidateScore | null
	global_match: CandidateScore | null
}

const duplicate_threshold = 0.84
const global_reference_threshold = 0.9

const normalizeText = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()

const tokenize = (value: string) => {
	const normalized_value = normalizeText(value)

	if (!normalized_value) {
		return [] as Array<string>
	}

	return Array.from(
		new Set(
			normalized_value
				.split(' ')
				.map(item => item.trim())
				.filter(item => item.length >= 2)
		)
	).slice(0, 180)
}

const getTokenOverlapScore = (left_tokens: Array<string>, right_tokens: Array<string>) => {
	if (left_tokens.length === 0 || right_tokens.length === 0) {
		return 0
	}

	const left_set = new Set(left_tokens)
	const right_set = new Set(right_tokens)
	let overlap_count = 0

	for (const token of left_set) {
		if (right_set.has(token)) {
			overlap_count += 1
		}
	}

	return overlap_count / Math.max(1, Math.min(left_set.size, right_set.size))
}

const getContainmentScore = (left_text: string, right_text: string) => {
	if (!left_text || !right_text) {
		return 0
	}

	if (left_text.includes(right_text) || right_text.includes(left_text)) {
		return 1
	}

	return 0
}

const getCandidateScore = (args: { draft_article: PthinkGeneratedArticle; candidate: Article }) => {
	const draft_title = args.draft_article.title || ''
	const draft_content = args.draft_article.content.slice(0, 1800)
	const candidate_title = args.candidate.title || ''
	const candidate_content = args.candidate.content.slice(0, 1800)
	const title_score = getTokenOverlapScore(tokenize(draft_title), tokenize(candidate_title))
	const content_score = getTokenOverlapScore(tokenize(draft_content), tokenize(candidate_content))
	const containment_score = getContainmentScore(normalizeText(draft_content), normalizeText(candidate_content))
	const blended_score = title_score * 0.45 + content_score * 0.55

	if (title_score === 1 && content_score >= 0.55) {
		return Math.max(0.9, blended_score, containment_score)
	}

	return Math.max(blended_score, containment_score)
}

const getSearchQuery = (draft_article: PthinkGeneratedArticle) => {
	return [draft_article.title.trim(), draft_article.content.slice(0, 600).trim()].filter(Boolean).join('\n')
}

const readScopedSearchCandidates = async (args: {
	draft_article: PthinkGeneratedArticle
	scope_type: 'global' | 'agent'
	scope_id: string | null
}) => {
	const query = getSearchQuery(args.draft_article)

	if (!query) {
		return [] as Array<Article>
	}

	const search_result = await fullTextSearch({
		query,
		intent: 'pthink article duplicate detection',
		type: 'article',
		scope_type: args.scope_type,
		scope_id: args.scope_id ?? undefined
	})

	if (search_result.type !== 'article' || search_result.results.length === 0) {
		return [] as Array<Article>
	}

	const candidate_ids = Array.from(new Set(search_result.results.map(item => item.id)))

	return getArticles({
		where: inArray(article.id, candidate_ids),
		limit: candidate_ids.length
	})
}

const readRecentScopeCandidates = async (args: {
	draft_article: PthinkGeneratedArticle
	scope_type: 'global' | 'agent'
	scope_id: string | null
}) => {
	const scope_where =
		args.scope_type === 'agent' && args.scope_id
			? and(eq(article.scope_type, 'agent'), eq(article.scope_id, args.scope_id))
			: eq(article.scope_type, 'global')

	return getArticles({
		where: and(scope_where, eq(article.for, args.draft_article.for_type)),
		orderBy: desc(article.updated_at),
		limit: 12
	})
}

const mergeCandidates = (candidate_groups: Array<Array<Article>>) => {
	const candidate_map = new Map<string, Article>()

	for (const candidate_group of candidate_groups) {
		for (const candidate_item of candidate_group) {
			candidate_map.set(candidate_item.id, candidate_item)
		}
	}

	return Array.from(candidate_map.values())
}

const getBestCandidate = (args: {
	draft_article: PthinkGeneratedArticle
	candidates: Array<Article>
	scope_type?: 'global' | 'agent'
	scope_id?: string | null
}) => {
	const scored_candidates = args.candidates
		.filter(candidate_item => candidate_item.for === args.draft_article.for_type)
		.filter(candidate_item =>
			args.scope_type
				? candidate_item.scope_type === args.scope_type &&
					candidate_item.scope_id === (args.scope_id ?? null)
				: true
		)
		.map(candidate_item => ({
			article: candidate_item,
			score: getCandidateScore({
				draft_article: args.draft_article,
				candidate: candidate_item
			})
		}))
		.sort((left, right) => right.score - left.score)

	return scored_candidates[0] ?? null
}

const readDuplicateMatches = async (args: {
	draft_article: PthinkGeneratedArticle
	scope_type: 'global' | 'agent'
	scope_id: string | null
}) => {
	const [search_candidates, recent_target_candidates, recent_global_candidates] = await Promise.all([
		readScopedSearchCandidates(args),
		readRecentScopeCandidates(args),
		args.scope_type === 'agent'
			? readRecentScopeCandidates({
					...args,
					scope_type: 'global',
					scope_id: null
				})
			: Promise.resolve([] as Array<Article>)
	])
	const candidates = mergeCandidates([search_candidates, recent_target_candidates, recent_global_candidates])
	const target_match = getBestCandidate({
		draft_article: args.draft_article,
		candidates,
		scope_type: args.scope_type,
		scope_id: args.scope_id
	})
	const global_match =
		args.scope_type === 'agent'
			? getBestCandidate({
					draft_article: args.draft_article,
					candidates,
					scope_type: 'global',
					scope_id: null
				})
			: target_match

	return {
		target_match,
		global_match
	}
}

const saveGlobalReviewArticle = async (args: {
	draft_article: PthinkGeneratedArticle
	target_match: CandidateScore | null
}) => {
	const article_id = await saveArticle({
		article_id:
			args.target_match?.score && args.target_match.score >= duplicate_threshold
				? args.target_match.article.id
				: undefined,
		title: args.draft_article.title,
		content: args.draft_article.content,
		for: args.draft_article.for_type,
		source: 'pthink',
		scope_type: 'global',
		scope_id: null,
		exec_pipeline: true
	})

	return {
		action: args.target_match?.score && args.target_match.score >= duplicate_threshold ? 'update' : 'create',
		article_id
	} as const
}

const saveAgentReviewArticle = async (args: {
	draft_article: PthinkGeneratedArticle
	scope_id: string
	target_match: CandidateScore | null
}) => {
	const saved_article = await savePrivateAgentArticle({
		agent_id: args.scope_id,
		article_id:
			args.target_match?.score && args.target_match.score >= duplicate_threshold
				? args.target_match.article.id
				: undefined,
		for_type: args.draft_article.for_type,
		title: args.draft_article.title,
		content: args.draft_article.content
	})

	return {
		action: args.target_match?.score && args.target_match.score >= duplicate_threshold ? 'update' : 'create',
		article_id: saved_article.id
	} as const
}

const saveReviewArticle = async (args: {
	draft_article: PthinkGeneratedArticle
	scope: ScopeArgs
}): Promise<SavedReviewArticle> => {
	const duplicate_matches = await readDuplicateMatches({
		draft_article: args.draft_article,
		scope_type: args.scope.scope_type,
		scope_id: args.scope.scope_id
	})

	if (args.scope.scope_type === 'agent' && args.scope.scope_id) {
		const saved_article = await saveAgentReviewArticle({
			draft_article: args.draft_article,
			scope_id: args.scope.scope_id,
			target_match: duplicate_matches.target_match
		})

		return {
			...saved_article,
			target_match: duplicate_matches.target_match,
			global_match:
				duplicate_matches.global_match?.score &&
				duplicate_matches.global_match.score >= global_reference_threshold
					? duplicate_matches.global_match
					: null
		}
	}

	const saved_article = await saveGlobalReviewArticle({
		draft_article: args.draft_article,
		target_match: duplicate_matches.target_match
	})

	return {
		...saved_article,
		target_match: duplicate_matches.target_match,
		global_match: duplicate_matches.global_match
	}
}

export default saveReviewArticle
