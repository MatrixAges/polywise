import path from 'path'
import dayjs from 'dayjs'
import fs from 'fs-extra'

import type { Message } from '../../types'
import type Index from '../index'

const appendJsonlMessage = async (s: Index, v: Message) => {
	const messages_dir = path.resolve(s.session_dir, 'messages')
	const file_name = `${dayjs().format('YYYY-MM-DD')}.jsonl`
	const file_path = path.resolve(messages_dir, file_name)
	const time_text = dayjs().format('YYYY-MM-DD HH:mm:ss')
	const message_text = JSON.stringify(v)

	await fs.ensureDir(messages_dir)
	await fs.appendFile(file_path, `time:${time_text},${message_text}\n`)
}

export default async (s: Index, v: Message) => {
	s.model_messages.push(v)
	s.ui_messages.push(v)

	if (s.ui_messages.length >= 20) {
		s.ui_messages = s.ui_messages.slice(10)
		s.ui_has_older = true
	}

	await s.insertMessage(v)
	await appendJsonlMessage(s, v)

	if (s.archived_at !== null) {
		s.archived_at = null

		await s.setState()
	}
}
