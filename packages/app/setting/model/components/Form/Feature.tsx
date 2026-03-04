import {
	BracketsCurlyIcon,
	BrainIcon,
	EyeIcon,
	FileImageIcon,
	GoogleChromeLogoIcon,
	ImagesSquareIcon,
	LinkIcon,
	SortAscendingIcon,
	ToggleRightIcon,
	WaveformIcon,
	WrenchIcon
} from '@phosphor-icons/react'

import { memo } from '@/utils'

import type { Icon } from '@phosphor-icons/react'

export const feature_metadata = {
	reasoning: {
		Icon: BrainIcon,
		col: 'col-span-3'
	},
	vision: {
		Icon: EyeIcon,
		col: 'col-span-3'
	},
	voice: {
		Icon: WaveformIcon,
		col: 'col-span-3'
	},
	embedding: {
		Icon: LinkIcon,
		col: 'col-span-3'
	},
	reranking: {
		Icon: SortAscendingIcon,
		col: 'col-span-3',
		no_border_r: true
	},
	reasoning_optional: {
		Icon: ToggleRightIcon
	},
	function_calling: {
		Icon: WrenchIcon
	},
	structured_output: {
		Icon: BracketsCurlyIcon,
		no_border_r: true
	},
	web_search: {
		Icon: GoogleChromeLogoIcon
	},
	image_input: {
		Icon: ImagesSquareIcon
	},
	image_output: {
		Icon: FileImageIcon,
		no_border_r: true
	}
} as Record<string, { Icon: Icon; col?: string; no_border_r?: boolean }>

export const feature_keys = Object.keys(feature_metadata)

interface IProps {
	name: string
}

const Index = (props: IProps) => {
	const { name } = props
	const { Icon } = feature_metadata[name]

	return <Icon />
}

export default memo(Index)
