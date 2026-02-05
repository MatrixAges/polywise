import crypto from 'crypto'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'

import Pipeline from '../src/Pipeline'

const CACHE_DIR = path.resolve(__dirname, '../.test_vectors')

let rawPipeline: Pipeline | null = null

export async function getTestVectors(text: string) {
	const hash = crypto.createHash('sha256').update(text).digest('hex')
	const cache_path = path.join(CACHE_DIR, `${hash}.json`)

	if (fs.existsSync(cache_path)) {
		return fs.readJsonSync(cache_path)
	}

	if (!rawPipeline) {
		rawPipeline = new Pipeline()

		await rawPipeline.init({
			cache_dir: path.join(os.homedir(), '.polywise', '.models')
		})
	}

	const vector = (await rawPipeline.embed(text)) as Array<number>

	fs.ensureDirSync(CACHE_DIR)
	fs.writeJsonSync(cache_path, vector)

	return vector
}
