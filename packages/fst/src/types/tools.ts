import Sessions from '../Sessions'

export interface ToolArgs {
	cwd: string
	sessions: Sessions
	summarize: (content: string) => Promise<string>
}
