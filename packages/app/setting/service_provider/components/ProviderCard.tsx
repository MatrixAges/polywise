import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDownToLine, GripVertical, SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import type { LinkcaseProvider, LinkcaseProviderId, ManageProviderAction } from '../model'

type ProviderCardProps = {
	provider: LinkcaseProvider
	drag_disabled: boolean
	installing_id: string | null
	managing_action_id: string | null
	onInstall: (id: LinkcaseProviderId) => Promise<void>
	onManage: (action: ManageProviderAction) => Promise<void>
}

const getProviderDescription = (args: {
	id: LinkcaseProvider['id']
	t: ReturnType<typeof useTranslation<'setting'>>['t']
}) => {
	const { id, t } = args

	switch (id) {
		case 'agent-browser':
			return t('service_provider.provider_agent_browser_desc')
		case 'opencli':
			return t('service_provider.provider_opencli_desc')
		case 'crawl4ai':
			return t('service_provider.provider_crawl4ai_desc')
		case 'dokobot':
			return t('service_provider.provider_dokobot_desc')
	}
}

const getCheckStatusText = (args: {
	status: LinkcaseProvider['checks'][number]['status']
	t: ReturnType<typeof useTranslation<'setting'>>['t']
}) => {
	const { status, t } = args

	switch (status) {
		case 'ok':
			return t('service_provider.check_ok')
		case 'warning':
			return t('service_provider.check_warning')
		case 'missing':
			return t('service_provider.check_missing')
		case 'info':
			return t('service_provider.check_info')
	}
}

const getCheckLabel = (args: {
	provider_id: LinkcaseProvider['id']
	check_id: string
	t: ReturnType<typeof useTranslation<'setting'>>['t']
	fallback: string
}) => {
	const { provider_id, check_id, t, fallback } = args

	if (provider_id === 'agent-browser' && check_id === 'chrome-session') {
		return t('service_provider.check_chrome_session_reuse')
	}

	if (provider_id === 'crawl4ai' && check_id === 'managed-profiles') {
		return t('service_provider.check_managed_profiles')
	}

	if (check_id === 'browser-bridge') {
		return t('service_provider.check_browser_bridge')
	}

	return fallback
}

const getCheckActionLabel = (args: { label?: string; t: ReturnType<typeof useTranslation<'setting'>>['t'] }) => {
	const { label, t } = args

	switch (label) {
		case 'Install bridge':
			return t('service_provider.action_install_bridge')
		case 'Setup guide':
			return t('service_provider.action_setup_guide')
		case 'Session docs':
			return t('service_provider.action_session_docs')
		default:
			return label
	}
}

const getCheckDetail = (args: {
	provider_id: LinkcaseProvider['id']
	check_id: string
	detail: string
	t: ReturnType<typeof useTranslation<'setting'>>['t']
}) => {
	const { provider_id, check_id, detail, t } = args

	if (provider_id === 'opencli' && check_id === 'browser-bridge') {
		if (detail === 'Connected to the local Chrome/Chromium extension.') {
			return t('service_provider.opencli_bridge_connected')
		}

		if (detail === 'The Chrome extension is not connected.') {
			return t('service_provider.opencli_bridge_missing')
		}

		if (
			detail ===
			'Runtime probe is deferred until you click Refresh or OpenCLI is used, so opening this page does not start the Browser Bridge.'
		) {
			return t('service_provider.opencli_probe_deferred')
		}

		if (detail === 'Install opencli first, then connect the Browser Bridge extension.') {
			return t('service_provider.opencli_install_first')
		}

		if (detail === 'opencli doctor returned no output.') {
			return t('service_provider.opencli_no_output')
		}
	}

	if (provider_id === 'agent-browser' && check_id === 'chrome-session') {
		if (detail === 'Unable to inspect local Chrome profiles, but agent-browser can still attach via CDP.') {
			return t('service_provider.agent_browser_cannot_inspect_profiles')
		}

		if (detail === 'CDP attach is available; no local Chrome profiles were listed.') {
			return t('service_provider.agent_browser_no_profiles')
		}

		const matched_profiles = /detected (\d+) local Chrome profile/.exec(detail)

		if (matched_profiles) {
			return t('service_provider.agent_browser_detected_profiles', {
				count: Number(matched_profiles[1] || 0)
			})
		}
	}

	if (provider_id === 'crawl4ai' && check_id === 'managed-profiles') {
		if (detail === 'No local Chrome profile was detected for session cloning.') {
			return t('service_provider.crawl4ai_no_local_profile')
		}

		const ready_match =
			/^Polywise managed profile is ready at (.+)\. It is a snapshot cloned from Chrome profile (.+); use Recreate Profile to refresh cookies or login state later\.$/.exec(
				detail
			)

		if (ready_match) {
			return t('service_provider.crawl4ai_profile_ready', {
				path: ready_match[1] || '',
				profile: ready_match[2] || ''
			})
		}

		const missing_match =
			/^No managed profile detected yet\. Click Create From Chrome to clone a snapshot of the current Chrome profile (.+)\.$/.exec(
				detail
			)

		if (missing_match) {
			return t('service_provider.crawl4ai_profile_missing', {
				profile: missing_match[1] || ''
			})
		}
	}

	if (provider_id === 'dokobot' && check_id === 'browser-bridge') {
		if (
			detail ===
			'Dokobot CLI is installed, but the local browser bridge is not ready. Install the extension, enable Remote Control, and run `dokobot install-bridge`.'
		) {
			return t('service_provider.dokobot_bridge_not_ready')
		}

		if (
			detail ===
			'No Dokobot local bridge/device was detected. Install the extension, enable Remote Control, and run `dokobot install-bridge`.'
		) {
			return t('service_provider.dokobot_no_bridge_device')
		}

		if (detail === 'Dokobot local bridge is responding.') {
			return t('service_provider.dokobot_bridge_responding')
		}

		if (detail === 'Install Dokobot CLI first, then set up the extension bridge for local mode.') {
			return t('service_provider.dokobot_install_first')
		}

		const lines_match = /returned (\d+) line/.exec(detail)

		if (lines_match) {
			return t('service_provider.dokobot_bridge_lines', {
				count: Number(lines_match[1] || 0)
			})
		}
	}

	return detail
}

