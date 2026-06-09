import type { ConfigProvider } from '@core/types'

interface ProviderRuntimeOverride {
	custom_fields?: Record<string, string>
}

export type ProviderRuntimeLike = ConfigProvider | ProviderRuntimeOverride | null

export default (args: {
	provider_name: string
	provider_item?: ProviderRuntimeLike
	custom_provider_names: Array<string>
}) => {
	const { provider_name, provider_item, custom_provider_names } = args
	const runtime_name =
		provider_item &&
		typeof provider_item === 'object' &&
		'custom_fields' in provider_item &&
		provider_item.custom_fields?.provider_runtime
			? provider_item.custom_fields.provider_runtime.trim()
			: ''

	if (runtime_name) {
		return runtime_name
	}

	return custom_provider_names.includes(provider_name) ? 'open_compatible' : provider_name
}
