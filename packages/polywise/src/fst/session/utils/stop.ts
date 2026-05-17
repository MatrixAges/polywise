import type Index from '../index'

export default async (s: Index) => {
	const last_ui_message = s.ui_messages.at(-1)

	if (last_ui_message && !last_ui_message.parts.length) {
		s.ui_messages.pop()
	}

	const last_model_message = s.model_messages.at(-1)

	if (last_model_message && !last_model_message.parts.length) {
		s.model_messages.pop()
	}

	await s.runing(false)
}
