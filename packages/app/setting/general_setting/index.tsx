import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { locale_options, themes } from '@/appdata'
import { Controller } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'

import type { AppConfig, AppPthinkConfig } from '@core/types'

const pthink_idle_options = [
	{ label: '10 min', value: '10' },
	{ label: '20 min', value: '20' },
	{ label: '30 min', value: '30' },
	{ label: '45 min', value: '45' },
	{ label: '60 min', value: '60' }
]
const pthink_cooldown_options = [
	{ label: '10 min', value: '10' },
	{ label: '15 min', value: '15' },
	{ label: '30 min', value: '30' },
	{ label: '60 min', value: '60' }
]
const Index = () => {
	const global = useGlobal()
	const t = global.theme
	const l = global.locale
	const s = global.setting
	const pthink = s.config?.pthink

	const onChange = useMemoizedFn((_, changed) => {
		if ('theme' in changed) t.setTheme(changed['theme'])
		if ('lang' in changed) l.setLang(changed['lang'])
	})

	const { control } = useForm<{ theme: string; lang: string }>(
		{ values: { theme: t.theme_source, lang: l.lang } },
		onChange
	)

	const updatePthink = useMemoizedFn((patch: Partial<AppPthinkConfig>) => {
		const current_config = s.config

		if (!current_config) {
			return
		}

		s.setConfig('config', {
			...(current_config as AppConfig),
			pthink: {
				...current_config.pthink,
				...patch
			}
		})
	})

	const resetAgentExportDir = useMemoizedFn(() => {
		if (!s.config) {
			return
		}

		s.setConfig('config', {
			...(s.config as AppConfig),
			agent_export_dir: ''
		})
	})

	const setAgentExportDir = useMemoizedFn((value: string) => {
		if (!s.config) {
			return
		}

		s.setConfig('config', {
			...(s.config as AppConfig),
			agent_export_dir: value
		})
	})

	return (
		<div className='page_wrap flex w-full flex-col'>
			<FieldGroup className='gap-0'>
				<Field
					className='
						items-center!
						py-3
					'
					orientation='horizontal'
				>
					<FieldContent>
						<FieldTitle className='text-base'>Theme</FieldTitle>
						<FieldDescription>
							Customize the visual interface, including color modes and system
							synchronization
						</FieldDescription>
					</FieldContent>
					<Controller name='theme' control={control}>
						<Select items={themes.map(item => ({ label: item, value: item }))}>
							<SelectTrigger className='workspace_selector'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Theme</SelectLabel>
									{themes.map(item => (
										<SelectItem value={item} key={item}>
											{item}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Controller>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Language</FieldTitle>
						<FieldDescription>
							Select your preferred language for the application interface and notifications
						</FieldDescription>
					</FieldContent>
					<Controller name='lang' control={control}>
						<Select items={locale_options}>
							<SelectTrigger className='workspace_selector'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Language</SelectLabel>
									{locale_options.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Controller>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Agent Export Directory</FieldTitle>
						<FieldDescription>
							Where exported `.papk` files are written. Default is Downloads folder.
						</FieldDescription>
					</FieldContent>
					<div className='flex w-[380px] items-center gap-2'>
						<Input
							value={s.config?.agent_export_dir || ''}
							placeholder='Downloads'
							onChange={event => setAgentExportDir(event.target.value)}
						></Input>
						<Button variant='ghost' type='button' onClick={resetAgentExportDir}>
							Reset
						</Button>
					</div>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Post-Think</FieldTitle>
						<FieldDescription>
							When the app is idle, review today&apos;s newly accumulated messages and turn
							durable findings into articles, and only when strongly justified, skills or
							tools.
						</FieldDescription>
					</FieldContent>
					<Switch
						checked={Boolean(pthink?.enabled)}
						onCheckedChange={checked => updatePthink({ enabled: checked })}
					/>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Idle Grace</FieldTitle>
						<FieldDescription>
							How long the app should stay inactive before post-think can start
						</FieldDescription>
					</FieldContent>
					<Select
						items={pthink_idle_options}
						value={String(Math.round((pthink?.idle_grace_ms ?? 20 * 60 * 1000) / 60000))}
						onValueChange={value => updatePthink({ idle_grace_ms: Number(value) * 60 * 1000 })}
					>
						<SelectTrigger className='workspace_selector'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align='start'>
							<SelectGroup>
								<SelectLabel>Idle Grace</SelectLabel>
								{pthink_idle_options.map(item => (
									<SelectItem value={item.value} key={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Review Cooldown</FieldTitle>
						<FieldDescription>
							Minimum time between two automatic post-think review runs
						</FieldDescription>
					</FieldContent>
					<Select
						items={pthink_cooldown_options}
						value={String(Math.round((pthink?.review_cooldown_ms ?? 15 * 60 * 1000) / 60000))}
						onValueChange={value =>
							updatePthink({ review_cooldown_ms: Number(value) * 60 * 1000 })
						}
					>
						<SelectTrigger className='workspace_selector'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align='start'>
							<SelectGroup>
								<SelectLabel>Review Cooldown</SelectLabel>
								{pthink_cooldown_options.map(item => (
									<SelectItem value={item.value} key={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Skill Generation</FieldTitle>
						<FieldDescription>
							Allow post-think to write a local skill only when the extracted workflow is
							clearly reusable
						</FieldDescription>
					</FieldContent>
					<Switch
						checked={Boolean(pthink?.skill_generation_enabled ?? true)}
						onCheckedChange={checked => updatePthink({ skill_generation_enabled: checked })}
					/>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Tool Generation</FieldTitle>
						<FieldDescription>
							Allow post-think to create a custom tool only under a much stricter confidence
							bar
						</FieldDescription>
					</FieldContent>
					<Switch
						checked={Boolean(pthink?.tool_generation_enabled ?? true)}
						onCheckedChange={checked => updatePthink({ tool_generation_enabled: checked })}
					/>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
