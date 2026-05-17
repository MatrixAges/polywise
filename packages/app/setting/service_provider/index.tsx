import { useEffect, useState } from 'react'
import { default_fetch_fallback_chain } from '@core/types'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { ArrowDownToLine, GripVertical, RefreshCw, SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'
import { rpc } from '@/utils'

import type { AppConfig } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'

type LinkcaseProvider = Awaited<ReturnType<typeof rpc.linkcase.getContentProviders.query>>['providers'][number]
type LinkcaseProviderId = LinkcaseProvider['id']

const provider_status_text = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'Not installed'
	return provider.ready ? 'Ready' : 'Needs setup'
}

const provider_status_variant = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'outline'
	return provider.ready ? 'secondary' : 'destructive'
}

const check_status_variant = (status: LinkcaseProvider['checks'][number]['status']) => {
	if (status === 'ok') return 'secondary'
	if (status === 'warning') return 'destructive'
	if (status === 'missing') return 'outline'
	return 'outline'
}

const getFallbackChain = (config?: Partial<AppConfig> | null) => {
	if (Array.isArray(config?.fetch_fallback_chain) && config.fetch_fallback_chain.length) {
		return config.fetch_fallback_chain
	}

	return [...default_fetch_fallback_chain] as AppConfig['fetch_fallback_chain']
}

const orderProvidersByChain = (
	providers: Array<LinkcaseProvider>,
	fallback_chain: AppConfig['fetch_fallback_chain']
) => {
	const order_map = new Map(fallback_chain.map((id, index) => [id, index]))
	const original_order_map = new Map(providers.map((provider, index) => [provider.id, index]))

	return [...providers].sort((a, b) => {
		const a_index = order_map.get(a.id) ?? Number.MAX_SAFE_INTEGER
		const b_index = order_map.get(b.id) ?? Number.MAX_SAFE_INTEGER

		if (a_index !== b_index) {
			return a_index - b_index
		}

		return (original_order_map.get(a.id) ?? 0) - (original_order_map.get(b.id) ?? 0)
	})
}

const buildNextFallbackChain = (
	ordered_provider_ids: Array<LinkcaseProviderId>,
	current_chain: AppConfig['fetch_fallback_chain']
) => {
	const ordered_provider_id_set = new Set<LinkcaseProviderId>(ordered_provider_ids)
	const hidden_provider_ids = current_chain.filter(item => !ordered_provider_id_set.has(item as LinkcaseProviderId))

	return [...ordered_provider_ids, ...hidden_provider_ids] as AppConfig['fetch_fallback_chain']
}

type SortableProviderCardProps = {
	provider: LinkcaseProvider
	drag_disabled: boolean
	installing_id: string | null
	managing_action_id: string | null
	onInstall: (id: LinkcaseProviderId) => Promise<void>
	onManage: (action: 'create_profile' | 'recreate_profile') => Promise<void>
}

