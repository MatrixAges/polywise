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
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import type { ChatStatus } from 'ai'
import type {
	ComponentProps,
	FormEvent,
	FormEventHandler,
	KeyboardEventHandler,
	PropsWithChildren,
	RefObject
} from 'react'

export interface PromptInputMessage {
	text: string
}

interface PromptInputContextValue {
	value: string
	setValue: (v: string) => void
	inputRef: RefObject<HTMLTextAreaElement | null>
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null)

const usePromptInputContext = () => {
	const ctx = useContext(PromptInputContext)
	if (!ctx) {
		throw new Error('PromptInput components must be used within <PromptInput>')
	}
	return ctx
}

export type PromptInputProps = PropsWithChildren<
	Omit<ComponentProps<'form'>, 'onSubmit'> & {
		onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void | Promise<void>
	}
>

export const PromptInput = ({
	className,
	onSubmit,
	children,
	...props
}: PromptInputProps) => {
	const [value, setValue] = useState('')
	const inputRef = useRef<HTMLTextAreaElement>(null)

	const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
		event => {
			event.preventDefault()

			const text = value.trim()
			if (!text) return

			onSubmit({ text }, event)
			setValue('')
		},
		[value, onSubmit]
	)

	return (
		<PromptInputContext.Provider value={{ value, setValue, inputRef }}>
			<form
				className={cn('w-full', className)}
				onSubmit={handleSubmit}
				{...props}
			>
				<InputGroup className='overflow-hidden'>{children}</InputGroup>
			</form>
		</PromptInputContext.Provider>
	)
}

export type PromptInputTextareaProps = Omit<
	ComponentProps<typeof InputGroupTextarea>,
	'value' | 'onChange'
> & {
	value?: string
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export const PromptInputTextarea = ({
	onKeyDown,
	className,
	placeholder = 'What would you like to know?',
	...props
}: PromptInputTextareaProps) => {
	const ctx = useContext(PromptInputContext)
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

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			ctx?.setValue(e.currentTarget.value)
		},
		[ctx]
	)

	if (ctx) {
		return (
			<InputGroupTextarea
				className={cn('field-sizing-content max-h-48 min-h-16', className)}
				name='message'
				onCompositionEnd={handleCompositionEnd}
				onCompositionStart={handleCompositionStart}
				onKeyDown={handleKeyDown}
				onChange={handleChange}
				placeholder={placeholder}
				value={ctx.value}
				ref={ctx.inputRef}
			/>
		)
	}

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
