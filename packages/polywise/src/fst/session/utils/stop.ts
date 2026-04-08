import type Index from '../index'

export default async (s: Index) => {
	if (!s.ui_messages.at(-1)!.parts.length) {
		s.ui_messages.pop()
	}

	if (!s.model_messages.at(-1)!.parts.length) {
		s.model_messages.pop()
	}

	await s.runing(false)
}
