import { useEffect } from 'react'
import { useToggle } from 'ahooks'
import { FilePenLine, Search, SquareTerminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ToolUIPart } from 'ai'
import type { IPropsCodexExec } from '../types'

const getToolMeta = (part: ToolUIPart) => {
	switch (part.type) {
		case 'tool-web_search':
			return {
				title: 'Codex Search',
				Icon: Search
			}
		case 'tool-exec':
			return {
				title: 'Codex Command',
				Icon: SquareTerminal
			}
		case 'tool-patch':
			return {
				title: 'Codex Patch',
				Icon: FilePenLine
			}
		default:
			return {
				title: 'Codex Tool',
				Icon: SquareTerminal
			}
	}
}

const getStatusText = (part: ToolUIPart, t: ReturnType<typeof useTranslation<'components'>>['t']) => {
	if (part.providerExecuted === true) {
		if (part.state === 'input-streaming' || part.state === 'input-available') {
			return t('session.codex_exec.running')
		}

		if (part.state === 'approval-requested' || part.state === 'approval-responded') {
			return t('session.codex_exec.running')
		}

		if (part.output || part.state === 'output-available' || part.state === 'output-error') {
			return t('session.codex_exec.completed')
		}
	}

	switch (part.state) {
		case 'input-streaming':
			return t('session.codex_exec.pending')
		case 'input-available':
		case 'approval-requested':
		case 'approval-responded':
			return t('session.codex_exec.running')
		case 'output-available':
			return t('session.codex_exec.completed')
		case 'output-denied':
			return t('session.codex_exec.denied')
		case 'output-error':
			return t('session.codex_exec.error')
	}
}

const getDetail = (part: ToolUIPart) => {
	switch (part.type) {
		case 'tool-web_search':
			return ((part.output as { query?: string } | undefined)?.query || '') as string
		case 'tool-exec':
			return ((part.output as { command?: string } | undefined)?.command ||
				(part.input as { command?: string } | undefined)?.command ||
				'') as string
		case 'tool-patch': {
			const changes = (part.output as { changes?: Array<unknown> } | undefined)?.changes

			return Array.isArray(changes) ? `${changes.length} changes` : ''
		}
		default:
			return ''
	}
}

const getSafeErrorText = (part: ToolUIPart) => {
	if (part.providerExecuted === true) {
		return undefined
	}

	return part.errorText
}

const Index = (props: IPropsCodexExec) => {
	const { streaming, part } = props
	const { t } = useTranslation('components')
	const [open, { toggle, set }] = useToggle(false)
	const { Icon, title } = getToolMeta(part)
	const detail = getDetail(part)
	const error_text = getSafeErrorText(part)
	const status_text = getStatusText(part, t)

	useEffect(() => set(streaming), [streaming, set])

	return (
		<div
			className='
				flex flex-col
				mb-1
				group
				data-[open=true]:rounded-md data-[open=true]:bg-secondary
			'
			data-open={open}
		>
			<div
				className='
					flex
					items-center justify-between
					gap-2
					text-muted-foreground text-sm
					group-data-[open=true]:px-3 group-data-[open=true]:py-2
					hover:text-foreground
					cursor-pointer select-none
				'
				onClick={toggle}
			>
				<div className='flex min-w-0 items-center gap-2'>
					<Icon className='text-std-400 size-3.5 shrink-0'></Icon>
					<span className='group-data-[open=true]:font-medium'>{title}</span>
				</div>
				<div
					className='
						flex
						items-center
						min-w-0
						gap-2
						text-std-400 text-xs
					'
				>
					{detail ? <span className='max-w-[28rem] truncate'>{detail}</span> : null}
					<span>{status_text}</span>
				</div>
			</div>
			{open && (
				<div
					className='
						flex flex-col
						gap-2
						p-3 pt-0
					'
				>
					{detail ? (
						<div
							className='
								px-3 py-2
								rounded-md
								text-sm
								bg-card
							'
						>
							{detail}
						</div>
					) : null}
					{error_text ? (
						<div
							className='
								px-3 py-2
								rounded-md
								text-destructive text-sm
								bg-destructive/10
							'
						>
							{error_text}
						</div>
					) : null}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
