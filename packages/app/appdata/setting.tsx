import { Info, Layers2, MessageCircle, Server, Settings2, Sparkles, Unplug } from 'lucide-react'

export const setting_items = [
	{ key: '', title: 'general', Icon: Settings2 },
	{ key: 'model_provider', title: 'model_provider', Icon: Layers2 },
	{ key: 'model_setting', title: 'model_setting', Icon: Sparkles },
	{ key: 'mcp', title: 'mcp', Icon: Server },
	{ key: 'service_provider', title: 'service_provider', Icon: Unplug },
	{ key: 'im', title: 'im', Icon: MessageCircle },
	{ key: 'about_feedback', title: 'about_feedback', Icon: Info }
]

export const about = {
	github: 'https://github.com/MatrixAges/polywise',
	site: 'https://polywise.io',
	x: 'https://x.com/xiewendao',
	docs: 'https://polywise.io/docs',
	changelog: 'https://github.com/MatrixAges/polywise/releases',
	issues: 'https://github.com/MatrixAges/polywise/issues',
	email: 'xiewendao@gmail.com'
}
