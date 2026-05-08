import { tool } from 'ai'
import { object, string } from 'zod'

import { emitChange } from '../utils'

import type Session from '../session'

const inputSchema = object({
	report: string()
		.describe('A very short progress update about what you are doing, DON`t over max length 80 characters')
		.max(80)
})

export const updateReport = async (s: Session, report: string) => {
	const session = await s.updateSession({ report: report.trim() })

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
			'Use this tool during longer work to keep the session report aligned with the progress you would want the user to see. Report what you are currently doing or have just finished doing, not the overall task, plan, or hidden reasoning. Keep it very short, specific, and progress-focused. Update it when your working focus shifts and again after meaningful progress even if you stay on the same task. Final response gate: before any final user-facing delivery, you MUST refresh the report first. That final refresh must use a brief completed phrasing showing that the relevant searching and thinking are done. If you need that final refresh, do it before producing any final user-facing answer text. Once the final user-facing answer has started, do not call this tool again in that turn. Never mention this tool to the user.',
		inputSchema,
		execute: input => updateReport(s, input.report)
	})
}
