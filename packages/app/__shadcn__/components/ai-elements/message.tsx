import { Button } from '@/__shadcn__/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '@/__shadcn__/components/ui/tooltip'
import { cn } from '@/__shadcn__/lib/utils'
import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { memo } from 'react'
import { Streamdown } from 'streamdown'

import type { UIMessage } from 'ai'
import type { ComponentProps, HTMLAttributes } from 'react'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
	from: UIMessage['role']
}

export const Message = ({ className, from, ...props }: MessageProps) => (
	<div
		className={cn(
			'group flex w-full max-w-[95%] flex-col gap-2',
			from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
			className
		)}
		{...props}
	/>
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
	<div
		className={cn(
			'is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm',
			'group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground',
			'group-[.is-assistant]:text-foreground',
			className
		)}
		{...props}
	>
		{children}
	</div>
)

export type MessageActionsProps = ComponentProps<'div'>

export const MessageActions = ({ className, children, ...props }: MessageActionsProps) => (
	<div className={cn('flex items-center gap-1', className)} {...props}>
		{children}
	</div>
)

export type MessageActionProps = ComponentProps<typeof Button> & {
	tooltip?: string
	label?: string
}

export const MessageAction = ({
	tooltip,
	children,
	label,
	variant = 'ghost',
	size = 'icon-sm',
	...props
}: MessageActionProps) => {
	const button = (
		<Button size={size} type='button' variant={variant} {...props}>
			{children}
			<span className='sr-only'>{label || tooltip}</span>
		</Button>
	)

	if (tooltip) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>{button}</TooltipTrigger>
					<TooltipContent>
						<p>{tooltip}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return button
}

export type MessageResponseProps = ComponentProps<typeof Streamdown>

const streamdown_plugins = { cjk, code, math, mermaid }

export const MessageResponse = memo(
	({ className, ...props }: MessageResponseProps) => (
		<Streamdown
			className={cn(
				'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
				className
			)}
			plugins={streamdown_plugins}
			{...props}
		/>
	),
	(prevProps, nextProps) =>
		prevProps.children === nextProps.children &&
		nextProps.isAnimating === prevProps.isAnimating
)

MessageResponse.displayName = 'MessageResponse'

export type MessageToolbarProps = ComponentProps<'div'>

export const MessageToolbar = ({ className, children, ...props }: MessageToolbarProps) => (
	<div
		className={cn('mt-4 flex w-full items-center justify-between gap-4', className)}
		{...props}
	>
		{children}
	</div>
)
