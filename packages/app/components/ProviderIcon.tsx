import { useMemo } from 'react'
import AlibabaCloud from '@lobehub/icons-static-svg/icons/alibabacloud.svg?react'
import Anthropic from '@lobehub/icons-static-svg/icons/anthropic.svg?react'
import Azure from '@lobehub/icons-static-svg/icons/azure.svg?react'
import Bedrock from '@lobehub/icons-static-svg/icons/bedrock.svg?react'
import Cerebras from '@lobehub/icons-static-svg/icons/cerebras.svg?react'
import Cohere from '@lobehub/icons-static-svg/icons/cohere.svg?react'
import DeepInfra from '@lobehub/icons-static-svg/icons/deepinfra.svg?react'
import DeepSeek from '@lobehub/icons-static-svg/icons/deepseek.svg?react'
import Fireworks from '@lobehub/icons-static-svg/icons/fireworks.svg?react'
import Gemini from '@lobehub/icons-static-svg/icons/gemini.svg?react'
import Grok from '@lobehub/icons-static-svg/icons/grok.svg?react'
import Groq from '@lobehub/icons-static-svg/icons/groq.svg?react'
import Hunyuan from '@lobehub/icons-static-svg/icons/hunyuan.svg?react'
import LmStudio from '@lobehub/icons-static-svg/icons/lmstudio.svg?react'
import Minimax from '@lobehub/icons-static-svg/icons/minimax.svg?react'
import Mistral from '@lobehub/icons-static-svg/icons/mistral.svg?react'
import Moonshot from '@lobehub/icons-static-svg/icons/moonshot.svg?react'
import Ollama from '@lobehub/icons-static-svg/icons/ollama.svg?react'
import OpenAI from '@lobehub/icons-static-svg/icons/openai.svg?react'
import OpenRouter from '@lobehub/icons-static-svg/icons/openrouter.svg?react'
import Perplexity from '@lobehub/icons-static-svg/icons/perplexity.svg?react'
import SiliconCloud from '@lobehub/icons-static-svg/icons/siliconcloud.svg?react'
import Together from '@lobehub/icons-static-svg/icons/together.svg?react'
import V0 from '@lobehub/icons-static-svg/icons/v0.svg?react'
import Volcengine from '@lobehub/icons-static-svg/icons/volcengine.svg?react'
import Zhipu from '@lobehub/icons-static-svg/icons/zhipu.svg?react'
import { Bot, EyeClosedIcon, Leaf } from 'lucide-react'

import type { ElementType } from 'react'

export const provider_icon_map = {
	google_gemini: Gemini,
	aliyun_bailian: AlibabaCloud,
	amazon_bedrock: Bedrock,
	anthropic: Anthropic,
	azure_openai: Azure,
	cerebras: Cerebras,
	cohere: Cohere,
	deepinfra: DeepInfra,
	deepseek: DeepSeek,
	fireworks: Fireworks,
	groq: Groq,
	lmstudio: LmStudio,
	mistral: Mistral,
	ollama: Ollama,
	openai: OpenAI,
	openrouter: OpenRouter,
	perplexity: Perplexity,
	siliconflow: SiliconCloud,
	tencent_hunyuan: Hunyuan,
	together: Together,
	vercel: V0,
	volcengine: Volcengine,
	xai: Grok,
	zhipu: Zhipu,
	moonshot: Moonshot,
	minimax: Minimax,
	custom: Leaf,
	disabled: EyeClosedIcon
} as Record<string, ElementType>

interface IProps {
	name: string
	color?: string
	size?: string | number
}

const Index = ({ name, ...props }: IProps) => {
	const Icon = useMemo(() => (name in provider_icon_map ? provider_icon_map[name] : Bot), [name])

	return <Icon {...props}></Icon>
}

export default $app.memo(Index)
