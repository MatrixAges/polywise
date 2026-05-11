import {
	CodeSimpleIcon,
	LinkIcon,
	ListBulletsIcon,
	ListChecksIcon,
	ListIcon,
	ListNumbersIcon,
	MinusCircleIcon,
	TextBIcon,
	TextHIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
	TextUnderlineIcon
} from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { useDelegate } from '@/hooks'

import { getHeadingLevel, getListType } from '../../utils'

import styles from './index.module.css'

import type { IPropsActionBar } from '../../types'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const Index = (props: IPropsActionBar) => {
	const { editor, signal, focus, rich_text, text_only, update } = props

	const ref = useDelegate(v => {
		switch (v) {
			case 'bold':
				editor.commands.toggleBold()
				break
			case 'italic':
				editor.commands.toggleItalic()
				break
			case 'strike':
				editor.commands.toggleStrike()
				break
			case 'underline':
				editor.commands.toggleUnderline()
				break
			case 'code':
				editor.commands.toggleCode()
				break
		}

		update()
	})

	const onUnsetLink = useMemoizedFn(() => {
		editor.commands.unsetLink()

		update()
	})

	const onChangeLink = useMemoizedFn(() => {
		const next = window.prompt('Link URL', editor.getAttributes('link')?.href || '')

		if (next === null) return
		if (!next) return onUnsetLink()

		editor.commands.setLink({ href: next })

		update()
	})

	const onChangeHeading = useMemoizedFn(v => {
		editor.commands.toggleHeading({ level: Number(v) as HeadingLevel })

		update()
	})

	const onChangeList = useMemoizedFn(v => {
		switch (v) {
			case 'bullet':
				editor.commands.toggleBulletList()
				break
			case 'number':
				editor.commands.toggleOrderedList()
				break
			case 'check':
				editor.commands.toggleTaskList()
				break
		}

		update()
	})

	const link = editor.getAttributes('link')?.href
	const heading = getHeadingLevel(editor)
	const list = getListType(editor)

	return (
		<div className={$cx('align_center flex', signal, styles._local)} ref={ref}>
			<Choose>
				<When condition={focus === 'table'}>123</When>
				<Otherwise>
					<div className='format_items flex'>
						<div
							className={$cx(
								'
								flex
								btn_format justify_center align_center clickable
							',
								editor.isActive('bold') && 'active'
							)}
							data-key='bold'
						>
							<TextBIcon weight='bold' />
						</div>
						<div
							className={$cx(
								'
								flex
								btn_format justify_center align_center clickable
							',
								editor.isActive('italic') && 'active'
							)}
							data-key='italic'
						>
							<TextItalicIcon weight='bold' />
						</div>
						<div
							className={$cx(
								'
								flex
								btn_format justify_center align_center clickable
							',
								editor.isActive('strike') && 'active'
							)}
							data-key='strike'
						>
							<TextStrikethroughIcon weight='bold' />
						</div>
						<If condition={rich_text}>
							<div
								className={$cx(
									'
									flex
									btn_format justify_center align_center clickable
								',
									editor.isActive('underline') && 'active'
								)}
								data-key='underline'
							>
								<TextUnderlineIcon weight='bold' />
							</div>
						</If>
						<div
							className={$cx(
								'
								flex
								btn_format justify_center align_center clickable
							',
								editor.isActive('code') && 'active'
							)}
							data-key='code'
						>
							<CodeSimpleIcon weight='bold' />
						</div>
						<div
							className={$cx(
								'
								flex
								btn_format justify_center align_center clickable
							',
								editor.isActive('link') && 'active'
							)}
							title={link || 'Set link'}
							onClick={onChangeLink}
						>
							<LinkIcon weight='bold' />
						</div>
						<If condition={editor.isActive('link')}>
							<div
								className='
									flex
									btn_format justify_center align_center clickable
								'
								onClick={onUnsetLink}
							>
								<MinusCircleIcon weight='bold'></MinusCircleIcon>
							</div>
						</If>
					</div>
					<If condition={!text_only}>
						<span className='d_line'></span>
						<div className='format_items flex'>
							<Select
								value={heading ? String(heading) : undefined}
								onValueChange={onChangeHeading}
							>
								<SelectTrigger
									className={$cx(
										'select_heading select select_btn',
										heading && 'active'
									)}
									noStyle
								>
									<div className='flex items-center gap-1'>
										<TextHIcon weight='bold' />
										<SelectValue placeholder='H' />
									</div>
								</SelectTrigger>
								<SelectContent className={styles.dropdown}>
									<SelectItem value='1'>H1</SelectItem>
									<SelectItem value='2'>H2</SelectItem>
									<SelectItem value='3'>H3</SelectItem>
									<SelectItem value='4'>H4</SelectItem>
									<SelectItem value='5'>H5</SelectItem>
									<SelectItem value='6'>H6</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<span className='d_line'></span>
						<div className='list_wrap format_items flex'>
							<Select value={list || undefined} onValueChange={onChangeList}>
								<SelectTrigger
									className={$cx('select_list select select_btn', list && 'active')}
									noStyle
								>
									<div className='flex items-center gap-1'>
										<ListIcon weight='bold' />
										<SelectValue placeholder='List' />
									</div>
								</SelectTrigger>
								<SelectContent className={styles.dropdown}>
									<SelectItem value='bullet'>
										<ListBulletsIcon weight='bold' size={16} />
									</SelectItem>
									<SelectItem value='number'>
										<ListNumbersIcon weight='bold' size={16} />
									</SelectItem>
									<SelectItem value='check'>
										<ListChecksIcon weight='bold' size={16} />
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</If>
				</Otherwise>
			</Choose>
		</div>
	)
}

export default $app.memo(Index)
