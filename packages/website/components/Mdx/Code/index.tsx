import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { highlight } from '@website/utils/shiki'

import styles from './index.module.css'

import type { ReactElement, ReactNode } from 'react'
import type { BundledLanguage } from 'shiki/bundle/web'

interface IProps {
	children: ReactNode
	language: BundledLanguage
}

const getCodeBlockData = (children: ReactNode, language: BundledLanguage) => {
	const child = children as ReactElement<{
		children?: string
		className?: string
	}>
	const code = child?.props.children || ''
	const lang = (child?.props.className?.replace('language-', '') || language || 'js') as BundledLanguage

	return { code, lang }
}

const Index = (props: IProps) => {
	const { children, language } = props
	const { code, lang } = getCodeBlockData(children, language)
	const content_key = `${lang}\0${code}`
	const [highlighted, setHighlighted] = useState<{ key: string; html: string } | null>(null)
	const [should_highlight, setShouldHighlight] = useState(false)
	const [copyied, setCopyied] = useState(false)
	const container_ref = useRef<HTMLDivElement>(null)
	const render_id = useRef(0)

	useEffect(() => {
		const element = container_ref.current

		if (!element || should_highlight) return

		if (typeof IntersectionObserver === 'undefined') {
			setShouldHighlight(true)

			return
		}

		const observer = new IntersectionObserver(
			entries => {
				if (!entries[0]?.isIntersecting) return

				setShouldHighlight(true)
				observer.disconnect()
			},
			{
				rootMargin: '400px 0px'
			}
		)

		observer.observe(element)

		return () => {
			observer.disconnect()
		}
	}, [should_highlight, content_key])

	useEffect(() => {
		if (!code || !should_highlight) return

		const current_render_id = ++render_id.current

		void (async () => {
			try {
				const highlighted_html = await highlight(code, lang)

				if (current_render_id !== render_id.current) return

				setHighlighted({
					key: content_key,
					html: highlighted_html
				})
			} catch {}
		})()
	}, [code, lang, content_key, should_highlight])

	const copy = useMemoizedFn(() => {
		setCopyied(true)

		navigator.clipboard.writeText(code)

		setTimeout(() => {
			setCopyied(false)
		}, 3000)
	})

	const html = highlighted?.key === content_key ? highlighted.html : ''

	return (
		<div ref={container_ref} className={$.cx('relative box-border w-full', styles._local)}>
			<span className='lang absolute'>{lang}</span>
			<button
				className='
					absolute
					flex
					items-center justify-center
					btn_copy clickable
				'
				onClick={copy}
			>
				{copyied ? <CheckIcon></CheckIcon> : <CopyIcon></CopyIcon>}
			</button>
			{html ? (
				<div className='flex w-full' dangerouslySetInnerHTML={{ __html: html }}></div>
			) : (
				<div className='pre_code_wrap'>
					<pre className='shiki shiki-block'>
						<code className='__editor_code shiki-code'>{code}</code>
					</pre>
				</div>
			)}
		</div>
	)
}

// @ts-ignore
export default $.memo(Index)
