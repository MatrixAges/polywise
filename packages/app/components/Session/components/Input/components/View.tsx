import { useEffect } from 'react'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { observer } from 'mobx-react-lite'

import { Popover, PopoverContent, PopoverTrigger } from '@/__shadcn__/components/ui/popover'

import { useModel } from '../context'
import EditorPane from './EditorPane'
import MentionMenu from './MentionMenu'
import PrimaryBar from './PrimaryBar'
import SecondaryBar from './SecondaryBar'
import SessionToken from './SessionToken'

const Index = () => {
	const x = useModel()

	const editor = useEditor({
		autofocus: true,
		content: '',
		contentType: 'markdown',
		extensions: [
			Markdown,
			Placeholder.configure({
				placeholder: 'What needs to be done?'
			}),
			SessionToken,
			StarterKit
		],
		editorProps: {
			attributes: {
				class: 'session-input-tiptap bg-transparent text-base md:text-sm outline-none'
			},
			handleDOMEvents: {
				compositionstart: () => {
					x.setCompositing(true)

					return false
				},
				compositionend: () => {
					x.setCompositing(false)

					return false
				}
			}
		},
		onCreate: ({ editor: instance }) => x.handleEditorCreate(instance),
		onSelectionUpdate: ({ editor: instance }) => x.handleEditorSelectionUpdate(instance),
		onUpdate: ({ editor: instance }) => x.handleEditorUpdate(instance)
	})

	useEffect(() => {
		x.setEditor(editor)

		return () => x.setEditor(null)
	}, [editor, x])

	useEffect(() => {
		void x.loadSkillItems()
	}, [x, x.active_mention?.trigger])

	useEffect(() => {
		void x.loadToolItems()
	}, [x, x.active_mention?.trigger, x.session_id])

	useEffect(() => {
		void x.loadAgentItems()
	}, [x, x.active_mention?.trigger, x.session_id])

	useEffect(() => {
		void x.loadFileItems()
	}, [x, x.active_mention?.trigger, x.session_id])

	useEffect(() => {
		x.syncDraftInput()
	}, [x, x.props.draft_input?.key, editor])

	useEffect(() => {
		x.resetMentionIndex()
	}, [x, x.active_mention?.trigger, x.active_mention?.query])

	return (
		<div
			className={$cx(
				'relative w-full px-3',
				x.full &&
					`
				absolute!
				inset-0
				z-50
				pt-3
				backdrop-blur-lg
			`,
				x.is_page && 'page_wrap py-0',
				x.props.type === 'dialog' && 'px-px!'
			)}
		>
			<Popover open={x.mention_open}>
				<PopoverTrigger className={$cx('block min-h-0 w-full', x.full && 'flex h-full flex-col')}>
					<div className={$cx('flex min-h-0 flex-col', x.full && 'h-full')}>
						<div
							className={$cx(
								`
								flex flex-1 flex-col
								rounded-lg
								bg-card
								border-t border-border-light/36
								shadow
							`,
								x.full && 'h-full min-h-0'
							)}
						>
							<EditorPane />
							<PrimaryBar />
						</div>
						<SecondaryBar />
					</div>
				</PopoverTrigger>
				<PopoverContent
					className='
						overflow-visible
						p-0
						rounded-none
						bg-transparent
						ring-0
						shadow-none
						backdrop-blur-md
					'
					side='top'
					align='start'
					sideOffset={10}
				>
					<MentionMenu
						items={x.mention_items}
						loading={x.mention_loading}
						activeIndex={x.active_index}
						onSelect={x.applyMention}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}

export default observer(Index)
