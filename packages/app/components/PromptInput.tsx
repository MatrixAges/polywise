import { memo, useCallback, useState } from 'react'
import { GlobeIcon } from 'lucide-react'

import {
	Attachment,
	AttachmentPreview,
	AttachmentRemove,
	Attachments
} from '@/__shadcn__/components/ai-elements/attachments'
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputAttachments
} from '@/__shadcn__/components/ai-elements/prompt-input'

import ModelSelect from './ModelSelect'

import type { PromptInputMessage } from '@/__shadcn__/components/ai-elements/prompt-input'

const SUBMITTING_TIMEOUT = 200
const STREAMING_TIMEOUT = 2000

interface AttachmentItemProps {
	attachment: {
		id: string
		type: 'file'
		filename?: string
		mediaType?: string
		url: string
	}
	onRemove: (id: string) => void
}

const AttachmentItem = memo(({ attachment, onRemove }: AttachmentItemProps) => {
	const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id])
	return (
		<Attachment data={attachment} key={attachment.id} onRemove={handleRemove}>
			<AttachmentPreview />
			<AttachmentRemove />
		</Attachment>
	)
})

AttachmentItem.displayName = 'AttachmentItem'

const PromptInputAttachmentsDisplay = () => {
	const attachments = usePromptInputAttachments()

	const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments])

	if (attachments.files.length === 0) {
		return null
	}

	return (
		<Attachments variant='inline'>
			{attachments.files.map(attachment => (
				<AttachmentItem attachment={attachment} key={attachment.id} onRemove={handleRemove} />
			))}
		</Attachments>
	)
}

const Index = () => {
	const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready')

	const handleSubmit = useCallback((message: PromptInputMessage) => {
		const hasText = Boolean(message.text)
		const hasAttachments = Boolean(message.files?.length)

		if (!(hasText || hasAttachments)) {
			return
		}

		setStatus('submitted')

		// eslint-disable-next-line no-console
		console.log('Submitting message:', message)

		setTimeout(() => {
			setStatus('streaming')
		}, SUBMITTING_TIMEOUT)

		setTimeout(() => {
			setStatus('ready')
		}, STREAMING_TIMEOUT)
	}, [])

	return (
		<div className='size-full'>
			<PromptInputProvider>
				<PromptInput globalDrop multiple onSubmit={handleSubmit}>
					<PromptInputAttachmentsDisplay />
					<PromptInputBody>
						<PromptInputTextarea />
					</PromptInputBody>
					<PromptInputFooter>
						<PromptInputTools>
							<PromptInputActionMenu>
								<PromptInputActionMenuTrigger />
								<PromptInputActionMenuContent>
									<PromptInputActionAddAttachments />
									<PromptInputActionAddScreenshot />
								</PromptInputActionMenuContent>
							</PromptInputActionMenu>
							<PromptInputButton>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
							<ModelSelect></ModelSelect>
						</PromptInputTools>
						<PromptInputSubmit status={status} />
					</PromptInputFooter>
				</PromptInput>
			</PromptInputProvider>
		</div>
	)
}

export default $app.memo(Index)
