import { chunk_vector_top_k, keyword_search_limit } from '@core/consts/search'
import { env } from '@core/env'

import type Database from 'better-sqlite3'

export const getChunkById = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('?').join(',')
	return env.sqlite.prepare(`
		SELECT c.id as chunk_id, v.vectors
		FROM chunk c
		JOIN vec.chunk_vec v ON c.rowid = v.rowid
		WHERE c.id IN (${placeholders})
	`)
}

export const searchChunkByVector = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT c.id as chunk_id, distance
		FROM vec.chunk_vec v
		JOIN chunk c ON c.rowid = v.rowid
		WHERE v.vectors MATCH vec_f32(?) AND k = ${chunk_vector_top_k}
		ORDER BY distance
	`)
}

export const searchChunkByKeywords = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT c.id as chunk_id, rank
		FROM chunk_keywords_fts fts
		JOIN chunk c ON c.rowid = fts.rowid
		WHERE chunk_keywords_fts MATCH ?
		ORDER BY rank
		LIMIT ${keyword_search_limit}
	`)
}

export const getChunkRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM chunk WHERE id = ?')
}

export const insertChunkVector = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO vec.chunk_vec(rowid, vectors) VALUES (?, ?)')
}

export const deleteChunkVector = (): Database.Statement => {
	return env.sqlite.prepare('DELETE FROM vec.chunk_vec WHERE rowid = ?')
}

export const deleteChunkFts = (): Database.Statement => {
	return env.sqlite.prepare('DELETE FROM chunk_keywords_fts WHERE rowid = ?')
}

export const insertChunkFts = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO chunk_keywords_fts(rowid, keywords) VALUES (?, ?)')
}

export const insertNodeFts = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO node_name_fts(rowid, name) VALUES (?, ?)')
}

export const deleteNodeFts = (): Database.Statement => {
	return env.sqlite.prepare('DELETE FROM node_name_fts WHERE rowid = ?')
}

export const searchNodeByText = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT n.id, n.name, n.rowid, bm25(node_name_fts) as score
		FROM node_name_fts
		JOIN node n ON n.rowid = node_name_fts.rowid
		WHERE node_name_fts MATCH ?
		ORDER BY score
		LIMIT 50
	`)
}

export const getEdgeRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM edge WHERE id = ?')
}

export const insertEdgeFts = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO edge_text_fts(rowid, text) VALUES (?, ?)')
}

export const deleteEdgeFts = (): Database.Statement => {
	return env.sqlite.prepare('DELETE FROM edge_text_fts WHERE rowid = ?')
}

export const getAgentRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM agent WHERE id = ?')
}

export const insertAgentVector = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO vec.agent_vec(rowid, vectors) VALUES (?, ?)')
}

export const getNodeRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM node WHERE id = ?')
}

export const getAgentByName = (): Database.Statement => {
	return env.sqlite.prepare('SELECT id FROM agent WHERE name = ?')
}

export const insertAgent = (): Database.Statement => {
	return env.sqlite.prepare(`
		INSERT INTO agent (id, name, soul, model, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
}

export const getNodeChunk = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT node_id, chunk_id, article_id
		FROM node_chunk nc
		JOIN chunk c ON c.id = nc.chunk_id
		WHERE node_id IN (SELECT value FROM json_each(?))
	`)
}

export const getNodeByName = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('name LIKE ?').join(' OR ')
	return env.sqlite.prepare(`
		SELECT id, name, rowid FROM node
		WHERE ${placeholders}
		LIMIT 50
	`)
}

export const searchEdgeByText = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT e.id, e.source_id, e.target_id, e.relation, e.rowid, bm25(edge_text_fts) as score
		FROM edge_text_fts
		JOIN edge e ON e.rowid = edge_text_fts.rowid
		WHERE edge_text_fts MATCH ?
		ORDER BY score
		LIMIT 50
	`)
}

export const getEdgeByNodeId = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('?').join(',')
	return env.sqlite.prepare(`
		SELECT source_id, target_id, weight, confidence, bandwidth FROM edge
		WHERE state = 'active' AND (source_id IN (${placeholders}) OR target_id IN (${placeholders}))
	`)
}

export const getNodeById = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('?').join(',')
	return env.sqlite.prepare(`
		SELECT id, name, rowid FROM node
		WHERE id IN (${placeholders})
	`)
}