const getProviderStatusText = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'status_not_installed'
	if (provider.runtime_probe_deferred) return 'status_check_on_refresh'
	return provider.ready ? 'status_ready' : 'status_needs_setup'
}

const getProviderStatusVariant = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'outline'
	if (provider.runtime_probe_deferred) return 'outline'
	return provider.ready ? 'secondary' : 'destructive'
}

const getCheckStatusVariant = (status: LinkcaseProvider['checks'][number]['status']) => {
	if (status === 'ok') return 'secondary'
	if (status === 'warning') return 'destructive'
	if (status === 'missing') return 'outline'
	return 'outline'
}

const Index = (props: ProviderCardProps) => {
	const { provider, drag_disabled, installing_id, managing_action_id, onInstall, onManage } = props
	const { t } = useTranslation('setting')
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: provider.id,
		disabled: drag_disabled
	})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`
				flex flex-col
				gap-2
				px-4 py-3
				rounded-2xl
				bg-muted/40
				group
				${isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}
			`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{provider.name}</span>
						<Badge variant={getProviderStatusVariant(provider)}>
							{t(`service_provider.${getProviderStatusText(provider)}`)}
						</Badge>
						<a
							className='
								text-std-400 text-xs
								underline
								decoration-std-150 underline-offset-4
							'
							href={provider.docs_url}
							target='_blank'
						>
							{t('service_provider.installation_docs')}
						</a>
					</div>
					<div className='text-std-500 text-sm'>
						{getProviderDescription({ id: provider.id, t }) || provider.description}
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						type='button'
						variant={provider.installed ? 'outline' : 'default'}
						size='sm'
						disabled={
							provider.installed ||
							installing_id === provider.id ||
							managing_action_id !== null
						}
						onClick={() => void onInstall(provider.id)}
					>
						{installing_id === provider.id ? (
							<Spinner className='size-4' />
						) : (
							<ArrowDownToLine className='size-4' />
						)}
						<span>
							{provider.installed
								? t('service_provider.installed')
								: t('service_provider.install')}
						</span>
					</Button>
					<button
						type='button'
						aria-label={t('service_provider.drag_reorder', { name: provider.name })}
						className={`
							active:cursor-grabbing
							icon_button small cursor-grab
							${isDragging ? 'opacity-100' : ''}
						`}
						disabled={drag_disabled}
						{...attributes}
						{...listeners}
					>
						<GripVertical className='size-3.5' />
					</button>
				</div>
			</div>
			{provider.id === 'crawl4ai' && provider.installed ? (
				<div className='flex flex-wrap gap-2'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={
							!provider.crawl4ai_profile?.preferred_source_profile_name ||
							Boolean(provider.crawl4ai_profile?.managed_profile_exists) ||
							managing_action_id !== null
						}
						onClick={() => void onManage('create_profile')}
					>
						{managing_action_id === 'crawl4ai:create_profile' ? (
							<Spinner className='size-4' />
						) : null}
						<span>{t('service_provider.create_from_chrome')}</span>
					</Button>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={
							!provider.crawl4ai_profile?.preferred_source_profile_name ||
							!provider.crawl4ai_profile?.managed_profile_exists ||
							managing_action_id !== null
						}
						onClick={() => void onManage('recreate_profile')}
					>
						{managing_action_id === 'crawl4ai:recreate_profile' ? (
							<Spinner className='size-4' />
						) : null}
						<span>{t('service_provider.recreate_profile')}</span>
					</Button>
				</div>
			) : null}
			{provider.checks.length > 0 ? (
				<div
					className='
						flex flex-col
						gap-2
						p-3
						rounded-xl
						bg-background/70
						border border-border/60
					'
				>
					{provider.checks.map(check => (
						<div
							key={`${provider.id}-${check.id}`}
							className='
								flex flex-wrap
								items-start justify-between
								gap-3
							'
						>
							<div className='flex min-w-0 flex-col gap-1'>
								<div className='flex flex-wrap items-center gap-2'>
									<span className='text-sm font-medium'>
										{getCheckLabel({
											provider_id: provider.id,
											check_id: check.id,
											t,
											fallback: check.label
										})}
									</span>
									<Badge variant={getCheckStatusVariant(check.status)}>
										{getCheckStatusText({ status: check.status, t })}
									</Badge>
								</div>
								<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
									{getCheckDetail({
										provider_id: provider.id,
										check_id: check.id,
										detail: check.detail,
										t
									})}
								</div>
							</div>
							{check.action_url && check.action_label ? (
								<a
									className='
										inline-flex
										items-center
										gap-1
										text-std-400 text-xs
										underline
										decoration-std-150 underline-offset-4
									'
									href={check.action_url}
									target='_blank'
								>
									<span>
										{getCheckActionLabel({ label: check.action_label, t })}
									</span>
									<SquareArrowOutUpRight className='size-3' />
								</a>
							) : null}
						</div>
					))}
				</div>
			) : null}
		</div>
	)
}

export default observer(Index)
