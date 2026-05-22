import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useParams } from 'react-router'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'
import { formatDateTime, rpc } from '@/utils'

import type { RPCOutput } from '@/types/rpc'

const Index = () => {
	const params = useParams()
	const article_id = params.id ?? ''
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [article, setArticle] = useState<RPCOutput['article']['read'] | null>(null)

	useEffect(() => {
		if (!article_id) {
			setArticle(null)
			setError('Article not found.')

			return
		}

		let mounted = true

		setLoading(true)
		setError('')

		void rpc.article.read
			.query({ id: article_id })
			.then(response => {
				if (!mounted) {
					return
				}

				setArticle(response)
			})
			.catch(err => {
				if (!mounted) {
					return
				}

				setArticle(null)
				setError(err instanceof Error ? err.message : 'Failed to load article.')
			})
			.finally(() => {
				if (mounted) {
					setLoading(false)
				}
			})

		return () => {
			mounted = false
		}
	}, [article_id])

	return (
		<div className='h-full overflow-y-auto'>
			<div className='page_wrap max-w-4xl px-6 py-8'>
				{loading ? (
					<div
						className='
							flex
							items-center
							gap-2
							text-sm text-std-400
						'
					>
						<Loader2 className='size-4 animate-spin'></Loader2>
						Loading article...
					</div>
				) : error ? (
					<div className='text-std-400 text-sm'>{error}</div>
				) : article ? (
					<div className='flex flex-col gap-6'>
						<div
							className='
										flex flex-col
										gap-2
										pb-4
										border-b border-border-light
									'
						>
							<h1 className='text-2xl font-semibold'>
								{article.title || 'Untitled article'}
							</h1>
							<div
								className='
											flex flex-wrap
											items-center
											gap-2
											text-xs text-std-400
											uppercase
										'
							>
								<span>{article.for_type}</span>
								{article.source ? <span>{article.source}</span> : null}
								{article.updated_at ? (
									<span>
										{formatDateTime(article.updated_at, 'YYYY-MM-DD HH:mm:ss')}
									</span>
								) : null}
							</div>
						</div>
						<div className='page_wrap' data-streamdown>
							<MessageResponse className='w-full leading-7'>
								{article.content}
							</MessageResponse>
						</div>
					</div>
				) : (
					<div className='text-std-400 text-sm'>Article not found.</div>
				)}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
