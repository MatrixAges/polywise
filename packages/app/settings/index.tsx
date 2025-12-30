import { useLayoutEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Button, Form, Radio, Select, Switch, Tooltip } from 'antd'
import { observer } from 'mobx-react-lite'

import { locale_options, themes } from '@/appdata'
import { Modal } from '@/components'
import { useGlobal } from '@/context'
import { AppWindowIcon, MoonIcon, PaletteIcon, SunIcon, TranslateIcon } from '@phosphor-icons/react'

import { Item } from './components'

const { useForm } = Form
const { Group } = Radio

const Index = () => {
	const global = useGlobal()
	const x = global.settings
	const [form] = useForm()
	const { setFieldsValue } = form

	useLayoutEffect(() => {
		if (!x.open) return

		setFieldsValue({
			lang: x.lang,
			theme: x.theme_source,
			glass: x.glass
		})
	}, [x.open])

	const onValuesChange = useMemoizedFn(v => {
		if ('lang' in v) x.setLang(v.lang)
		if ('theme' in v) x.setTheme(v.theme)
		if ('glass' in v) x.setGlass(v.glass)
	})

	return (
		<Modal
			title='Settings'
			width='max(510px,64%)'
			mask_closable
			max_width={810}
			open={x.open}
			onClose={x.toggleSettings}
		>
			<Form
				className='flex w-full flex-col gap-4'
				layout='inline'
				form={form}
				onValuesChange={onValuesChange}
			>
				<Item name='lang' Icon={TranslateIcon} title='Language'>
					<Select
						className='select'
						options={locale_options}
						popupMatchSelectWidth={false}
					></Select>
				</Item>
				<Item
					name='theme'
					Icon={PaletteIcon}
					title='Theme'
					extra={
						<Tooltip
							title='Auto Theme'
							mouseEnterDelay={0.6}
							placement='left'
							styles={{ root: { width: 180 } }}
						>
							<Button
								className={$cx(
									`
									flex
									bg-std-200!
									border-0!
									justify_center align_center clickable mr_12
								`,
									x.auto_theme && 'active'
								)}
								onClick={x.toggleAutoTheme}
								shape='circle'
							>
								{x.theme_value === 'light' ? (
									<MoonIcon
										size={18}
										weight={x.auto_theme ? 'fill' : 'regular'}
									></MoonIcon>
								) : (
									<SunIcon
										size={18}
										weight={x.auto_theme ? 'fill' : 'regular'}
									></SunIcon>
								)}
							</Button>
						</Tooltip>
					}
				>
					<Select
						className='select'
						options={themes.map(item => ({
							label: item,
							value: item
						}))}
						popupMatchSelectWidth={false}
					></Select>
				</Item>
				<Item name='glass' Icon={AppWindowIcon} title='Glass'>
					<Switch size='small'></Switch>
				</Item>
			</Form>
		</Modal>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()
