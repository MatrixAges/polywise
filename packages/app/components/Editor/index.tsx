import { useLayoutEffect, useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/components'
import { useAliveEffect, useTheme } from '@/hooks'
import markdown from '@/styles/markdown.module.css'

import { ActionBar, Emoji, Image, Katex, Menu, Mermaid, Toc } from './components'
import { modal_size } from './metadata'
import Model from './model'

import styles from './index.module.css'

import type { IProps, IPropsActionBar, IPropsMenu, IPropsModal } from './types'

const Index = (props: IProps) => {
	const {
		id,
		value,
		className,
		placeholderStyle,
		readonly,
		rich_text,
		text_only,
		onChange,
		onBlur,
		onCharacterCountChange,
		renderActionBarExtra
	} = props
	const [x] = useState(() => new Model())
	const { t } = useTranslation()
	const theme = useTheme()
	const handleChange = useMemoizedFn((next_value: string) => onChange(next_value))
	const handleBlur = useMemoizedFn((next_value: string) => onBlur?.(next_value))
	const handleCharacterCountChange = useMemoizedFn((count: number) => onCharacterCountChange?.(count))

	const { setRef } = useAliveEffect({
		init: () =>
			x.init({
				id,
				value,
				className,
				readonly,
				onChange: handleChange,
				onBlur: handleBlur,
				onCharacterCountChange: handleCharacterCountChange
			}),
		deinit: () => x.off(),
		deps: [readonly],
		normal: true
	})

	useLayoutEffect(() => {
		if (!x.mounted) return

		x.editor.commands.updateAttributes('codeBlock', { theme: `github-${theme}` })
	}, [theme, x.mounted])

	useLayoutEffect(() => {
		x.syncValue(value)
	}, [value, x, x.mounted])

	useLayoutEffect(() => {
		if (!x.mounted) return

		x.editor.setOptions({
			editorProps: {
				attributes: {
					class: x.getEditorClassName(className)
				}
			}
		})
	}, [className, x, x.mounted])

	const setActionBar = useMemoizedFn(v => v && (x.ref_action_bar = v))
	const setMenu = useMemoizedFn(v => v && (x.ref_menu = v))
	const setContainer = useMemoizedFn(v => v && (x.ref_container = v))

	const props_actions_bar: IPropsActionBar = {
		editor: x.editor,
		signal: x.signal,
		focus: x.focus,
		rich_text,
		text_only,
		update: x.update,
		extra: renderActionBarExtra?.({
			editor: x.editor,
			signal: x.signal,
			focus: x.focus,
			update: x.update
		})
	}

	const props_menu: IPropsMenu = {
		editor: x.editor,
		current_menu_items: $copy(x.current_menu_items),
		latest_menu_items: $copy(x.latest_menu_items),
		onMenuItem: x.onMenuItem
	}

	const props_modal: IPropsModal = {
		editor: x.editor
	}

	const modal_width = useMemo(() => {
		if (!x.modal_type) return 300

		return modal_size[x.modal_type as keyof typeof modal_size] ?? 300
	}, [x.modal_type])

	const onCloseModal = useMemoizedFn(() => (x.modal_visible = false))

	return (
		<div className={$cx('flex h-full w-full flex-col', x.signal, markdown._local, styles._local)} ref={setRef}>
			<div className='float_el absolute' ref={setActionBar}>
				<If condition={x.editor !== null}>
					<ActionBar {...props_actions_bar}></ActionBar>
				</If>
			</div>
			<div className='float_menu float_el absolute' data-floating-visible='false' ref={setMenu}>
				<If condition={x.editor !== null}>
					<Menu {...props_menu}></Menu>
				</If>
			</div>
			<div
				className={`
					relative
					flex flex-col
					items-center
					w-full h-full
					editor_container
				`}
			>
				<If condition={x.counts === 0}>
					<p className='placeholder absolute box-border w-full' style={placeholderStyle}>
						{t('editor.placeholder')}...
					</p>
				</If>
				<div className='editor_wrap box-border h-full w-full' ref={setContainer}></div>
				<If condition={x.editor?.contentComponent}>{x.react_nodes}</If>
			</div>
			<Modal
				className={$cx(styles.modal, x.modal_type && styles[x.modal_type])}
				title={x.modal_type ? t('insert') + t('b') + t(`editor.block.${x.modal_type}`) : ''}
				width={modal_width}
				open={x.modal_visible}
				onClose={onCloseModal}
			>
				<Choose>
					<When condition={x.modal_type === 'image'}>
						<Image {...props_modal}></Image>
					</When>
					<When condition={x.modal_type === 'emoji'}>
						<Emoji {...props_modal}></Emoji>
					</When>
					<When condition={x.modal_type === 'function'}>
						<Katex context={x.modal_context} {...props_modal}></Katex>
					</When>
					<When condition={x.modal_type === 'mermaid'}>
						<Mermaid context={x.modal_context} {...props_modal}></Mermaid>
					</When>
					<When condition={x.modal_type === 'toc'}>
						<Toc toc={x.toc} {...props_modal}></Toc>
					</When>
				</Choose>
			</Modal>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()

export * from './types'
