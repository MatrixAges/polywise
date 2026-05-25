import { FileImageIcon, LinkSimpleIcon } from '@phosphor-icons/react'

export default [
	{
		label: 'URL',
		value: 'URL',
		icon: <LinkSimpleIcon />
	},
	{
		label: 'File',
		value: 'File',
		icon: <FileImageIcon />
	}
] as const
