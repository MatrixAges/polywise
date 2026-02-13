import fs from 'node:fs/promises'
import path from 'node:path'
import { injectable } from 'tsyringe'

@injectable()
export default class Fs {
	public async ensureDir(dir_path: string) {
		await fs.mkdir(dir_path, { recursive: true })
	}

	public async writeFile(file_path: string, content: string) {
		await fs.writeFile(file_path, content, 'utf-8')
	}

	public async readFile(file_path: string) {
		try {
			const content = await fs.readFile(file_path, 'utf-8')

			return content
		} catch {
			return null
		}
	}

	public async listFiles(dir_path: string) {
		try {
			const files = await fs.readdir(dir_path)

			return files
		} catch {
			return []
		}
	}

	public async exists(file_path: string) {
		try {
			await fs.access(file_path)

			return true
		} catch {
			return false
		}
	}

	public async deleteFile(file_path: string) {
		try {
			await fs.unlink(file_path)
		} catch {
			return
		}
	}

	public async saveSession(conversation_id: string, session_id: string, data: unknown) {
		const dir = path.join(process.cwd(), '.fst', conversation_id)

		await this.ensureDir(dir)

		const file_path = path.join(dir, `${session_id}.json`)

		await this.writeFile(file_path, JSON.stringify(data, null, 2))
	}

	public async loadSession(conversation_id: string, session_id: string) {
		const file_path = path.join(process.cwd(), '.fst', conversation_id, `${session_id}.json`)
		const content = await this.readFile(file_path)

		if (!content) {
			return null
		}

		return JSON.parse(content)
	}
}
