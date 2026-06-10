import type { Model } from '@core/types'

const stripAnsi = (value: string) => value.replace(/\u001B\[[0-9;]*m/g, '')

const normalizeModelName = (value: string) => {
	const parts = value.split(/[/-]/g).filter(Boolean)
	const last_index = parts.length - 1
	const previous_index = parts.length - 2
	const should_merge_claude_version =
		parts[0] === 'claude' &&
		previous_index >= 0 &&
		/^\d+$/.test(parts[previous_index] || '') &&
		/^\d+$/.test(parts[last_index] || '')

	const normalized_parts = should_merge_claude_version
		? [...parts.slice(0, previous_index), `${parts[previous_index]}.${parts[last_index]}`]
		: parts

	return normalized_parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export default (output: string) => {
	return stripAnsi(output)
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const parts = line.split('/')
			const model_id = parts[parts.length - 1] || line

			return {
				id: model_id,
				name: normalizeModelName(model_id),
				enabled: true
			} satisfies Model
		})
}
