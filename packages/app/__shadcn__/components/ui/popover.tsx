import { Popover as PopoverPrimitive } from '@base-ui/react/popover'

import { cn } from '@/__shadcn__/lib/utils/index'

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot='popover' modal={false} {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
	return (
		<PopoverPrimitive.Trigger
			data-slot='popover-trigger'
			nativeButton={false}
			{...props}
			render={trigger_props => <div {...trigger_props} />}
		/>
	)
}

function PopoverContent({
	className,
	side = 'top',
	sideOffset = 8,
	align = 'start',
	alignOffset = 0,
	children,
	...props
}: PopoverPrimitive.Popup.Props &
	Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className='isolate z-50'
			>
				<PopoverPrimitive.Popup
					data-slot='popover-content'
					className={cn(
						`
							bg-popover text-popover-foreground
							data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
							data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
							data-[side=bottom]:slide-in-from-top-2
							data-[side=left]:slide-in-from-right-2
							data-[side=right]:slide-in-from-left-2
							data-[side=top]:slide-in-from-bottom-2
							data-[side=inline-start]:slide-in-from-right-2
							data-[side=inline-end]:slide-in-from-left-2
							z-50
							w-(--anchor-width)
							max-w-(--available-width)
							origin-(--transform-origin)
							overflow-hidden
							rounded-2xl
							shadow-2xl
							ring-1 ring-foreground/5
						`,
						className
					)}
					{...props}
				>
					{children}
				</PopoverPrimitive.Popup>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
}

export { Popover, PopoverContent, PopoverTrigger }
