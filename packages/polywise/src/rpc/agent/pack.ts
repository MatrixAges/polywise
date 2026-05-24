import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { config } from '@core/config'
import { app } from '@core/consts'
import {
	getAgentRowid,
	getChunkRowid,
	getEdgeRowid,
	getNodeRowid,
	insertAgentVector,
	insertChunkFts,
	insertChunkVector,
	insertEdgeVector,
	insertNodeVector
} from '@core/db/prepare'
import {
	agent,
	agent_article,
	agent_document,
	agent_skill,
	article,
	chunk,
	document,
	edge,
	edge_article,
	link,
	link_article,
	node,
	node_chunk,
	skill
} from '@core/db/schema'
import { getAgent, getAgents } from '@core/db/services'
import { env } from '@core/env'
import { and, eq, inArray } from 'drizzle-orm'
import fs from 'fs-extra'
import { getId } from 'stk/utils'

import type { Agent, Article, Chunk, Document, Edge, Link, Node, Skill } from '@core/db'

const pack_version = 1
export const agent_pack_extension = 'papk'
const require = createRequire(import.meta.url)
type ArchiveLike = {
	on(event: 'error', listener: (error: Error) => void): ArchiveLike
	pipe(destination: NodeJS.WritableStream): NodeJS.WritableStream
	directory(source: string, destination: string | false): void
	finalize(): void | Promise<void>
}

const { ZipArchive } = require('archiver') as {
	ZipArchive: new (options: { zlib: { level: number } }) => ArchiveLike
}
const unzipper = require('unzipper') as typeof import('unzipper')

type VectorRecord = {
	entity_type: 'agent' | 'chunk' | 'node' | 'edge'
	source_id: string
	source_rowid: number
	vector: string
}

type AgentPackSnapshot = {
	agent: Agent
	skills: Array<Skill>
	agent_skill_rows: Array<{ agent_id: string; skill_id: string; created_at: Date | null }>
	related_articles: Array<{ agent_id: string; article_id: string; created_at: Date | null }>
	documents: Array<Document>
	agent_document_rows: Array<{ agent_id: string; document_id: string; created_at: Date | null }>
	articles: Array<Article>
	chunks: Array<Chunk>
	nodes: Array<Node>
	edges: Array<Edge>
	node_chunk_rows: Array<{ node_id: string; chunk_id: string; created_at: Date | null }>
	edge_article_rows: Array<{ edge_id: string; article_id: string; created_at: Date | null }>
	links: Array<Link>
	link_article_rows: Array<{ link_id: string; article_id: string; created_at: Date | null }>
	vectors: {
		agent: Array<VectorRecord>
		chunk: Array<VectorRecord>
		node: Array<VectorRecord>
		edge: Array<VectorRecord>
	}
}

type AgentPackManifest = {
	pack_version: number
	exported_at: string
	source_app_version: string
	agent_name: string
	mode: 'snapshot'
	has_vectors: boolean
	has_graph: boolean
	counts: Record<string, number>
}

const toBase64 = (value: Uint8Array | Buffer | ArrayBuffer | null | undefined) => {
	if (!value) {
		return ''
	}

	if (value instanceof ArrayBuffer) {
		return Buffer.from(value).toString('base64')
	}

	return Buffer.from(value).toString('base64')
}

const fromBase64 = (value: string) => new Uint8Array(Buffer.from(value, 'base64'))

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const serializeValue = (value: unknown): unknown => {
	if (value === null || value === undefined) {
		return value ?? null
	}

	if (value instanceof Date) {
		return { $type: 'date', value: value.getTime() }
	}

	if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
		return { $type: 'bytes', value: toBase64(value) }
	}

	if (value instanceof ArrayBuffer) {
		return { $type: 'bytes', value: toBase64(value) }
	}

	if (Array.isArray(value)) {
		return value.map(item => serializeValue(item))
	}

	if (isPlainObject(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]))
	}

	return value
}

const deserializeValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(item => deserializeValue(item))
	}

	if (isPlainObject(value)) {
		if (value.$type === 'date' && typeof value.value === 'number') {
			return new Date(value.value)
		}

		if (value.$type === 'bytes' && typeof value.value === 'string') {
			return fromBase64(value.value)
		}

		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deserializeValue(item)]))
	}

	return value
}

