import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { ArrowDownToLine, RefreshCw, SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { Controller } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'
import { rpc } from '@/utils'

import type { AppConfig } from '@core/types'

type LinkcaseProvider = Awaited<ReturnType<typeof rpc.linkcase.getContentProviders.query>>['providers'][number]

const provider_status_text = (provider: LinkcaseProvider) => {
	return provider.installed ? 'Installed' : 'Not installed'
}

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const [providers, setProviders] = useState<Array<LinkcaseProvider>>([])
	const [loading, setLoading] = useState(false)
	const [installing_id, setInstallingId] = useState<string | null>(null)

	const onChange = useMemoizedFn((values: AppConfig) => {
		s.setConfig('config', values)
	})

	const refreshProviders = useMemoizedFn(async () => {
		setLoading(true)

		try {
			const res = await rpc.linkcase.getContentProviders.query()
			setProviders(res.providers)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to load Linkcase providers')
		} finally {
			setLoading(false)
		}
	})

	const installProvider = useMemoizedFn(async (id: LinkcaseProvider['id']) => {
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

	const { control } = useForm<AppConfig>({ values: $copy(s.config) }, onChange)

	useEffect(() => {
		void refreshProviders()
	}, [refreshProviders])

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
							Detect and install the local providers used by Linkcase.
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
				<div className='flex flex-col gap-2'>
					{providers.map(provider => (
						<div
							key={provider.id}
							className='
								flex
								items-center justify-between
								px-3 py-3
								rounded-2xl
								bg-muted/20
								border border-border-light
							'
						>
							<div className='flex flex-col gap-1'>
								<div className='flex items-center gap-2'>
									<span className='font-medium'>{provider.name}</span>
									<Badge variant={provider.installed ? 'default' : 'outline'}>
										{provider_status_text(provider)}
									</Badge>
								</div>
								<div className='text-std-500 text-sm'>{provider.description}</div>
								<a
									className='text-std-400 text-xs underline underline-offset-4'
									href={provider.docs_url}
									target='_blank'
								>
									Installation docs
								</a>
							</div>
							<Button
								type='button'
								variant={provider.installed ? 'outline' : 'default'}
								size='sm'
								disabled={provider.installed || installing_id === provider.id}
								onClick={() => void installProvider(provider.id)}
							>
								{installing_id === provider.id ? (
									<Spinner className='size-4' />
								) : (
									<ArrowDownToLine className='size-4' />
								)}
								<span>{provider.installed ? 'Installed' : 'Install'}</span>
							</Button>
						</div>
					))}
				</div>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
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
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
