import {
	CodeSimpleIcon,
	LinkIcon,
	ListBulletsIcon,
	ListChecksIcon,
	ListIcon,
	ListNumbersIcon,
	MinusCircleIcon,
	TextBIcon,
	TextHFiveIcon,
	TextHFourIcon,
	TextHIcon,
	TextHOneIcon,
	TextHSixIcon,
	TextHThreeIcon,
	TextHTwoIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
	TextUnderlineIcon
} from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/__shadcn__/components/ui/select'
import { useDelegate } from '@/hooks'

import { getHeadingLevel, getListType } from '../../utils'

import styles from './index.module.css'

import type { IPropsActionBar } from '../../types'

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
type ListType = 'bullet' | 'number' | 'check'

const getHeadingIcon = (level?: HeadingLevel | null) => {
	switch (level) {
		case 1:
			return <TextHOneIcon weight='bold' />
		case 2:
			return <TextHTwoIcon weight='bold' />
		case 3:
			return <TextHThreeIcon weight='bold' />
		case 4:
			return <TextHFourIcon weight='bold' />
		case 5:
			return <TextHFiveIcon weight='bold' />
		case 6:
			return <TextHSixIcon weight='bold' />
		default:
			return <TextHIcon weight='bold' />
	}
}

const getListIcon = (value?: ListType | null) => {
	switch (value) {
		case 'bullet':
			return <ListBulletsIcon weight='bold' size={13} />
		case 'number':
			return <ListNumbersIcon weight='bold' size={13} />
		case 'check':
			return <ListChecksIcon weight='bold' size={13} />
		default:
			return <ListIcon weight='bold' />
	}
}

const Index = (props: IPropsActionBar) => {
	const { editor, signal, focus, rich_text, text_only, update, extra } = props
	const format_button_class = 'btn_format flex cursor-pointer items-center justify-center'

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
		if (v === null) return

		editor.commands.toggleHeading({ level: Number(v) as HeadingLevel })

		update()
	})

	const onChangeList = useMemoizedFn(v => {
		if (v === null) return

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
	const heading = getHeadingLevel(editor) as HeadingLevel | null
	const list = getListType(editor) as ListType | null

	return (
		<div className={$cx('flex items-center', signal, styles._local)} ref={ref}>
			<Choose>
				<When condition={focus === 'table'}>123</When>
				<Otherwise>
					<div className='format_items flex'>
						<div
							className={$cx(format_button_class, editor.isActive('bold') && 'active')}
							data-key='bold'
						>
							<TextBIcon weight='bold' />
						</div>
						<div
							className={$cx(format_button_class, editor.isActive('italic') && 'active')}
							data-key='italic'
						>
							<TextItalicIcon weight='bold' />
						</div>
						<div
							className={$cx(format_button_class, editor.isActive('strike') && 'active')}
							data-key='strike'
						>
							<TextStrikethroughIcon weight='bold' />
						</div>
						<If condition={rich_text}>
							<div
								className={$cx(
									format_button_class,
									editor.isActive('underline') && 'active'
								)}
								data-key='underline'
							>
								<TextUnderlineIcon weight='bold' />
							</div>
						</If>
						<div
							className={$cx(format_button_class, editor.isActive('code') && 'active')}
							data-key='code'
						>
							<CodeSimpleIcon weight='bold' />
						</div>
						<div
							className={$cx(format_button_class, editor.isActive('link') && 'active')}
							title={link || 'Set link'}
							onClick={onChangeLink}
						>
							<LinkIcon weight='bold' />
						</div>
						<If condition={editor.isActive('link')}>
							<div className={format_button_class} onClick={onUnsetLink}>
								<MinusCircleIcon weight='bold'></MinusCircleIcon>
							</div>
						</If>
					</div>
					<If condition={!text_only}>
						<span className='d_line'></span>
						<div className='format_items flex'>
							<Select
								value={heading ? String(heading) : null}
								onValueChange={onChangeHeading}
							>
								<SelectTrigger
									className={$cx(
										'select_heading select select_btn',
										heading && 'active'
									)}
									noStyle
								>
									{getHeadingIcon(heading)}
								</SelectTrigger>
								<SelectContent align='start' sideOffset={3} className={styles.dropdown}>
									<SelectItem value='1'>{getHeadingIcon(1)}</SelectItem>
									<SelectItem value='2'>{getHeadingIcon(2)}</SelectItem>
									<SelectItem value='3'>{getHeadingIcon(3)}</SelectItem>
									<SelectItem value='4'>{getHeadingIcon(4)}</SelectItem>
									<SelectItem value='5'>{getHeadingIcon(5)}</SelectItem>
									<SelectItem value='6'>{getHeadingIcon(6)}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<span className='d_line'></span>
						<div className='list_wrap format_items flex'>
							<Select value={list || null} onValueChange={onChangeList}>
								<SelectTrigger
									className={$cx('select_list select select_btn', list && 'active')}
									noStyle
								>
									{getListIcon(list)}
								</SelectTrigger>
								<SelectContent align='start' sideOffset={3} className={styles.dropdown}>
									<SelectItem value='bullet'>{getListIcon('bullet')}</SelectItem>
									<SelectItem value='number'>{getListIcon('number')}</SelectItem>
									<SelectItem value='check'>{getListIcon('check')}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</If>
					<If condition={Boolean(extra)}>
						<span className='d_line'></span>
						<div className={$cx(format_button_class, 'mx-[4px]!')}>{extra}</div>
					</If>
				</Otherwise>
			</Choose>
		</div>
	)
}

export default $app.memo(Index)