const writeJsonFile = async (file_path: string, value: unknown) => {
	await fs.ensureDir(path.dirname(file_path))
	await fs.writeJson(file_path, serializeValue(value), { spaces: 2 })
}

const readJsonFile = async <T>(file_path: string) => {
	const raw = await fs.readJson(file_path)

	return deserializeValue(raw) as T
}

const writeVectorFile = async (file_path: string, values: Array<VectorRecord>) => {
	await fs.ensureDir(path.dirname(file_path))
	const content = values.map(item => JSON.stringify(item)).join('\n')

	await fs.writeFile(file_path, content ? `${content}\n` : '', 'utf8')
}

const readVectorFile = async (file_path: string) => {
	if (!(await fs.pathExists(file_path))) {
		return [] as Array<VectorRecord>
	}

	const content = await fs.readFile(file_path, 'utf8')

	return content
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => JSON.parse(line) as VectorRecord)
}

const sortByUpdated = <T extends { updated_at?: Date | null; created_at?: Date | null }>(rows: Array<T>) =>
	[...rows].sort((a, b) => {
		const a_updated = a.updated_at?.getTime() ?? 0
		const b_updated = b.updated_at?.getTime() ?? 0

		if (a_updated !== b_updated) {
			return b_updated - a_updated
		}

		const a_created = a.created_at?.getTime() ?? 0
		const b_created = b.created_at?.getTime() ?? 0

		return a_created - b_created
	})

const unique = <T>(values: Array<T>) => Array.from(new Set(values))

const getDefaultAgentExportDir = () => path.resolve(os.homedir(), 'Downloads')

const getConfiguredExportDir = () => {
	const configured = config.agent_export_dir?.trim()

	return configured ? path.resolve(configured) : getDefaultAgentExportDir()
}

