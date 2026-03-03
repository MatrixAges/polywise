import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle
} from '@/__shadcn__/components/ui/field'
import { Switch } from '@/__shadcn__/components/ui/switch'

const Index = () => {
	return (
		<div className='flex w-full'>
			<FieldGroup className='page_wrap gap-0'>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Theme</FieldTitle>
						<FieldDescription>
							Customize the visual interface, including color modes and system
							synchronization
						</FieldDescription>
					</FieldContent>
					<Switch id='switch-share' />
				</Field>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Language</FieldTitle>
						<FieldDescription>
							Select your preferred language for the application interface and notifications
						</FieldDescription>
					</FieldContent>
					<Switch id='switch-share' />
				</Field>
				<Field className='border-dev items-center! border-b py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Development Appearance</FieldTitle>
						<FieldDescription>
							Add dividers and backgrounds to the content area
						</FieldDescription>
					</FieldContent>
					<Switch id='switch-share' />
				</Field>
			</FieldGroup>
		</div>
	)
}

export default $app.memo(Index)
