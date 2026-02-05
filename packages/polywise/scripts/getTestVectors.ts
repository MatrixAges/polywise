import crypto from 'crypto'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import Pipeline from '../src/Pipeline'

const CACHE_DIR = path.resolve(__dirname, '../.test_vectors')
const CACHE_RERANK_DIR = path.resolve(__dirname, '../.test_vectors/rerank')
const CACHE_DECISION_DIR = path.resolve(__dirname, '../.test_vectors/decision')

let rawPipeline: Pipeline | null = null

async function getPipeline() {
	if (!rawPipeline) {
		rawPipeline = new Pipeline()

		await rawPipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models')
		})
	}

	return rawPipeline
}

export async function getTestVectors(text: string) {
	const hash = crypto.createHash('sha256').update(text).digest('hex')
	const cache_path = path.join(CACHE_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		return fs.readJsonSync(cache_path)
	}

	const pipeline = await getPipeline()
	const vector = (await pipeline.embed(text)) as Array<number>

	fs.ensureDirSync(CACHE_DIR)
	fs.writeJsonSync(cache_path, vector)

	return vector
}

export async function getTestRerank(query: string, documents: string[]) {
	const content = JSON.stringify({ query, documents })
	const hash = crypto.createHash('sha256').update(content).digest('hex')
	const cache_path = path.join(CACHE_RERANK_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		return fs.readJsonSync(cache_path)
	}

	const pipeline = await getPipeline()
	const result = await pipeline.rerank(query, documents)

	fs.ensureDirSync(CACHE_RERANK_DIR)
	fs.writeJsonSync(cache_path, result)

	return result
}

export async function getTestDecision(prompt: string, options: any) {
	const content = JSON.stringify({ prompt, options })
	const hash = crypto.createHash('sha256').update(content).digest('hex')
	const cache_path = path.join(CACHE_DECISION_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		return fs.readJsonSync(cache_path)
	}

	const pipeline = await getPipeline()
	const result = await pipeline.decide(prompt, options)

	fs.ensureDirSync(CACHE_DECISION_DIR)
	fs.writeJsonSync(cache_path, result)

	return result
}
