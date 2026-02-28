import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import { pipeline } from 'stream/promises'
import to from 'await-to-js'

export default async (file_path: string) => {
	const hash = createHash('sha256')
	const input = createReadStream(file_path)

	await pipeline(input, hash)

	return hash.digest('hex')
}
