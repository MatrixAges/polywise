import crypto from 'crypto'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import Pipeline from '../src/Pipeline'

const CACHE_DIR = path.resolve(__dirname, '../.test_vectors')
let rawPipeline: Pipeline | null = null

/**
 * Test utility to get vectors for a given text with local file caching.
 * This is intended to be used in tests to avoid repeated heavy embedding calls.
 */
export async function getTestVectors(text: string): Promise<number[]> {
	const hash = crypto.createHash('sha256').update(text).digest('hex')
	const cachePath = path.join(CACHE_DIR, `${hash}.json`)

	if (fs.existsSync(cachePath)) {
		return fs.readJsonSync(cachePath)
	}

	if (!rawPipeline) {
		rawPipeline = new Pipeline()
		// Use default local model configuration
		await rawPipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models')
		})
	}

	const vector = await rawPipeline.embed(text)

	fs.ensureDirSync(CACHE_DIR)
	fs.writeJsonSync(cachePath, vector)

	return vector
}