const SortableProviderCard = (props: SortableProviderCardProps) => {
	const { provider, drag_disabled, installing_id, managing_action_id, onInstall, onManage } = props
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
				${isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{provider.name}</span>
						<Badge variant={provider_status_variant(provider)}>
							{provider_status_text(provider)}
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
							Installation docs
						</a>
					</div>
					<div className='text-std-500 text-sm'>{provider.description}</div>
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
						<span>{provider.installed ? 'Installed' : 'Install'}</span>
					</Button>
					<button
						type='button'
						aria-label={`Drag to reorder ${provider.name}`}
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
			{provider.id === 'crawl4ai' && provider.installed && (
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
						<span>Create From Chrome</span>
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
						<span>Recreate Profile</span>
					</Button>
				</div>
			)}
			{provider.checks.length > 0 && (
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
									<span className='text-sm font-medium'>{check.label}</span>
									<Badge variant={check_status_variant(check.status)}>
										{check.status}
									</Badge>
								</div>
								<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
									{check.detail}
								</div>
							</div>
							{check.action_url && check.action_label && (
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
									<span>{check.action_label}</span>
									<SquareArrowOutUpRight className='size-3' />
								</a>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const current_config = (s.config ? $copy(s.config) : {}) as Partial<AppConfig>
	const [providers, setProviders] = useState<Array<LinkcaseProvider>>([])
	const [loading, setLoading] = useState(false)
	const [installing_id, setInstallingId] = useState<string | null>(null)
	const [managing_action_id, setManagingActionId] = useState<string | null>(null)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const fallback_chain = getFallbackChain(current_config)
	const fallback_chain_key = fallback_chain.join('|')
	const drag_disabled = loading || installing_id !== null || managing_action_id !== null

	const onChange = useMemoizedFn((values: AppConfig) => {
		s.setConfig('config', values)
	})

	const refreshProviders = useMemoizedFn(async () => {
		setLoading(true)

		try {
			const res = await rpc.linkcase.getContentProviders.query()
			setProviders(orderProvidersByChain(res.providers, fallback_chain))
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to load Linkcase providers')
		} finally {
			setLoading(false)
		}
	})

	const installProvider = useMemoizedFn(async (id: LinkcaseProviderId) => {
		setInstallingId(id)

		try {
			await rpc.linkcase.installContentProvider.mutate({ id })
			toast.success('Installed')
			await refreshProviders()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Install failed')
		} finally {
			setInstallingId(null)
		}
	})

	const manageProvider = useMemoizedFn(async (action: 'create_profile' | 'recreate_profile') => {
		const action_id = `crawl4ai:${action}`
		setManagingActionId(action_id)

		try {
			const res = await rpc.linkcase.manageContentProvider.mutate({ id: 'crawl4ai', action })
			toast.success(
				res.created
					? action === 'recreate_profile'
						? 'Crawl4AI profile recreated from current Chrome session'
						: 'Crawl4AI profile created from current Chrome session'
					: 'Crawl4AI profile already exists'
			)
			await refreshProviders()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Provider action failed')
		} finally {
			setManagingActionId(null)
		}
	})

	const onDragEnd = useMemoizedFn((event: DragEndEvent) => {
		const { active, over } = event

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = providers.findIndex(item => item.id === active.id)
		const to = providers.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		const next_providers = arrayMove(providers, from, to)
		const next_chain = buildNextFallbackChain(
			next_providers.map(item => item.id),
			fallback_chain
		)

		setProviders(next_providers)
		s.setConfig('config', { fetch_fallback_chain: next_chain } as AppConfig, true)
	})

	const { control } = useForm<AppConfig>(
		{
			values: {
				...current_config,
				fetch_fallback_chain: fallback_chain,
				enbale_webfetch_chain: current_config.enbale_webfetch_chain ?? false
			} as AppConfig
		},
		onChange
	)

	useEffect(() => {
		void refreshProviders()
	}, [refreshProviders])

	useEffect(() => {
		setProviders(prev => orderProvidersByChain(prev, fallback_chain))
	}, [fallback_chain_key])

	return (
		<div
			className='
				overflow-y-scroll
				flex flex-col
				w-full h-full
				page_wrap
			'
		>
			<FieldGroup className='gap-0'>
				<div className='flex items-start justify-between py-3'>
					<FieldContent>
						<FieldTitle className='text-base'>Linkcase Content Providers</FieldTitle>
						<FieldDescription>
							Detect, install, and drag to reorder the local providers used by Linkcase.
							This also rewrites `fetch_fallback_chain`; `r.jina.ai` stays as the final
							remote fallback.
						</FieldDescription>
					</FieldContent>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() => void refreshProviders()}
						disabled={loading}
					>
						{loading ? <Spinner className='size-4' /> : <RefreshCw className='size-4' />}
						<span>Refresh</span>
					</Button>
				</div>
				<DndContext sensors={sensors} onDragEnd={onDragEnd}>
					<SortableContext
						items={providers.map(provider => provider.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className='mb-2 flex flex-col gap-2'>
							{providers.map(provider => (
								<SortableProviderCard
									key={provider.id}
									provider={provider}
									drag_disabled={drag_disabled}
									installing_id={installing_id}
									managing_action_id={managing_action_id}
									onInstall={installProvider}
									onManage={manageProvider}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			</FieldGroup>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='vertical'>
					<FieldContent>
						<FieldTitle className='flex items-center text-base'>
							<span>Jina API Key</span>
							<a
								className='icon_button small'
								target='_blank'
								href='https://jina.ai/api-dashboard/reader'
							>
								<SquareArrowOutUpRight></SquareArrowOutUpRight>
							</a>
						</FieldTitle>
						<FieldDescription>
							Used by web_search_tool and web_fetch_tool through s.jina.ai and r.jina.ai
						</FieldDescription>
					</FieldContent>
					<Controller type='input' name='jina_api_key' control={control}>
						<Input type='text' placeholder='jina_...' autoComplete='off' />
					</Controller>
				</Field>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Enable Webfetch Chain</FieldTitle>
						<FieldDescription>
							Use `fetch_fallback_chain` for `webfetch`. Linkcase and `webfetch` now share
							the same ordered local provider chain, with `r.jina.ai` kept as the final
							remote fallback.
						</FieldDescription>
					</FieldContent>
					<Controller type='switch' name='enbale_webfetch_chain' control={control}>
						<Switch></Switch>
					</Controller>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
