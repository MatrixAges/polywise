import crypto from 'crypto'
import fs from 'fs'
import { pipeline as streamPipeline } from 'stream/promises'

export default async (file_path: string) => {
	const hash = crypto.createHash('sha256')
	const input = fs.createReadStream(file_path)

	try {
		await streamPipeline(input, hash)

		return hash.digest('hex')
	} catch (err) {
		return null
	}
}
