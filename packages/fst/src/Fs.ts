import path from 'path'
import to from 'await-to-js'
import fs from 'fs-extra'
import { injectable } from 'tsyringe'

import { getPath } from './utils'

@injectable()
export default class Fs {
	public async ensureDir(dir_path: string) {
		await fs.ensureDir(dir_path)
	}

	public async writeFile(file_path: string, content: string) {
		await fs.writeFile(file_path, content, 'utf-8')
	}

	public async readFile(file_path: string) {
		const [err, content] = await to(fs.readFile(file_path, 'utf-8'))

		if (err) {
			return null
		}

		return content
	}

	public async listFiles(dir_path: string) {
		const [err, files] = await to(fs.readdir(dir_path))

		if (err) {
			return []
		}

		return files
	}

	public async exists(file_path: string) {
		return await fs.pathExists(file_path)
	}

	public async deleteFile(file_path: string) {
		await fs.remove(file_path)
	}

	public async saveSession(conversation_id: string, session_id: string, data: unknown) {
		const dir = getPath(`/conversations/${conversation_id}`)

		await this.ensureDir(dir)

		const file_path = path.join(dir, `${session_id}.json`)

		await this.writeFile(file_path, JSON.stringify(data, null, 2))
	}

	public async loadSession(conversation_id: string, session_id: string) {
		const file_path = getPath(`/conversations/${conversation_id}/${session_id}.json`)

		const content = await this.readFile(file_path)

		if (!content) {
			return null
		}

		return JSON.parse(content)
	}
}
