import { FileImage, LinkSimple } from '@phosphor-icons/react'

export default [
	{
		label: 'URL',
		value: 'URL',
		icon: <LinkSimple />
	},
	{
		label: 'File',
		value: 'File',
		icon: <FileImage />
	}
] as const
