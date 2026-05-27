import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

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

import type { AppConfig, AppPthinkConfig, AppReportConfig } from '@core/types'

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
const default_report_time = '18:00'
const normalizeReportTime = (value: string) =>
	/^([01]?\d|2[0-3]):([0-5]\d)$/.test(value) ? value : default_report_time
const report_weekday_options = [
	{ label: 'Monday', value: 'mon' },
	{ label: 'Tuesday', value: 'tue' },
	{ label: 'Wednesday', value: 'wed' },
	{ label: 'Thursday', value: 'thu' },
	{ label: 'Friday', value: 'fri' },
	{ label: 'Saturday', value: 'sat' },
	{ label: 'Sunday', value: 'sun' }
]
const report_monthly_mode_options = [
	{ label: 'Last day', value: 'last_day' },
	{ label: 'Next month first day', value: 'next_month_first_day' }
]
const report_yearly_mode_options = [
	{ label: 'Last day', value: 'last_day' },
	{ label: 'Next year first day', value: 'next_year_first_day' }
]

const Index = () => {
	const global = useGlobal()
	const t = global.theme
	const l = global.locale
	const s = global.setting
	const a = global.auth
	const pthink = s.config?.pthink
	const report = s.config?.report
	const [bootstrap_password, setBootstrapPassword] = useState('')
	const [bootstrap_confirm, setBootstrapConfirm] = useState('')
	const [next_password, setNextPassword] = useState('')
	const [next_password_confirm, setNextPasswordConfirm] = useState('')

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

	const updateReport = useMemoizedFn((patch: Partial<AppReportConfig>) => {
		const current_config = s.config

		if (!current_config) {
			return
		}

		s.setConfig('config', {
			...(current_config as AppConfig),
			report: {
				...(current_config.report || { enabled: true }),
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

	const updateAuthEnabled = useMemoizedFn(async (enabled: boolean) => {
		await s.setConfig(
			'config',
			{
				auth: {
					enabled
				}
			} as Partial<AppConfig>,
			true
		)

		await a.refreshStatus()
		toast.success(enabled ? 'Auth enabled.' : 'Auth disabled.')
	})

	const submitBootstrapPassword = useMemoizedFn(async () => {
		if (bootstrap_password.length < 8) {
			toast.error('Password must be at least 8 characters.')
			return
		}

		if (bootstrap_password !== bootstrap_confirm) {
			toast.error('Passwords do not match.')
			return
		}

		try {
			await a.bootstrapPassword(bootstrap_password)
			setBootstrapPassword('')
			setBootstrapConfirm('')
			toast.success('Password configured. You can now sign in.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	const submitPasswordChange = useMemoizedFn(async () => {
		if (next_password.length < 8) {
			toast.error('New password must be at least 8 characters.')
			return
		}

		if (next_password !== next_password_confirm) {
			toast.error('Passwords do not match.')
			return
		}

		try {
			await a.changePassword(next_password)
			setNextPassword('')
			setNextPasswordConfirm('')
			toast.success('Password updated.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	const submitLogout = useMemoizedFn(async () => {
		try {
			await a.logout()
			toast.success('Logged out.')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	return (
		<div className='h-full overflow-y-scroll'>
			<div
				className='
					flex flex-col
					w-full
					page_wrap
				'
			>
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
								Select your preferred language for the application interface and
								notifications
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
							<FieldTitle className='text-base'>Auth</FieldTitle>
							<FieldDescription>
								Enable Better Auth password login for the standalone web runtime.
								Electron keeps bypassing auth even when this is on.
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(s.config?.auth?.enabled ?? a.status?.enabled)}
							onCheckedChange={checked => void updateAuthEnabled(checked)}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Auth Runtime</FieldTitle>
							<FieldDescription>
								Username is fixed to `{a.status?.username || 'polywiser'}`. Current
								server platform is `{a.status?.platform || 'standalone'}`.
							</FieldDescription>
						</FieldContent>
						<div
							className='
								flex flex-col
								items-end
								w-[380px]
								gap-2
								text-std-500 text-sm leading-6
							'
						>
							<div>
								{a.status?.bootstrap_required
									? 'Auth is enabled and no account is configured yet.'
									: a.status?.has_account
										? 'Auth account is configured.'
										: 'Auth is currently disabled.'}
							</div>
							{a.status?.has_account && a.authenticated && (
								<Button variant='outline' size='sm' onClick={() => void submitLogout()}>
									Logout
								</Button>
							)}
						</div>
					</Field>
					{a.status?.bootstrap_required && (
						<Field className='items-start! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Set Initial Password</FieldTitle>
								<FieldDescription>
									Create the only local auth account for username `
									{a.status.username}`.
								</FieldDescription>
							</FieldContent>
							<div className='flex w-[380px] flex-col gap-2'>
								<Input
									type='password'
									placeholder='New password'
									value={bootstrap_password}
									onChange={event => setBootstrapPassword(event.target.value)}
								></Input>
								<Input
									type='password'
									placeholder='Confirm password'
									value={bootstrap_confirm}
									onChange={event => setBootstrapConfirm(event.target.value)}
								></Input>
								<Button onClick={() => void submitBootstrapPassword()}>
									Set Password
								</Button>
							</div>
						</Field>
					)}
					{a.status?.has_account && (
						<Field className='items-start! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>Change Password</FieldTitle>
								<FieldDescription>
									{a.canChangePassword
										? 'Update the password for the fixed account.'
										: 'Login is required in web mode before changing the password.'}
								</FieldDescription>
							</FieldContent>
							<div className='flex w-[380px] flex-col gap-2'>
								<Input
									type='password'
									placeholder='New password'
									value={next_password}
									onChange={event => setNextPassword(event.target.value)}
									disabled={!a.canChangePassword}
								></Input>
								<Input
									type='password'
									placeholder='Confirm password'
									value={next_password_confirm}
									onChange={event => setNextPasswordConfirm(event.target.value)}
									disabled={!a.canChangePassword}
								></Input>
								<Button
									disabled={!a.canChangePassword}
									onClick={() => void submitPasswordChange()}
								>
									Change Password
								</Button>
							</div>
						</Field>
					)}
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
							<FieldTitle className='text-base'>Report</FieldTitle>
							<FieldDescription>
								Enable the existing report generation mechanism and report tool entry
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(report?.enabled ?? true)}
							onCheckedChange={checked => updateReport({ enabled: checked })}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Daily Report</FieldTitle>
							<FieldDescription>
								Generate the day report automatically at the configured local time.
							</FieldDescription>
						</FieldContent>
						<div className='flex w-[380px] items-center gap-2'>
							<Switch
								checked={Boolean(report?.daily_enabled)}
								onCheckedChange={checked => updateReport({ daily_enabled: checked })}
							/>
							<Input
								type='time'
								step={60}
								value={normalizeReportTime(report?.daily_time || default_report_time)}
								onChange={event =>
									updateReport({
										daily_time: normalizeReportTime(event.target.value)
									})
								}
							></Input>
						</div>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Weekly Report</FieldTitle>
							<FieldDescription>
								Choose the weekday and local time for weekly report generation.
							</FieldDescription>
						</FieldContent>
						<div className='flex w-[380px] items-center gap-2'>
							<Switch
								checked={Boolean(report?.weekly_enabled)}
								onCheckedChange={checked => updateReport({ weekly_enabled: checked })}
							/>
							<Select
								items={report_weekday_options}
								value={report?.weekly_weekday || 'sun'}
								onValueChange={value =>
									updateReport({
										weekly_weekday: value as NonNullable<
											AppReportConfig['weekly_weekday']
										>
									})
								}
							>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>Weekday</SelectLabel>
										{report_weekday_options.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<Input
								type='time'
								step={60}
								value={normalizeReportTime(report?.weekly_time || default_report_time)}
								onChange={event =>
									updateReport({
										weekly_time: normalizeReportTime(event.target.value)
									})
								}
							></Input>
						</div>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Monthly Report</FieldTitle>
							<FieldDescription>
								Run on the month&apos;s last day or on the next month&apos;s first day.
							</FieldDescription>
						</FieldContent>
						<div className='flex w-[380px] items-center gap-2'>
							<Switch
								checked={Boolean(report?.monthly_enabled)}
								onCheckedChange={checked => updateReport({ monthly_enabled: checked })}
							/>
							<Select
								items={report_monthly_mode_options}
								value={report?.monthly_mode || 'last_day'}
								onValueChange={value =>
									updateReport({
										monthly_mode: value as NonNullable<
											AppReportConfig['monthly_mode']
										>
									})
								}
							>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>Monthly Mode</SelectLabel>
										{report_monthly_mode_options.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<Input
								type='time'
								step={60}
								value={normalizeReportTime(report?.monthly_time || default_report_time)}
								onChange={event =>
									updateReport({
										monthly_time: normalizeReportTime(event.target.value)
									})
								}
							></Input>
						</div>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Yearly Report</FieldTitle>
							<FieldDescription>
								Run on the year&apos;s last day or on the next year&apos;s first day.
							</FieldDescription>
						</FieldContent>
						<div className='flex w-[380px] items-center gap-2'>
							<Switch
								checked={Boolean(report?.yearly_enabled)}
								onCheckedChange={checked => updateReport({ yearly_enabled: checked })}
							/>
							<Select
								items={report_yearly_mode_options}
								value={report?.yearly_mode || 'last_day'}
								onValueChange={value =>
									updateReport({
										yearly_mode: value as NonNullable<
											AppReportConfig['yearly_mode']
										>
									})
								}
							>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>Yearly Mode</SelectLabel>
										{report_yearly_mode_options.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<Input
								type='time'
								step={60}
								value={normalizeReportTime(report?.yearly_time || default_report_time)}
								onChange={event =>
									updateReport({
										yearly_time: normalizeReportTime(event.target.value)
									})
								}
							></Input>
						</div>
					</Field>
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Post-Think</FieldTitle>
							<FieldDescription>
								When the app is idle, review today&apos;s newly accumulated messages and
								turn durable findings into articles, and only when strongly justified,
								skills or tools.
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
							onValueChange={value =>
								updatePthink({ idle_grace_ms: Number(value) * 60 * 1000 })
							}
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
							value={String(
								Math.round((pthink?.review_cooldown_ms ?? 15 * 60 * 1000) / 60000)
							)}
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
								Allow post-think to write a local skill only when the extracted workflow
								is clearly reusable
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(pthink?.skill_generation_enabled ?? true)}
							onCheckedChange={checked =>
								updatePthink({ skill_generation_enabled: checked })
							}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>Tool Generation</FieldTitle>
							<FieldDescription>
								Allow post-think to create a custom tool only under a much stricter
								confidence bar
							</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(pthink?.tool_generation_enabled ?? true)}
							onCheckedChange={checked =>
								updatePthink({ tool_generation_enabled: checked })
							}
						/>
					</Field>
				</FieldGroup>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
