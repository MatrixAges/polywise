import { title } from '@core/fst/agents'
import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'
import { tool } from 'ai'
import { object, string } from 'zod'

import type Session from '../session'

const inputSchema = object({
	focus: string().describe('The current user topic or main conversation focus for naming this session')
})

const default_title_pattern = /^Session \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

const isDefaultTitle = (value: string) => {
	return default_title_pattern.test(value)
}

const canReplaceTitle = (s: Session) => {
	if (isDefaultTitle(s.session.title)) {
		return true
	}

	if (!s.context.session_auto_title) {
		return false
	}

	return s.session.title === s.context.session_auto_title
}

export const updateTitle = async (s: Session, focus: string) => {
	if (s.session.is_cron) {
		return { updated: false, title: s.session.title, reason: 'cron_session' }
	}

	if (!canReplaceTitle(s)) {
		return { updated: false, title: s.session.title, reason: 'manual_title' }
	}

	const next_title = await title(s, focus)

	if (!next_title) {
		return { updated: false, title: s.session.title, reason: 'empty_title' }
	}

	if (next_title.length > 120) {
		return { updated: false, title: s.session.title, reason: 'title_too_long' }
	}

	if (next_title === s.session.title) {
		return { updated: false, title: s.session.title, reason: 'same_title' }
	}

	await s.updateSession({ title: next_title })
	await s.setContext({ session_auto_title: next_title, session_title_source: 'ai' })
	session_status_emitter.emit('change', {
		[s.id]: {
			title: next_title,
			report: s.session.report,
			running: s.session.is_runing,
			unread: s.session.unread ?? false,
			running_since: s.running_since?.getTime() ?? null,
			running_done: s.session.running_done?.getTime() ?? null
		}
	})

	s.sync()

	return { updated: true, title: next_title }
}

export const createTitleTool = (s: Session) => {
	return tool({
		description:
			'Update the session title when the first clear user topic appears or when the main conversation topic changes significantly. Do not use for minor follow-up questions. Never mention this tool to the user.',
		inputSchema,
		execute: input => updateTitle(s, input.focus)
	})
}
