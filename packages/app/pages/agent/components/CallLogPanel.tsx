import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import type { ReactNode } from 'react'

interface ILogItemBase {
	created_at: number
	input: unknown
	output: unknown
	session_id: string
	status: 'success' | 'error'
}

interface IProps<T extends ILogItemBase> {
	available_dates: Array<string>
	date: string
	empty_text: string
	has_more: boolean
	items: Array<T>
	loading: boolean
	onDateChange: (value: string) => void
	onPageChange: (page: number) => void
	page: number
	renderSummary: (item: T) => ReactNode
	total: number
}

const stringifyValue = (value: unknown) => {
	if (value === undefined) {
		return 'undefined'
	}

	if (typeof value === 'string') {
		return value
	}

	try {
		return JSON.stringify(value, null, 2)
	} catch {
		return String(value)
	}
}

const JsonBlock = ({ title, value }: { title: string; value: unknown }) => {
	return (
		<details
			className='
				p-3
				rounded-3xl
				bg-secondary/40
			'
		>
			<summary className='text-std-500 cursor-pointer text-xs font-medium'>{title}</summary>
			<pre
				className='
					break-all
					overflow-auto
					max-h-56
					mt-2
					text-xs text-std-400
					whitespace-pre-wrap
				'
			>
				{stringifyValue(value)}
			</pre>
		</details>
	)
}

const Index = <T extends ILogItemBase>(props: IProps<T>) => {
	const { t } = useTranslation('agent')
	const {
		available_dates,
		date,
		empty_text,
		has_more,
		items,
		loading,
		onDateChange,
		onPageChange,
		page,
		renderSummary,
		total
	} = props

	return (
		<div
			className='
				flex flex-1 flex-col
				min-h-0
				gap-4
			'
		>
			<div className='flex flex-wrap items-center gap-3'>
				<div className='w-full max-w-44'>
					<Input
						type='date'
						value={date}
						onChange={event => {
							onDateChange(event.target.value)
						}}
					/>
				</div>
				<div className='text-std-400 text-xs'>{loading ? 'Loading...' : `${total} records`}</div>
				<div className='ml-auto flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={loading || page <= 1}
						onClick={() => onPageChange(page - 1)}
					>
						Prev
					</Button>
					<div className='text-std-400 text-xs'>Page {page}</div>
					<Button
						variant='outline'
						size='sm'
						disabled={loading || !has_more}
						onClick={() => onPageChange(page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
			{available_dates.length > 0 && (
				<div className='flex flex-wrap gap-2'>
					{available_dates.slice(0, 6).map(item => (
						<Button
							key={item}
							variant={item === date ? 'secondary' : 'outline'}
							size='xs'
							onClick={() => onDateChange(item)}
						>
							{item}
						</Button>
					))}
				</div>
			)}
			<div
				className='
					overflow-y-auto
					flex flex-1 flex-col
					min-h-0
					gap-3
					pr-1
				'
			>
				{!loading && items.length === 0 && (
					<div
						className='
							p-4
							rounded-4xl
							text-sm text-std-400
							border border-dashed border-border
						'
					>
						{empty_text}
					</div>
				)}
				{items.map((item, index) => (
					<div
						key={`${item.session_id}-${item.created_at}-${index}`}
						className='
							flex flex-col
							gap-3
							p-4
							rounded-4xl
							bg-secondary/20
						'
					>
						<div className='flex flex-wrap items-center gap-2'>
							<Badge variant={item.status === 'error' ? 'destructive' : 'secondary'}>
								{item.status}
							</Badge>
							<div className='text-sm font-medium'>{renderSummary(item)}</div>
						</div>
						<div className='text-std-400 text-xs'>
							{dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')} · session{' '}
							{item.session_id}
						</div>
						<JsonBlock title={t('call_log.input')} value={item.input} />
						<JsonBlock title={t('call_log.output')} value={item.output} />
					</div>
				))}
			</div>
		</div>
	)
}

export default Index
