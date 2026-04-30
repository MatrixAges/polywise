import { Field, FieldContent } from '@/__shadcn__/components/ui/field'

import type { IPropsTodoDetailField } from '../types'

const Index = (props: IPropsTodoDetailField) => {
	const { icon: Icon, label, children } = props

	return (
		<Field orientation='horizontal' className='items-start gap-4'>
			<div
				className='
					flex shrink-0
					items-center
					w-28
					gap-2
					pt-2
					text-muted-foreground
				'
			>
				<Icon size={14}></Icon>
				<span className='text-[11px] font-medium tracking-[0.16em] uppercase'>{label}</span>
			</div>
			<FieldContent className='min-w-0'>{children}</FieldContent>
		</Field>
	)
}

export default $app.memo(Index)
