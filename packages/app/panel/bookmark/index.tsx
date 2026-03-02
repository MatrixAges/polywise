import { useLayoutEffect } from 'react'

const Index = () => {
	useLayoutEffect(() => {}, [])

	return <div className='flex'></div>
}

export default $app.memo(Index)
