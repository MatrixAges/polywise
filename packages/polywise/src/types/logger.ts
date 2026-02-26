export interface LoggerConfig {
	enable_console_log?: boolean
	enable_file_log?: boolean
	dir?: string
	exclude_stages?: Array<Stage>
}

export type Stage = 'SQL' | 'PIPELINE' | 'RANKING' | 'SEARCH' | 'SYSTEM'
