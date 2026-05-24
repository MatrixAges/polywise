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

const pthink_hours = Array.from({ length: 24 }, (_, hour) => ({ label: `${hour}:00`, value: String(hour) }))
const pthink_idle_options = [
	{ label: '10 min', value: '10' },
	{ label: '20 min', value: '20' },
	{ label: '30 min', value: '30' },
	{ label: '45 min', value: '45' },
	{ label: '60 min', value: '60' }
]
const pthink_weekdays = [
	{ label: 'Sunday', value: 'sun' },
	{ label: 'Monday', value: 'mon' },
	{ label: 'Tuesday', value: 'tue' },
	{ label: 'Wednesday', value: 'wed' },
	{ label: 'Thursday', value: 'thu' },
	{ label: 'Friday', value: 'fri' },
	{ label: 'Saturday', value: 'sat' }
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
							Where exported `.papk` files are written. Leave empty to use the system
							Downloads folder.
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
							Run automatic background reporting on schedule while keeping manual report
							generation available in Home / Report.
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
						<FieldTitle className='text-base'>Daily Report</FieldTitle>
						<FieldDescription>
							Generate a daily summary on a fixed schedule using Croner
						</FieldDescription>
					</FieldContent>
					<div className='flex items-center gap-3'>
						<Switch
							checked={Boolean(pthink?.daily_report_enabled)}
							onCheckedChange={checked => updatePthink({ daily_report_enabled: checked })}
						/>
						<Select
							items={pthink_hours}
							value={String(pthink?.daily_report_hour ?? 21)}
							onValueChange={value => updatePthink({ daily_report_hour: Number(value) })}
						>
							<SelectTrigger className='workspace_selector w-[110px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Daily Hour</SelectLabel>
									{pthink_hours.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Weekly Report</FieldTitle>
						<FieldDescription>
							Generate a longer weekly summary with behavior and content patterns
						</FieldDescription>
					</FieldContent>
					<div className='flex items-center gap-3'>
						<Switch
							checked={Boolean(pthink?.weekly_report_enabled)}
							onCheckedChange={checked => updatePthink({ weekly_report_enabled: checked })}
						/>
						<Select
							items={pthink_weekdays}
							value={pthink?.weekly_report_weekday ?? 'sun'}
							onValueChange={value =>
								updatePthink({
									weekly_report_weekday:
										value as AppPthinkConfig['weekly_report_weekday']
								})
							}
						>
							<SelectTrigger className='workspace_selector w-[130px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Weekday</SelectLabel>
									{pthink_weekdays.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<Select
							items={pthink_hours}
							value={String(pthink?.weekly_report_hour ?? 20)}
							onValueChange={value => updatePthink({ weekly_report_hour: Number(value) })}
						>
							<SelectTrigger className='workspace_selector w-[110px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>Weekly Hour</SelectLabel>
									{pthink_hours.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
