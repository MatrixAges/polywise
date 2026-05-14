import { link } from '@core/db/schema'
import { env } from '@core/env'
import getHash from '@core/utils/getHash'
import { desc, eq, inArray, or, SQL } from 'drizzle-orm'

import type { Link, LinkInsert } from '@core/db'

interface ArgsGetLinks {
	where?: SQL
	orderBy?: SQL | Array<SQL>
	limit?: number
	offset?: number
}

const normalizeLink = (row: Link | undefined) => {
	if (!row) {
		return row
	}

	const favicon = row.favicon

	if (!favicon) {
		return row
	}

	if (favicon instanceof Uint8Array && favicon.constructor === Uint8Array) {
		return row
	}

	if (favicon instanceof Uint8Array) {
		return { ...row, favicon: new Uint8Array(favicon) }
	}

	if (favicon instanceof ArrayBuffer) {
		return { ...row, favicon: new Uint8Array(favicon) }
	}

	return row
}

export const normalizeLinkUrl = (value: string) => {
	const target_url = new URL(value.trim())

	if (!['http:', 'https:'].includes(target_url.protocol)) {
		throw new Error(`Unsupported bookmark URL protocol: ${target_url.protocol}`)
	}

	target_url.hash = ''
	target_url.protocol = target_url.protocol.toLowerCase()
	target_url.hostname = target_url.hostname.toLowerCase()

	if (
		(target_url.protocol === 'http:' && target_url.port === '80') ||
		(target_url.protocol === 'https:' && target_url.port === '443')
	) {
		target_url.port = ''
	}

	if (target_url.pathname !== '/' && target_url.pathname.endsWith('/')) {
		target_url.pathname = target_url.pathname.replace(/\/+$/, '')
	}

	return target_url.toString()
}

export const getLinkHash = (url: string) => {
	return getHash(normalizeLinkUrl(url))
}

export const prepareLinkInsert = (values: LinkInsert) => {
	const normalized_url = normalizeLinkUrl(values.url)

	return {
		...values,
		url: normalized_url,
		title: values.title?.trim() || normalized_url,
		hash: values.hash ?? getLinkHash(normalized_url)
	} satisfies LinkInsert
}

export const getLinksByHashesOrUrls = async (args: { hashes?: Array<string>; urls?: Array<string> }) => {
	const hashes = Array.from(new Set((args.hashes ?? []).filter(Boolean)))
	const urls = Array.from(new Set((args.urls ?? []).filter(Boolean)))
	const where_list = [] as Array<SQL>

	if (hashes.length > 0) {
		where_list.push(inArray(link.hash, hashes))
	}

	if (urls.length > 0) {
		where_list.push(inArray(link.url, urls))
	}

	if (where_list.length === 0) {
		return [] as Array<Link>
	}

	return getLinks({
		where: where_list.length === 1 ? where_list[0] : or(...where_list)
	})
}

export const addLink = async (values: LinkInsert) => {
	const next_values = prepareLinkInsert(values)
	const existing_where = next_values.hash
		? (or(eq(link.hash, next_values.hash), eq(link.url, next_values.url)) ?? eq(link.url, next_values.url))
		: eq(link.url, next_values.url)
	const existing = (await getLink(existing_where)) ?? null

	if (existing) {
		return existing
	}

	const inserted = await env.db
		.insert(link)
		.values(next_values)
		.onConflictDoNothing()
		.returning()
		.then(res => normalizeLink(res[0]))

	if (inserted) {
		return inserted
	}

	return getLink(existing_where)
}

export const addLinks = async (values: Array<LinkInsert>) => {
	if (!values.length) {
		return [] as Array<Link>
	}

	const next_values = values.map(prepareLinkInsert)

	return env.db
		.insert(link)
		.values(next_values)
		.onConflictDoNothing()
		.returning()
		.then(res => res.map(item => normalizeLink(item) as Link))
}

export const getLink = async (where: SQL) => {
	return env.db
		.select()
		.from(link)
		.where(where)
		.limit(1)
		.then(res => normalizeLink(res[0]))
}

export const getLinks = async (args: ArgsGetLinks = {}) => {
	const { where, orderBy = [desc(link.updated_at), desc(link.created_at)], limit, offset } = args

	let query = env.db.select().from(link).$dynamic()

	if (where) query = query.where(where)

	if (orderBy) {
		const order_args = Array.isArray(orderBy) ? orderBy : [orderBy]

		query = query.orderBy(...order_args)
	}

	if (limit) query = query.limit(limit)
	if (offset) query = query.offset(offset)

	return query.then(res => res.map(item => normalizeLink(item) as Link))
}

export const setLink = async (where: SQL, values: Partial<LinkInsert>) => {
	return env.db
		.update(link)
		.set(values)
		.where(where)
		.returning()
		.then(res => normalizeLink(res[0]))
}

export const removeLink = async (where: SQL) => {
	return env.db
		.delete(link)
		.where(where)
		.returning()
		.then(res => normalizeLink(res[0]))
}
