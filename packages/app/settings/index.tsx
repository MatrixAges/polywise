import { useLayoutEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Button, Form, Radio, Select, Switch, Tooltip } from 'antd'
import { Languages, Moon, Palette, Spotlight, Sun } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { locale_options, themes } from '@/appdata'
import { Modal } from '@/components'
import { useGlobal } from '@/context'

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
			theme: x.theme_source
		})
	}, [x.open])

	const onValuesChange = useMemoizedFn(v => {
		if ('lang' in v) x.setLang(v.lang)
		if ('theme' in v) x.setTheme(v.theme)
	})

	return (
		<Modal
			title='Settings'
			width='max(510px,60%)'
			mask_closable
			max_width={810}
			open={x.open}
			onClose={x.toggleSettings}
		>
			<Form
				className='
					flex flex-col
					w-full
					gap-4
				'
				layout='inline'
				form={form}
				onValuesChange={onValuesChange}
			>
				<Item name='lang' Icon={Languages} title='Language'>
					<Select
						className='select'
						options={locale_options}
						popupMatchSelectWidth={false}
					></Select>
				</Item>
				<Item
					name='theme'
					Icon={Palette}
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
									border-none!
									hover:text-std-black!
									justify_center align_center clickable mr_12
								`,
									x.auto_theme && 'bg-std-800! text-std-100! hover:text-std-white!'
								)}
								onClick={x.toggleAutoTheme}
								shape='circle'
							>
								{x.theme_value === 'light' ? (
									<Moon size={16}></Moon>
								) : (
									<Sun size={16}></Sun>
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
			</Form>
		</Modal>
	)
}

export default new $app.handle(Index).by(observer).by($app.memo).get()
