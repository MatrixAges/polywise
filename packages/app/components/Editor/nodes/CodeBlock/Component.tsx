import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useMemoizedFn } from 'ahooks'
import { bundledLanguages } from 'shiki'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { copy } from '@/utils'

import styles from './index.module.css'

import type { ReactNodeViewProps } from '@tiptap/react'

const langs = Object.keys(bundledLanguages)

const Index = (props: ReactNodeViewProps<HTMLDivElement>) => {
	const { editor, node, extension, HTMLAttributes, getPos, updateAttributes } = props
	const { language, theme } = node.attrs
	const ref = useRef<HTMLPreElement>(null)
	const rendered = useRef(false)
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (rendered.current) return

		editor.commands.focus(getPos()! + 1)

		rendered.current = true
	}, [editor])

	const onSelectLang = useMemoizedFn(v => {
		updateAttributes({ language: v })
	})

	const onCopy = useMemoizedFn(() => {
		copy((ref.current!.querySelector('code') as HTMLElement).textContent!)

		setCopied(true)

		setTimeout(() => {
			setCopied(false)
		}, 2400)
	})

	return (
		<NodeViewWrapper
			className={$cx('relative', styles._local)}
			as='pre'
			ref={ref}
			data-language={language}
			data-theme={theme || extension.options.defaultTheme}
			{...HTMLAttributes}
		>
			<NodeViewContent />
			<div className='actions_wrap absolute flex' contentEditable={false}>
				<Select value={language} onValueChange={onSelectLang}>
					<SelectTrigger className='select' noStyle>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className='custom_select_dropdown max-h-40'>
						{langs.map(item => (
							<SelectItem value={item} key={item}>
								{item}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<button
					className={`
						flex
						btn_action justify_center align_center clickable
					`}
					onClick={onCopy}
				>
					{copied ? <CheckIcon></CheckIcon> : <CopyIcon></CopyIcon>}
				</button>
			</div>
		</NodeViewWrapper>
	)
}

export default $app.memo(Index)
