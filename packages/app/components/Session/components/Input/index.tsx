import { useEffect, useState } from 'react'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { observer } from 'mobx-react-lite'

import { useGlobal } from '@/context'

import EditorPane from './components/EditorPane'
import MentionMenu from './components/MentionMenu'
import PrimaryBar from './components/PrimaryBar'
import SecondaryBar from './components/SecondaryBar'
import SessionToken from './components/SessionToken'
import { Context } from './context'
import Model from './model'

import type { IPropsInput } from '../../types'

const Index = (props: IPropsInput) => {
	const global = useGlobal()
	const [x] = useState(() => new Model(props, global.setting))

	x.sync(props, global.setting)

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
	}, [x, x.active_mention?.trigger, x.active_mention?.query, x.session_id])

	useEffect(() => {
		x.syncDraftInput()
	}, [x, props.draft_input?.key, editor])

	useEffect(() => {
		x.resetMentionIndex()
	}, [x, x.active_mention?.trigger, x.active_mention?.query])

	return (
		<Context value={x}>
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
					props.type === 'dialog' && 'px-px!'
				)}
			>
				<div className={$cx('flex min-h-0 flex-col', x.full && 'h-full')}>
					{x.mention_open && (
						<div
							className='
								absolute
								right-3 bottom-full
								left-3
								z-50
								mb-2
							'
						>
							<MentionMenu
								items={x.mention_items}
								loading={x.mention_loading}
								activeIndex={x.active_index}
								onSelect={x.applyMention}
							/>
						</div>
					)}
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
						<EditorPane editor={editor} />
						<PrimaryBar
							mode={props.mode}
							setMode={props.setMode}
							show_session_mode_select={props.show_session_mode_select}
							stop={props.stop}
							streaming={props.streaming}
						/>
					</div>
					<SecondaryBar
						archive={props.archive}
						archived={props.archived}
						audit_mode={props.audit_mode}
						clear={props.clear}
						scrollToBottom={props.scrollToBottom}
						setAuditMode={props.setAuditMode}
						show_audit_mode_select={props.show_audit_mode_select}
						toggleContextModal={props.toggleContextModal}
						unarchive={props.unarchive}
					/>
				</div>
			</div>
		</Context>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
