import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const navigate = useNavigate()

	return (
		<div
			className='
				flex
				items-start justify-between
				gap-4
				mb-5
			'
		>
			<div>
				<div className='text-foreground text-xl font-semibold'>Posts</div>
				<div className='text-std-400 mt-1 text-sm'>
					Browse social posts by source type and continue writing from the detail page.
				</div>
			</div>
			<Button
				className='shrink-0'
				onClick={async () => {
					const id = await x.createPost()

					if (id) {
						navigate(`/post/${id}`)
					}
				}}
			>
				<Plus className='size-4'></Plus>
				<span>New post</span>
			</Button>
		</div>
	)
}

export default observer(Index)
