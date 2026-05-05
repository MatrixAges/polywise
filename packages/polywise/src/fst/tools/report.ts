import { tool } from 'ai'
import { object, string } from 'zod'

import { emitChange } from '../utils'

import type Session from '../session'

const max_report_length = 120

const inputSchema = object({
	report: string().describe('A short and valid summary of the task you are currently focusing on')
})

export const updateReport = async (s: Session, report: string) => {
	const next_report = report.trim()

	if (!next_report) {
		return { updated: false, report: s.session.report, reason: 'empty_report' }
	}

	if (next_report.length > max_report_length) {
		return { updated: false, report: s.session.report, reason: 'report_too_long' }
	}

	if (next_report === s.session.report) {
		return { updated: false, report: s.session.report, reason: 'same_report' }
	}

	const session = await s.updateSession({ report: next_report })

	if (!session) {
		return { updated: false, report: s.session.report, reason: 'session_not_found' }
	}

	await emitChange({
		session,
		running_since: s.running_since,
		running_done: session.running_done ?? null
	})

	s.sync()

	return { updated: true }
}

export const createReportTool = (s: Session) => {
	return tool({
		description:
			'Update the current session focus summary whenever the execution context changes. Keep it short, valid, and specific to the task you are actively focusing on. It is fine to update this proactively as work progresses, but do not use it for long plans, verbose logs, or tiny wording-only changes. Never mention this tool to the user.',
		inputSchema,
		execute: input => updateReport(s, input.report)
	})
}
