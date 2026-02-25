import chalk from 'chalk'

export type ConsoleStage = 'SQL' | 'PIPELINE' | 'RANKING' | 'SEARCH' | 'SYSTEM'

export type ConsoleConfig = {
	enabled?: boolean
	stages?: Array<ConsoleStage>
	only?: Array<ConsoleStage>
}

export default class Console {
	private static config: ConsoleConfig = {
		enabled: false,
		stages: ['SQL', 'PIPELINE', 'RANKING', 'SEARCH', 'SYSTEM'],
		only: ['PIPELINE', 'RANKING', 'SEARCH', 'SYSTEM']
	}

	static configure(config: ConsoleConfig) {
		this.config = {
			...this.config,
			...config
		}
	}

	static log(stage: ConsoleStage, message: string, data?: unknown) {
		if (!this.config.enabled) return

		if (this.config.only && this.config.only.length > 0) {
			if (!this.config.only.includes(stage)) return
		} else if (this.config.stages && !this.config.stages.includes(stage)) {
			return
		}

		const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
		const stage_color = this.getStageColor(stage)
		const prefix = chalk.gray(`[${timestamp}]`)
		const tag = stage_color(`[${stage}]`)
		const msg = chalk.green(message)

		console.log(`${prefix} ${tag} ${msg}`)

		if (data !== undefined) {
			console.log(this.formatData(data))
		}
	}

	private static getStageColor(stage: ConsoleStage) {
		switch (stage) {
			case 'SQL':
				return chalk.blueBright
			case 'PIPELINE':
				return chalk.magentaBright
			case 'RANKING':
				return chalk.yellowBright
			case 'SEARCH':
				return chalk.cyanBright
			case 'SYSTEM':
				return chalk.whiteBright
			default:
				return chalk.white
		}
	}

	private static formatData(data: unknown) {
		if (data === null || data === undefined) return ''

		const formatted = JSON.stringify(
			data,
			(_, value) => {
				if (typeof value === 'string' && value.length > 500) {
					return value.substring(0, 500) + '...'
				}

				return value
			},
			2
		)

		return formatted
			.split('\n')
			.map(line => chalk.gray('  ' + line))
			.join('\n')
	}
}
