import { useLayoutEffect } from 'react'

const Index = () => {
	console.log('bookmark')

	useLayoutEffect(() => {}, [])

	return <div className='flex'>bookmark</div>
}

export default $app.memo(Index)
