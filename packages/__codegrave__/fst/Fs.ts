import path from 'path'
import to from 'await-to-js'
import fs from 'fs-extra'
import { injectable } from 'tsyringe'

import { getPath } from './utils'

import type { ModelMessage } from 'ai'
import type { ShadowContext } from './types/shadow'

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

	public async saveShadowContext(conversation_id: string, data: ShadowContext) {
		const dir = getPath(`/conversations/${conversation_id}`)
		await this.ensureDir(dir)
		const file_path = path.join(dir, 'shadow.json')
		await this.writeFile(file_path, JSON.stringify(data, null, 2))
	}

	public async loadShadowContext(conversation_id: string): Promise<ShadowContext | null> {
		const file_path = getPath(`/conversations/${conversation_id}/shadow.json`)
		const content = await this.readFile(file_path)

		if (!content) return null

		try {
			return JSON.parse(content) as ShadowContext
		} catch {
			return null
		}
	}

	public async saveMessage(
		conversation_id: string,
		message_id: string,
		role: string,
		content: string
	): Promise<ModelMessage> {
		const dir = getPath(`/conversations/${conversation_id}/messages`)
		await this.ensureDir(dir)

		const timestamp = Date.now()
		const filename = `${timestamp}_${role}_${message_id}.json`
		const file_path = path.join(dir, filename)

		// Create a message object that fits ModelMessage structure loosely for storage
		// When loading back, we ensure it matches ModelMessage
		const message_data = {
			role,
			content
		}

		await this.writeFile(file_path, JSON.stringify({ id: message_id, ...message_data }, null, 2))

		return message_data as unknown as ModelMessage
	}

	public async appendToList(conversation_id: string, message_data: { id: string; role: string; content: string }) {
		const dir = getPath(`/conversations/${conversation_id}/list`)
		await this.ensureDir(dir)

		const files = (await this.listFiles(dir)) || []
		const chunk_files = files
			.filter(f => f.startsWith('chunk_') && f.endsWith('.json'))
			.sort((a, b) => {
				const idx_a = parseInt(a.match(/chunk_(\d+)/)?.[1] || '0')
				const idx_b = parseInt(b.match(/chunk_(\d+)/)?.[1] || '0')
				return idx_a - idx_b
			})

		let current_chunk_idx = 0
		let current_chunk: Array<any> = []

		if (chunk_files.length > 0) {
			const last_file = chunk_files[chunk_files.length - 1]
			const match = last_file.match(/chunk_(\d+)/)
			current_chunk_idx = match ? parseInt(match[1]) : 0

			const content = await this.readFile(path.join(dir, last_file))
			if (content) {
				try {
					current_chunk = JSON.parse(content)
				} catch {
					current_chunk = []
				}
			}
		}

		if (current_chunk.length >= 100) {
			current_chunk_idx++
			current_chunk = []
		}

		current_chunk.push(message_data)

		const new_file_path = path.join(dir, `chunk_${current_chunk_idx}.json`)
		await this.writeFile(new_file_path, JSON.stringify(current_chunk, null, 2))
	}

	public async getLastMessages(conversation_id: string, count: number): Promise<Array<ModelMessage>> {
		const dir = getPath(`/conversations/${conversation_id}/list`)
		if (!(await this.exists(dir))) return []

		const files = (await this.listFiles(dir)) || []
		const chunk_files = files
			.filter(f => f.startsWith('chunk_') && f.endsWith('.json'))
			.sort((a, b) => {
				const idx_a = parseInt(a.match(/chunk_(\d+)/)?.[1] || '0')
				const idx_b = parseInt(b.match(/chunk_(\d+)/)?.[1] || '0')
				return idx_b - idx_a
			})

		const messages: Array<ModelMessage> = []
		for (const file of chunk_files) {
			const content = await this.readFile(path.join(dir, file))
			if (content) {
				try {
					const chunk = JSON.parse(content) as Array<any>
					for (let i = chunk.length - 1; i >= 0; i--) {
						// Ensure we reconstruct a valid ModelMessage
						const msg = {
							role: chunk[i].role,
							content: chunk[i].content
						} as ModelMessage
						messages.unshift(msg)
						if (messages.length >= count) return messages
					}
				} catch {
					// Ignore malformed chunks
				}
			}
		}

		return messages
	}
}
