import { Cpu, Info, Layers2, Settings2, Sparkles, Unplug } from 'lucide-react'

export const setting_items = [
	{ key: '', title: 'General Setting', Icon: Settings2 },
	{ key: 'model_provider', title: 'Model Provider', Icon: Layers2 },
	{ key: 'default_model', title: 'Default Model', Icon: Sparkles },
	{ key: 'local_model', title: 'Local Model', Icon: Cpu },
	{ key: 'service_provider', title: 'Service Provider', Icon: Unplug },
	{ key: 'about_feedback', title: 'About & Feedback', Icon: Info }
]
