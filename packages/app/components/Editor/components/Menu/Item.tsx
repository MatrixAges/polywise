import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components'

import type { IPropsMenuItem } from '../../types'

const Index = (props: IPropsMenuItem) => {
	const { item, index, onMenuItem } = props
	const { key, shortcut, icon } = item
	const { t } = useTranslation()

	const onClick = useMemoizedFn(() => onMenuItem(index))

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-between
				picker_menu_item cursor-pointer
			`
			)}
			onClick={onClick}
		>
			<div className='left_wrap flex items-center'>
				<div className='icon_wrap mr-1.5 flex'>
					<Icon id={icon}></Icon>
				</div>
				<span className='text'>{t(`editor.block.${item.key}`)}</span>
			</div>
			<span className='shortcut'>{shortcut}</span>
		</div>
	)
}

export default $app.memo(Index)
