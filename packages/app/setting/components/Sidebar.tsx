import type { IPropsSidebar } from '../types'

const Index = (props: IPropsSidebar) => {
	const { sidebar_collapsed } = props

	if (!sidebar_collapsed) return null

	return <div className='flex'></div>
}

export default $app.memo(Index)
