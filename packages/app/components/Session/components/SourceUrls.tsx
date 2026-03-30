import type { SourceUrlUIPart } from 'ai'

export interface IProps {
	items: Array<SourceUrlUIPart>
}

const Index = (props: IProps) => {
	const { items } = props

	return (
		<div className='flex flex-col pt-2'>
			<span className='mb-1 font-medium'>Sources: </span>
			<div className='flex flex-wrap gap-1.5 underline'>
				{items.map((item, index) => (
					<a href={item.url} target='_blank' key={index}>
						{item.title}
					</a>
				))}
			</div>
		</div>
	)
}

export default $app.memo(Index)
