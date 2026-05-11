import { useMemo } from 'react'

import styles from './index.module.css'

import type { Editor } from '@tiptap/core'

interface IProps {
	editor: Editor
}

const Index = (props: IProps) => {
	const { editor } = props

	const actions = useMemo(
		() => [
			{
				label: 'Insert table',
				action: () => editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			},
			{
				label: 'Add column before',
				action: () => editor.commands.addColumnBefore()
			},
			{
				label: 'Add column after',
				action: () => editor.commands.addColumnAfter()
			},
			{
				label: 'Add row before',
				action: () => editor.commands.addRowBefore()
			},
			{
				label: 'Add row after',
				action: () => editor.commands.addRowAfter()
			},
			{
				label: 'divider'
			},
			{
				label: 'Toggle header row',
				action: () => editor.commands.toggleHeaderRow()
			},
			{
				label: 'Toggle header column',
				action: () => editor.commands.toggleHeaderColumn()
			},
			{
				label: 'Toggle header cell',
				action: () => editor.commands.toggleHeaderCell()
			},
			{
				label: 'Merge cells',
				action: () => editor.commands.mergeCells()
			},
			{
				label: 'Split cells',
				action: () => editor.commands.splitCell()
			},
			{
				label: 'divider'
			},
			{
				label: 'Delete column',
				action: () => editor.commands.deleteColumn()
			},
			{
				label: 'Delete row',
				action: () => editor.commands.deleteRow()
			},
			{
				label: 'Delete table',
				action: () => editor.commands.deleteTable()
			},
			{
				label: 'Fix table',
				action: () => editor.commands.fixTables()
			}
		],
		[editor]
	)

	return (
		<div className={$cx('flex flex-col', styles._local)}>
			<div className='action_items flex w-full flex-col'>
				{actions.map(({ label, action }, index) =>
					label === 'divider' ? (
						<span className='divider' key={index}></span>
					) : (
						<div
							className='action_item flex cursor-pointer items-center'
							onClick={action}
							key={index}
						>
							{label}
						</div>
					)
				)}
			</div>
		</div>
	)
}

export default Index
