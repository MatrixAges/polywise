interface CodexInputItem {
	type?: string
	id?: string
	[key: string]: unknown
}

interface CodexRequestBody {
	model?: string
	input?: Array<CodexInputItem>
	include?: Array<string> | null
	store?: boolean | null
	stream?: boolean
	[key: string]: unknown
}

const normalizeCodexModel = (value?: string) => {
	if (!value) {
		return 'gpt-5.1'
	}

	const model_id = value.includes('/') ? (value.split('/').at(-1) ?? value) : value
	const normalized = model_id.toLowerCase()

	if (
		normalized.includes('gpt-5.2-codex') ||
		normalized.includes('gpt-5.3-codex') ||
		normalized.includes('gpt-5.4-codex') ||
		normalized.includes('gpt-5.5-codex')
	) {
		return 'gpt-5.2-codex'
	}

	if (
		normalized.includes('gpt-5.2') ||
		normalized.includes('gpt-5.3') ||
		normalized.includes('gpt-5.4') ||
		normalized.includes('gpt-5.5')
	) {
		return 'gpt-5.2'
	}

	if (normalized.includes('gpt-5.1-codex-max')) {
		return 'gpt-5.1-codex-max'
	}

	if (normalized.includes('gpt-5.1-codex-mini') || normalized.includes('gpt-5-codex-mini')) {
		return 'gpt-5.1-codex-mini'
	}

	if (normalized.includes('gpt-5.1-codex') || normalized.includes('gpt-5-codex') || normalized.includes('codex')) {
		return 'gpt-5.1-codex'
	}

	if (normalized.includes('gpt-5.1') || normalized.includes('gpt-5')) {
		return 'gpt-5.1'
	}

	return model_id
}

const normalizeCodexInput = (value?: Array<CodexInputItem>) => {
	if (!Array.isArray(value)) {
		return value
	}

	return value
		.filter(item => item?.type !== 'item_reference')
		.map(item => {
			if (!item || typeof item !== 'object' || !('id' in item)) {
				return item
			}

			const { id, ...rest } = item

			return rest satisfies CodexInputItem
		})
}

export default (body: CodexRequestBody) => {
	const include = Array.from(
		new Set([...(Array.isArray(body.include) ? body.include : []), 'reasoning.encrypted_content'])
	)

	return {
		...body,
		model: normalizeCodexModel(body.model),
		input: normalizeCodexInput(body.input),
		include,
		store: false,
		stream: true
	} satisfies CodexRequestBody
}
