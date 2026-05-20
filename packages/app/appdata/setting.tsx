import { Info, Layers2, MessageCircle, Settings2, Sparkles, Unplug } from 'lucide-react'

export const setting_items = [
	{ key: '', title: 'General Setting', Icon: Settings2 },
	{ key: 'model_provider', title: 'Model Provider', Icon: Layers2 },
	{ key: 'model_setting', title: 'Model Setting', Icon: Sparkles },
	{ key: 'service_provider', title: 'Service Provider', Icon: Unplug },
	{ key: 'im', title: 'IM Integration', Icon: MessageCircle },
	{ key: 'about_feedback', title: 'About & Feedback', Icon: Info }
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
