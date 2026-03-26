import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea
} from '@/__shadcn__/components/ui/input-group'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '@/__shadcn__/components/ui/tooltip'
import { cn } from '@/__shadcn__/lib/utils'
import { CornerDownLeftIcon, SquareIcon, XIcon } from 'lucide-react'
import { useCallback, useState } from 'react'

import type { ChatStatus } from 'ai'
import type { ChangeEventHandler, ComponentProps, FormEvent, KeyboardEventHandler } from 'react'

export interface PromptInputMessage {
	text: string
}

export type PromptInputProps = Omit<
	ComponentProps<'form'>,
	'onSubmit'
> & {
	onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>
}

export const PromptInput = ({
	className,
	onSubmit,
	children,
	...props
}: PromptInputProps) => {
	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault()

			const form = event.currentTarget
			const formData = new FormData(form)
			const text = (formData.get('message') as string) || ''

			onSubmit({ text }, event)
			form.reset()
		},
		[onSubmit]
	)

	return (
		<form
			className={cn('w-full', className)}
			onSubmit={handleSubmit}
			{...props}
		>
			<InputGroup className='overflow-hidden'>{children}</InputGroup>
		</form>
	)
}

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>

export const PromptInputTextarea = ({
	onChange,
	onKeyDown,
	className,
	placeholder = 'What would you like to know?',
	...props
}: PromptInputTextareaProps) => {
	const [isComposing, setIsComposing] = useState(false)

	const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
		e => {
			onKeyDown?.(e)

			if (e.defaultPrevented) {
				return
			}

			if (e.key === 'Enter') {
				if (isComposing || e.nativeEvent.isComposing) {
					return
				}
				if (e.shiftKey) {
					return
				}
				e.preventDefault()

				const { form } = e.currentTarget
				const submitButton = form?.querySelector(
					'button[type="submit"]'
				) as HTMLButtonElement | null
				if (submitButton?.disabled) {
					return
				}

				form?.requestSubmit()
			}
		},
		[onKeyDown, isComposing]
	)

	const handleCompositionEnd = useCallback(() => setIsComposing(false), [])
	const handleCompositionStart = useCallback(() => setIsComposing(true), [])

	return (
		<InputGroupTextarea
			className={cn('field-sizing-content max-h-48 min-h-16', className)}
			name='message'
			onCompositionEnd={handleCompositionEnd}
			onCompositionStart={handleCompositionStart}
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			{...props}
		/>
	)
}

export type PromptInputFooterProps = Omit<
	ComponentProps<typeof InputGroupAddon>,
	'align'
>

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
	<InputGroupAddon
		align='block-end'
		className={cn('justify-between gap-1', className)}
		{...props}
	/>
)

export type PromptInputToolsProps = ComponentProps<'div'>

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
	<div className={cn('flex min-w-0 items-center gap-1', className)} {...props} />
)

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton> & {
	tooltip?: string
}

export const PromptInputButton = ({
	variant = 'ghost',
	className,
	size = 'icon-sm',
	tooltip,
	...props
}: PromptInputButtonProps) => {
	const button = (
		<InputGroupButton
			className={cn(className)}
			size={size}
			type='button'
			variant={variant}
			{...props}
		/>
	)

	if (!tooltip) {
		return button
	}

	return (
		<Tooltip>
			<TooltipTrigger>{button}</TooltipTrigger>
			<TooltipContent side='top'>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	)
}

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
	status?: ChatStatus
	onStop?: () => void
}

export const PromptInputSubmit = ({
	className,
	variant = 'default',
	size = 'icon-sm',
	status,
	onStop,
	children,
	...props
}: PromptInputSubmitProps) => {
	const isGenerating = status === 'submitted' || status === 'streaming'

	let Icon = <CornerDownLeftIcon className='size-4' />

	if (status === 'submitted') {
		Icon = <Spinner />
	} else if (status === 'streaming') {
		Icon = <SquareIcon className='size-4' />
	} else if (status === 'error') {
		Icon = <XIcon className='size-4' />
	}

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			if (isGenerating && onStop) {
				e.preventDefault()
				onStop()
				return
			}
		},
		[isGenerating, onStop]
	)

	return (
		<InputGroupButton
			aria-label={isGenerating ? 'Stop' : 'Submit'}
			className={cn(className)}
			onClick={handleClick}
			size={size}
			type={isGenerating && onStop ? 'button' : 'submit'}
			variant={variant}
			{...props}
		>
			{children ?? Icon}
		</InputGroupButton>
	)
}
