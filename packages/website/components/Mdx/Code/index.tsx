import { useLayoutEffect, useRef, useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { highlight } from '@website/utils/shiki'

import styles from './index.module.css'

import type { ReactNode } from 'react'
import type { BundledLanguage } from 'shiki/bundle/web'

interface IProps {
	children: ReactNode
	language: BundledLanguage
}

const Index = (props: IProps) => {
	const { children, language } = props
	const [html, setHTML] = useState<string>('')
	const [copyied, setCopyied] = useState(false)
	const lang = useRef<BundledLanguage>()
	const code = useRef()

	useLayoutEffect(() => {
		const c = children as JSX.Element

		if (!c || !c.props.children) return

		code.current = c.props.children
		lang.current = (c.props.className?.replace('language-', '') || 'js') as BundledLanguage

		highlight(code.current!, lang.current).then(setHTML)
	}, [children, language])

	const copy = useMemoizedFn(() => {
		setCopyied(true)

		navigator.clipboard.writeText(code.current!)

		setTimeout(() => {
			setCopyied(false)
		}, 3000)
	})

	return (
		<div className={$.cx('relative box-border w-full', styles._local)}>
			<span className='lang absolute'>{lang.current}</span>
			<button
				className='
					absolute
					flex
					items-center justify-center
					btn_copy clickable
				'
				onClick={copy}
			>
				{copyied ? <Check></Check> : <Copy></Copy>}
			</button>
			<div className='flex w-full' dangerouslySetInnerHTML={{ __html: html }}></div>
		</div>
	)
}

// @ts-ignore
export default $.memo(Index)
