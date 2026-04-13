export interface SystemCommandSpec {
	name: string
	desc: string
	rules: Array<string>
}

export interface SystemSpec {
	platform: string
	arch: string
	commands: Array<SystemCommandSpec>
	global_rules: Array<string>
	updated_at: string
}
