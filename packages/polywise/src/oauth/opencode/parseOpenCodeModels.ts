import type { Model } from '@core/types'

const stripAnsi = (value: string) => value.replace(/\u001B\[[0-9;]*m/g, '')

const normalizeModelName = (value: string) =>
	value
		.split(/[/-]/g)
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')

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
