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
				'
				flex
				picker_menu_item justify_between align_center cursor_point
			'
			)}
			onClick={onClick}
		>
			<div className='left_wrap align_center flex'>
				<div className='icon_wrap mr_6 flex'>
					<Icon id={icon}></Icon>
				</div>
				<span className='text'>{t(`editor.block.${item.key}`)}</span>
			</div>
			<span className='shortcut'>{shortcut}</span>
		</div>
	)
}

export default $app.memo(Index)
