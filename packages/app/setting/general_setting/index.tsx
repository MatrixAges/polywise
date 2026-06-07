import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
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

const default_report_time = '18:00'
const normalizeReportTime = (value: string) =>
	/^([01]?\d|2[0-3]):([0-5]\d)$/.test(value) ? value : default_report_time

const Index = () => {
	const global = useGlobal()
	const { t: tt } = useTranslation('setting')
	const t = global.theme
	const l = global.locale
	const s = global.setting
	const a = global.auth
	const pthink = s.config?.pthink
	const report = s.config?.report
	const pthink_idle_options = [
		{ label: tt('general.option_minutes', { count: 10 }), value: '10' },
		{ label: tt('general.option_minutes', { count: 20 }), value: '20' },
		{ label: tt('general.option_minutes', { count: 30 }), value: '30' },
		{ label: tt('general.option_minutes', { count: 45 }), value: '45' },
		{ label: tt('general.option_minutes', { count: 60 }), value: '60' }
	]
	const pthink_cooldown_options = [
		{ label: tt('general.option_minutes', { count: 10 }), value: '10' },
		{ label: tt('general.option_minutes', { count: 15 }), value: '15' },
		{ label: tt('general.option_minutes', { count: 30 }), value: '30' },
		{ label: tt('general.option_minutes', { count: 60 }), value: '60' }
	]
	const pthink_message_threshold_options = [
		{ label: tt('general.option_messages', { count: 3 }), value: '3' },
		{ label: tt('general.option_messages', { count: 6 }), value: '6' },
		{ label: tt('general.option_messages', { count: 10 }), value: '10' },
		{ label: tt('general.option_messages', { count: 15 }), value: '15' },
		{ label: tt('general.option_messages', { count: 20 }), value: '20' }
	]
	const report_weekday_options = [
		{ label: tt('general.option_monday'), value: 'mon' },
		{ label: tt('general.option_tuesday'), value: 'tue' },
		{ label: tt('general.option_wednesday'), value: 'wed' },
		{ label: tt('general.option_thursday'), value: 'thu' },
		{ label: tt('general.option_friday'), value: 'fri' },
		{ label: tt('general.option_saturday'), value: 'sat' },
		{ label: tt('general.option_sunday'), value: 'sun' }
	]
	const report_monthly_mode_options = [
		{ label: tt('general.option_last_day'), value: 'last_day' },
		{ label: tt('general.option_next_month_first_day'), value: 'next_month_first_day' }
	]
	const report_yearly_mode_options = [
		{ label: tt('general.option_last_day'), value: 'last_day' },
		{ label: tt('general.option_next_year_first_day'), value: 'next_year_first_day' }
	]
	const [bootstrap_password, setBootstrapPassword] = useState('')
	const [bootstrap_confirm, setBootstrapConfirm] = useState('')
	const [next_password, setNextPassword] = useState('')
	const [next_password_confirm, setNextPasswordConfirm] = useState('')

	const onChange = useMemoizedFn((_, changed) => {
		if ('theme' in changed) t.setTheme(changed['theme'])
		if ('lang' in changed) void l.setLang(changed['lang'])
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
		toast.success(enabled ? tt('general.toast_auth_enabled') : tt('general.toast_auth_disabled'))
	})

	const updatePageBridgeEnabled = useMemoizedFn(async (enabled: boolean) => {
		await s.setConfig(
			'config',
			{
				page_bridge_enabled: enabled
			} as Partial<AppConfig>,
			true
		)

		toast.success(enabled ? tt('general.toast_page_bridge_enabled') : tt('general.toast_page_bridge_disabled'))
	})

	const updatePromptFullInject = useMemoizedFn(async (enabled: boolean) => {
		await s.setConfig(
			'config',
			{
				prompt_full_inject: enabled
			} as Partial<AppConfig>,
			true
		)

		toast.success(
			enabled
				? tt('general.toast_prompt_full_injection_enabled')
				: tt('general.toast_prompt_full_injection_disabled')
		)
	})

	const submitBootstrapPassword = useMemoizedFn(async () => {
		if (bootstrap_password.length < 8) {
			toast.error(tt('general.toast_password_too_short'))
			return
		}

		if (bootstrap_password !== bootstrap_confirm) {
			toast.error(tt('general.toast_password_mismatch'))
			return
		}

		try {
			await a.bootstrapPassword(bootstrap_password)
			setBootstrapPassword('')
			setBootstrapConfirm('')
			toast.success(tt('general.toast_password_configured'))
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	const submitPasswordChange = useMemoizedFn(async () => {
		if (next_password.length < 8) {
			toast.error(tt('general.toast_new_password_too_short'))
			return
		}

		if (next_password !== next_password_confirm) {
			toast.error(tt('general.toast_password_mismatch'))
			return
		}

		try {
			await a.changePassword(next_password)
			setNextPassword('')
			setNextPasswordConfirm('')
			toast.success(tt('general.toast_password_updated'))
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error))
		}
	})

	const submitLogout = useMemoizedFn(async () => {
		try {
			await a.logout()
			toast.success(tt('general.toast_logged_out'))
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
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.language')}</FieldTitle>
							<FieldDescription>{tt('general.language_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='lang' control={control}>
							<Select
								items={locale_options.map(item => ({
									label:
										item.value === 'en'
											? tt('general.option_english')
											: tt('general.option_simplified_chinese'),
									value: item.value
								}))}
							>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>{tt('general.language')}</SelectLabel>
										{locale_options.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.value === 'en'
													? tt('general.option_english')
													: tt('general.option_simplified_chinese')}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Controller>
					</Field>
					<Field
						className='
							items-center!
							py-3
						'
						orientation='horizontal'
					>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.theme')}</FieldTitle>
							<FieldDescription>{tt('general.theme_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='theme' control={control}>
							<Select items={themes.map(item => ({ label: item, value: item }))}>
								<SelectTrigger className='workspace_selector'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align='start'>
									<SelectGroup>
										<SelectLabel>{tt('general.theme_label')}</SelectLabel>
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
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.page_bridge')}</FieldTitle>
							<FieldDescription>{tt('general.page_bridge_desc')}</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(s.config?.page_bridge_enabled)}
							onCheckedChange={checked => void updatePageBridgeEnabled(checked)}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{tt('general.prompt_full_inject')}
							</FieldTitle>
							<FieldDescription>{tt('general.prompt_full_inject_desc')}</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(s.config?.prompt_full_inject)}
							onCheckedChange={checked => void updatePromptFullInject(checked)}
						/>
					</Field>
					<div className='bg-border-light my-2 h-px w-full'></div>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.auth')}</FieldTitle>
							<FieldDescription>{tt('general.auth_desc')}</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(s.config?.auth?.enabled ?? a.status?.enabled)}
							onCheckedChange={checked => void updateAuthEnabled(checked)}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.auth_runtime')}</FieldTitle>
							<FieldDescription>
								{tt('general.auth_runtime_desc', {
									username: a.status?.username || 'polywiser',
									platform: a.status?.platform || 'standalone'
								})}
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
									? tt('general.auth_status_bootstrap')
									: a.status?.has_account
										? tt('general.auth_status_ready')
										: tt('general.auth_status_disabled')}
							</div>
							{a.status?.has_account && a.authenticated && (
								<Button variant='outline' size='sm' onClick={() => void submitLogout()}>
									{tt('general.logout')}
								</Button>
							)}
						</div>
					</Field>
					{a.status?.bootstrap_required && (
						<Field className='items-start! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>
									{tt('general.set_initial_password')}
								</FieldTitle>
								<FieldDescription>
									{tt('general.set_initial_password_desc', {
										username: a.status.username
									})}
								</FieldDescription>
							</FieldContent>
							<div className='flex w-[380px] flex-col gap-2'>
								<Input
									type='password'
									placeholder={tt('general.new_password')}
									value={bootstrap_password}
									onChange={event => setBootstrapPassword(event.target.value)}
								></Input>
								<Input
									type='password'
									placeholder={tt('general.confirm_password')}
									value={bootstrap_confirm}
									onChange={event => setBootstrapConfirm(event.target.value)}
								></Input>
								<Button onClick={() => void submitBootstrapPassword()}>
									{tt('general.set_password')}
								</Button>
							</div>
						</Field>
					)}
					{a.status?.has_account && (
						<Field className='items-start! py-3' orientation='horizontal'>
							<FieldContent>
								<FieldTitle className='text-base'>
									{tt('general.change_password')}
								</FieldTitle>
								<FieldDescription>
									{a.canChangePassword
										? tt('general.change_password_desc_ready')
										: tt('general.change_password_desc_login')}
								</FieldDescription>
							</FieldContent>
							<div className='flex w-[380px] flex-col gap-2'>
								<Input
									type='password'
									placeholder={tt('general.new_password')}
									value={next_password}
									onChange={event => setNextPassword(event.target.value)}
									disabled={!a.canChangePassword}
								></Input>
								<Input
									type='password'
									placeholder={tt('general.confirm_password')}
									value={next_password_confirm}
									onChange={event => setNextPasswordConfirm(event.target.value)}
									disabled={!a.canChangePassword}
								></Input>
								<Button
									disabled={!a.canChangePassword}
									onClick={() => void submitPasswordChange()}
								>
									{tt('general.change_password_action')}
								</Button>
							</div>
						</Field>
					)}
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{tt('general.agent_export_dir')}
							</FieldTitle>
							<FieldDescription>{tt('general.agent_export_dir_desc')}</FieldDescription>
						</FieldContent>
						<div className='flex w-[380px] items-center gap-2'>
							<Input
								value={s.config?.agent_export_dir || ''}
								placeholder={tt('general.downloads_placeholder')}
								onChange={event => setAgentExportDir(event.target.value)}
							></Input>
							<Button variant='ghost' type='button' onClick={resetAgentExportDir}>
								{tt('general.reset')}
							</Button>
						</div>
					</Field>
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.report')}</FieldTitle>
							<FieldDescription>{tt('general.report_desc')}</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(report?.enabled ?? true)}
							onCheckedChange={checked => updateReport({ enabled: checked })}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.daily_report')}</FieldTitle>
							<FieldDescription>{tt('general.daily_report_desc')}</FieldDescription>
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
							<FieldTitle className='text-base'>{tt('general.weekly_report')}</FieldTitle>
							<FieldDescription>{tt('general.weekly_report_desc')}</FieldDescription>
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
										<SelectLabel>{tt('general.weekday_label')}</SelectLabel>
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
							<FieldTitle className='text-base'>{tt('general.monthly_report')}</FieldTitle>
							<FieldDescription>{tt('general.monthly_report_desc')}</FieldDescription>
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
										<SelectLabel>
											{tt('general.monthly_mode_label')}
										</SelectLabel>
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
							<FieldTitle className='text-base'>{tt('general.yearly_report')}</FieldTitle>
							<FieldDescription>{tt('general.yearly_report_desc')}</FieldDescription>
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
										<SelectLabel>{tt('general.yearly_mode_label')}</SelectLabel>
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
							<FieldTitle className='text-base'>{tt('general.post_think')}</FieldTitle>
							<FieldDescription>{tt('general.post_think_desc')}</FieldDescription>
						</FieldContent>
						<Switch
							checked={Boolean(pthink?.enabled)}
							onCheckedChange={checked => updatePthink({ enabled: checked })}
						/>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>{tt('general.idle_grace')}</FieldTitle>
							<FieldDescription>{tt('general.idle_grace_desc')}</FieldDescription>
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
									<SelectLabel>{tt('general.idle_grace')}</SelectLabel>
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
							<FieldTitle className='text-base'>
								{tt('general.message_threshold')}
							</FieldTitle>
							<FieldDescription>{tt('general.message_threshold_desc')}</FieldDescription>
						</FieldContent>
						<Select
							items={pthink_message_threshold_options}
							value={String(pthink?.min_messages ?? 6)}
							onValueChange={value => updatePthink({ min_messages: Number(value) })}
						>
							<SelectTrigger className='workspace_selector'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='start'>
								<SelectGroup>
									<SelectLabel>{tt('general.message_threshold')}</SelectLabel>
									{pthink_message_threshold_options.map(item => (
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
							<FieldTitle className='text-base'>{tt('general.review_cooldown')}</FieldTitle>
							<FieldDescription>{tt('general.review_cooldown_desc')}</FieldDescription>
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
									<SelectLabel>{tt('general.review_cooldown')}</SelectLabel>
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
							<FieldTitle className='text-base'>
								{tt('general.skill_generation')}
							</FieldTitle>
							<FieldDescription>{tt('general.skill_generation_desc')}</FieldDescription>
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
							<FieldTitle className='text-base'>{tt('general.tool_generation')}</FieldTitle>
							<FieldDescription>{tt('general.tool_generation_desc')}</FieldDescription>
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
