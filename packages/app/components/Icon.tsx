import type { Icon, IconType } from '@/types'

interface IProps {
	id: Icon
	size?: number | string
	icon_type?: IconType
}

const Index = (props: IProps) => {
	const { id, size, icon_type = 'icon' } = props

	if (!id) return <></>
	if (icon_type === 'emoji') return <>{id}</>

	return <i className={`ph ph-${id}`} style={{ fontSize: size }}></i>
}

export default $app.memo(Index)
