import type { Model } from '@core/types'

export default () => {
	return [
		{
			id: 'gpt-5.2-codex',
			name: 'GPT 5.2 Codex (OAuth)',
			enabled: true
		},
		{
			id: 'gpt-5.2',
			name: 'GPT 5.2 (OAuth)',
			enabled: true
		},
		{
			id: 'gpt-5.1-codex-max',
			name: 'GPT 5.1 Codex Max (OAuth)',
			enabled: true
		},
		{
			id: 'gpt-5.1-codex',
			name: 'GPT 5.1 Codex (OAuth)',
			enabled: true
		},
		{
			id: 'gpt-5.1-codex-mini',
			name: 'GPT 5.1 Codex Mini (OAuth)',
			enabled: true
		},
		{
			id: 'gpt-5.1',
			name: 'GPT 5.1 (OAuth)',
			enabled: true
		}
	] satisfies Array<Model>
}
