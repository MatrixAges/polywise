import { Spinner } from '@/__shadcn__/components/ui/spinner'

const Index = () => {
	return (
		<div
			className='
				flex
				items-center justify-center
				w-full h-full
				py-6
			'
		>
			<Spinner></Spinner>
		</div>
	)
}

export default $app.memo(Index)