const getSafeFileStem = (value: string) => {
	const normalized = value
		.trim()
		.replace(/[\\/:*?"<>|]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()

	return normalized || 'agent'
}

const getExportFilePath = async (agent_name: string) => {
	const export_dir = getConfiguredExportDir()
	const stem = getSafeFileStem(agent_name)
	const base_path = path.resolve(export_dir, `${stem}.${agent_pack_extension}`)

	if (!(await fs.pathExists(base_path))) {
		return { export_dir, file_path: base_path, file_name: path.basename(base_path) }
	}

	let duplicate_index = 2
	let next_path = path.resolve(export_dir, `${stem} (${duplicate_index}).${agent_pack_extension}`)

	while (await fs.pathExists(next_path)) {
		duplicate_index += 1
		next_path = path.resolve(export_dir, `${stem} (${duplicate_index}).${agent_pack_extension}`)
	}

	return { export_dir, file_path: next_path, file_name: path.basename(next_path) }
}

const collectVectorRecords = (args: {
	entity_type: VectorRecord['entity_type']
	table_name: 'agent' | 'chunk' | 'node' | 'edge'
	vec_table_name: 'agent_vec' | 'chunk_vec' | 'node_vec' | 'edge_vec'
	ids: Array<string>
}) => {
	const { entity_type, table_name, vec_table_name, ids } = args

	if (!ids.length) {
		return [] as Array<VectorRecord>
	}

	const placeholders = ids.map(() => '?').join(', ')
	const stmt = env.sqlite.prepare(`
		SELECT t.id as source_id, t.rowid as source_rowid, v.vectors as vector
		FROM ${table_name} t
		JOIN vec.${vec_table_name} v ON t.rowid = v.rowid
		WHERE t.id IN (${placeholders})
	`)
	const rows = stmt.all(...ids) as Array<{ source_id: string; source_rowid: number; vector: Uint8Array | Buffer }>

	return rows.map(item => ({
		entity_type,
		source_id: item.source_id,
		source_rowid: item.source_rowid,
		vector: toBase64(item.vector)
	}))
}

const collectSnapshot = async (agent_id: string): Promise<AgentPackSnapshot> => {
	const target_agent = await getAgent(eq(agent.id, agent_id))

	if (!target_agent) {
		throw new Error(`Agent not found: ${agent_id}`)
	}

	const [agent_skill_rows, raw_related_rows, agent_document_rows, private_articles, agent_nodes, agent_edges] =
		await Promise.all([
			env.db.select().from(agent_skill).where(eq(agent_skill.agent_id, agent_id)),
			env.db.select().from(agent_article).where(eq(agent_article.agent_id, agent_id)),
			env.db.select().from(agent_document).where(eq(agent_document.agent_id, agent_id)),
			env.db
				.select()
				.from(article)
				.where(and(eq(article.scope_type, 'agent'), eq(article.scope_id, agent_id))),
			env.db.select().from(node).where(eq(node.agent_id, agent_id)),
			env.db.select().from(edge).where(eq(edge.agent_id, agent_id))
		])

	const skill_ids = unique(agent_skill_rows.map(item => item.skill_id))
	const related_article_ids = unique(raw_related_rows.map(item => item.article_id))
	const related_articles = related_article_ids.length
		? await env.db.select().from(article).where(inArray(article.id, related_article_ids))
		: []

	const private_article_id_set = new Set(private_articles.map(item => item.id))
	const related_rows = raw_related_rows.filter(item => !private_article_id_set.has(item.article_id))
	const article_map = new Map<string, Article>()

	for (const item of [...private_articles, ...related_articles]) {
		article_map.set(item.id, item)
	}

	const articles = sortByUpdated(Array.from(article_map.values()))
	const article_ids = articles.map(item => item.id)
	const article_document_ids = articles.map(item => item.document_id).filter(Boolean) as Array<string>
	const document_ids = unique([...agent_document_rows.map(item => item.document_id), ...article_document_ids])
	const skill_rows = skill_ids.length ? await env.db.select().from(skill).where(inArray(skill.id, skill_ids)) : []
	const documents = document_ids.length
		? await env.db.select().from(document).where(inArray(document.id, document_ids))
		: []
	const chunks = article_ids.length
		? await env.db.select().from(chunk).where(inArray(chunk.article_id, article_ids))
		: []
	const chunk_ids = chunks.map(item => item.id)
	const chunk_node_rows = chunk_ids.length
		? await env.db.select().from(node_chunk).where(inArray(node_chunk.chunk_id, chunk_ids))
		: []
	const article_edge_rows = article_ids.length
		? await env.db.select().from(edge_article).where(inArray(edge_article.article_id, article_ids))
		: []
	const link_article_rows = article_ids.length
		? await env.db.select().from(link_article).where(inArray(link_article.article_id, article_ids))
		: []

	const related_node_ids = chunk_node_rows.map(item => item.node_id)
	const related_edge_ids = article_edge_rows.map(item => item.edge_id)
	const base_node_ids = unique([...agent_nodes.map(item => item.id), ...related_node_ids])
	const base_edge_ids = unique([...agent_edges.map(item => item.id), ...related_edge_ids])
	const base_edges = base_edge_ids.length
		? await env.db.select().from(edge).where(inArray(edge.id, base_edge_ids))
		: []
	const graph_node_ids = unique([
		...base_node_ids,
		...base_edges.map(item => item.source_id),
		...base_edges.map(item => item.target_id)
	])
	const nodes = graph_node_ids.length
		? await env.db.select().from(node).where(inArray(node.id, graph_node_ids))
		: []
	const node_id_set = new Set(nodes.map(item => item.id))
	const node_chunk_rows = chunk_node_rows.filter(item => node_id_set.has(item.node_id))
	const edges = sortByUpdated(base_edges)
	const edge_ids = edges.map(item => item.id)
	const links = link_article_rows.length
		? await env.db
				.select()
				.from(link)
				.where(inArray(link.id, unique(link_article_rows.map(item => item.link_id))))
		: []
	const agent_vectors = collectVectorRecords({
		entity_type: 'agent',
		table_name: 'agent',
		vec_table_name: 'agent_vec',
		ids: [agent_id]
	})
	const chunk_vectors = collectVectorRecords({
		entity_type: 'chunk',
		table_name: 'chunk',
		vec_table_name: 'chunk_vec',
		ids: chunk_ids
	})
	const node_vectors = collectVectorRecords({
		entity_type: 'node',
		table_name: 'node',
		vec_table_name: 'node_vec',
		ids: nodes.map(item => item.id)
	})
	const edge_vectors = collectVectorRecords({
		entity_type: 'edge',
		table_name: 'edge',
		vec_table_name: 'edge_vec',
		ids: edge_ids
	})

	return {
		agent: target_agent,
		skills: sortByUpdated(skill_rows as Array<Skill>),
		agent_skill_rows: agent_skill_rows.map(item => ({
			agent_id: item.agent_id,
			skill_id: item.skill_id,
			created_at: item.created_at
		})),
		related_articles: related_rows.map(item => ({
			agent_id: item.agent_id,
			article_id: item.article_id,
			created_at: item.created_at
		})),
		documents: sortByUpdated(documents as Array<Document>),
		agent_document_rows: agent_document_rows.map(item => ({
			agent_id: item.agent_id,
			document_id: item.document_id,
			created_at: item.created_at
		})),
		articles,
		chunks: sortByUpdated(chunks as Array<Chunk>),
		nodes: sortByUpdated(nodes as Array<Node>),
		edges,
		node_chunk_rows: node_chunk_rows.map(item => ({
			node_id: item.node_id,
			chunk_id: item.chunk_id,
			created_at: item.created_at
		})),
		edge_article_rows: article_edge_rows.map(item => ({
			edge_id: item.edge_id,
			article_id: item.article_id,
			created_at: item.created_at
		})),
		links: sortByUpdated(links as Array<Link>),
		link_article_rows: link_article_rows.map(item => ({
			link_id: item.link_id,
			article_id: item.article_id,
			created_at: item.created_at
		})),
		vectors: {
			agent: agent_vectors,
			chunk: chunk_vectors,
			node: node_vectors,
			edge: edge_vectors
		}
	}
}

const buildManifest = (snapshot: AgentPackSnapshot): AgentPackManifest => ({
	pack_version,
	exported_at: new Date().toISOString(),
	source_app_version: '0.0.1',
	agent_name: snapshot.agent.name,
	mode: 'snapshot',
	has_vectors:
		snapshot.vectors.agent.length > 0 ||
		snapshot.vectors.chunk.length > 0 ||
		snapshot.vectors.node.length > 0 ||
		snapshot.vectors.edge.length > 0,
	has_graph:
		snapshot.nodes.length > 0 ||
		snapshot.edges.length > 0 ||
		snapshot.node_chunk_rows.length > 0 ||
		snapshot.edge_article_rows.length > 0,
	counts: {
		skills: snapshot.skills.length,
		related_articles: snapshot.related_articles.length,
		documents: snapshot.documents.length,
		articles: snapshot.articles.length,
		chunks: snapshot.chunks.length,
		nodes: snapshot.nodes.length,
		edges: snapshot.edges.length,
		links: snapshot.links.length
	}
})

const writeSnapshot = async (temp_dir: string, snapshot: AgentPackSnapshot) => {
	const payload_dir = path.resolve(temp_dir, 'payload')
	const vectors_dir = path.resolve(payload_dir, 'vectors')

	await writeJsonFile(path.resolve(temp_dir, 'manifest.json'), buildManifest(snapshot))
	await writeJsonFile(path.resolve(payload_dir, 'agent.json'), snapshot.agent)
	await writeJsonFile(path.resolve(payload_dir, 'skills.json'), snapshot.skills)
	await writeJsonFile(path.resolve(payload_dir, 'agent_skills.json'), snapshot.agent_skill_rows)
	await writeJsonFile(path.resolve(payload_dir, 'related_articles.json'), snapshot.related_articles)
	await writeJsonFile(path.resolve(payload_dir, 'documents.json'), snapshot.documents)
	await writeJsonFile(path.resolve(payload_dir, 'agent_documents.json'), snapshot.agent_document_rows)
	await writeJsonFile(path.resolve(payload_dir, 'articles.json'), snapshot.articles)
	await writeJsonFile(path.resolve(payload_dir, 'chunks.json'), snapshot.chunks)
	await writeJsonFile(path.resolve(payload_dir, 'nodes.json'), snapshot.nodes)
	await writeJsonFile(path.resolve(payload_dir, 'edges.json'), snapshot.edges)
	await writeJsonFile(path.resolve(payload_dir, 'node_chunks.json'), snapshot.node_chunk_rows)
	await writeJsonFile(path.resolve(payload_dir, 'edge_articles.json'), snapshot.edge_article_rows)
	await writeJsonFile(path.resolve(payload_dir, 'links.json'), snapshot.links)
	await writeJsonFile(path.resolve(payload_dir, 'link_articles.json'), snapshot.link_article_rows)
	await writeVectorFile(path.resolve(vectors_dir, 'agent_vec.ndjson'), snapshot.vectors.agent)
	await writeVectorFile(path.resolve(vectors_dir, 'chunk_vec.ndjson'), snapshot.vectors.chunk)
	await writeVectorFile(path.resolve(vectors_dir, 'node_vec.ndjson'), snapshot.vectors.node)
	await writeVectorFile(path.resolve(vectors_dir, 'edge_vec.ndjson'), snapshot.vectors.edge)
}

const createArchive = async (source_dir: string, file_path: string) => {
	await fs.ensureDir(path.dirname(file_path))

	await new Promise<void>((resolve, reject) => {
		const output = fs.createWriteStream(file_path)
		const archive = new ZipArchive({ zlib: { level: 9 } })

		output.on('close', () => resolve())
		output.on('error', reject)
		archive.on('error', reject)

		archive.pipe(output)
		archive.directory(source_dir, false)
		void archive.finalize()
	})
}

const assertSafeEntryPath = (root_dir: string, entry_path: string) => {
	const normalized = entry_path.replace(/\\/g, '/')

	if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
		throw new Error(`Unsafe archive entry path: ${entry_path}`)
	}

	const target_path = path.resolve(root_dir, normalized)
	const safe_root = root_dir.endsWith(path.sep) ? root_dir : `${root_dir}${path.sep}`

	if (target_path !== root_dir && !target_path.startsWith(safe_root)) {
		throw new Error(`Archive entry escaped target directory: ${entry_path}`)
	}

	return target_path
}

const extractArchive = async (file_path: string, target_dir: string) => {
	const directory = await unzipper.Open.file(file_path)

	for (const entry of directory.files) {
		const output_path = assertSafeEntryPath(target_dir, entry.path)

		if (entry.type === 'Directory') {
			await fs.ensureDir(output_path)
			continue
		}

		await fs.ensureDir(path.dirname(output_path))
		await pipeline(entry.stream(), fs.createWriteStream(output_path))
	}
}

const readSnapshot = async (temp_dir: string) => {
	const manifest = await readJsonFile<AgentPackManifest>(path.resolve(temp_dir, 'manifest.json'))

	if (manifest.pack_version !== pack_version) {
		throw new Error(`Unsupported agent pack version: ${manifest.pack_version}`)
	}

	const payload_dir = path.resolve(temp_dir, 'payload')
	const vectors_dir = path.resolve(payload_dir, 'vectors')

	return {
		manifest,
		agent: await readJsonFile<Agent>(path.resolve(payload_dir, 'agent.json')),
		skills: await readJsonFile<Array<Skill>>(path.resolve(payload_dir, 'skills.json')),
		agent_skill_rows: await readJsonFile<
			Array<{ agent_id: string; skill_id: string; created_at: Date | null }>
		>(path.resolve(payload_dir, 'agent_skills.json')),
		related_articles: await readJsonFile<
			Array<{ agent_id: string; article_id: string; created_at: Date | null }>
		>(path.resolve(payload_dir, 'related_articles.json')),
		documents: await readJsonFile<Array<Document>>(path.resolve(payload_dir, 'documents.json')),
		agent_document_rows: await readJsonFile<
			Array<{ agent_id: string; document_id: string; created_at: Date | null }>
		>(path.resolve(payload_dir, 'agent_documents.json')),
		articles: await readJsonFile<Array<Article>>(path.resolve(payload_dir, 'articles.json')),
		chunks: await readJsonFile<Array<Chunk>>(path.resolve(payload_dir, 'chunks.json')),
		nodes: await readJsonFile<Array<Node>>(path.resolve(payload_dir, 'nodes.json')),
		edges: await readJsonFile<Array<Edge>>(path.resolve(payload_dir, 'edges.json')),
		node_chunk_rows: await readJsonFile<Array<{ node_id: string; chunk_id: string; created_at: Date | null }>>(
			path.resolve(payload_dir, 'node_chunks.json')
		),
		edge_article_rows: await readJsonFile<
			Array<{ edge_id: string; article_id: string; created_at: Date | null }>
		>(path.resolve(payload_dir, 'edge_articles.json')),
		links: await readJsonFile<Array<Link>>(path.resolve(payload_dir, 'links.json')),
		link_article_rows: await readJsonFile<
			Array<{ link_id: string; article_id: string; created_at: Date | null }>
		>(path.resolve(payload_dir, 'link_articles.json')),
		vectors: {
			agent: await readVectorFile(path.resolve(vectors_dir, 'agent_vec.ndjson')),
			chunk: await readVectorFile(path.resolve(vectors_dir, 'chunk_vec.ndjson')),
			node: await readVectorFile(path.resolve(vectors_dir, 'node_vec.ndjson')),
			edge: await readVectorFile(path.resolve(vectors_dir, 'edge_vec.ndjson'))
		}
	}
}

const resolveImportedAgentName = async (name: string) => {
	const base_name = name.trim() || 'Imported Agent'
	const existing_names = new Set((await getAgents()).map(item => item.name))

	if (!existing_names.has(base_name)) {
		return base_name
	}

	const imported_name = `${base_name} (Imported)`

	if (!existing_names.has(imported_name)) {
		return imported_name
	}

	return `${imported_name} ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
}

export const exportAgentPack = async (agent_id: string) => {
	const temp_root = path.resolve(app.app_path, '.temp')
	const work_dir = path.resolve(temp_root, `export-${randomUUID()}`)

	await fs.ensureDir(work_dir)

	try {
		const snapshot = await collectSnapshot(agent_id)
		const { export_dir, file_path, file_name } = await getExportFilePath(snapshot.agent.name)

		await writeSnapshot(work_dir, snapshot)
		await createArchive(work_dir, file_path)

		return {
			ok: true as const,
			export_dir,
			file_path,
			file_name
		}
	} finally {
		await fs.remove(work_dir)
	}
}

const insertVectorRecords = (
	records: Array<VectorRecord>,
	rowid_map: Map<string, number>,
	insert: (rowid: bigint, vector: Buffer) => void
) => {
	const seen_rowids = new Set<number>()

	for (const item of records) {
		const next_rowid = rowid_map.get(item.source_id)

		if (!next_rowid || seen_rowids.has(next_rowid)) {
			continue
		}

		seen_rowids.add(next_rowid)
		insert(BigInt(next_rowid), Buffer.from(item.vector, 'base64'))
	}
}

export const importAgentPack = async (file_path: string) => {
	if (!file_path.toLowerCase().endsWith(`.${agent_pack_extension}`)) {
		throw new Error(`Unsupported pack file: ${file_path}`)
	}

	const temp_root = path.resolve(app.app_path, '.temp')
	const work_dir = path.resolve(temp_root, `import-${randomUUID()}`)

	await fs.ensureDir(work_dir)

	try {
		await extractArchive(file_path, work_dir)

		const snapshot = await readSnapshot(work_dir)
		const imported_name = await resolveImportedAgentName(snapshot.agent.name)
		const next_agent_id = getId()
		const now = new Date()
		const current_agents = await getAgents()
		const min_agent_order = current_agents.reduce(
			(total, item) => Math.min(total, Number.isFinite(item.order) ? item.order : 0),
			Number.POSITIVE_INFINITY
		)
		const next_agent_order = Number.isFinite(min_agent_order) ? min_agent_order - 1 : 0
		const skill_id_map = new Map(snapshot.skills.map(item => [item.id, getId()]))
		const document_id_map = new Map(snapshot.documents.map(item => [item.id, getId()]))
		const article_id_map = new Map(snapshot.articles.map(item => [item.id, getId()]))
		const chunk_id_map = new Map(snapshot.chunks.map(item => [item.id, getId()]))
		const link_id_map = new Map(snapshot.links.map(item => [item.id, getId()]))
		const node_id_map = new Map<string, string>()
		const edge_id_map = new Map<string, string>()
		const skill_base_order = Date.now()

		const sorted_nodes = [...snapshot.nodes].sort(
			(a, b) => Number(Boolean(b.agent_id)) - Number(Boolean(a.agent_id))
		)
		const node_name_map = new Map<string, string>()
		const node_insert_rows = [] as Array<{ source: Node; next_id: string }>

		for (const item of sorted_nodes) {
			const key = item.name
			const existing_id = node_name_map.get(key)

			if (existing_id) {
				node_id_map.set(item.id, existing_id)
				continue
			}

			const next_id = getId()

			node_name_map.set(key, next_id)
			node_id_map.set(item.id, next_id)
			node_insert_rows.push({ source: item, next_id })
		}

		const sorted_edges = [...snapshot.edges].sort(
			(a, b) => Number(Boolean(b.agent_id)) - Number(Boolean(a.agent_id))
		)
		const edge_pair_map = new Map<string, string>()
		const edge_insert_rows = [] as Array<{
			source: Edge
			next_id: string
			source_id: string
			target_id: string
		}>

		for (const item of sorted_edges) {
			const source_id = node_id_map.get(item.source_id)
			const target_id = node_id_map.get(item.target_id)

			if (!source_id || !target_id) {
				continue
			}

			const pair_key = `${source_id}:${target_id}`
			const existing_id = edge_pair_map.get(pair_key)

			if (existing_id) {
				edge_id_map.set(item.id, existing_id)
				continue
			}

			const next_id = getId()

			edge_pair_map.set(pair_key, next_id)
			edge_id_map.set(item.id, next_id)
			edge_insert_rows.push({ source: item, next_id, source_id, target_id })
		}

		const chunk_rowid_map = new Map<string, number>()
		const node_rowid_map = new Map<string, number>()
		const edge_rowid_map = new Map<string, number>()
		const agent_rowid_map = new Map<string, number>()

		env.sqlite.transaction(() => {
			env.db
				.insert(agent)
				.values({
					id: next_agent_id,
					name: imported_name,
					role: snapshot.agent.role,
					description: snapshot.agent.description,
					photo: snapshot.agent.photo ? new Uint8Array(snapshot.agent.photo as Uint8Array) : null,
					avatar: snapshot.agent.avatar,
					tools: snapshot.agent.tools,
					prompt: snapshot.agent.prompt,
					soul: snapshot.agent.soul,
					identity: snapshot.agent.identity,
					memory: snapshot.agent.memory,
					order: next_agent_order,
					model: snapshot.agent.model,
					created_at: snapshot.agent.created_at ?? now,
					updated_at: snapshot.agent.updated_at ?? now
				})
				.run()

			for (let index = 0; index < snapshot.skills.length; index += 1) {
				const item = snapshot.skills[index]

				env.db
					.insert(skill)
					.values({
						...item,
						id: skill_id_map.get(item.id)!,
						order: skill_base_order + index,
						created_at: item.created_at ?? now,
						updated_at: item.updated_at ?? now
					})
					.run()
			}

			for (const item of snapshot.documents) {
				env.db
					.insert(document)
					.values({
						...item,
						id: document_id_map.get(item.id)!,
						created_at: item.created_at ?? now,
						updated_at: item.updated_at ?? now
					})
					.run()
			}

			for (const item of snapshot.articles) {
				env.db
					.insert(article)
					.values({
						...item,
						id: article_id_map.get(item.id)!,
						document_id: item.document_id
							? (document_id_map.get(item.document_id) ?? null)
							: null,
						scope_type: 'agent',
						scope_id: next_agent_id,
						hash: null,
						created_at: item.created_at ?? now,
						updated_at: item.updated_at ?? now
					})
					.run()
			}

			for (const item of snapshot.chunks) {
				const next_article_id = item.article_id ? article_id_map.get(item.article_id) : null

				if (!next_article_id) {
					continue
				}

				env.db
					.insert(chunk)
					.values({
						...item,
						id: chunk_id_map.get(item.id)!,
						article_id: next_article_id,
						created_at: item.created_at ?? now
					})
					.run()
			}

			for (const item of node_insert_rows) {
				env.db
					.insert(node)
					.values({
						...item.source,
						id: item.next_id,
						agent_id: next_agent_id,
						created_at: item.source.created_at ?? now
					})
					.run()
			}

			for (const item of edge_insert_rows) {
				env.db
					.insert(edge)
					.values({
						...item.source,
						id: item.next_id,
						agent_id: next_agent_id,
						source_id: item.source_id,
						target_id: item.target_id,
						created_at: item.source.created_at ?? now
					})
					.run()
			}

			for (const item of snapshot.links) {
				env.db
					.insert(link)
					.values({
						...item,
						id: link_id_map.get(item.id)!,
						hash: null,
						created_at: item.created_at ?? now,
						updated_at: item.updated_at ?? now
					})
					.run()
			}

			for (const item of snapshot.agent_skill_rows) {
				const next_skill_id = skill_id_map.get(item.skill_id)

				if (!next_skill_id) {
					continue
				}

				env.db
					.insert(agent_skill)
					.values({
						agent_id: next_agent_id,
						skill_id: next_skill_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			for (const item of snapshot.agent_document_rows) {
				const next_document_id = document_id_map.get(item.document_id)

				if (!next_document_id) {
					continue
				}

				env.db
					.insert(agent_document)
					.values({
						agent_id: next_agent_id,
						document_id: next_document_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			for (const item of snapshot.related_articles) {
				const next_article_id = article_id_map.get(item.article_id)

				if (!next_article_id) {
					continue
				}

				env.db
					.insert(agent_article)
					.values({
						agent_id: next_agent_id,
						article_id: next_article_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			for (const item of snapshot.node_chunk_rows) {
				const next_node_id = node_id_map.get(item.node_id)
				const next_chunk_id = chunk_id_map.get(item.chunk_id)

				if (!next_node_id || !next_chunk_id) {
					continue
				}

				env.db
					.insert(node_chunk)
					.values({
						node_id: next_node_id,
						chunk_id: next_chunk_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			for (const item of snapshot.edge_article_rows) {
				const next_edge_id = edge_id_map.get(item.edge_id)
				const next_article_id = article_id_map.get(item.article_id)

				if (!next_edge_id || !next_article_id) {
					continue
				}

				env.db
					.insert(edge_article)
					.values({
						edge_id: next_edge_id,
						article_id: next_article_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			for (const item of snapshot.link_article_rows) {
				const next_link_id = link_id_map.get(item.link_id)
				const next_article_id = article_id_map.get(item.article_id)

				if (!next_link_id || !next_article_id) {
					continue
				}

				env.db
					.insert(link_article)
					.values({
						link_id: next_link_id,
						article_id: next_article_id,
						created_at: item.created_at ?? now
					})
					.onConflictDoNothing()
					.run()
			}

			const next_agent_rowid = getAgentRowid().get(next_agent_id) as { rowid: number } | undefined

			if (next_agent_rowid) {
				agent_rowid_map.set(snapshot.agent.id, next_agent_rowid.rowid)
			}

			for (const [source_id, next_id] of chunk_id_map) {
				const row = getChunkRowid().get(next_id) as { rowid: number } | undefined

				if (row) {
					chunk_rowid_map.set(source_id, row.rowid)
				}
			}

			for (const [source_id, next_id] of node_id_map) {
				const row = getNodeRowid().get(next_id) as { rowid: number } | undefined

				if (row) {
					node_rowid_map.set(source_id, row.rowid)
				}
			}

			for (const [source_id, next_id] of edge_id_map) {
				const row = getEdgeRowid().get(next_id) as { rowid: number } | undefined

				if (row) {
					edge_rowid_map.set(source_id, row.rowid)
				}
			}

			insertVectorRecords(snapshot.vectors.agent, agent_rowid_map, (rowid, vector) =>
				insertAgentVector().run(rowid, vector)
			)
			insertVectorRecords(snapshot.vectors.chunk, chunk_rowid_map, (rowid, vector) =>
				insertChunkVector().run(rowid, vector)
			)
			insertVectorRecords(snapshot.vectors.node, node_rowid_map, (rowid, vector) =>
				insertNodeVector().run(rowid, vector)
			)
			insertVectorRecords(snapshot.vectors.edge, edge_rowid_map, (rowid, vector) =>
				insertEdgeVector().run(rowid, vector)
			)

			for (const [source_id, next_rowid] of chunk_rowid_map) {
				const source_chunk = snapshot.chunks.find(item => item.id === source_id)

				if (!source_chunk) {
					continue
				}

				insertChunkFts().run(BigInt(next_rowid), source_chunk.keywords)
			}
		})()

		return {
			ok: true as const,
			agent_id: next_agent_id,
			agent_name: imported_name
		}
	} finally {
		await fs.remove(work_dir)
	}
}
