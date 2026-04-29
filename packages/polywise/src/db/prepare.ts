import { chunk_vector_top_k, keyword_search_limit, node_vector_top_k } from '@core/consts/search'
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

export const getEdgeRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM edge WHERE id = ?')
}

export const insertEdgeVector = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO vec.edge_vec(rowid, vectors) VALUES (?, ?)')
}

export const getNodeRowid = (): Database.Statement => {
	return env.sqlite.prepare('SELECT rowid FROM node WHERE id = ?')
}

export const insertNodeVector = (): Database.Statement => {
	return env.sqlite.prepare('INSERT INTO vec.node_vec(rowid, vectors) VALUES (?, ?)')
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

export const getNodeByVector = (): Database.Statement => {
	return env.sqlite.prepare(`
		SELECT n.id, n.name, n.rowid, distance
		FROM vec.node_vec v JOIN node n ON n.rowid = v.rowid
		WHERE v.vectors MATCH vec_f32(?) AND k = ${node_vector_top_k}
		ORDER BY distance
	`)
}

export const getEdgeByNodeId = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('?').join(',')
	return env.sqlite.prepare(`
		SELECT source_id, target_id FROM edge
		WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})
	`)
}

export const getNodeById = (count: number): Database.Statement => {
	const placeholders = Array(count).fill('?').join(',')
	return env.sqlite.prepare(`
		SELECT id, name, rowid FROM node
		WHERE id IN (${placeholders})
	`)
}
