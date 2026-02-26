export interface LogArgs {
	dir?: string
	log?: boolean
	json?: boolean
}

export interface WriteLogArgs {
	timestamp: string
	input: object
	output: object
	date: string
}
